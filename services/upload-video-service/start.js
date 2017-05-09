/**
 * Created by Jérémy on 08/05/2017.
 */

let mongoose = require('mongoose');
let config = require('./service-config.json');
let EventLogger = require('node-windows').EventLogger;
let log = new EventLogger(config.service_name);
let service = require('./service');
let states = require('../../config/states');

let uploadProcessor = require('../../processors/upload-processor');

let Job = require('../../model/job.model');
let db_config = require('../../config/database-config');
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