/**
 * Created by jdallard on 09/05/2017.
 */
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var path = require('path');
var flow = require('flow');
var Service = require('../model/service.model');

function ServiceManager() {
}

util.inherits(ServiceManager, EventEmitter);

ServiceManager.prototype.init = function (done) {
    var self = this;
    Service.find({}).exec(function (err, services) {
        if (err) throw err;
        if (services.length === 0) {
            var servicesPaths = [
                './job-runner-service',
                './process-video-service',
                './upload-video-service',
                './watcher-service'
            ];

            flow.serialForEach(servicesPaths, function (servicePath) {
                var service = new Service();
                console.log('init', path.join(__dirname, servicePath, 'service-config.json'));
                var definition = require(path.resolve(path.join(__dirname, servicePath, 'service-config.json')));
                service.service_name = definition.service_name;
                service.service_description = definition.service_description;
                service.path = path.resolve(path.join(__dirname, servicePath, 'service.js'));
                service.save(this);
            }, function (err, result) {
                if (err) {
                    throw err;
                }
                self.install(result);
            }, function () {
                done(Service.find({}));
            });
        } else {
            console.log('services already in database, starting...');
            flow.serialForEach(services, function (service) {
                if (!service.installed) {
                    self.install(service, this);
                } else if (!service.started) {
                    self.start(service, this);
                }
            }, function (err) {
                if (err) {
                    throw err;
                }
            }, function () {
                done(Service.find({}));
            })
        }
    });
};

ServiceManager.prototype.start = function (service, done) {
    console.log('starting service', service.service_name);
    var instance = require(service.path);
    instance.start();
    instance.on('start', function () {
        done(null);
    });
    instance.on('error', function (err) {
        done(err);
    });
};

ServiceManager.prototype.install = function (service, done) {
    console.log('installing service', service.service_name);
    var instance = require(service.path);
    instance.install();
    instance.on('install', function () {
        done(null);
    });
    instance.on('alreadyinstalled', function () {
        done(null);
    });
    instance.on('error', function (err) {
        done(err);
    });
};

ServiceManager.prototype.stop = function (service, done) {
    console.log('stopping service', service.service_name);
    var instance = require(service.path);
    instance.stop();
    instance.on('stop', function () {
        done(null);
    });
    instance.on('error', function (err) {
        done(err);
    });
};

ServiceManager.prototype.restart = function (service, done) {
    console.log('restarting service', service.service_name);
    var instance = require(service.path);
    instance.stop();
    instance.on('stop', function () {
        instance.start();
    });
    instance.on('start', function () {
        done(null);
    });
    instance.on('error', function (err) {
        done(err);
    });
};

ServiceManager.prototype.uninstall = function (service, done) {
    console.log('uninstalling service', service.service_name);
    var instance = require(service.path);
    instance.uninstall();
    instance.on('uninstall', function () {
        done(null);
    });
    instance.on('error', function (err) {
        done(err);
    });
};

module.exports = ServiceManager;