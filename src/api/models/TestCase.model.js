const mongoose = require('mongoose');

/**
 * Refresh Token Schema
 * @private
 */
const testCaseSchema = new mongoose.Schema({
  tweets: {
    subject: {
      id_str: String,
      user_id_str: String,
      created_at: Date,
      lang: String,
      full_text: String,
      possibly_sensitive_editable: Boolean,
      favorite_count: Number,
      reply_count: Number,
      retweet_count: Number
    },
    testedWith: {
      id_str: String,
      user_id_str: String,
      created_at: Date,
      lang: String,
      full_text: String,
      possibly_sensitive_editable: Boolean,
      favorite_count: Number,
      reply_count: Number,
      retweet_count: Number
    }
  },
  terminated: Boolean
});

/**
 * @typedef TestCase
 */
const TestCase = mongoose.model('TestCase', testCaseSchema);
module.exports = TestCase;
