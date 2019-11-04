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
      process.env.MONGO_URI
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  twitterGuestBearer: process.env.TWITTER_GUEST_BEARER,
  userWatch: {
    pollingInterval: (process.env.USER_WATCH_POLLING_INTERVAL || 60 * 60) * 1000
  }
};
