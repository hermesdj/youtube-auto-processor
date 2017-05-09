/**
 * Created by Jérémy on 06/05/2017.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var fs = require('fs');
var path = require('path');
var config = require('../config/youtube.json');

var EpisodeSchema = new Schema({
    path: String,
    video_name: String,
    youtube_id: String,
    status: Schema.Types.Mixed,
    episode_number: Number,
    description: String,
    keywords: [String],
    serie: {type: Schema.Types.ObjectId, ref: 'Serie'},
    date_created: {type: Date, default: null, unique: true, required: true, dropDubs: true},
    thumbnails: Schema.Types.Mixed,
    publishAt: {type: Date, default: null, unique: true}
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
    var description_template = serie.description_template || config.default_description_template;
    this.description = description_template.replace('${game_title}', serie.game_title)
        .replace('${description}', serie.description)
        .replace('${steam_url}', serie.steam_url)
        .replace('${playlist_url}', 'https://www.youtube.com/playlist?list=' + serie.playlist_id)
        .replace('${default_description}', fs.readFileSync(path.join(__dirname, '../config/default_description.txt'), 'utf-8'));
};

module.exports = mongoose.model('Episode', EpisodeSchema);