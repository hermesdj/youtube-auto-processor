/**
 * Created by Jérémy on 08/05/2017.
 */

var mongoose = require('mongoose');
var config = require('./service-config.json');
var EventLogger = require('node-windows').EventLogger;
var log = new EventLogger(config.service_name);
var service = require('./service');

var videoProcessor = require('../../processors/video-processor');

var Job = require('../../model/job.model');
var states = require('../../config/states');
var db_config = require('../../config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

log.info('starting video processor service with env' + process.env);
Job.findOne({state: states.VIDEO_READY.label}).sort('+date_created').populate({
    path: 'episode',
    populate: {
        path: 'serie',
        model: 'Serie'
    }
}).exec(function (err, job) {
    if(err){
        console.error(err);
        return service.stop();
    }

    if (!job) {
        log.error('no job in VIDEO_READY state');
        return service.stop();
    }

    if (!job.episode) {
        log.error('this job has no episode configured to process');
        job.error('this job has no episode configured to process');
        return service.stop();
    }

    videoProcessor.process(job, log, function (err, result) {
        if (err) {
            console.error(err);
            log.error('videoProcessorError: ', err);
            job.error(err);
            service.stop();
            return;
        }

        console.log('done processing episode ' + job.episode.video_name, result);
        // Move job to next state
        job.next(function () {
            mongoose.connection.close();
            service.stop();
        });
    });
});