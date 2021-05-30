/**
 * Created by Jérémy on 06/05/2017.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const path = require('path');
const Episode = require('./episode.model');
const stores = require('../config/stores.json');
const winston = require('winston');

let SerieSchema = new Schema({
    path: String,
    planning_name: String,
    playlist_id: String,
    video_title_template: String,
    video_keywords: [String],
    description: String,
    last_episode: Number,
    game_title: String,
    description_template: String,
    playlist_title: String,
    default_language: String,
    store_url: String,
    is_partner: Boolean,
    partner_key: String,
    partner: String,
    intro: String,
    outro: String,
    resolution: {
        type: String,
        default: '1080p'
    },
    stores_url: [{type: Schema.Types.Mixed}],
    named_episode: {type: Boolean, default: false},
    episodes: [{type: Schema.Types.ObjectId, ref: 'Episode'}],
    localizations: [
        {
            key: String,
            title: String,
            description: String,
            description_template: Schema.Types.Mixed
        }
    ]
});

SerieSchema.methods.addEpisode = function (job, done) {
    winston.info('retrieving last episode number for serie ' + this._id);
    Episode.getLastEpisodeNumber(this._id, function (err, lastEpisode) {
        if (err) {
            winston.error('error on last episode query');
            winston.error(err);
            return done(err, null);
        }
        let last_episode_number = this.last_episode || 0;
        if (lastEpisode) {
            winston.info('last episode is', lastEpisode._id);
            last_episode_number = lastEpisode.episode_number;
        }

        let episode_number = last_episode_number + 1;
        winston.info('new episode number is', episode_number);

        // Check if episode already exists in DB
        Episode.findOne({date_created: job.date_created}).exec(function (err, episode) {
            if (err) {
                return done(err);
            }

            winston.info('does an episode exists ?', episode ? episode._id : 'no');

            if (episode) {
                done(null, episode);
            } else {
                episode = new Episode({
                    serie: this
                });
                try {
                    winston.info('initializing episode');
                    episode.initialize(job, this, episode_number);
                    winston.info('episode initialized');
                    episode.save(function (err, episode) {
                        if (err) {
                            if (err.code === 11000) {
                                winston.info('episode already stored in database', err);
                                Episode.findOne({date_created: job.date_created}, function (err, episode) {
                                    if (err) {
                                        winston.error(err);
                                        return done(err, null);
                                    }
                                    done(null, episode);
                                })
                            } else {
                                winston.error(err);
                                return done(err, null);
                            }
                        } else {
                            this.episodes.push(episode);
                            this.save(function (err, serie) {
                                if (err) {
                                    winston.error('error saving serie', err);
                                    return done(err, null);
                                }

                                done(null, episode);
                            });
                        }
                    }.bind(this))
                } catch (e) {
                    winston.error(e);
                    done(e, null);
                }
            }
        }.bind(this));
    }.bind(this));
};

SerieSchema.statics.findOrCreate = function (directory, done) {
    let query = this.model('Serie').findOne({path: directory});
    let self = this;
    query.exec(function (err, serie) {
        if (err) {
            return done(err, null);
        }
        if (serie) {
            // Serie exists
            winston.info('serie found for this job', serie._id);
            return done(null, serie);
        } else {
            // Create serie based on path
            winston.info('serie not found for path', directory);
            let serie = new self({
                path: directory
            });
            let config = require(path.join(directory, 'serie.json'));
            if (!config) {
                winston.error('Cannot find serie.json in', directory);
                done('Cannot find serie.json in' + directory);
            } else {
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
                    winston.info('adding partner intro to serie config: ' + config.partner_key);
                    serie.partner = stores[config.partner_key].partner_intro;
                }

                if (config.localizations) {
                    winston.info('adding localization');
                    serie.localizations = config.localizations;
                }

                serie.video_keywords = config.video_keywords.split(',');

                serie.save(function (err, serie) {
                    if (err) {
                        return done(err, null);
                    }
                    winston.info('new serie created with planning name', serie.planning_name);
                    done(null, serie);
                })
            }
        }
    })
};

module.exports = mongoose.model('Serie', SerieSchema);
