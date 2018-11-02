/**
 * Created by Jérémy on 07/05/2017.
 */

var mongoose = require('mongoose');
var upload_processor = require('../processors/upload-processor');
var thumbnail_processor = require('../processors/thumbnail-processor');
var sheet_processor = require('../processors/sheet-processor');
var path = require('path');
var moment = require('moment');

var Job = require('../model/job.model');
var db_config = require('../config/database-config');
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

    if (!job.episode.publishAt) {
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
            });
        });
    } else {
        upload_processor.upload(job, function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log('done uploading episode');
            }
        });
    }


});