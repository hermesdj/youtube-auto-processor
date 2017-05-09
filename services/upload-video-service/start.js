/**
 * Created by Jérémy on 08/05/2017.
 */
var config = require('./service-config.json');
var EventLogger = require('node-windows').EventLogger;
var log = new EventLogger(config.service_name);
var service = require('./service');
var states = require('../../config/states');

var uploadProcessor = require('../../processors/upload-processor');

var Job = require('../../model/job.model');
var mongoose = require('mongoose');
var db_config = require('../../config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

console.log('starting upload processor service with HOME ' + process.env.HOME);
Job.findOne({state: states.UPLOAD_READY.label}).sort('-date_created').populate({
    path: 'episode',
    populate: {
        path: 'serie',
        model: 'Serie'
    }
}).exec(function (err, job) {
    if (!job) {
        console.error('no job in UPLOAD_READY state');
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
            console.error(err);
            service.stop();
            return;
        }
        console.log('done uploading episode ' + job.episode.video_name);
        service.stop();
    });
});