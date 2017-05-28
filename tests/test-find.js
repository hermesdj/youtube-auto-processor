/**
 * Created by Jérémy on 25/05/2017.
 */
var mongoose = require('mongoose');
var Job = require('../model/job.model');
var db_config = require('../config/database-config');
var states = require('../config/states');

mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

Job.findOne().select('date_created').sort('+date_created').exec(function (err, jobs) {
    console.log(jobs);
});
