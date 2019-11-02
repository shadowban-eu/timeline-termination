const GuestSession = require('./GuestSession');

const TestService = {};

TestService.getTweetsForSubject = async (subjectTweetId) => {
  const timeline = await GuestSession.getTimeline(subjectTweetId);
  const tweetIds = Object.keys(timeline.tweets).sort();

  const subjectIdx = tweetIds.indexOf(subjectTweetId);
  const subjectTweet = timeline.tweets[subjectTweetId];

  const testTweetId = tweetIds[subjectIdx + 1];
  const testTweet = timeline.tweets[testTweetId];

  return {
    subject: {
      id_str: subjectTweet.id_str,
      user_id_str: subjectTweet.user_id_str,
      created_at: subjectTweet.created_at,
      lang: subjectTweet.lang,
      full_text: subjectTweet.full_text,
      possibly_sensitive_editable: subjectTweet.possibly_sensitive_editable,
      favorite_count: subjectTweet.favorite_count,
      reply_count: subjectTweet.reply_count,
      retweet_count: subjectTweet.retweet_count
    },
    testedWith: {
      id_str: testTweet.id_str,
      user_id_str: testTweet.user_id_str,
      created_at: testTweet.created_at,
      lang: testTweet.lang,
      full_text: testTweet.full_text,
      possibly_sensitive_editable: testTweet.possibly_sensitive_editable,
      favorite_count: testTweet.favorite_count,
      reply_count: testTweet.reply_count,
      retweet_count: testTweet.retweet_count
    }
  };
};

TestService.test = async (subjectTweetId, testTweetId) => {
  const timeline = await GuestSession.getTimeline(testTweetId);
  return !Object.keys(timeline.tweets).includes(subjectTweetId);
};

module.exports = TestService;
