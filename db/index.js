const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const dbConfig = require('./config.json');

module.exports = {
  mongoose,
  connect() {
    const gracefulExit = function () {
      mongoose.connection.close(function () {
        console.log('Mongoose default connection is disconnected through app termination');
        process.exit(0);
      });
    }
    process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
    return mongoose.connect(dbConfig.mongo.uri, dbConfig.mongo.options);
  }
}
