/**
 * Created by Jérémy on 07/05/2017.
 */
var mongoose = require('mongoose');
var watcher = require('./watch-folder');
var config = require('../../config/app.json');
var service = require('./service');
var db_config = require('../../config/database-config');
var path = require('path');
var moment = require('moment');
var Job = require('../../model/job.model');
require('../job-runner-service/install-service')();

mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

watcher.start(config.watch_directory, function (file) {
    console.log('on new file', file);
    console.log('video date is', path.basename(file, '.mp4'));
    var date = moment(path.basename(file, '.mp4'), 'YYYY-MM-DD_HH:mm:ss', 'fr');

    var job = new Job({
        path: file,
        date_created: date.toDate()
    });
    job.save(function (err, job) {
        if (err) {
            console.error('error creating job', err);
            return err;
        }
        console.log('new job saved', job);
    });
});

service.on('stop', function () {
    console.log('Service is being stopped');
    watcher.stop(function () {
        console.log('Watcher has been stopped');
    });
});