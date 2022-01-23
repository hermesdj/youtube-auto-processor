const {createLogger} = require('../../logger');
const logger = createLogger({label: 'process-video-service'});
const videoProcessor = require('../../processors/video-processor');
const states = require('../../config/states');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const {Job, Config} = require('../../model');

async function runService(config, jobId) {
  let job = await Job
    .findById(jobId)
    .sort('date_created')
    .populate({
      path: 'episode',
      populate: 'serie'
    }).exec();

  if (!job) {
    logger.info('No episode in %s state to process', states.VIDEO_READY.label);
    return;
  }

  if (job.state !== states.VIDEO_READY.label) {
    logger.error("Job with id %s is in state %s", jobId, job.state);
    return;
  }

  if (!job.episode) {
    logger.error('job %s has no episode configured to process', job.id);
    await job.error(new Error('this job has no episode configured to process'));
    return;
  }

  try {
    let processResult = await videoProcessor.processJob(job, config);

    logger.info('finished processing video for episode %s with result %j', job.episode.video_name, processResult);

    if (config.pauseAfterProcessing) {
      job.state = 'UPLOAD_READY';
      await job.pause();
    } else {
      await job.next();
    }

    if (config.chainVideoProcessing) {
      let pausedJob = await Job.findOne({
        state: states.PAUSED.label,
        previous_state: states.SCHEDULE.label
      }).sort('date_created').exec();

      if (pausedJob) {
        await pausedJob.resume();
      }
    }

    return processResult;
  } catch (err) {
    logger.error('video processor error: %s', err.message);
    job.state = 'VIDEO_READY';
    await job.error(err);
    throw err;
  }
}

module.exports = async (jobId) => {
  if (!jobId) {
    throw new Error('No Job ID provided to process video service');
  }

  logger.info('starting video processor service for job %s', jobId);

  const config = await Config.loadAsObject();

  if (!config.mainAppDirectory) {
    throw new Error('No Main app directory configured');
  }

  config.workingDirectory = path.resolve(path.join(config.mainAppDirectory, "Work"));
  config.outputDirectory = path.resolve(path.join(config.mainAppDirectory, "Output"));

  if (!fs.existsSync(config.workingDirectory)) {
    await mkdirp(config.workingDirectory);
  }
  if (!fs.existsSync(config.outputDirectory)) {
    await mkdirp(config.outputDirectory);
  }

  return await runService(config, jobId);
}
