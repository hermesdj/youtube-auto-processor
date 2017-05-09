/**
 * Created by Jérémy on 07/05/2017.
 */

let mongoose = require('mongoose');
let config = require('./service-config.json');
let EventLogger = require('node-windows').EventLogger;
let log = new EventLogger(config.service_name);
let Task = require('./job-runner-task');
let db_config = require('../../config/database-config');
let service = require('./service');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

let interval = parseInt(config.scheduled_interval);
if (interval === 0) {
    interval = 30;
}

let i = null;
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