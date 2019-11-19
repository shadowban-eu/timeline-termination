const GuestSession = require('./GuestSession');
const TweetObject = require('../utils/TweetObject');
const TestCase = require('../models/TestCase.model');

const { debug } = require('../../config/logger');

class TestService {
  static async getTweetsForSubject(subjectTweetId) {
    debug(`Getting tweets for subject ${subjectTweetId}`);

    const timeline = await GuestSession.getTimeline(subjectTweetId);
    const tweetIds = Object.keys(timeline.tweets).sort();

    const subjectIdx = tweetIds.indexOf(subjectTweetId);
    const subjectTweet = timeline.tweets[subjectTweetId];

    const testTweetId = tweetIds[subjectIdx + 1];
    const testTweet = timeline.tweets[testTweetId];

    return {
      subject: new TweetObject(subjectTweet),
      testedWith: new TweetObject(testTweet)
    };
  }

  static async test(subjectTweetId) {
    debug(`Testing ${subjectTweetId}`);

    const { testedWith, subject } = await TestService.getTweetsForSubject(subjectTweetId);
    const testCase = new TestCase({
      tweets: {
        testedWith,
        subject,
      },
      terminated: false
    });
    const timeline = await GuestSession.getTimeline(testedWith.tweetId, true);
    testCase.terminated = !Object.keys(timeline.tweets).includes(subjectTweetId);
    await testCase.save();
    return testCase;
  }
}

module.exports = TestService;
