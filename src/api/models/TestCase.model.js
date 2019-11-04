const mongoose = require('mongoose');
const { TweetObjectSchema } = require('../utils/TweetObject');

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

/**
 * @typedef TestCase
 */
const TestCase = mongoose.model('TestCase', testCaseSchema);
module.exports = TestCase;
