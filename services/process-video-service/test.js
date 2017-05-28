/**
 * Created by Jérémy on 26/05/2017.
 */
var service = require('./service');
service.install();
service.on('install', function () {
    console.log('starting service');
    service.start();
});