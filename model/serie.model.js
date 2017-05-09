/**
 * Created by Jérémy on 06/05/2017.
 */
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let path = require('path');
let Episode = require('./episode.model');

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
    episodes: [{type: Schema.Types.ObjectId, ref: 'Episode'}]
});

SerieSchema.methods.addEpisode = function (job, done) {
    console.log('retrieving last episode number');
    Episode.getLastEpisodeNumber(this._id, function (err, lastEpisode) {
        if (err) {
            console.error(err);
            return done(err, null);
        }
        let episode_number = lastEpisode ? lastEpisode.episode_number++ : this.last_episode++;
        console.log('new episode number is', episode_number);
        let episode = new Episode({
            serie: this
        });
        episode.initialize(job, this, episode_number);
        console.log('episode initialized');
        episode.save(function (err, episode) {
            if (err) {
                if (err.code === 11000) {
                    console.log('episode already stored in database');
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
                serie.video_keywords = config.video_keywords;
                serie.description = config.description;
                serie.last_episode = parseInt(config.last_episode) || 0;
                serie.game_title = config.game_title;
                serie.description_template = config.description_template || null;
                serie.playlist_title = config.playlist_title || serie.video_title_template.replace('- Episode ${episode_number}', '');

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