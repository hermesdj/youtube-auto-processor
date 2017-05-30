/**
 * Created by Jérémy on 07/05/2017.
 */
var Service = require('node-windows').Service;
var config = require('./service-config.json');
var path = require('path');
var ServiceModel = require(path.resolve(path.join(__dirname, '../../model/service.model')));

var service = new Service({
    name: config.service_name,
    description: config.service_description,
    script: path.join(__dirname, config.main),
    env: {
        name: "HOME",
        value: process.env['HOME'] || process.env['USERPROFILE']
    }
});

function get(next) {
    let p = path.resolve(path.join(__dirname, 'service.js'));
    ServiceModel.findOne({path: p}).exec(next);
}

service.on('install', function () {
    get(function (err, service) {
        service.installed = true;
        console.log('service', service.service_name, 'installed');
        service.save();
    });
});

service.on('alreadyinstalled', function () {
    get(function (err, service) {
        service.installed = true;
        console.log('service', service.service_name, 'alreadyinstalled');
        service.save();
    });
});

service.on('invalidinstallation', function () {
    get(function (err, service) {
        service.installed = false;
        console.log('service', service.service_name, 'invalidinstallation');
        service.save();
    });
});

service.on('uninstall', function () {
    get(function (err, service) {
        service.installed = false;
        console.log('service', service.service_name, 'uninstall');
        service.save();
    });
});

service.on('start', function () {
    get(function (err, service) {
        service.started = true;
        console.log('service', service.service_name, 'started');
        service.save();
    });
});

service.on('stop', function () {
    get(function (err, service) {
        service.started = false;
        console.log('service', service.service_name, 'stopped');
        service.save();
    });
});

service.on('error', function (err) {
    console.log('service', service.service_name, 'error', err);
});

module.exports = function () {
    return service;
}();