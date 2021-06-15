/**
 * Created by Jérémy on 07/05/2017.
 */
const Ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const moment = require('moment');
const {createLogger} = require('../../logger');
const logger = createLogger({label: 'video-processor'});
const {Config} = require('../../model');

async function initFfmpeg(config) {
  if (!config) {
    config = await Config.loadAsObject();
  }

  if (!config.ffmpegPath) {
    throw new Error('No FFMPEG Path configured');
  }

  if (!config.ffprobePath) {
    throw new Error('No FFPROBE Path configured');
  }

  process.env['FFMPEG_PATH'] = config.ffmpegPath;
  process.env['FFPROBE_PATH'] = config.ffprobePath;

  logger.debug('FFMPEG_PATH=', process.env.FFMPEG_PATH);
  logger.debug('FFPROBE_PATH=', process.env.FFPROBE_PATH);
}

async function resolveMetadata(path) {
  return new Promise((resolve, reject) => {
    Ffmpeg.ffprobe(path, function (err, metadata) {
      if (err) return reject(err);
      resolve(metadata);
    })
  });
}

async function processJob(job, config) {
  let intro = null;
  let outro = null;
  let content = null;
  let partner = null;

  await initFfmpeg(config);

  if (job) {
    if (job.episode && job.episode.serie) {
      if (job.episode.serie.intro) {
        intro = path.resolve(job.intro);
      }
      if (job.episode.serie.partner) {
        partner = path.resolve(job.partner);
      }
      if (job.episode.serie.outro) {
        outro = path.resolve(job.outro);
      }
    }
    if (job.path) {
      content = path.resolve(job.path);
    }
  }

  if (!intro && config.defaultIntro) {
    intro = path.resolve(config.defaultIntro);
  }
  if (!outro && config.defaultOutro) {
    outro = path.resolve(config.defaultOutro);
  }

  if (!content) {
    throw new Error('no content to process !');
  }

  let outputDirectory = path.resolve(config.outputDirectory, job.id);

  if (!fs.existsSync(outputDirectory)) {
    await mkdirp(outputDirectory);
  }

  let out = path.resolve(outputDirectory, job.episode.episode_number + '.mp4');

  if (!intro && !outro) {
    logger.info('nothing to process !');
    job.state = 'VIDEO_DONE';
    return job.save();
  }

  logger.info('processing video content %s', path.resolve(content));
  logger.info('output directory is %s', out);

  let duration = 0;

  if (intro) {
    let introMeta = await resolveMetadata(intro);
    if (introMeta && introMeta.format) {
      duration += introMeta.format.duration;
    }
  }
  if (outro) {
    let outroMeta = await resolveMetadata(outro);
    if (outroMeta && outroMeta.format) {
      duration += outroMeta.format.duration;
    }
  }
  if (content) {
    let contentMeta = await resolveMetadata(content);
    if (contentMeta && contentMeta.format) {
      duration += contentMeta.format.duration;
    }
  }

  return new Promise((resolve, reject) => {
    let command = new Ffmpeg();

    if (intro) {
      logger.debug('adding intro to the video', path.resolve(intro));
      command.input(intro);
    }
    if (partner) {
      logger.debug('adding partner to the video', path.resolve(partner));
      command.input(partner);
    }

    command.input(content);

    if (outro) {
      logger.info('adding outro to the video', path.resolve(outro));
      command.input(outro);
    }

    if (config.videoCodec) {
      logger.info('Using video encoding codec %s', config.videoCodec);
      command.videoCodec(config.videoCodec);
    }

    if (config.videoFilter) {
      logger.info('Using video encoding filter %s', config.videoFilter);
      command.videoFilter(config.videoFilter);
    }

    if (config.videoBitrate && !isNaN(config.videoBitrate) && config.videoBitrate > 0) {
      logger.info('Using video encoding bitrate %d', config.videoBitrate);
      command.videoBitrate(config.videoBitrate);
    }

    command.on('start', async function (commandLine) {
      logger.info('Spawned ffmpeg with command %s', commandLine);

      job.state = 'VIDEO_PROCESSING';
      job.process_data = {
        totalSize: fs.statSync(content).size,
        duration,
        startDate: moment().toDate()
      };
      job.markModified('process_data');

      await job.save();
    });

    command.on('progress', async function (progress) {
      logger.debug('process is %j', progress);
      job.process_data.progress = progress;
      job.markModified('process_data');
      await job.save();
    });

    command.on('error', async function (err) {
      logger.error(`FFMPEG command err ${err.message}`);
      reject(err);
    });

    command.on('end', async function () {
      logger.info('FFMPEG Command end');
      job.episode.path = out;

      await job.episode.save();

      job.state = 'VIDEO_DONE';
      job.last_state = 'VIDEO_PROCESSING';

      job.process_data.endDate = moment().toDate();
      job.markModified('process_data');
      await job.save();

      resolve(job.process_data);
    });

    command.mergeToFile(out, config.workingDirectory);
  });
}

function formatResponse(data) {
  return Object.keys(data).map(key => ({key, ...data[key]}));
}

async function getAvailableFormats() {
  await initFfmpeg();
  return new Promise((resolve, reject) => {
    Ffmpeg.getAvailableFormats(function (err, formats) {
      if (err) return reject(err);
      resolve(formatResponse(formats));
    });
  });
}

async function getAvailableFilters() {
  await initFfmpeg();
  return new Promise((resolve, reject) => {
    Ffmpeg.getAvailableFilters(function (err, filters) {
      if (err) return reject(err);
      resolve(formatResponse(filters));
    });
  });
}

async function getAvailableEncoders() {
  await initFfmpeg();
  return new Promise((resolve, reject) => {
    Ffmpeg.getAvailableEncoders(function (err, encoders) {
      if (err) return reject(err);
      resolve(formatResponse(encoders));
    });
  });
}

async function getAvailableCodecs() {
  await initFfmpeg();
  return new Promise((resolve, reject) => {
    Ffmpeg.getAvailableCodecs(function (err, codecs) {
      if (err) return reject(err);
      resolve(formatResponse(codecs));
    });
  });
}

module.exports = {
  processJob,
  getAvailableFormats,
  getAvailableFilters,
  getAvailableEncoders,
  getAvailableCodecs
}
