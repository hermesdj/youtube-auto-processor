/**
 * Created by Jérémy on 07/05/2017.
 */
let service = require('./service');

module.exports = function () {
    console.log('starting ' + service.name + ' service');

    service.on('install', function () {
        console.log('starting service');
        service.start();
    });

    service.on('alreadyinstalled', function () {
        console.log('service already installed');
        service.start();
    });

    service.on('uninstall', function () {
        console.log('service uninstalled');
    });

    if(!service.exists) {
        service.install();
    }else{
        service.start();
    }

    return service;
};