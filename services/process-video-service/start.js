/**
 * Created by Jérémy on 08/05/2017.
 */
var config = require('./service-config.json');
var EventLogger = require('node-windows').EventLogger;
var log = new EventLogger(config.service_name);
var service = require('./service');

var videoProcessor = require('../../processors/video-processor');

var Job = require('../../model/job.model');
var states = require('../../config/states');
var mongoose = require('mongoose');
var db_config = require('../../config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

console.log('starting video processor service with HOME ' + process.env.HOME);
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