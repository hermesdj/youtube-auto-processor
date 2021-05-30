/**
 * Created by Jérémy on 08/05/2017.
 */

var mongoose = require('mongoose');
var thumbnail_processor = require('../processors/thumbnail-processor');
var Job = require('../model/job.model');
var db_config = require('../config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

Job.findOne({state: 'UPLOAD_DONE'}).sort('-date_created').populate('episode').exec(function (err, job) {
    if (err) {
        console.error(err);
        return;
    }

    if (!job) {
        console.error('no job in UPLOAD_DONE state');
        return;
    }

    if (!job.episode) {
        console.error('this job has no episode configured to upload');
        return;
    }
    thumbnail_processor.setThumbnail(job, function (err, result) {
        if(err) console.error(err);
        else console.log(result);
    });
});
