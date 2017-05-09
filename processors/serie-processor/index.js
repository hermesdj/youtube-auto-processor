/**
 * Created by Jérémy on 08/05/2017.
 */
let path = require('path');
let Serie = require('../../model/serie.model');

exports.process = function (job, done) {
    console.log('called serie processor on job', job._id);
    Serie.findOrCreate(path.dirname(job.path), function (err, serie) {
        if (err) {
            console.error(err);
            return done(err, null);
        }

        serie.addEpisode(job, function (err, episode) {
            if (err) {
                console.error(err);
                return done(err, null);
            }
            job.episode = episode;
            console.log('passing serie to next step');
            job.next(done);
        });
    });
};