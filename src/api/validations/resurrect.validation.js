const Joi = require('joi');

const { joiSchema: tweetObject } = require('../utils/TweetObject');

module.exports = {
  // GET /v1/resurrect/:probeId
  root: {
    params: {
      probeId: Joi.string().regex(/\d{10,20}/)
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
