const path = require('path');

// import .env variables
require('dotenv-safe').load({
  path: path.join(__dirname, '../../.env'),
  sample: path.join(__dirname, '../../.env.example')
});

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.TTB_PORT,
  mongo: {
    uri: process.env.NODE_ENV === 'test' ?
      process.env.TTB_MONGO_URI_TESTS :
      process.env.TTB_MONGO_URI,
    retries: process.env.TTB_MONGO_RETRIES || 3
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  twitterGuestBearer: process.env.TTB_TWITTER_GUEST_BEARER,
  userWatch: {
    pollingTimeout: (process.env.TTB_USER_WATCH_POLLING_TIMEOUT || 60 * 60) * 1000
  },
  guestSessions: process.env.TTB_GUEST_SESSIONS || 10
};
