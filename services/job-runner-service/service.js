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
    env: {
        name: "HOME",
        value: process.env['HOME'] || process.env['USERPROFILE']
    }
});

module.exports = function () {
    return service;
}();