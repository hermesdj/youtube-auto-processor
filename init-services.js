/**
 * Created by Jérémy on 15/05/2017.
 */
var Services = require('./services');
let mongoose = require('mongoose');
let db_config = require('./config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);
mongoose.Promise = require('q').Promise;

var services = new Services();
services.init(function (services) {
    console.log('done initiating services');
});