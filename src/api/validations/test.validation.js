const Joi = require('@hapi/joi');

const { joiSchema: tweetObject } = require('../utils/TweetObject');

module.exports = {
  // GET /v1/test/:subjectId
  root: {
    param: {
      subjectId: Joi.string()
    }
  },
  rootResponse: Joi.object({
    tweets: Joi.object({
      subject: tweetObject.required(),
      testedWith: tweetObject.required()
    }),
    terminated: Joi.boolean().required()
  })
};
