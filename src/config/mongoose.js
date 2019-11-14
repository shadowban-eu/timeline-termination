const mongoose = require('mongoose');
const logger = require('./../config/logger');
const { mongo, env } = require('./vars');

// set mongoose Promise to Bluebird
mongoose.Promise = Promise;

// print mongoose logs in dev env
if (env === 'development') {
  mongoose.set('debug', true);
}

/**
* Connect to mongo db
*
* @returns {object} Mongoose connection
* @public
*/
exports.connect = () => new Promise((resolve) => {
  // Retry MONGO_RETRIES times on error and exit application on last
  let attempt = 1;
  const connectWithRetry = () => mongoose.connect(mongo.uri, {
    keepAlive: 1,
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err) => {
    if (err) {
      if (attempt === mongo.retries) {
        logger.error('MongoDB connection error');
        logger.error(err);
        process.exit(-1);
      }
      logger.warn(`MongoDB connection error. Retrying in 7 sec [${attempt}/${mongo.retries}]`);
      attempt += 1;
      return setTimeout(connectWithRetry, 7000);
    }
    logger.info('MongoDB connection established.');
    return resolve(mongoose.connection);
  });

  // print mongoose logs in dev env
  if (env === 'development') {
    mongoose.set('debug', true);
  }

  connectWithRetry();
});
