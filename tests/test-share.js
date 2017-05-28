/**
 * Created by jdallard on 24/05/2017.
 */
const mongoose = require('mongoose');
const Job = require('../model/job.model');
const db_config = require('../config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);
const Discord = require('../plugins/discord');

Job.findOne({state: 'SHARE'}).sort('-date_created').populate({
    path: 'episode',
    populate: {
        path: 'serie',
        model: 'Serie'
    }
}).exec(function (err, job) {
    if (err) {
        console.error(err);
        return;
    }

    if (!job) {
        console.error('no job in SCHEDULE state');
        return;
    }

    if (!job.episode) {
        console.error('no episode for this job');
        return;
    }

    if (!job.episode.serie) {
        console.error('no serie for the episode of this job !');
    }

    Discord.share(job, function (err, message) {
        if (err) {
            console.error(err);
            return;
        }

        console.log(message);
    });
});