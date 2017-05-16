/**
 * Created by Jérémy on 15/05/2017.
 */
'use strict';
let Service = require('./model/service.model');
let ServiceManager = require('./services');

function WinServiceDataService($q) {
    function Factory() {
        this.manager = new ServiceManager();
    }

    Factory.prototype.list = function (opts) {
        // Simulate async nature of real remote calls
        opts = opts || {};
        return Service.find(opts).exec().then(function (services) {
            console.log(services);
            return services;
        });
    };

    Factory.prototype.start = function (service) {
        console.log('WinServiceDataService', service.service_name, 'start');
        var deferred = $q.defer();
        this.manager.start(service, function (err) {
            if (err) return deferred.reject(err);
            deferred.resolve();
        });

        return deferred.promise;
    };

    Factory.prototype.stop = function (service) {
        console.log('WinServiceDataService', service.service_name, 'stop');
        var deferred = $q.defer();
        this.manager.stop(service, function (err) {
            if (err) return deferred.reject(err);
            deferred.resolve();
        });

        return deferred.promise;
    };

    Factory.prototype.restart = function (service) {
        console.log('WinServiceDataService', service.service_name, 'restart');
        var deferred = $q.defer();
        this.manager.restart(service, function (err) {
            if (err) return deferred.reject(err);
            deferred.resolve();
        });

        return deferred.promise;
    };

    Factory.prototype.install = function (service) {
        console.log('WinServiceDataService', service.service_name, 'install');
        var deferred = $q.defer();
        this.manager.install(service, function (err) {
            if (err) return deferred.reject(err);
            deferred.resolve();
        });

        return deferred.promise;
    };

    Factory.prototype.uninstall = function (service) {
        console.log('WinServiceDataService', service.service_name, 'uninstall');
        var deferred = $q.defer();
        this.manager.uninstall(service, function (err) {
            if (err) return deferred.reject(err);
            deferred.resolve();
        });

        return deferred.promise;
    };

    return new Factory();
}

export default ['$q', WinServiceDataService];