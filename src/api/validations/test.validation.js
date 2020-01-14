const Joi = require('joi');

const { joiSchema: tweetObject } = require('../utils/TweetObject');

module.exports = {
  // GET /v1/test/:tweetId
  root: {
    params: {
      tweetId: Joi.string().regex(/\d{10,20}/)
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
