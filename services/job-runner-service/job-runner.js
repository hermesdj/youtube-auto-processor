/**
 * Created by Jérémy on 07/05/2017.
 */

const mongoose = require('mongoose');
const config = require('./service-config.json');
const EventLogger = require('node-windows').EventLogger;
const log = new EventLogger(config.service_name);
const Task = require('./job-runner-task');
const db_config = require('../../config/database-config');
const service = require('./service');
const winston = require('winston');
const wMongoDb = require('winston-mongodb').MongoDB;
winston.add(winston.transports.MongoDB, {
    db: db_config.mongo.uri,
    options: db_config.mongo.options,
    label: 'job-runner-service'
});
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

let interval = parseInt(config.scheduled_interval);
if (interval === 0) {
    interval = 30;
}

let i = null;
winston.debug('starting interval job-runner-service for jobs with ' + interval + ' seconds interval');
i = setInterval(function () {
    winston.debug('starting new job runner task after an interval of ' + interval + ' seconds');

    Task.run(function (err, result) {
        if (err) {
            log.error(err, null);
        } else {
            log.info('task execution launched');
        }
    });
}, interval * 1000);

service.on('stop', function () {
    winston.log('clearing interval on service stop');
    clearInterval(i);
});

process.on('uncaughtException', function (err) {
    winston.error(err);
    service.stop();
});

process.on('exit', function () {
    winston.info('exiting Job Runner');
    clearInterval(i);
    mongoose.connection.close();
});