const fs = require('fs');
const {google} = require('googleapis');
const {Serie, Episode, Google: {GoogleCookieConfig, YoutubeChannel}} = require('../../model');
const {parse, toSeconds} = require('iso8601-duration');
const moment = require('moment');
const {init, setMonetisation, setEndScreen, endScreen, getEndScreen, upload} = require('./youtube-studio-api');
const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');
const rootDir = path.join(os.tmpdir(), 'youtube-auto-processor', 'upload');
mkdirp.sync(rootDir);
const {createLogger} = require('../../logger');
const logger = createLogger({label: 'youtube-studio-processor'});

class YoutubeStudioError extends Error {
  constructor(message, data) {
    super(message);
    this.data = data;
  }
}

module.exports = {
  setMonetization: async function (job) {
    try {
      let cookieInfo = await GoogleCookieConfig.resolveConfig({});
      await init(cookieInfo);

      let allowMidRolls = true;
      let midVideoMilliseconds = 1200000;

      if (job.details && job.details.duration) {
        let parsedDuration = parse(job.details.duration);
        let seconds = toSeconds(parsedDuration);

        logger.info('Video seconds is %d', seconds);

        if ((seconds * 1000) > 1200000) {
          midVideoMilliseconds = (seconds / 2) * 1000;
        } else {
          allowMidRolls = false;
        }
      }

      const result = await setMonetisation(job.episode.youtube_id, {
        encryptedVideoId: job.episode.youtube_id, // your video ID
        monetizationSettings: {
          newMonetizeWithAds: true // Monetisation: On
        },
        "adSettings": {
          "adFormats": {
            "newHasOverlayAds": "ENABLED",
            "newHasSkippableVideoAds": "ENABLED",
            "newHasNonSkippableVideoAds": "ENABLED",
            "newHasProductListingAds": "ENABLED"
          },
          "adBreaks": {
            "newHasPrerolls": "ENABLED",
            "newHasMidrollAds": allowMidRolls ? "ENABLED" : "DISABLED",
            "newHasPostrolls": "ENABLED",
            "newHasManualMidrolls": allowMidRolls ? "ENABLED" : "DISABLED",
            "newManualMidrollTimesMillis": allowMidRolls ? [midVideoMilliseconds] : []
          },
          "autoAdSettings": "AUTO_AD_SETTINGS_TYPE_OFF"
        },
      })

      if (result && result.error) {
        throw new YoutubeStudioError('Monetization is in error  ', result.error);
      }

      return result;
    } catch (e) {
      logger.error('Error setting monetization : %O', e);
      throw e;
    }
  },
  setEndScreen: async function (job) {
    if (!job.details || !job.details.duration) {
      throw new Error('details duration missing');
    }

    try {
      logger.debug('duration is %s', job.details.duration);
      let parsedDuration = parse(job.details.duration);
      logger.debug('parsed duration is %j', parsedDuration);
      let seconds = toSeconds(parsedDuration);
      logger.info('video seconds is %d', seconds);

      if (seconds === 0) {
        throw new Error('Video Seconds is 0');
      }

      let episode = await Episode.findById(job.episode._id);

      if (!episode) {
        throw new Error('Episode not found');
      }

      if (!episode.serie) {
        throw new Error('No serie in episode');
      }

      let serie = await Serie.findById(episode.serie);

      if (!serie || !serie.playlist_id) {
        throw new Error('no playlist id found in serie');
      }

      let cookieInfo = await GoogleCookieConfig.resolveConfig({});
      await init(cookieInfo);

      let youtubeChannel = await YoutubeChannel.findOne({});
      if (!youtubeChannel) {
        throw new Error('No youtube channel configured. Channel ID is required for this operation');
      }

      const result = await setEndScreen(episode.youtube_id, (seconds * 1000) - 20000, [
        {...endScreen.POSITION_CENTER, ...endScreen.TYPE_SUBSCRIBE(youtubeChannel.channelId)},
        {...endScreen.POSITION_CENTER_LEFT, ...endScreen.TYPE_BEST_FOR_VIEWERS},
        {...endScreen.POSITION_CENTER_RIGHT, ...endScreen.TYPE_PLAYLIST(serie.playlist_id)}
      ])

      if (result && result.error) {
        throw new YoutubeStudioError('Set endscreen is in error', result.error);
      }

      return result;
    } catch (e) {
      logger.error('Error set endscreen : %O', e);
      throw e;
    }
  },
  getEndScreen: async function (job) {
    const VIDEO_ID = job.episode.youtube_id;
    let cookieInfo = await GoogleCookieConfig.resolveConfig({});
    await init(cookieInfo)

    const result = await getEndScreen(VIDEO_ID);

    if (result && result.error) {
      throw YoutubeStudioError('Get endscreen is in error', result.error);
    }

    return result;
  },
  upload: async function (auth, job) {
    let cookieInfo = await GoogleCookieConfig.resolveConfig({});
    await init(cookieInfo);

    let youtubeChannel = await YoutubeChannel.findOne({});
    if (!youtubeChannel) {
      throw new Error('No youtube channel configured. Channel ID is required for this operation');
    }

    let episode = job.episode;

    let stream = fs.createReadStream(episode.path);

    let options = {
      fileName: path.basename(job.path),
      filePath: episode.path,
      channelId: youtubeChannel.channelId,
      newTitle: episode.video_name,
      newDescription: episode.description,
      newPrivacy: 'PRIVATE',
      stream,
      isDraft: false,
      tags: episode.keywords
    };

    let result = await upload(options, async (progress) => {
      try {
        logger.info('upload progress is %j', progress);
        if (progress && progress.percent) {
          let value = progress.percent;
          job.upload_data.progress = (value / 100) * job.upload_data.total;
          job.markModified('upload_data');
          await job.save();
        }
      } catch (err) {
        logger.error('error uploading progress: %s', err.message);
      }
    });

    let {videoId} = result;

    if (!videoId) {
      let filePath = path.join(rootDir, 'response.json');
      fs.writeFileSync(filePath, JSON.stringify(result));
      throw new Error('No Video ID, upload have failed and response is written here :' + filePath);
    }

    episode.youtube_id = videoId;
    job.episode.youtube_id = videoId;
    job.upload_data.progress = job.upload_data.total;
    job.markModified('upload_data');

    let youtube = google.youtube({
      version: 'v3',
      auth: auth
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
    job.state = 'UPLOAD_DONE';

    await job.save();
    await episode.save();

    return result;
  }
}
