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
    subject: {
      type: TweetObjectSchema,
      default: null
    },
    testedWith: {
      type: TweetObjectSchema,
      default: null
    }
  },
  terminated: Boolean,
  resurrected: Boolean,
  deleted: Boolean,
  protected: Boolean,
  suspended: Boolean,
  resurrectCandidate: Boolean
});

testCaseSchema.method({
  transform() {
    const transformed = {
      tweets: { subject: null, testedWith: {} },
      terminated: this.terminated,
      resurrected: this.resurrected,
      deleted: this.deleted,
      protected: this.protected,
      suspended: this.suspended,
      resurrectCandidate: this.resurrectCandidate
    };

    const tweetFields = apiResponseSchema._inner.children.map(field => field.key);

    if (this.tweets.subject !== null) {
      transformed.tweets.subject = {};
      tweetFields.forEach((field) => {
        transformed.tweets.subject[field] = this.tweets.subject[field];
      });
    }

    tweetFields.forEach((field) => {
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
