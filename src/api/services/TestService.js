const GuestSession = require('./GuestSession');
const TweetObject = require('../utils/TweetObject');

class TestService {
  static async getTweetsForSubject(subjectTweetId) {
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

  static async test(subjectTweetId, testTweetId) {
    const timeline = await GuestSession.getTimeline(testTweetId);
    return !Object.keys(timeline.tweets).includes(subjectTweetId);
  }
}

module.exports = TestService;
