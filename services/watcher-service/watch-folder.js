/**
 * Created by Jérémy on 06/05/2017.
 */
const chokidar = require('chokidar');
const config = require('./service-config.json');
const winston = require('winston');

let watcher = null;

exports.start = function (dir, onFile) {
    let watch_directory =  dir + '/**/*.mp4';
    winston.info('directory watcher-service started on ' + watch_directory);

    watcher = chokidar.watch(watch_directory, {persistent: true, ignoreInitial: true});

    watcher.on('add', function (path) {
        winston.info('New file detected by watcher-service', path);
        onFile(path);
    });
};

exports.stop = function (done) {
    winston.info('stopping file watcher-service');
    watcher.close();
    done();
};