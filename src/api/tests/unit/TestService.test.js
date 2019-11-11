/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const GuestSession = require('../../services/GuestSession');
const TestService = require('../../services/TestService');
const TweetObject = require('../../utils/TweetObject');
const TestCase = require('../../models/TestCase.model');

const { joiSchema: tweetObjectJoiSchema } = TweetObject;

describe('Test Service', function testServiceTests() {
  this.timeout(20000);

  const bannedId = '1183908355372273665';
  const notBannedId = '1189475608390242305'; // clean
  // const notBannedId = '1189574251394879489'; // first missing its children
  const notBannedCommentId = '1189545551794233345'; // first missing its children

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
  });
});
