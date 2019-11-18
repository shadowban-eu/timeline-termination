const path = require('path');

// import .env variables
require('dotenv-safe').load({
  path: path.join(__dirname, '../../.env'),
  sample: path.join(__dirname, '../../.env.example')
});

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  mongo: {
    uri: process.env.NODE_ENV === 'test' ?
      process.env.MONGO_URI_TESTS :
      process.env.MONGO_URI,
    retries: process.env.MONGO_RETRIES || 3
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  twitterGuestBearer: process.env.TWITTER_GUEST_BEARER,
  userWatch: {
    pollingTimeout: (process.env.USER_WATCH_POLLING_TIMEOUT || 60 * 60) * 1000
  },
  guestSessions: process.env.GUEST_SESSIONS || 10
};
