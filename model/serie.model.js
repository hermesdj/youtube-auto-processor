/**
 * Created by Jérémy on 06/05/2017.
 */
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const moveFile = require('move-file');

const mongoose = require('mongoose');
const {Schema} = mongoose;
const {createLogger} = require('../logger');
const logger = createLogger({label: 'serie-model'});
const moment = require('moment');

const Episode = require('./episode.model');
const stores = require('../config/stores.json');

const {
  createPlaylist,
  deletePlaylist,
  retrievePlaylistData,
  updatePlaylist
} = require('../processors/playlist-processor');

let SerieSchema = new Schema(
  {
    path: {
      type: String,
      required: true
    },
    planning_name: {
      type: String,
      required: true
    },
    playlist_id: {
      type: String,
      required: true
    },
    video_title_template: {
      type: String,
      required: true
    },
    video_keywords: [String],
    description: {
      type: String,
      required: true
    },
    last_episode: {
      type: Number,
      default: 0
    },
    game_title: {
      type: String,
      required: true
    },
    privacy_status: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'public'
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'finished', 'cancelled'],
      default: 'active'
    },
    description_template: String,
    playlist_title: String,
    default_language: {
      type: String
    },
    store_url: {
      type: String
    },
    is_partner: {
      type: Boolean,
      default: false
    },
    partner_key: {
      type: String
    },
    partner: {
      type: String
    },
    intro: {
      type: String
    },
    outro: {
      type: String
    },
    resolution: {
      type: String,
      default: '1080p'
    },
    stores_url: [
      {type: Schema.Types.Mixed}
    ],
    named_episode: {
      type: Boolean,
      default: false
    },
    thumbnails: Schema.Types.Mixed,
    localizations: [
      {
        key: String,
        title: String,
        description: String,
        description_template: Schema.Types.Mixed
      }
    ]
  },
  {
    timestamps: true,
    toJSON: {virtuals: true, getters: true},
    toObject: {virtuals: true, getters: true}
  }
);

SerieSchema.virtual('thumbnail')
  .get(function () {
    return this.path ? path.join(this.path, 'thumbnails', '1.png') : null;
  });

SerieSchema.virtual('episodes', {
  ref: 'Episode',
  localField: '_id',
  foreignField: 'serie',
  options: {sort: 'episode_number'}
});

SerieSchema.virtual('countEpisodes', {
  ref: 'Episode',
  localField: '_id',
  foreignField: 'serie',
  count: true
});

SerieSchema.virtual('firstEpisode', {
  ref: 'Episode',
  localField: '_id',
  foreignField: 'serie',
  options: {sort: 'episode_number'},
  justOne: true
})

SerieSchema.plugin(require('../db/plugins/mongoose-ipc'), {
  ipcId: process.env.IPC_ID
});

SerieSchema.methods.addEpisode = async function (job) {
  logger.info('retrieving last episode number for serie ' + this._id);

  let episode = await Episode.findOne({date_created: job.date_created});

  logger.info('does an episode exists ? %s', episode ? 'yes' : 'no');

  if (episode) {
    return episode;
  }

  let lastEpisode = await Episode.getLastEpisodeNumber(this._id);

  let last_episode_number = this.last_episode || 0;
  if (lastEpisode) {
    let {episode_number} = lastEpisode;
    logger.info('last episode is %s with number %d', lastEpisode._id, episode_number);
    if (episode_number >= this.last_episode) {
      last_episode_number = lastEpisode.episode_number;
    } else {
      logger.info('Last episode number %d was < to current last episode %d, so current is kept', episode_number, this.last_episode);
    }
  }

  let episode_number = last_episode_number + 1;
  logger.info('new episode number is', episode_number);

  episode = new Episode({
    serie: this
  });

  try {
    logger.info('initializing episode');
    await episode.initialize(job, this, episode_number);
    await episode.save();

    this.last_episode = episode_number;
    await this.save();

    logger.info('episode initialized');

    return episode;
  } catch (err) {
    if (err.code === 11000) {
      logger.info('episode already stored in database: %s', err.message);
      return Episode.findOne({date_created: job.date_created});
    } else {
      throw err;
    }
  }
};

