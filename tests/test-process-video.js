/**
 * Created by Jérémy on 26/05/2017.
 */
const Job = require('../model/job.model');
const db_config = require('../config/database-config');
const mongoose = require('mongoose');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);
const VideoProcessor = require('../processors/video-processor');

Job.findOne({state: 'VIDEO_READY'}).sort('-date_created').populate({
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
        console.error('no job in VIDEO_READY state');
        return;
    }

    VideoProcessor.process(job, function (err, job) {
        if (err) {
            console.log(err);
        } else {
            console.log(job.process_data);
        }
    });
});