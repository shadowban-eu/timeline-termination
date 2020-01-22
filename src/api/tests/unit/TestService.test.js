/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const GuestSession = require('../../services/GuestSession');
const TestService = require('../../services/TestService');
const TweetObject = require('../../utils/TweetObject');
const { NoRepliesError } = require('../../utils/Errors');
const TestCase = require('../../models/TestCase.model');
const { testProps } = require('../utils');

const { joiSchema: tweetObjectJoiSchema } = TweetObject;

describe('Test Service', () => {
  const terminatedId = '1183908355372273665';
  const notTerminatedId = '1189475608390242305'; // clean
  // const notTerminatedId = '1189574251394879489'; // first missing its children
  const notTerminatedCommentId = '1189545551794233345'; // first missing its children
  const noRepliesTweetId = '1189546480144654342';

  before(async () => GuestSession.createSession());

  describe('.getTweetsForSubject', () => {
    it('returns TweetObjects of subject and reply tweet to test with', async () => {
      const { testedWith, subject } = await TestService.getTweetsForSubject(terminatedId);
      expect(subject).to.be.instanceof(TweetObject);
      expect(testedWith).to.be.instanceof(TweetObject);

      const { error: testedWithError } = tweetObjectJoiSchema.validate(testedWith);
      const { error: subjectError } = tweetObjectJoiSchema.validate(subject);
      expect(testedWithError).to.be.null;
      expect(subjectError).to.be.null;
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
        testProps(err, {
          message: `Tweet ${noRepliesTweetId} has no replies.`,
          tweetId: noRepliesTweetId
        });
      }
      expect(caught).to.be.true;
    });
  });

  describe('.test', () => {
    let testCase;

    before(async () => {
      testCase = await TestService.test(terminatedId);
    });

    it('returns a TestCase', async () => {
      expect(testCase).to.be.instanceof(TestCase);
    });

    it('returns true when tweet is banned ', async () => {
      expect(testCase.terminated).to.eql(true);
    });

    it('returns false when tweet is not banned ', async () => {
      const notBannedTestCase = await TestService.test(notTerminatedId);
      expect(notBannedTestCase.terminated).to.eql(false);
    });

    it('returns false when a comment is not banned', async () => {
      const notBannedTestCase = await TestService.test(notTerminatedCommentId);
      expect(notBannedTestCase.terminated).to.eql(false);
    });

    it('returns a NoRepliesError when subject has no replies', async () => {
      const noRepliesTestCase = await TestService.test(noRepliesTweetId);
      expect(noRepliesTestCase).to.be.instanceof(NoRepliesError);
    });
  });

  describe('.resurrect', () => {
    let terminatedTestCase;
    const terminatedProbeId = '1183909147072520193';
    const deletedProbeId = '1214957370431942656';
    const notTerminatedProbeId = '1189637556914270209';
    const suspendedProbeId = '1209194776656072704';
    const protectedProbeId = '1215987140351479809';
    const authorDeletedProbeId = '1219658203148976128';

    before(async () => {
      terminatedTestCase = await TestService.resurrect(terminatedProbeId);
    });

    it('returns a TestCase', () => {
      expect(terminatedTestCase).to.be.instanceof(TestCase);
    });

    it('skips not hidden parents', async () => {
      const skippedTestCase = await TestService.resurrect(notTerminatedProbeId);
      testProps(skippedTestCase, { resurrectCandidate: false });
    });

    it('identifies deleted tweets', async () => {
      const expectedProps = {
        resurrected: true,
        deleted: true,
        terminated: false,
        resurrectCandidate: true
      };
      const deletedTestCase = await TestService.resurrect(deletedProbeId);
      testProps(deletedTestCase, expectedProps);
    });

    it('identifies terminated tweets', () => {
      const expectedProps = {
        resurrected: true,
        terminated: true,
        deleted: false,
        resurrectCandidate: true
      };
      testProps(terminatedTestCase, expectedProps);
    });

    it('identifies suspended authors', async () => {
      const expectedProps = {
        resurrected: true,
        suspended: true
      };
      const suspendedTestCase = await TestService.resurrect(suspendedProbeId);
      testProps(suspendedTestCase, expectedProps);
    });

    it('identifies protected authors', async () => {
      const expectedProps = {
        resurrected: true,
        protected: true
      };
      const protectedTestCase = await TestService.resurrect(protectedProbeId);
      testProps(protectedTestCase, expectedProps);
    });

    it('identifies deleted authors', async () => {
      const expectedProps = {
        resurrected: true,
        authorDeleted: true
      };
      const authorDeletedTestCase = await TestService.resurrect(authorDeletedProbeId);
      testProps(authorDeletedTestCase, expectedProps);
    });
  });
});
