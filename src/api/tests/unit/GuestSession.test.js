/* eslint-disable no-unused-expressions */
const chai = require('chai').use(require('chai-as-promised'));
const sinon = require('sinon');

const GuestSession = require('../../services/GuestSession');
const TweetObject = require('../../utils/TweetObject');
const { twitterGuestBearer } = require('../../../config/vars');

const { expect } = chai;
const sandbox = sinon.createSandbox();

describe('GuestSession Service', () => {
  let session;
  let guestToken;
  before(async () => {
    session = await GuestSession.createSession();
  });

  it('uses guestBearer token from .env', () =>
    expect(GuestSession.guestBearer).to.eql(twitterGuestBearer)
  );

  it('has a User-Agent', () =>
    expect(GuestSession.UA).to.exist.and.to.be.a('string')
  );

  it('has a session pool', () => {
    expect(GuestSession.pool).to.be.an('array');
  });

  it('instanciates with an axios instance, using the guestBearer token', () => {
    expect(session.axiosInstance.defaults.headers.common.Authorization)
      .to.eql(`Bearer ${twitterGuestBearer}`);
  });

  describe('.createSession', () => {
    let newSession;
    it('instanciates a new guest session and adds it to .pool', async function testcreateSession() {
      this.timeout(5000);
      newSession = await GuestSession.createSession();
      expect(GuestSession.pool).to.have.lengthOf.above(0);
      expect(GuestSession.pool[GuestSession.pool.length - 1]).to.be.instanceof(GuestSession);
    });

    it('returns the new session', () => {
      expect(newSession).to.be.instanceof(GuestSession);
    });
  });

  describe('.pickSession', () => {
    beforeEach(() => sandbox.stub(GuestSession, 'pool').value([]));
    afterEach(() => sandbox.restore());

    it('returns a newly created session, if pool is empty', async () => {
      const createSessionSpy = sandbox.spy(GuestSession, 'createSession');
      const createdSession = await GuestSession.pickSession();

      expect(createdSession).to.be.instanceof(GuestSession);
      expect(createdSession.exhausted).to.eql(false);
      expect(createSessionSpy.called).to.be.true;
    });

    it('returns a session that is not rate limited', async () => {
      const limitedSession = new GuestSession();
      limitedSession.exhausted = true;
      GuestSession.pool.unshift(limitedSession);

      const picked = await GuestSession.pickSession();

      expect(GuestSession.pool).to.have.length(2);
      expect(picked.exhausted).not.to.eql(true);
      GuestSession.pool.pop(); // remove usable session for next test
    });

    it('creates and returns a new session, when all in pool are rate-limited', async () => {
      const createSessionSpy = sandbox.spy(GuestSession, 'createSession');
      const createdSession = await GuestSession.pickSession();

      expect(createdSession).to.be.instanceof(GuestSession);
      expect(createdSession.exhausted).to.eql(false);
      expect(createSessionSpy.called).to.be.true;
    });
  });

  describe('.getTimeline', async () => {
    let getTimelineSpy;
    before(async () => {
      sandbox.stub(GuestSession, 'pool').value([]);
      await GuestSession.createSession();
      getTimelineSpy = sandbox.spy(GuestSession.pool[0], 'getTimeline');
    });
    after(() => sandbox.restore());

    it('calls #getTimeline on a GuestSession from .pool for tweetId parameter', async () => {
      const tweetId = '1183908355372273665';
      GuestSession.getTimeline(tweetId);
      expect(getTimelineSpy.calledWith(tweetId));
    });
  });

  describe('.getUserId', () => {
    let getUserIdSpy;
    before(async () => {
      sandbox.stub(GuestSession, 'pool').value([]);
      await GuestSession.createSession();
      getUserIdSpy = sandbox.spy(GuestSession.pool[0], 'getUserId');
    });
    after(() => sandbox.restore());

    it('calls #getUserId on a GuestSession from .pool for tweetId parameter', async () => {
      const screenName = 'realdonaldtrump';
      GuestSession.getUserId(screenName);
      expect(getUserIdSpy.calledWith(screenName));
    });
  });

  describe('#get', () => {
    afterEach(() => sandbox.restore());

    it('is a wrapper for instance\'s axios.get', async () => {
      const spy = sandbox.spy(session.axiosInstance, 'get');
      await session.get('https://twitter.com', { params: { foo: 'bar' } });
      expect(spy.calledWith('https://twitter.com', { params: { foo: 'bar' } }));
    });

    it('tracks x-rate-limit-remaining and -reset values', async () => {
      const res = await session.get(
        'https://api.twitter.com/2/timeline/profile/25073877.json'
      );
      const parsed = {
        remaining: parseInt(res.headers['x-rate-limit-remaining'], 10),
        reset: parseInt(res.headers['x-rate-limit-reset'], 10)
      };
      expect(session.rateLimitRemaining).to.eql(parsed.remaining);
      expect(session.rateLimitReset).to.eql(parsed.reset);
    });

    it('sets the #exhausted flag, when #rateLimitRemaining becomes 0', async () => {
      sandbox.stub(session.axiosInstance, 'get').callsFake(async () => ({
        headers: {
          'x-rate-limit-remaining': '0'
        }
      }));
      expect(session).to.have.property('exhausted', false);

      await session.get('https://foo.com');

      expect(session).to.have.property('exhausted', true);
      expect(session.rateLimitRemaining).to.eql(0);
    });

    it('calls .pickSession and replays request on 429 errors', async () => {
      const pickSpy = sandbox.spy(GuestSession, 'pickSession');
      const getStub = sandbox.stub(session.axiosInstance, 'get').callsFake(async () => {
        const err = new Error();
        err.status = 429;
        throw err;
      });

      await session.get('https://twitter.com');
      expect(getStub.called).to.be.true;
      expect(pickSpy.called).to.be.true;
    });
  });

  describe('#getGuestToken', () => {
    it('returns a twitter guest token', async () => {
      guestToken = await session.getGuestToken();
      expect(guestToken).not.to.be.undefined;
    });

    it('throws when no token was received', async () => {
      const axiosPostStub = sinon.stub(session.axiosInstance, 'post').callsFake(() => ({
        data: { error: 'foo' }
      }));

      await expect(session.getGuestToken())
        .to.be.rejectedWith(Error, 'Failed to get guestToken');

      axiosPostStub.restore();
    });
  });

  describe('#setGuestTokenHeader', () => {
    it('sets the guestToken', () => {
      session.setGuestToken(guestToken);
      expect(session.guestToken).to.eql(guestToken);
    });

    it('sets the X-Guest-Token header on the axios instance', async () => {
      expect(session.axiosInstance.defaults.headers.common['X-Guest-Token']).to.eql(guestToken);
    });
  });

  describe('#getTimeline', () => {
    let timeline;
    let barrierOnlyTimeline;
    let getSpy;
    const tweetId = '1183908355372273665';
    const barrierOnlyTweetId = '1192199021307166720';
    const noRepliesTweetId = '1192338232886906880';

    before(async () => {
      getSpy = sandbox.spy(session, 'get');
      timeline = await session.getTimeline(tweetId);
      barrierOnlyTimeline = await session.getTimeline(barrierOnlyTweetId);
    });

    after(() => sandbox.restore());

    it('returns instructions for tweetId parameter', async () => {
      expect(timeline).to.have.property('id', tweetId);
      expect(timeline).to.have.property('instructions');
      expect(timeline.instructions).to.be.an('array');
    });

    it('returns tweets for tweetId parameter', async () => {
      expect(timeline).to.have.property('tweets');
      expect(timeline.tweets).to.have.property(tweetId);
      expect(Object.keys(timeline.tweets)).to.have.lengthOf.above(1);
    });

    it('follows barrier if otherwise no tweets exist', () => {
      expect(barrierOnlyTimeline).to.have.property('id', barrierOnlyTweetId);
      expect(barrierOnlyTimeline.tweets).to.have.property(barrierOnlyTweetId);
      expect(Object.keys(barrierOnlyTimeline.tweets)).to.have.lengthOf.above(1);
    });

    it('throws a RangeError when tweet has no replies', async () => {
      let caught = false;
      try {
        await session.getTimeline(noRepliesTweetId);
      } catch (err) {
        caught = true;
        expect(err).to.be.instanceof(RangeError);
        expect(err).to.have.property('message', `Tweet ${noRepliesTweetId} has no replies.`);
      }
      expect(caught).to.be.true;
    });

    it('uses session\'s .get wrapper', () => {
      expect(getSpy.called).to.be.true;
    });
  });

  describe('#getUserId', () => {
    let getSpy;
    before(() => {
      getSpy = sandbox.spy(session, 'get');
    });

    after(() => sandbox.restore());

    it('returns the user_id for given screen_name', async () => {
      const userId = await session.getUserId('realdonaldtrump');
      expect(userId).to.eql('25073877');
    });

    it('uses session\'s .get wrapper', () => {
      expect(getSpy.called).to.be.true;
    });
  });

  describe('#getUserTimeline', function testGetUserTimeline() {
    const userId = '25073877';
    let _cursor;
    let firstPage;
    let getSpy;
    before(() => {
      getSpy = sinon.spy(session, 'get');
    });
    this.timeout(5000);

    it('returns 20 tweetObjects and a cursor', async () => {
      firstPage = await session.getUserTimeline({ userId });
      const { tweets, cursor } = firstPage;

      expect(tweets).to.be.an('array');
      tweets.forEach(tweetObject => expect(tweetObject).to.be.instanceof(TweetObject));
      expect(cursor).to.be.a('string');
      _cursor = cursor;
    });

    it('uses the cursor option', async () => {
      const { tweets, cursor } = await session.getUserTimeline({ userId, cursor: _cursor });
      const firstPageIds = firstPage.tweets.map(tweet => tweet.tweetId).sort();
      const secondPageIds = tweets.map(tweet => tweet.tweetId).sort();

      expect(firstPageIds).not.to.eql(secondPageIds);
      expect(cursor).not.to.eql(_cursor);
    });

    it('uses session\'s .get wrapper', () => {
      expect(getSpy.called).to.be.true;
    });
  });
});
