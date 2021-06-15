/**
 * Created by Jérémy on 08/05/2017.
 */
const {google} = require('googleapis');
const {GoogleToken} = require('../../model/google.model');
const moment = require('moment');

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
  setVideoData: async function (job) {
    if (!job) throw new Error('Job not provided');

    if (!job.populated('episode')) await job.populate('episode').execPopulate();

    if (!job.episode) throw new Error('No episode in job');

    if (!job.episode.youtube_id) throw new Error('No youtube id in episode');

    let episode = job.episode;
    let videoId = episode.youtube_id;

    if (!episode.populated('serie')) await episode.populate('serie').execPopulate();

    if (!episode.serie) throw new Error('No serie in episode');

    let oauth2client = await GoogleToken.resolveOAuth2Client();

    let youtube = google.youtube({
      version: 'v3',
      auth: oauth2client
    });

    let {status} = await youtube.videos.update({
      part: 'snippet,status',
      requestBody: {
        id: videoId,
        snippet: {
          title: episode.video_name,
          categoryId: "20",
          description: episode.description,
          tags: episode.keywords,
          defaultLanguage: episode.serie.default_language || 'fr',
        },
        status: {
          privacyStatus: 'private',
          publishAt: moment(episode.publishAt).format('YYYY-MM-DDTHH:mm:ss.sZ')
        }
      }
    });

    episode.status = status;
    episode.markModified('status');
  }
};
