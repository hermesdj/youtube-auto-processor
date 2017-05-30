/**
 * Created by Jérémy on 06/05/2017.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const fs = require('fs');
const path = require('path');
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
    this.findOne({serie: serie_id}).select('episode_number').sort('-episode_number').exec(done);
};

EpisodeSchema.methods.initialize = function (job, serie, episode_number) {
    this.episode_number = episode_number || 1;
    this.path = job.path;
    this.date_created = job.date_created;
    this.keywords = serie.video_keywords;
    this.video_name = serie.video_title_template.replace('${episode_number}', this.episode_number);
    let description_template = serie.description_template || config.default_description_template;
    this.description = description_template.replace('${game_title}', serie.game_title)
        .replace('${description}', serie.description)
        .replace('${store_url}', serie.store_url)
        .replace('${playlist_url}', 'https://www.youtube.com/playlist?list=' + serie.playlist_id)
        .replace('${default_description}', fs.readFileSync(path.join(__dirname, '../config/default_description.txt'), 'utf-8'));

    if (serie.localizations.length > 0) {
        this.localizations = {};
        for (let i = 0; i < serie.localizations.length; i++) {
            let localization = serie.localizations[i];
            winston.debug('new language detected: ' + localization.key);
            let localized_description_template = config.default_description_template_localized[localization.key];
            if (localization.description_template) {
                localized_description_template = localization.description_template[localization.key];
            }
            this.localizations[localization.key] = {
                title: localization.title.replace('${episode_number}', this.episode_number),
                description: localized_description_template.replace('${game_title}', serie.game_title)
                    .replace('${description}', localization.description)
                    .replace('${store_url}', serie.store_url)
                    .replace('${playlist_url}', 'https://www.youtube.com/playlist?list=' + serie.playlist_id)
                    .replace('${default_description}', fs.readFileSync(path.join(__dirname, '../config/default_description_' + localization.key + '.txt'), 'utf-8'))
            }
        }
    }
};

module.exports = mongoose.model('Episode', EpisodeSchema);