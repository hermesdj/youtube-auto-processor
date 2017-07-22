/**
 * Created by Jérémy on 08/05/2017.
 */
const path = require('path');
const Serie = require('../../model/serie.model');
const winston = require('winston');

exports.process = function (job, done) {
    winston.info('called serie processor on job', job._id);
    Serie.findOrCreate(path.dirname(job.path), function (err, serie) {
        if (err) {
            winston.error(err);
            return done(err, null);
        }

        serie.addEpisode(job, function (err, episode) {
            if (err) {
                winston.error(err);
                return done(err, null);
            }
            job.episode = episode;
            winston.info('passing serie to next step');
            job.next(done);
        });
    });
};