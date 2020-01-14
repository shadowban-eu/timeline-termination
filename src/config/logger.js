const winston = require('winston');
require('winston-daily-rotate-file');

const { combine, json, timestamp } = winston.format;
const { DailyRotateFile, Console: ConsoleTransport } = winston.transports;

const rotateOptions = {
  dirname: './logs',
  // add { filename: 'foo.%DATE%.log' }
  datePattern: 'MM-DD',
  maxSize: '100m',
  maxFiles: 10,
  zippedArchive: true,
  utc: true
};

const logger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'error.%DATE%.log',
      level: 'error'
    }),
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'combined.%DATE%.log'
    }),
  ],
});

//
// If we're not in production or test then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (!(['production', 'test'].includes(process.env.NODE_ENV))) {
  logger.add(new ConsoleTransport({
    format: winston.format.simple(),
    level: 'debug'
  }));
}

logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
