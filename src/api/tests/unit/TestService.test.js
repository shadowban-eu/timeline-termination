/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const GuestSession = require('../../services/GuestSession');
const TestService = require('../../services/TestService');
const TweetObject = require('../../utils/TweetObject');
const { NoRepliesError } = require('../../utils/Errors');
const TestCase = require('../../models/TestCase.model');

const { joiSchema: tweetObjectJoiSchema } = TweetObject;

describe('Test Service', () => {
  const bannedId = '1183908355372273665';
  const notBannedId = '1189475608390242305'; // clean
  // const notBannedId = '1189574251394879489'; // first missing its children
  const notBannedCommentId = '1189545551794233345'; // first missing its children
  const noRepliesTweetId = '1189546480144654342';

  before(async () => GuestSession.createSession());

  describe('.getTweetsForSubject', () => {
    it('returns TweetObjects of subject and reply tweet to test with', async () => {
      const { testedWith, subject } = await TestService.getTweetsForSubject(bannedId);
      expect(subject).to.be.instanceof(TweetObject);
      expect(testedWith).to.be.instanceof(TweetObject);

      const { error: testedWithError } = tweetObjectJoiSchema.validate(testedWith);
      const { error: subjectError } = tweetObjectJoiSchema.validate(subject);
      expect(testedWithError).to.be.null;
      expect(subjectError).to.be.null;
    });
  });

  describe('.test', () => {
    let testCase;

    before(async () => {
      testCase = await TestService.test(bannedId);
    });

    it('returns a TestCase', async () => {
      expect(testCase).to.be.instanceof(TestCase);
    });

    it('returns true when tweet is banned ', async () => {
      expect(testCase.terminated).to.eql(true);
    });

    it('returns false when tweet is not banned ', async () => {
      const notBannedTestCase = await TestService.test(notBannedId);
      expect(notBannedTestCase.terminated).to.eql(false);
    });

    it('returns false when a comment is not banned', async () => {
      const notBannedTestCase = await TestService.test(notBannedCommentId);
      expect(notBannedTestCase.terminated).to.eql(false);
    });

    it('returns a NoRepliesError when subject has no replies', async () => {
      const noRepliesTestCase = await TestService.test(noRepliesTweetId);
      expect(noRepliesTestCase).to.be.instanceof(NoRepliesError);
    });
  });

  describe('.getRepliesTo', () => {
    const tweetId = '1214936748276559873';
    const replyItselfTweetId = '1214936839259340800';
    const secondaryReplyTweetId = '1214936962349576192';
    const threadReplyTweetId = '1214937462562263042';
    let timeline;
    before(async () => {
      timeline = await TestService.getRepliesTo(replyItselfTweetId);
    });

    it('returns only direct replies to given tweetId', async () => {
      const { tweets } = timeline;
      const responseTweetIds = Object.keys(tweets);
      expect(responseTweetIds).to.not.include(tweetId);
      expect(responseTweetIds).to.not.include(replyItselfTweetId);
      expect(responseTweetIds).to.not.include(threadReplyTweetId);
      expect(responseTweetIds).to.include(secondaryReplyTweetId);
    });

    it('throws a NoRepliesError when tweet has no replies', async () => {
      let caught = false;

      try {
        await TestService.getRepliesTo(noRepliesTweetId);
      } catch (err) {
        caught = true;
        expect(err).to.be.instanceof(NoRepliesError);
        expect(err).to.have.property('message', `Tweet ${noRepliesTweetId} has no replies.`);
        expect(err).to.have.property('tweetId', noRepliesTweetId);
      }
      expect(caught).to.be.true;
    });
  });
});
