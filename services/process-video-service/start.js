/**
 * Created by Jérémy on 08/05/2017.
 */

let mongoose = require('mongoose');
let config = require('./service-config.json');
let EventLogger = require('node-windows').EventLogger;
let log = new EventLogger(config.service_name);
let service = require('./service');

let videoProcessor = require('../../processors/video-processor');

let Job = require('../../model/job.model');
let states = require('../../config/states');
let db_config = require('../../config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

console.log('starting video processor service with env', process.env);
Job.findOne({state: states.VIDEO_READY.label}).sort('-date_created').populate({
    path: 'episode',
    populate: {
        path: 'serie',
        model: 'Serie'
    }
}).exec(function (err, job) {
    if (!job) {
        log.error('no job in VIDEO_READY state');
        service.stop();
    }

    if (!job.episode) {
        job.error('this job has no episode configured to process');
        service.stop();
    }

    videoProcessor.process(job, function (err) {
        if (err) {
            log.error(err);
            service.stop();
            return;
        }

        console.log('done processing episode ' + job.episode.video_name);
        job.next(function () {
            service.stop();
        });
    });
});