/**
 * Created by Jérémy on 07/05/2017.
 */

let mongoose = require('mongoose');
let upload_processor = require('./processors/upload-processor');
let thumbnail_processor = require('./processors/thumbnail-processor');
let sheet_processor = require('./processors/sheet-processor');
let path = require('path');
let moment = require('moment');

let Job = require('./model/job.model');
let db_config = require('./config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);


Job.findOne({state: 'UPLOAD_READY'}).sort('-date_created').populate({
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
        console.error('no job in UPLOAD_READY state');
        return;
    }

    if (!job.episode) {
        console.error('this job has no episode configured to upload');
        return;
    }

    sheet_processor.getScheduledDate(job, function (err, result) {
        if (err) {
            console.error(err);
        }
        console.log('scheduled date for', job.episode.video_name, 'is', result);
        job.episode.publishAt = moment(result).toDate();
        job.save();
        console.log('uploading episode', job.episode.video_name, 'and scheduling at', job.episode.publishAt);
        upload_processor.upload(job, function (err) {
            console.log('done uploading episode');
            thumbnail_processor.setThumbnail(job, function (err, result) {

            });
        });
    });
});