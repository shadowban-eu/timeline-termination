/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const GuestSession = require('../../services/GuestSession');
const TestService = require('../../services/TestService');

const { tweetObject } = require('../../validations/test.validation');

describe('Test Service', () => {
  const bannedId = '1183908355372273665';
  const notBannedId = '1189475608390242305'; // clean
  // const notBannedId = '1189574251394879489'; // first missing its children
  const notBannedCommentId = '1189545551794233345'; // first missing its children
  let notBannedTestTweetId;
  let bannedTestTweetId;
  let notBannedCommentTestId;

  before(async () => GuestSession.createSession());

  describe('.getTweetsForSubject', () => {
    it('returns tweetObjects of subject and reply tweet to test with', async () => {
      const { testedWith, subject } = await TestService.getTweetsForSubject(bannedId);
      bannedTestTweetId = testedWith.id_str;

      const { error: testedWithError } = tweetObject.validate(testedWith);
      const { error: subjectError } = tweetObject.validate(subject);
      expect(testedWithError).to.be.undefined;
      expect(subjectError).to.be.undefined;
    });
  });

  describe('.test', () => {
    before(async () => {
      const {
        testedWith: notBannedTestTweet
      } = await TestService.getTweetsForSubject(notBannedId);
      const {
        testedWith: notBannedCommentTest
      } = await TestService.getTweetsForSubject(notBannedCommentId);

      notBannedTestTweetId = notBannedTestTweet.id_str;
      notBannedCommentTestId = notBannedCommentTest.id_str;
    });

    it('returns true when tweet is banned ', async () => {
      const banned = await TestService.test(bannedId, bannedTestTweetId);
      expect(banned).to.eql(true);
    });

    it('returns false when tweet is not banned ', async () => {
      const banned = await TestService.test(notBannedId, notBannedTestTweetId);
      expect(banned).to.eql(false);
    });

    it('returns false when a comment is not banned', async () => {
      const notBanned = await TestService.test(notBannedCommentId, notBannedCommentTestId);
      expect(notBanned).to.eql(false);
    });
  });
});
