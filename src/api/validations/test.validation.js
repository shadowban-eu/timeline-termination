const Joi = require('@hapi/joi');

const tweetObject = Joi.object({
  id_str: Joi.string(),
  user_id_str: Joi.string(),
  created_at: Joi.date(),
  lang: Joi.string(),
  full_text: Joi.string(),
  possibly_sensitive_editable: Joi.bool(),
  favorite_count: Joi.number(),
  reply_count: Joi.number(),
  retweet_count: Joi.number()
});

module.exports = {
  // GET /v1/test/:subjectId
  root: {
    param: {
      subjectId: Joi.string()
    }
  },
  rootResponse: {
    tweets: Joi.object({
      subject: tweetObject.required(),
      testedWith: tweetObject.required()
    }),
    terminated: Joi.boolean().required()
  }
};

module.exports.tweetObject = tweetObject;
