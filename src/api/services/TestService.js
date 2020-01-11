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
      tweets: { subject: null, testedWith: probeTweet },
      resurrected: true
    });

    const parentUser = await GuestSession.getUser(probeTweet.parentAuthorScreenName);
    if (parentUser.protected) {
      testCase.protected = true;
      await testCase.save();
      return testCase;
    }

    if (parentUser.suspended) {
      testCase.suspended = true;
      await testCase.save();
      return testCase;
    }

    probeTweet.parentTweet = await GuestSession.getTweet(probeTweet.parentId);
    testCase.tweets.subject = probeTweet.parentTweet;

    // no need to test, when it's not hidden
    const isCandidate = !Object.keys(probeTimeline.tweets).includes(probeTweet.parentId);
    testCase.resurrectCandidate = isCandidate;

    if (isCandidate) {
      testCase.terminated = testCase.tweets.subject !== null;
      testCase.deleted = testCase.tweets.subject === null;
    }

    await testCase.save();
    return testCase;
  }
}

module.exports = TestService;
