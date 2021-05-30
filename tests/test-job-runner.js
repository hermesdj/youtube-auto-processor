/**
 * Created by Jérémy on 07/05/2017.
 */

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var Task = require('../services/job-runner-service/job-runner-task');
var db_config = require('../config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);
const winston = require('winston');
var timer = winston.startTimer()


Task.run(function (err, jobs) {
    console.log('done');
    setTimeout(function(){
        timer.done("Logging message");
    }, 1000);
});
