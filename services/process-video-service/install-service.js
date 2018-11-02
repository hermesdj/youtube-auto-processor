/**
 * Created by Jérémy on 07/05/2017.
 */
var service = require('./service');
console.log('Init ' + service.name + ' service');

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

if (!service.exists) {
    console.log('installing service');
    service.install();
}

module.exports = function () {
    return service;
};