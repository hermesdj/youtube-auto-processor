/**
 * Created by Jérémy on 07/05/2017.
 */

var mongoose = require('mongoose');
var config = require('./service-config.json');
var EventLogger = require('node-windows').EventLogger;
var log = new EventLogger(config.service_name);
var Task = require('./job-runner-task');
var db_config = require('../../config/database-config');
var service = require('./service');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

var interval = parseInt(config.scheduled_interval);
if (interval === 0) {
    interval = 30;
}

var i = null;
console.log('starting interval watcher-service for jobs with ' + interval + ' seconds interval');
log.info('starting interval watcher-service for jobs with ' + interval + ' seconds interval');
i = setInterval(function () {
    log.info('starting new job runner task after an interval of ' + interval + ' seconds');

    Task.run(function (err, result) {
        if (err) {
            log.error(err, null);
        } else {
            log.info('task execution launched');
        }
    });
}, interval * 1000);

service.on('stop', function () {
    console.log('clearing interval on service stop');
    clearInterval(i);
});

process.on('exit', function () {
    clearInterval(i);
});