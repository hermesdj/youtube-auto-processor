/**
 * Created by Jérémy on 07/05/2017.
 */

const mongoose = require('mongoose');
const watcher = require('./watch-folder');
const config = require('../../config/app.json');
const service = require('./service');
const db_config = require('../../config/database-config');
const path = require('path');
const moment = require('moment');
const Job = require('../../model/job.model');
const winston = require('winston');
const wMongoDb = require('winston-mongodb').MongoDB;
winston.add(winston.transports.MongoDB, {
    db: db_config.mongo.uri,
    options: db_config.mongo.options,
    label: 'watcher-service'
});
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

watcher.start(config.watch_directory, function (file) {
    winston.log('on new file', file);
    winston.log('video date is', path.basename(file, '.mp4'));
    let date = moment(path.basename(file, '.mp4'), 'YYYY-MM-DD_HH:mm:ss', 'fr');

    let job = new Job({
        path: file,
        date_created: date.toDate()
    });
    job.save(function (err, job) {
        if (err) {
            winston.error('error creating job', err);
            return err;
        }
        winston.log('new job saved', job);
    });
});

service.on('stop', function () {
    winston.log('Service is being stopped');
    mongoose.connection.close();
    watcher.stop(function () {
        winston.log('Watcher has been stopped');
    });
});