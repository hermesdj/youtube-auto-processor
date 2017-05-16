/**
 * Created by Jérémy on 07/05/2017.
 */

var mongoose = require('mongoose');
var Task = require('../services/job-runner-service/job-runner-task');
var db_config = require('../config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

Task.run(function (err, jobs) {
    console.log('done');
});