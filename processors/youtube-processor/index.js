/**
 * Created by Jérémy on 08/05/2017.
 */
const {google} = require('googleapis');
const {GoogleToken} = require('../../model/google.model');
const moment = require('moment');
const {createLogger} = require("../../logger");

const logger = createLogger({label: 'youtube-processor'});

module.exports = {
  getVideoProcessorStats: async function (job) {
    if (!job) {
      throw new Error('no job to retrieve the video status from !');
    }

    if (!job.episode) {
      throw new Error('No episode in job');
    }

    if (!job.episode.youtube_id) {
      throw new Error('no youtube id for episode ' + job.episode._id);
    }

    let oauth2client = await GoogleToken.resolveOAuth2Client();

    let youtube = google.youtube({
      version: 'v3',
      auth: oauth2client
    });

    let {data} = await youtube.videos.list({
      id: job.episode.youtube_id,
      part: 'processingDetails, contentDetails'
    });

    return data;
  },
  getVideoProcessorStatsMultiple: async function (jobs) {
    if (!jobs || jobs.length === 0) {
      throw new Error('no jobs provided');
    }

    let videoIds = jobs.filter(job => job.episode && job.episode.youtube_id).map(job => job.episode.youtube_id);

    if (videoIds.length === 0) {
      throw new Error('no video ids found');
    }

    logger.info("check processor stats for video ids %j", videoIds);

    let oauth2client = await GoogleToken.resolveOAuth2Client();

    let youtube = google.youtube({
      version: 'v3',
      auth: oauth2client
    });

    let {data} = await youtube.videos.list({
      id: videoIds.join(','),
      part: 'processingDetails, contentDetails, id'
    });

    return data;
  },
  getChannelList: async function () {
    let oauth2client = await GoogleToken.resolveOAuth2Client();

    let youtube = google.youtube({
      version: 'v3',
      auth: oauth2client
    });

    let {data} = await youtube.channels.list({
      part: 'snippet',
      mine: true
    });

    return data;
  },
  setVideoData: async function (videoId, videoName, description, keywords, defaultLanguage, privacy, publishAt) {
    let oauth2client = await GoogleToken.resolveOAuth2Client();

    let youtube = google.youtube({
      version: 'v3',
      auth: oauth2client
    });

    let {data: {status, snippet}} = await youtube.videos.update({
      part: 'snippet,status',
      requestBody: {
        id: videoId,
        snippet: {
          title: videoName,
          categoryId: "20",
          description: description,
          tags: keywords,
          defaultLanguage: defaultLanguage || 'fr',
        },
        status: {
          privacyStatus: privacy,
          publishAt: moment(publishAt).format('YYYY-MM-DDTHH:mm:ss.sZ')
        }
      }
    });

    return {snippet, status}
  }
};
