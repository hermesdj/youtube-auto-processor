const {createLogger, format, transports} = require('winston');
const {json, combine, timestamp, splat, printf} = format;
require('winston-mongodb').MongoDB;

const dbConfig = require('../db/config.json');

const myFormat = printf(({level, message, label, timestamp, metadata: {pid}}) => {
  return `${timestamp} [${label}/${pid}] ${level}: ${message}`;
});

module.exports = {
  createLogger: function ({label, level = 'info'}) {

    const jsonFormat = combine(
      splat(),
      format.label({label}),
      timestamp(),
      json()
    );
    const consoleFormat = combine(
      splat(),
      format.label({label}),
      timestamp(),
      myFormat
    )

    let loggerTransports = [
      new transports.MongoDB({
        level,
        db: dbConfig.mongo.uri,
        collection: 'log',
        options: dbConfig.mongo.options,
        label,
        decolorize: true,
        expireAfterSeconds: 60 * 60 * 24,
        storeHost: true
      })
    ];

    if (process.env.NODE_ENV === 'development') {
      loggerTransports.push(
        new transports.Console({
          level,
          json: false,
          timestamp: true,
          label,
          decolorize: true,
          format: consoleFormat
        })
      );
    }

    if (process.env.NODE_ENV === 'production') {
      loggerTransports.push(
        new transports.File({
          filename: 'log',
          maxsize: 1024 * 1000 * 5,
          maxFiles: 10
        }),
        new transports.File({
          level: 'error',
          filename: 'log-error',
          maxsize: 1024 * 1000 * 5,
          maxFiles: 10
        }),
      )
    }

    return createLogger({
      level,
      format: jsonFormat,
      defaultMeta: {metadata: {service: label, pid: process.pid}},
      handleExceptions: true,
      transports: loggerTransports
    });
  }
}
