/**
 * Created by Jérémy on 07/05/2017.
 */
const fs = require('fs');
const {google} = require('googleapis');
const {GoogleToken, GoogleCookieConfig, YoutubeChannel} = require('../../model/google.model');
const {createLogger} = require('../../logger');
const logger = createLogger({label: 'upload-processor'});
const {uploadWithPuppeteer} = require('./PupeteerYoutubeUploader');
const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');
const rootDir = path.join(os.tmpdir(), 'youtube-auto-processor', 'upload');
mkdirp.sync(rootDir);
const moment = require('moment');

module.exports = {
  uploadJob: async function (job) {
    if (!job.episode) {
      logger.error('this job has no episode configured to upload');
      throw new Error('upload job error, no episode');
    }

    let oauth2client = await GoogleToken.resolveOAuth2Client();

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2client
    });

    try {
      if (!job.populated('episode')) await job.populate({path: 'episode', populate: 'serie'}).execPopulate();

      let episode = job.episode;

      if (!fs.existsSync(episode.path)) {
        throw new Error('File not found : ' + episode.path);
      }

      let total = fs.statSync(episode.path).size;
      job.state = 'UPLOAD_PROCESSING';
      job.last_state = 'UPLOAD_READY';
      job.upload_data = {
        progress: 0,
        total: total,
        startDate: new Date()
      };

      await job.save();

      let stream = fs.createReadStream(episode.path);

      const cookieInfo = await GoogleCookieConfig.resolveConfig({});

      let youtubeChannel = await YoutubeChannel.findOne({});
      if (!youtubeChannel) {
        throw new Error('No youtube channel configured. Channel ID is required for this operation');
      }

      let options = {
        filePath: episode.path,
        stream,
        channelId: youtubeChannel.channelId
      };

      const onProgress = async ({
                                  percent,
                                  videoId,
                                  contentDetails,
                                  processingDetails,
                                  uploadStatus,
                                  pageCookies
                                }) => {
        try {
          logger.info('upload progress is %j', percent);
          if (percent) {
            let progress = (percent / 100) * job.upload_data.total;
            if (job.upload_data && job.upload_data.progress !== progress) {
              job.state = 'UPLOAD_PROCESSING';
              job.upload_data.progress = progress;
              job.markModified('upload_data');
            }
          }

          if (videoId && episode.youtube_id !== videoId) {
            episode.youtube_id = videoId;
            await episode.save();
          }

          if (contentDetails) {
            job.details = contentDetails;
            job.markModified('details');
          }

          if (processingDetails) {
            job.processing = processingDetails;
            job.markModified('processing');
          }

          if (uploadStatus) {
            job.upload_status = uploadStatus;
            job.markModified('upload_status');
          }

          if (pageCookies) {
            await cookieInfo.updateFromPageCookies(pageCookies);
          }

          if (job.isModified()) {
            await job.save();
          }
        } catch (err) {
          logger.error('error updating progress: %s', err.message);
        }
      }

      let result = await uploadWithPuppeteer(
        options,
        oauth2client,
        cookieInfo.toPuppeteerCookies(),
        onProgress
      );

      let {videoId} = result;

      if (!videoId) {
        let filePath = path.join(rootDir, 'response.json');
        fs.writeFileSync(filePath, JSON.stringify(result));
        throw new Error('No Video ID, upload have failed and response is written here :' + filePath);
      }

      job.state = 'UPLOAD_DONE';

      await job.save();

      if (!episode.youtube_id) {
        episode.youtube_id = videoId;
        await episode.save();
      }

      return job;
    } catch (err) {
      logger.error('error uploading video: ', err);
      await job.error(err);
      throw err;
    }
  }
}
