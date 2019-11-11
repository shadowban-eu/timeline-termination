// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign
const { port, env } = require('./config/vars');
const logger = require('./config/logger');
const app = require('./config/express');
const mongoose = require('./config/mongoose');

const GuestSession = require('./api/services/GuestSession');

let dbConnection;
let serverInstance;

const closeConnections = () => {
  dbConnection.base.disconnect();
  serverInstance.close();
};

const initGuestSessions = () => {
  const GUEST_SESSION_POOL_SIZE = process.env.NODE_ENV === 'test' ? 1 : 10;
  const sessionInits = [];
  logger.info(`Creating ${GUEST_SESSION_POOL_SIZE} guest sessions...`);
  for (let i = 0; i < GUEST_SESSION_POOL_SIZE; i += 1) {
    sessionInits.push(GuestSession.createSession());
  }
  return Promise.all(sessionInits);
};

const init = async () => {
  if (process.env.INITIATED) {
    return;
  }
  process.env.INITITATED = true;
  // open mongoose connection
  dbConnection = await mongoose.connect();

  await initGuestSessions();

  // listen to requests
  serverInstance = app.listen(port, () => logger.info(`server started on port ${port} (${env})`));
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
module.exports.initGuestSessions = initGuestSessions;
module.exports.closeConnections = closeConnections;
