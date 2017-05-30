/**
 * Created by Jérémy on 15/05/2017.
 */
const Services = require('./services');
const mongoose = require('mongoose');
const db_config = require('./config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);
mongoose.Promise = require('q').Promise;
const winston = require('winston');
const wMongoDb = require('winston-mongodb').MongoDB;
winston.add(winston.transports.MongoDB, {
    db: db_config.mongo.uri,
    options: db_config.mongo.options,
    label: 'main'
});

let services = new Services();
services.init(function (services) {
    winston.log('done initiating services');
});