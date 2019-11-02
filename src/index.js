// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign
const { port, env } = require('./config/vars');
const logger = require('./config/logger');
const app = require('./config/express');
const mongoose = require('./config/mongoose');

const GuestSession = require('./api/services/GuestSession');


const init = async () => {
  // open mongoose connection
  mongoose.connect();

  const GUEST_SESSION_POOL_SIZE = process.env.NODE_ENV === 'test' ? 1 : 10;
  const sessionInits = [];
  logger.info(`Creating ${GUEST_SESSION_POOL_SIZE} guest sessions...`);
  for (let i = 0; i < GUEST_SESSION_POOL_SIZE; i += 1) {
    sessionInits.push(GuestSession.createSession());
  }
  await Promise.all(sessionInits);
  // listen to requests
  app.listen(port, () => logger.info(`server started on port ${port} (${env})`));
};

if (process.env.NODE_ENV !== 'test') {
  init();
}

/**
* Exports express
* @public
*/
module.exports = app;
module.exports.init = init;
