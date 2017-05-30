/**
 * Created by Jérémy on 08/05/2017.
 */

const mongoose = require('mongoose');
const service = require('./service');
const states = require('../../config/states');
const uploadProcessor = require('../../processors/upload-processor');
const Job = require('../../model/job.model');
const db_config = require('../../config/database-config');
const winston = require('winston');
const wMongoDb = require('winston-mongodb').MongoDB;
winston.add(winston.transports.MongoDB, {
    db: db_config.mongo.uri,
    options: db_config.mongo.options,
    label: 'upload-video-service'
});

mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

winston.log('starting upload processor service with HOME ' + process.env.HOME);
Job.findOne({state: states.UPLOAD_READY.label}).sort('+date_created').populate({
    path: 'episode',
    populate: {
        path: 'serie',
        model: 'Serie'
    }
}).exec(function (err, job) {
    if (!job) {
        winston.error('no job in UPLOAD_READY state');
        service.stop();
        return;
    }

    if (!job.episode) {
        job.error('this job has no episode configured to upload');
        service.stop();
        return;
    }

    uploadProcessor.upload(job, function (err) {
        if (err) {
            winston.error(err);
            service.stop();
            return;
        }
        winston.log('done uploading episode ' + job.episode.video_name);

        mongoose.connection.close();
        service.stop();
    });
});