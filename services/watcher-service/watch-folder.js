/**
 * Created by Jérémy on 06/05/2017.
 */
let chokidar = require('chokidar');
let EventLogger = require('node-windows').EventLogger;
let config = require('./service-config.json');
let log = new EventLogger(config.service_name);

let watcher = null;

exports.start = function (dir, onFile) {
    let watch_directory =  dir + '/**/*.mp4';
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