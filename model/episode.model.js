/**
 * Created by Jérémy on 06/05/2017.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const fs = require('fs');
const path = require('path');
const stores = require('../config/stores.json');
const config = require('../config/youtube.json');
const winston = require('winston');

let EpisodeSchema = new Schema({
    path: String,
    video_name: String,
    youtube_id: String,
    status: Schema.Types.Mixed,
    episode_number: Number,
    description: String,
    keywords: [String],
    episode_name: String,
    serie: {type: Schema.Types.ObjectId, ref: 'Serie'},
    date_created: {type: Date, default: null, unique: true, required: true, dropDubs: true},
    thumbnails: Schema.Types.Mixed,
    publishAt: Date,
    localizations: Schema.Types.Mixed
});

EpisodeSchema.statics.getLastEpisodeNumber = function (serie_id, done) {
    winston.debug('findOne on serie id ' + serie_id);
    this.findOne({serie: serie_id}).select('episode_number').sort('-episode_number').exec(done);
};

EpisodeSchema.methods.initialize = function (job, serie, episode_number) {
    winston.debug('serie provided is ' + serie._id);
    this.episode_number = episode_number || 1;
    this.path = job.path;
    this.date_created = job.date_created;
    this.keywords = serie.video_keywords;
    winston.debug('keywords initialized: ' + this.keywords);
    this.video_name = serie.video_title_template.replace('${episode_number}', this.episode_number);
    winston.debug('video_name initialized: ' + this.video_name);
    let description_template = serie.description_template || config.default_description_template;
    winston.debug('description template initialized');

    let default_description = null;
    if (!fs.existsSync(path.join(__dirname, '../config/default_description.txt'))) {
        winston.warn('default_description.txt template not found on file system !');
    } else {
        default_description = fs.readFileSync(path.join(__dirname, '../config/default_description.txt'), 'utf-8');
    }

    this.description = description_template.replace('${game_title}', serie.game_title)
        .replace('${description}', serie.description)
        .replace('${playlist_url}', 'https://www.youtube.com/playlist?list=' + serie.playlist_id)
        .replace('${default_description}', default_description);
    winston.debug('description initialized: ' + this.description);

    winston.info('episode base params initalized: ' + this.video_name);

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

    winston.info('description initialized');

    if (serie.localizations.length > 0) {
        this.localizations = {};
        for (let i = 0; i < serie.localizations.length; i++) {
            let localization = serie.localizations[i];
            winston.info('new language detected: ' + localization.key, localization);
            let localized_description_template = config.default_description_template_localized[localization.key];
            if (localization.description_template) {
                localized_description_template = localization.description_template;
            }
            this.localizations[localization.key] = {
                title: localization.title.replace('${episode_number}', this.episode_number),
                description: localized_description_template.replace('${game_title}', serie.game_title)
                    .replace('${description}', localization.description)
                    .replace('${playlist_url}', 'https://www.youtube.com/playlist?list=' + serie.playlist_id)
                    .replace('${default_description}', fs.readFileSync(path.join(__dirname, '../config/default_description_' + localization.key + '.txt'), 'utf-8'))
            };

            if (!serie.store_url) {
                if (serie.stores_url) {
                    let loc_stores_string = null;
                    for (let i = 0; i < serie.stores_url.length; i++) {
                        let store_url = serie.stores_url[i];
                        let store_config = stores[store_url.key];
                        store_config['description_' + localization.key] = store_config['description_' + localization.key].replace('{{url}}', store_url.url);
                        loc_stores_string += store_config['description_' + localization.key] + "\r\n\r\n";
                    }
                    this.localizations[localization.key].description = this.localizations[localization.key].description.replace('${store_url}', loc_stores_string);
                } else {
                    this.localizations[localization.key].description = this.localizations[localization.key].description.replace('${store_url}', '');
                }
            } else {
                this.localizations[localization.key].description = this.localizations[localization.key].description.replace('${store_url}',
                    stores.default['description_' + localization.key].replace('{{url}}', serie.store_url));
            }
        }
        winston.info('localization initialized');
    }
};

module.exports = mongoose.model('Episode', EpisodeSchema);