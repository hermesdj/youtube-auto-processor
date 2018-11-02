/**
 * Created by Jérémy on 07/05/2017.
 */

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
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
    label: 'job-runner-service',
    level: 'debug'
});

mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

let interval = parseInt(config.scheduled_interval);
if (interval === 0) {
    interval = 30;
}

let i = null;
winston.debug('starting interval job-runner-service for jobs with ' + interval + ' seconds interval');
i = setInterval(function () {
    try {
        Task.run(function (err, result) {
            if (err) {
                winston.error(err, null);
            } else {
                winston.info('task execution launched');
            }
        });
    } catch (e) {
        winston.error('job runner caught exception ' + JSON.stringify(e));
        service.stop();
    }
}, interval * 1000);

service.on('stop', function () {
    winston.info('clearing interval on service stop');
    clearInterval(i);
});

process.on('uncaughtException', function (err) {
    winston.info('job runner encountered uncaught exception');
    console.error(err);
    winston.error('error caught : ' + JSON.stringify(err));
});

process.on('warning', (warning) => {
    winston.warn(warning.name);    // Print the warning name
    winston.warn(warning.message); // Print the warning message
    winston.warn(warning.stack);   // Print the stack trace
});

process.on('exit', function () {
    winston.info('exiting Job Runner');
    clearInterval(i);
    mongoose.connection.close();
});
