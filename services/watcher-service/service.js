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
        value: process.env["USERPROFILE"] // service is now able to access the user who created its' home directory
    }
});

module.exports = function () {
    return service;
}();