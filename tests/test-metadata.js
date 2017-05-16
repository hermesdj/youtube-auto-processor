/**
 * Created by Jérémy on 09/05/2017.
 */
var mongoose = require('mongoose');
var MetadataProcessor = require('../processors/metadata-processor');
var Job = require('../model/job.model');
var db_config = require('../config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

Job.findOne({state: 'MONETIZE'}).sort('-date_created').populate('episode').exec(function (err, job) {
    if (err) {
        console.error(err);
        return;
    }

    if (!job) {
        console.error('no job in ALL_DONE state');
        return;
    }

    if (!job.episode) {
        console.error('this job has no episode configured to upload');
        return;
    }

    var metadataProcessor = new MetadataProcessor();
    metadataProcessor.update(job, function (err, result) {

    });
});