/**
 * Created by Jérémy on 06/05/2017.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const path = require('path');
const Episode = require('./episode.model');

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
    store_url: String,
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
    console.log('retrieving last episode number');
    Episode.getLastEpisodeNumber(this._id, function (err, lastEpisode) {
        if (err) {
            console.error(err);
            return done(err, null);
        }
        console.log('last episode is', lastEpisode);
        let last_episode_number = this.last_episode || 0;
        if (lastEpisode) {
            last_episode_number = lastEpisode.episode_number;
        }

        let episode_number = last_episode_number + 1;
        console.log('new episode number is', episode_number);

        // Check if episode already exists in DB
        Episode.findOne({date_created: job.date_created}).exec(function (err, episode) {
            if (err) {
                return done(err);
            }

            console.log('does an episode exists ?', episode);

            if (episode) {
                done(null, episode);
            } else {
                episode = new Episode({
                    serie: this
                });
                episode.initialize(job, this, episode_number);
                console.log('episode initialized');
                episode.save(function (err, episode) {
                    if (err) {
                        if (err.code === 11000) {
                            console.log('episode already stored in database', err);
                            Episode.findOne({date_created: job.date_created}, function (err, episode) {
                                if (err) {
                                    console.error(err);
                                    return done(err, null);
                                }
                                done(null, episode);
                            })
                        } else {
                            console.error(err);
                            return done(err, null);
                        }
                    } else {
                        this.episodes.push(episode);
                        this.save(function (err, serie) {
                            if (err) {
                                console.error('error saving serie', err);
                                return done(err, null);
                            }

                            done(null, episode);
                        });
                    }
                }.bind(this))
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
            console.log('serie found for this job', serie._id);
            return done(null, serie);
        } else {
            // Create serie based on path
            console.log('serie not found for path', directory);
            let serie = new self({
                path: directory
            });
            let config = require(path.join(directory, 'serie.json'));
            if (!config) {
                console.error('Cannot find serie.json in', directory);
                done('Cannot find serie.json in' + directory);
            } else {
                serie.planning_name = config.planning_name;
                serie.playlist_id = config.playlist_id;
                serie.video_title_template = config.video_title_template;
                serie.description = config.description;
                serie.last_episode = parseInt(config.last_episode) || 0;
                serie.named_episode = config.named_episode || false;
                serie.game_title = config.game_title;
                serie.description_template = config.description_template || null;
                serie.playlist_title = config.playlist_title || serie.video_title_template.replace('- Episode ${episode_number}', '');
                serie.store_url = config.store_url;
                if (config.localizations) {
                    serie.localizations = config.localizations;
                }

                serie.video_keywords = config.video_keywords.split(',');

                serie.save(function (err, serie) {
                    if (err) {
                        return done(err, null);
                    }
                    console.log('new serie created with planning name', serie.planning_name);
                    done(null, serie);
                })
            }
        }
    })
};

module.exports = mongoose.model('Serie', SerieSchema);