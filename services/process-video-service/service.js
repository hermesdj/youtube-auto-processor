/**
 * Created by Jérémy on 07/05/2017.
 */
var Service = require('node-windows').Service;
var config = require('./service-config.json');
var path = require('path');

var service = new Service({
    name: config.service_name,
    description: config.service_description,
    script: path.join(__dirname, config.main),
    env: [{
        name: 'HOME',
        value: process.env['HOME'] || process.env['USERPROFILE']
    }, {
        name: 'FFMPEG_PATH',
        value: path.resolve(path.join(__dirname, config.fluent_ffmpeg.ffmpeg_path))
    }, {
        name: 'FFPROBE_PATH',
        value: path.resolve(path.join(__dirname, config.fluent_ffmpeg.ffprobe_path))
    }]
});

module.exports = function () {
    return service;
}();