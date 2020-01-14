const Joi = require('joi');
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
  retweetCount: Number,
  hasMedia: Boolean,
  isQuoting: Boolean,
  quotedId: String,
  parentId: String,
  parentAuthorId: String,
  parentAuthorScreenName: String
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
  retweetCount: Joi.number(),
  hasMedia: Joi.boolean(),
  isQuoting: Joi.boolean(),
  quotedId: Joi.string(),
  parentId: Joi.string(),
  parentAuthorId: Joi.string(),
  parentAuthorScreenName: Joi.string(),
  parentTweet: Joi.object().allow(null)
});

class TweetObject {
  constructor({
    id_str: tweetId,
    user_id_str: userId,
    created_at: createdAt,
    lang,
    full_text: fullText,
    possibly_sensitive_editable: possiblySensitive,
    favorite_count: favoriteCount,
    reply_count: replyCount,
    retweet_count: retweetCount,
    is_quote_status: isQuoting,
    entities,
    quoted_status_id_str: quotedId,
    in_reply_to_status_id_str: parentId,
    in_reply_to_user_id_str: parentAuthorId,
    in_reply_to_screen_name: parentAuthorScreenName
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
    this.hasMedia = entities ? Object.keys(entities).includes('media') : false;
    this.isQuoting = !!isQuoting;
    this.parentId = parentId;
    this.parentAuthorId = parentAuthorId;
    this.parentAuthorScreenName = parentAuthorScreenName;
    this.parentTweet = null;
    if (this.isQuoting) {
      this.quotedId = quotedId;
    }
  }
}

module.exports = TweetObject;
module.exports.joiSchema = joiSchema;
module.exports.mongoSchema = mongoSchema;
