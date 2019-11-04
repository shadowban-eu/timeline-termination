const Joi = require('@hapi/joi');
const { Schema } = require('mongoose');

const mongoSchema = new Schema({
  tweetId: String,
  userId: String,
  createdAt: Date,
  lang: String,
  fullText: String,
  possiblySensitive: Boolean,
  favoriteCount: Number,
  replyCount: Number,
  retweetCount: Number
}, {
  _id: false
});

const joiSchema = Joi.object({
  tweetId: Joi.string(),
  userId: Joi.string(),
  createdAt: Joi.date(),
  lang: Joi.string(),
  fullText: Joi.string(),
  possiblySensitive: Joi.bool(),
  favoriteCount: Joi.number(),
  replyCount: Joi.number(),
  retweetCount: Joi.number()
});

const TweetObject = function TweetObject({
  id_str: tweetId,
  user_id_str: userId,
  created_at: createdAt,
  lang,
  full_text: fullText,
  possibly_sensitive_editable: possiblySensitive,
  favorite_count: favoriteCount,
  reply_count: replyCount,
  retweet_count: retweetCount
}) {
  this.tweetId = tweetId;
  this.userId = userId;
  this.createdAt = createdAt;
  this.lang = lang;
  this.fullText = fullText;
  this.possiblySensitive = possiblySensitive;
  this.favoriteCount = favoriteCount;
  this.replyCount = replyCount;
  this.retweetCount = retweetCount;
};

module.exports = TweetObject;
module.exports.joiSchema = joiSchema;
module.exports.mongoSchema = mongoSchema;