SerieSchema.statics.findOrCreate = async function (directory) {
  let serie = await this.model('Serie').findOne({path: directory}).populate('episodes');

  if (serie) {
    logger.info('serie with id %s found for this job', serie._id);
    return serie;
  }

  // Create serie based on path
  logger.info('serie not found for path %s', directory);

  serie = new this({
    path: directory
  });

  let config = require(path.join(directory, 'serie.json'));

  if (!config) {
    logger.error('Cannot find serie.json in', directory);
    throw new Error('Cannot find serie.json in ' + directory);
  }

  serie.planning_name = config.planning_name;
  serie.playlist_id = config.playlist_id;
  serie.default_language = config.default_language || 'fr';
  serie.video_title_template = config.video_title_template;
  serie.description = config.description;
  serie.last_episode = parseInt(config.last_episode) || 0;
  serie.named_episode = config.named_episode || false;
  serie.is_partner = config.is_partner || false;
  serie.partner_key = config.partner_key || false;
  serie.game_title = config.game_title;
  serie.description_template = config.description_template || null;
  serie.playlist_title = config.playlist_title || serie.video_title_template.replace('- Episode ${episode_number}', '');
  serie.store_url = config.store_url;
  serie.stores_url = config.stores_url || null;
  serie.intro = config.intro || null;
  serie.outro = config.outro || null;
  serie.partner = null;
  serie.resolution = config.resolution || '1080p';

  if (config.is_partner && config.partner_key) {
    logger.info('adding partner intro to serie config: ' + config.partner_key);
    serie.partner = stores[config.partner_key].partner_intro;
  }

  if (config.localizations) {
    logger.info('adding localizations %j', config.localizations);
    serie.localizations = config.localizations;
  }

  serie.video_keywords = config.video_keywords.split(',');

  serie = await serie.save();
  logger.info('new serie created with planning name %s', serie.planning_name);
  return serie;
};

SerieSchema.statics.createSerie = async function (data, isNew, createOnYoutube) {
  let serie = new this(data);

  let config = await this.model('Config').loadAsObject();

  if (!config.mainAppDirectory) {
    throw new Error('No main app directory configured');
  }

  serie.path = path.resolve(
    path.join(
      path.join(config.mainAppDirectory, 'Watch'),
      serie.game_title.replace(/[^a-zA-Z ]/g, ""),
      serie.playlist_title.replace(/[^a-zA-Z ]/g, "")
    )
  );

  if (fs.existsSync(serie.path)) {
    throw new Error('Path already exists !');
  }

  logger.info('creating serie at path %s', serie.path);

  await mkdirp(serie.path);

  if (createOnYoutube) {
    serie.playlist_id = await createPlaylist(serie.playlist_title, serie.description, serie.default_language, serie.privacy_status);
  }

  return serie.save()
    .then(data => {
      fs.writeFileSync(path.join(data.path, 'serie.json'), JSON.stringify(data.toJSON(), null, 4));
      return data;
    });
}

SerieSchema.methods.deleteSerie = async function () {
  if (this.playlist_id) {
    await deletePlaylist(this.playlist_id);
  }

  await this.model('Episode').deleteMany({serie: this._id});

  await new Promise((resolve, reject) => rimraf(this.path, err => err ? reject(err) : resolve()));

  return this.remove();
}

SerieSchema.methods.syncSerieWithPlaylist = async function () {
  if (!this.playlist_id) return;
  return updatePlaylist(this.playlist_id, this.playlist_title, this.description, this.privacy_status, this.default_language);
}

SerieSchema.methods.syncPlaylistWithSerie = async function () {
  let {snippet, status} = await retrievePlaylistData(this.playlist_id);

  if (snippet.title !== this.playlist_title) {
    this.playlist_title = snippet.title;
  }

  if (snippet.description && this.description !== snippet.description) {
    this.description = snippet.description;
  }

  if (status.privacyStatus !== this.privacy_status) {
    this.privacy_status = status.privacyStatus;
  }

  if (!this.thumbnails && snippet.thumbnails) {
    this.thumbnails = snippet.thumbnails;
  }

  if (this.thumbnails && snippet.thumbnails.default.url !== this.thumbnails.default.url) {
    this.thumbnails = snippet.thumbnails;
  }

  return this.isModified() ? this.save() : this;
};

SerieSchema.methods.addRawVideoFromPath = async function (originalPath) {
  let videoName = path.basename(originalPath, '.mp4');
  let date = moment(videoName, 'YYYY-MM-DD_HH:mm:ss', 'fr');

  let moveTo = path.resolve(path.join(this.path, videoName + '.mp4'));

  let job = await this.model('Job').findOne({path: moveTo});

  if (!job) {
    job = await this.model('Job').create({
      path: moveTo,
      date_created: date.toDate()
    });

    try {
      await moveFile(originalPath, moveTo);
    } catch (err) {
      logger.error('move file error: %s', err.message);
      await job.remove();
    }
  }


  return job;
}

SerieSchema.statics.updateSerieData = async function (serieId, serieData) {
  let serie = await this.findById(serieId);

  if (!serie) {
    throw new Error('Serie not found');
  }

  serie.set(serieData);

  return serie.save();
}

module.exports = mongoose.model('Serie', SerieSchema);
