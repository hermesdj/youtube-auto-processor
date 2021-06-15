import fs from "fs";
import {createLogger} from "app/logger";
import serieProcessor from "app/processors/serie-processor";
import sheetProcessor from "app/processors/sheet-processor";
import states from "app/config/states";
import moment from "moment";
import playlistProcessor from "app/processors/playlist-processor";
import youtubeStudioProcessor from "app/processors/youtube-studio-processor";
import youtubeProcessor from "app/processors/youtube-processor";
import {runUploadService} from "app/src-electron/upload-service";
import thumbnailProcessor from "app/processors/thumbnail-processor";
import {runVideoService} from "app/src-electron/video-service";
import {minBy} from "lodash";

const logger = createLogger({label: 'job-runner-task'});

let Job, Log;

const findJobs = function (state) {
  return Job
    .find({
      state: state.label
    })
    .sort('date_created')
    .populate({
      path: 'episode',
      populate: 'serie'
    })
    .exec();
};

const processState = async function (state, process, appConfig) {
  const jobs = await findJobs(state);
  let results = [];

  if (jobs.length > 0) {
    logger.debug('found %d jobs in state %s to process', jobs.length, state.label);

    for (let job of jobs) {
      try {
        let result = await process(job, appConfig);
        results.push(result);
      } catch (err) {
        await job.error(err);
        logger.error('process job state %s error : %s', state.label, err.message);
      }
    }
  } else {
    logger.debug('No jobs in %s state found', state.label);
  }

  return results;
}

const processReadyJob = async function (job) {
  await serieProcessor.process(job);
};

const processInitializedJob = async function (job) {
  if ((job.episode.serie && job.episode.serie.named_episode) || job.episode.video_name.indexOf('${episode_name}') > 0) {
    logger.info('this episode needs a name, waiting for user input...');

    if (job.episode.episode_name) {
      job.episode.video_name = job.episode.video_name.replace('${episode_name}', job.episode.episode_name);
      await job.episode.save();
    }
  } else {
    await job.next();
  }
}

const processScheduleJob = async function (job, appConfig) {
  let result = await sheetProcessor.getScheduledDate(job, appConfig);

  job.episode.publishAt = moment(result).toDate();
  logger.info('%s scheduled on %s', job.episode.video_name, job.episode.publishAt);

  await job.episode.save();

  if (appConfig.pauseBeforeProcessing) {
    job.state = states.SCHEDULE.next().label;
    await job.pause();
  } else {
    await job.next();
  }
}

const processVideoReadyJob = async function (job) {
  logger.debug('job %s require to start process video service, trying to start if not already processing', job.id);
  await job.markOnPlanning();
  if (job.process_data) {
    job.process_data = null;
    await job.save();
  }
  runVideoService(job.id);
}

const processUploadReadyJob = async function (job) {
  logger.debug('job %s require to start upload video service, trying to start if not already uploading', job.id);
  if (job.upload_data) {
    job.upload_data = null;
    await job.save();
  }
  runUploadService(job.id);
}

const processUploadDoneJob = async function (job) {
  await job.next();
}

const processSetVideoDataJob = async function (job) {
  logger.info('set video data on job %s', job.id);
  await youtubeProcessor.setVideoData(job);
  await job.next();
}

const processThumbnailJob = async function (job) {
  logger.info('set thumbnail on job %s', job.id);
  await thumbnailProcessor.setThumbnail(job);
  await job.next();
}

const processPlaylistJob = async function (job) {
  if (!job.episode.serie.playlist_id) {
    let {serie} = job.episode;
    job.episode.serie.playlist_id = await playlistProcessor.createPlaylist(
      serie.playlist_title,
      serie.description,
      serie.default_language,
      'public'
    );
    await job.episode.serie.save();
  }

  let {youtube_id, serie} = job.episode;

  let playlistItem = await playlistProcessor.addEpisodeToPlaylist(youtube_id, serie.playlist_id);

  job.episode.playlist_item_id = playlistItem.id;

  await job.episode.save();

  await job.next();
}

const processMonetizeJob = async function (job) {
  // Move to monetization in progress
  logger.info('monetizing job %s', job.id);
  await job.next();

  // Monetize
  let result = await youtubeStudioProcessor.setMonetization(job);

  if (result && result.overallResult && result.overallResult.resultCode === 'UPDATE_SUCCESS') {
    // Move to endscreen if success
    await job.next();
  } else {
    throw new Error('Monetization Result Code is not in UPDATE_SUCCESS');
  }
}

const processEndscreenJob = async function (job) {
  // Move to setting endscreen
  logger.info('set endscreen on job %s', job.id);
  await job.next();

  let result = await youtubeStudioProcessor.setEndScreen(job);

  if (result && result.executionStatus === 'EDIT_EXECUTION_STATUS_DONE') {
    await job.next();
  } else {
    throw new Error('Endscreen result is not EDIT_EXECUTION_STATUS_DONE');
  }
}

