const {createLogger, format, transports} = require('winston');
const {json, combine, timestamp, splat, printf} = format;

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

    let loggerTransports = [];

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
    } else if (process.env.NODE_ENV === 'production') {
      loggerTransports.push(
        new transports.File({
          filename: 'logs/combined/youtube-auto-processor-log.log',
          maxsize: 1024 * 1000 * 5,
          maxFiles: 10,
          format: consoleFormat
        }),
        new transports.File({
          level: 'error',
          filename: 'logs/error/youtube-auto-processor-errors.log',
          maxsize: 1024 * 1000 * 5,
          maxFiles: 10,
          format: consoleFormat
        }),
        new transports.File({
          filename: 'logs/json/youtube-auto-processor.json',
          maxsize: 1024 * 1000 * 5,
          maxFiles: 10,
          format: jsonFormat
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
