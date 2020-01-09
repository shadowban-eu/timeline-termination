const Joi = require('joi');

const { joiSchema: tweetObject } = require('../utils/TweetObject');

module.exports = {
  // GET /v1/resurrect/:probeId
  root: {
    param: {
      probeId: Joi.string()
    }
  },
  rootResponse: Joi.object({
    tweets: Joi.object({
      subject: tweetObject.required().allow(null),
      testedWith: tweetObject.required().allow(null)
    }),
    resurrected: Joi.boolean().required(),
    terminated: Joi.boolean().required(),
    deleted: Joi.boolean().required()
  })
};
