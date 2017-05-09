/**
 * Created by Jérémy on 07/05/2017.
 */
var service = require('./service');

module.exports = function () {
    console.log('installing ' + service.name + ' service');

    service.on('install', function () {
        console.log('starting service');
        service.start();
    });

    service.on('alreadyinstalled', function () {
        console.log('service already installed, uninstalling');
        service.uninstall();
    });

    service.on('uninstall', function () {
        console.log('service uninstalled, reinstalling');
        service.install();
    });

    if (!service.exists) {
        service.install();
    } else {
        service.start();
    }
    return service;
};