const processAllDoneJob = async function (job) {
  const publicDate = moment(job.episode.publishAt);
  const now = moment();

  if (now.isAfter(publicDate)) {
    logger.info('job %s episode is now public', job.id);

    await job.next();
    await job.markOnPlanning();
  }
}

const processPublicJob = async function (job) {
  const publicDate = moment(job.episode.publishAt);

  if (moment().isAfter(publicDate.add(1, 'day'), 'day')) {
    logger.info('job found to mark as finished', job.id);
    await job.next();
  }
}

const processFinishedJob = async function (job) {
  if (fs.existsSync(job.path)) {
    logger.info('Job is finished and video has to be deleted at path %s', job.path);
    fs.unlinkSync(job.path);
  }

  if (fs.existsSync(job.episode.path)) {
    logger.info('Episode is public and job is finished, deleting the video file at path %s', job.episode.path);
    fs.unlinkSync(job.episode.path);
  }

  await job.remove();
  logger.info('job %s has been deleted', job.id);
}

const updateMultipleJobsProcessing = async function (jobs) {
  let res = await youtubeProcessor.getVideoProcessorStatsMultiple(jobs);

  if (!res) {
    return;
  }

  let {items} = res;

  for (let {id, processingDetails, contentDetails} of items) {
    let job = jobs.find(job => job.episode.youtube_id === id);

    if (job) {
      job.processing = processingDetails;
      job.details = contentDetails;
      job.lastProcessFetchDate = new Date();

      await job.save();

      if (processingDetails.processingStatus === 'succeeded') {
        // Move to next step as processing is done
        logger.info('video %s definition is %s', job.episode.youtube_id, contentDetails.definition);

        if (contentDetails.definition === 'hd') {
          await job.next();
        }
      }
    } else {
      logger.warn('job not found for video id %s', id);
    }
  }
}

const processMap = {
  READY: processReadyJob,
  INITIALIZED: processInitializedJob,
  SCHEDULE: processScheduleJob,
  VIDEO_READY: processVideoReadyJob,
  UPLOAD_READY: processUploadReadyJob,
  UPLOAD_DONE: processUploadDoneJob,
  SET_VIDEO_DATA: processSetVideoDataJob,
  THUMBNAIL: processThumbnailJob,
  PLAYLIST: processPlaylistJob,
  MONETIZE: processMonetizeJob,
  ENDSCREEN: processEndscreenJob,
  ALL_DONE: processAllDoneJob,
  PUBLIC: processPublicJob,
  FINISHED: processFinishedJob
}

export async function runJobRunner(db, appConfig) {
  Job = db.model('Job');
  Log = db.model('Log');

  try {
    let currentState = states.READY;

    do {
      logger.debug('processing state %s', currentState.label);
      let process = processMap[currentState.label];

      if (process) {
        try {
          await processState(currentState, process, appConfig);
        } catch (err) {
          logger.error('process state %s error: %s', currentState.label, err.message);
        }
      } else {
        logger.debug('No process found for current state %s', currentState.label);
      }

      currentState = currentState.next();
    } while (currentState);

    // Process paused videos
    let countVideoProcessing = await Job.countDocuments({state: states.VIDEO_PROCESSING.label});
    let countPausedVideos = await Job.countDocuments({state: states.PAUSED.label, last_state: states.SCHEDULE.label});

    if (countVideoProcessing === 0 && countPausedVideos > 0) {
      let jobs = await findJobs({state: states.PAUSED.label, last_state: states.SCHEDULE.label});

      if (jobs && jobs.length > 0) {
        let firstJob = jobs[0];
        await firstJob.resume();
      }
    }

    // Process videos in waiting procesing by batch

    let videosInProcessingNotYetUpdated = await Job.find({
      state: states.WAIT_YOUTUBE_PROCESSING.label,
      lastProcessFetchDate: {$eq: null}
    }).populate('episode');

    if (videosInProcessingNotYetUpdated.length > 0) {
      await updateMultipleJobsProcessing(videosInProcessingNotYetUpdated);
    }

    let videosAlreadyUpdated = await Job.find({
      state: states.WAIT_YOUTUBE_PROCESSING.label,
      lastProcessFetchDate: {$ne: null}
    }).populate('episode');

    if (videosAlreadyUpdated.length > 0) {
      let minLastUpdateDate = minBy(videosAlreadyUpdated, 'lastProcessFetchDate');
      if (moment(minLastUpdateDate.lastProcessFetchDate).isBefore(moment().subtract(1, 'minutes'))) {
        await updateMultipleJobsProcessing(videosAlreadyUpdated);
      }
    }

    logger.debug('Deleting logs older than a week');

    let result = await Log.deleteMany({
      timestamp: {$lte: moment().subtract(2, 'days').toDate()}
    });

    if (result && result.deletedCount > 0) {
      logger.debug('deleted %d logs from database', result.deletedCount);
    }

  } catch (err) {
    logger.error('job-runner-task error: %s', err.message);
  }
}
