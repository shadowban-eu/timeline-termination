const Joi = require('joi');

const { joiSchema: tweetObject } = require('../utils/TweetObject');

module.exports = {
  // GET /v1/test/:tweetId
  root: {
    param: {
      tweetId: Joi.string()
    }
  },
  rootResponse: Joi.object({
    tweets: Joi.object({
      subject: tweetObject.required(),
      testedWith: tweetObject.required()
    }),
    terminated: Joi.boolean().required(),
    resurrected: Joi.boolean(),
    deleted: Joi.boolean()
  })
};
