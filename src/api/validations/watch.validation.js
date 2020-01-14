const Joi = require('joi');

const watchedUserSchema = Joi.object({
  screenName: Joi.string().required(),
  userId: Joi.string().required(),
  pollingTimeout: Joi.number().required(),
  active: Joi.bool().required()
});

module.exports = {
  getRootResponse: Joi.object({
    watchedUsers: Joi.array().items(watchedUserSchema)
  }).required(),
  postRoot: {
    body: {
      screenName: Joi.string().regex(/^@?[a-zA-z_]{1,15}$/).required()
    }
  },
  postRootResponse: watchedUserSchema
};
