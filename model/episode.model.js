/**
 * Created by Jérémy on 06/05/2017.
 */
const mongoose = require('mongoose');
const {Schema} = mongoose;
const path = require('path');
const stores = require('../config/stores.json');
const {createLogger} = require('../logger');
const logger = createLogger({label: 'episode-model'});

let EpisodeSchema = new Schema(
  {
    path: {
      type: String,
      required: true
    },
    video_name: {
      type: String,
      required: true
    },
    youtube_id: {
      type: String
    },
    playlist_item_id: {
      type: String
    },
    status: Schema.Types.Mixed,
    episode_number: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    keywords: [String],
    episode_name: {
      type: String
    },
    serie: {
      type: Schema.Types.ObjectId,
      ref: 'Serie',
      required: true,
      index: true
    },
    date_created: {
      type: Date,
      default: null,
      unique: true,
      required: true,
      dropDubs: true
    },
    thumbnails: Schema.Types.Mixed,
    publishAt: {
      type: Date,
      unique: false
    },
    localizations: Schema.Types.Mixed,
    lbry: Schema.Types.Mixed
  },
  {
    timestamps: true,
    toJSON: {virtuals: true, getters: true},
    toObject: {virtuals: true, getters: true}
  }
);

EpisodeSchema.virtual('job', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'episode',
  justOne: true
})

EpisodeSchema.virtual('thumbnail')
  .get(function () {
    return this.serie && this.serie.path ? path.join(this.serie.path, 'thumbnails', `${this.episode_number}.png`) : null;
  });


EpisodeSchema.plugin(require('../db/plugins/mongoose-ipc'), {
  ipcId: process.env.IPC_ID
});

EpisodeSchema.path('video_name').validate(function (v) {
  return v.length <= 100;
}, 'Max Length is 100 for video_name');

EpisodeSchema.path('description').validate(function (v) {
  return v.length <= 5000;
}, 'Max length is 5000 for description');

EpisodeSchema.path('keywords').validate(function (v) {
  return v.join(',').length <= 500;
}, 'Combined keywords max length is 500');

EpisodeSchema.statics.getLastEpisodeNumber = function (serie_id) {
  return this.findOne({serie: serie_id}).select('episode_number').sort('-episode_number');
};

EpisodeSchema.methods.initialize = async function (job, serie, episode_number) {
  logger.debug('serie provided is %s', serie.id);

  let config = await this.model('Config').loadAsObject();

  this.episode_number = episode_number || 1;
  this.path = job.path;
  this.date_created = job.date_created;
  this.keywords = serie.video_keywords;

  logger.debug('keywords initialized: %s', this.keywords);

  this.video_name = serie.video_title_template.replace('${episode_number}', this.episode_number);

  logger.debug('video_name initialized: %s', this.video_name);

  let description_template = serie.description_template || config.defaultDescriptionTemplate;

  if (!description_template) {
    throw new Error('No Description Template provided in serie or in default config');
  }

  logger.debug('description template initialized');

  let default_description = config.defaultDescription;

  if (!default_description) {
    logger.warn('No default description provided');
  }

  this.description = description_template.replace('${game_title}', serie.game_title)
    .replace('${resolution}', serie.resolution)
    .replace('${description}', serie.description)
    .replace('${playlist_url}', 'https://www.youtube.com/playlist?list=' + serie.playlist_id)
    .replace('${default_description}', default_description);

  logger.debug('description initialized: %s', this.description);

  logger.info('episode base params initalized: %s', this.video_name);

  if (!serie.store_url) {
    if (serie.stores_url) {
      let stores_string = null;
      for (let i = 0; i < serie.stores_url.length; i++) {
        let store_url = serie.stores_url[i];
        let store_config = stores[store_url.key];
        store_config.description_fr = store_config.description_fr.replace('{{url}}', store_url.url);
        stores_string += store_config.description_fr + "\r\n\r\n";
      }
      this.description = this.description.replace('${store_url}', stores_string);
    } else {
      this.description = this.description.replace('${store_url}', '');
    }
  } else {
    this.description = this.description.replace('${store_url}', stores.default.description_fr.replace('{{url}}', serie.store_url));
  }

  logger.info('description initialized');
};

module.exports = mongoose.model('Episode', EpisodeSchema);
