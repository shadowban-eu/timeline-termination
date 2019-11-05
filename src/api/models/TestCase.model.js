const mongoose = require('mongoose');
const {
  mongoSchema: TweetObjectSchema,
  joiSchema: apiResponseSchema
} = require('../utils/TweetObject');

/**
 * TestCase Schema
 * @private
 */
const testCaseSchema = new mongoose.Schema({
  tweets: {
    subject: TweetObjectSchema,
    testedWith: TweetObjectSchema
  },
  terminated: Boolean
});

testCaseSchema.method({
  transform() {
    const transformed = {
      tweets: { subject: {}, testedWith: {} },
      terminated: this.terminated
    };

    const tweetFields = apiResponseSchema._inner.children.map(field => field.key);

    tweetFields.forEach((field) => {
      transformed.tweets.subject[field] = this.tweets.subject[field];
      transformed.tweets.testedWith[field] = this.tweets.testedWith[field];
    });

    return transformed;
  }
});

/**
 * @typedef TestCase
 */
const TestCase = mongoose.model('TestCase', testCaseSchema);
module.exports = TestCase;
