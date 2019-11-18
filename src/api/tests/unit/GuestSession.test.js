/* eslint-disable no-unused-expressions */
const chai = require('chai').use(require('chai-as-promised'));
const sinon = require('sinon');

const GuestSession = require('../../services/GuestSession');
const { twitterGuestBearer } = require('../../../config/vars');

const { expect } = chai;

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
    it('throws, if no session is in the pool', () => {
      const sessions = Array.from(GuestSession.pool);
      GuestSession.pool = [];

      expect(() => GuestSession.pickSession()).to.throw(
        RangeError,
        'GuestSession pool is empty. Create one with GuestSession.createSession!'
      );

      GuestSession.pool = Array.from(sessions);
    });
    it('returns a session that is not rate limited', () => {
      const newSession = new GuestSession();
      newSession.rateLimitRemaining = 0;
      GuestSession.pool.unshift(newSession);

      const picked = GuestSession.pickSession();
      expect(picked.rateLimitRemaining).not.to.eql(0);

      GuestSession.pool.shift();
    });
  });

  describe('.getTimeline', async () => {
    let spy;
    before(() => {
      spy = sinon.spy(GuestSession.pool[0], 'getTimeline');
    });

    it('calls #getTimeline on a GuestSession from .pool for tweetId parameter', async () => {
      const tweetId = '1183908355372273665';
      GuestSession.getTimeline(tweetId);
      expect(spy.calledWith(tweetId));
    });

    after(() => sinon.restore());
  });

  describe('.getUserId', () => {
    let spy;
    before(() => {
      spy = sinon.spy(GuestSession.pool[0], 'getUserId');
    });

    it('calls #getUserId on a GuestSession from .pool for tweetId parameter', async () => {
      const screenName = 'realdonaldtrump';
      GuestSession.getUserId(screenName);
      expect(spy.calledWith(screenName));
    });

    after(() => sinon.restore());
  });

  describe('#get', () => {
    it('is a wrapper for instance\'s axios.get', async () => {
      const spy = sinon.spy(session.axiosInstance, 'get');
      await session.get('https://twitter.com', { params: { foo: 'bar' } });
      expect(spy.calledWith('https://twitter.com', { params: { foo: 'bar' } }));
    });

    it('tracks x-rate-limit-remaining and -reset values', async () => {
      const res = await session.get(
        'https://api.twitter.com/2/timeline/profile/25073877.json'
      );
      expect(session.rateLimitRemaining).to.eql(res.headers['x-rate-limit-remaining']);
      expect(session.rateLimitReset).to.eql(res.headers['x-rate-limit-reset']);
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
    const tweetId = '1183908355372273665';
    const barrierOnlyTweetId = '1192199021307166720';
    before(async () => {
      timeline = await session.getTimeline(tweetId);
      barrierOnlyTimeline = await session.getTimeline(barrierOnlyTweetId);
    });
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
  });

  describe('#getUserId', () => {
    it('returns the user_id for given screen_name', async () => {
      const userId = await session.getUserId('realdonaldtrump');
      expect(userId).to.eql('25073877');
    });
  });

  describe('#getUserTimeline', function testGetUserTimeline() {
    const userId = '25073877';
    let _cursor;
    let firstPage;
    this.timeout(5000);

    it('returns 20 tweetObjects and a cursor', async () => {
      firstPage = await session.getUserTimeline(userId);
      const { tweets, cursor } = firstPage;

      expect(tweets).to.be.an('object');
      _cursor = cursor;
      expect(_cursor).to.be.a('string');
    });

    it('uses the cursor parameter', async () => {
      const { tweets, cursor } = await session.getUserTimeline(userId, _cursor);
      const firstPageIds = Object.keys(firstPage.tweets).sort();
      const secondPageIds = Object.keys(tweets).sort();

      expect(firstPageIds).not.to.eql(secondPageIds);
      expect(cursor).not.to.eql(_cursor);
    });
  });
});
