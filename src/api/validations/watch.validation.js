const Joi = require('joi');

module.exports = {
  postRoot: {
    body: {
      screenName: Joi.string().regex(/^@?[a-zA-z_]{1,15}$/).required()
    }
  },
  postRootResponse: Joi.object({
    screenName: Joi.string().required(),
    userId: Joi.string().required(),
    pollingInterval: Joi.number().required(),
    active: Joi.bool().required()
  })
};
