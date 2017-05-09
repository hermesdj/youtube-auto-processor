/**
 * Created by jdallard on 09/05/2017.
 */
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var path = require('path');
var Service = require('../model/service.model');

function ServiceManager() {
    this.serviceRoot = path.resolve(__dirname);
}

util.inherits(ServiceManager, EventEmitter);

ServiceManager.prototype.start = function (path) {

};

ServiceManager.prototype.install = function (path) {
    require('./watcher-service/install-service')();
    require('./job-runner-service/install-service')();
};

ServiceManager.prototype.stop = function (path) {

};

ServiceManager.prototype.restart = function (path) {

};

ServiceManager.prototype.uninstall = function (path) {

};

module.exports = ServiceManager;