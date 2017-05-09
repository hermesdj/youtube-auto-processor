/**
 * Created by Jérémy on 06/05/2017.
 */
var chokidar = require('chokidar');
var EventLogger = require('node-windows').EventLogger;
var config = require('./service-config.json');
var log = new EventLogger(config.service_name);

var watcher = null;

exports.start = function (dir, onFile) {
    var watch_directory =  dir + '/**/*.mp4';
    log.info('directory watcher-service started on ' + watch_directory);

    watcher = chokidar.watch(watch_directory, {persistent: true, ignoreInitial: true});

    watcher.on('add', function (path) {
        log.info('New file detected by watcher-service', path);
        onFile(path);
    });
};

exports.stop = function (done) {
    log.info('stopping file watcher-service');
    watcher.close();
    done();
};