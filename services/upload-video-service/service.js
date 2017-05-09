/**
 * Created by Jérémy on 07/05/2017.
 */
let Service = require('node-windows').Service;
let config = require('./service-config.json');
let path = require('path');

let service = new Service({
    name: config.service_name,
    description: config.service_description,
    script: path.join(__dirname, config.main),
    env: {
        name: "HOME",
        value: process.env['HOME'] || process.env['USERPROFILE']// service is now able to access the user who created its' home directory
    }
});

module.exports = function () {
    return service;
}();