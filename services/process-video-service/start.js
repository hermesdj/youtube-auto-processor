/**
 * Created by Jérémy on 08/05/2017.
 */

const mongoose = require('mongoose');
const service = require('./service');
const videoProcessor = require('../../processors/video-processor');
const Job = require('../../model/job.model');
const states = require('../../config/states');
const db_config = require('../../config/database-config');
const winston = require('winston');
const wMongoDb = require('winston-mongodb').MongoDB;
winston.add(winston.transports.MongoDB, {
    db: db_config.mongo.uri,
    options: db_config.mongo.options,
    label: 'process-video-service'
});
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

winston.info('starting video processor service with env' + process.env);
Job.findOne({state: states.VIDEO_READY.label}).sort('+date_created').populate({
    path: 'episode',
    populate: {
        path: 'serie',
        model: 'Serie'
    }
}).exec(function (err, job) {
    if(err){
        winston.error(err);
        return service.stop();
    }

    if (!job) {
        winston.error('no job in VIDEO_READY state');
        return service.stop();
    }

    if (!job.episode) {
        winston.error('this job has no episode configured to process');
        job.error('this job has no episode configured to process');
        return service.stop();
    }

    videoProcessor.process(job, log, function (err, result) {
        if (err) {
            winston.error(err);
            winston.error('videoProcessorError: ', err);
            job.error(err);
            service.stop();
            return;
        }

        winston.log('done processing episode ' + job.episode.video_name, result);
        // Move job to next state
        job.next(function () {
            mongoose.connection.close();
            service.stop();
        });
    });
});