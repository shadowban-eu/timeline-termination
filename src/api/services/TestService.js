const GuestSession = require('./GuestSession');
const TweetObject = require('../utils/TweetObject');
const { NoRepliesError, NotAReplyError } = require('../utils/Errors');
const TestCase = require('../models/TestCase.model');

const { debug } = require('../../config/logger');

class TestService {
  static async getTweetsForSubject(subjectTweetId) {
    debug(`Getting tweets for subject ${subjectTweetId}`);

    const { tweets: replies, owner: subjectTweet } = await TestService.getRepliesTo(subjectTweetId);
    const testTweetId = Object.keys(replies)[0];
    const testTweet = replies[testTweetId];

    return {
      subject: new TweetObject(subjectTweet),
      testedWith: new TweetObject(testTweet)
    };
  }

  static async getRepliesTo(tweetId) {
    const timeline = await GuestSession.getTimeline(tweetId);
    // eslint-disable-next-line
    for (let id in timeline.tweets) {
      const inReplyToId = timeline.tweets[id].in_reply_to_status_id_str;
      if (inReplyToId !== tweetId) {
        delete timeline.tweets[id];
      }
    }

    if (!Object.keys(timeline.tweets).length) {
      throw new NoRepliesError(tweetId);
    }

    return timeline;
  }

  static async test(subjectTweetId) {
    debug(`Testing ${subjectTweetId}`);
    try {
      const { testedWith, subject } = await TestService.getTweetsForSubject(subjectTweetId);
      const testCase = new TestCase({
        tweets: {
          testedWith,
          subject,
        },
        terminated: false
      });
      const timeline = await GuestSession.getTimeline(testedWith.tweetId);
      testCase.terminated = !Object.keys(timeline.tweets).includes(subjectTweetId);
      await testCase.save();
      return testCase;
    } catch (err) {
      if (err instanceof NoRepliesError) {
        return err;
      }
      throw err;
    }
  }

  static async resurrect(probeTweetId) {
    debug(`Probing ${probeTweetId} for parent resurrection`);
    const probeTimeline = await GuestSession.getTimeline(probeTweetId);
    const probeTweet = new TweetObject(probeTimeline.owner);
    if (!probeTweet.parentId) {
      throw new NotAReplyError(probeTweetId);
    }
    const testCase = new TestCase({
      tweets: { testedWith: probeTweet },
      resurrected: true
    });
    // no need to test, when it's not hidden
    const isCandidate = !Object.keys(probeTimeline.tweets).includes(probeTweet.parentId);
    testCase.resurrectCandidate = isCandidate;

    if (isCandidate) {
      try {
        probeTweet.parentTweet = await GuestSession.getTweet(probeTweet.parentId);
        testCase.terminated = probeTweet.parentTweet !== null;
        testCase.deleted = false;
        testCase.tweets.subject = probeTweet.parentTweet;
      } catch (err) {
        if (err.response.status === 404) {
          testCase.deleted = true;
          testCase.terminated = false;
        }
      }
      await testCase.save();
      return testCase;
    }

    testCase.terminated = false;
    testCase.deleted = false;
    testCase.tweets.subject = probeTweet.parentTweet;
    await testCase.save();
    return testCase;
  }
}

module.exports = TestService;
