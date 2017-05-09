/**
 * Created by Jérémy on 07/05/2017.
 */

let mongoose = require('mongoose');
let watcher = require('./watch-folder');
let config = require('../../config/app.json');
let service = require('./service');
let db_config = require('../../config/database-config');
let path = require('path');
let moment = require('moment');
let Job = require('../../model/job.model');

mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

watcher.start(config.watch_directory, function (file) {
    console.log('on new file', file);
    console.log('video date is', path.basename(file, '.mp4'));
    let date = moment(path.basename(file, '.mp4'), 'YYYY-MM-DD_HH:mm:ss', 'fr');

    let job = new Job({
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