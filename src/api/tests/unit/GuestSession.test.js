/* eslint-disable no-unused-expressions */
const chai = require('chai').use(require('chai-as-promised'));
const sinon = require('sinon');

const GuestSession = require('../../services/GuestSession');
const TweetObject = require('../../utils/TweetObject');
const UserObject = require('../../utils/UserObject');
const { TweetDoesNotExistError } = require('../../utils/Errors');
const { twitterGuestBearer } = require('../../../config/vars');
const { testProps } = require('../utils');

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

  it('instanciates with an axios instance, using the guestBearer token and User-Agent', () => {
    expect(session.axiosInstance.defaults.headers.common.Authorization)
      .to.eql(`Bearer ${twitterGuestBearer}`);
    expect(session.axiosInstance.defaults.headers.common['User-Agent'])
      .to.eql(GuestSession.UA);
  });

  describe('.createSession', () => {
    let newSession;
    it('instanciates a new guest session and adds it to .pool', async () => {
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

  describe('.getTweet', () => {
    let getTweetSpy;
    before(async () => {
      sandbox.stub(GuestSession, 'pool').value([]);
      await GuestSession.createSession();
      getTweetSpy = sandbox.spy(GuestSession.pool[0], 'getTweet');
    });
    after(() => sandbox.restore());

    it('calls #getTweet on a GuestSession from .pool for tweetId parameter', async () => {
      const tweetId = '1183908355372273665';
      GuestSession.getTweet(tweetId);
      expect(getTweetSpy.calledWith(tweetId));
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

  describe('.getUser', () => {
    let getUserSpy;
    before(async () => {
      sandbox.stub(GuestSession, 'pool').value([]);
      await GuestSession.createSession();
      getUserSpy = sandbox.spy(GuestSession.pool[0], 'getUser');
    });
    after(() => sandbox.restore());

    it('calls #getUser on a GuestSession from .pool for screenName parameter', async () => {
      const screenName = 'realdonaldtrump';
      GuestSession.getUser(screenName);
      expect(getUserSpy.calledWith(screenName));
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

    it('calls #getUserId on a GuestSession from .pool for screenName parameter', async () => {
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
        reset: parseInt(res.headers['x-rate-limit-reset'], 10) * 1000
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
      testProps(session, {
        exhausted: false
      });

      await session.get('https://foo.com');

      testProps(session, {
        exhausted: true,
        rateLimitRemaining: 0
      });
    });

    it('calls .pickSession and replays request on 429 errors', async () => {
      const pickSpy = sandbox.spy(GuestSession, 'pickSession');
      const getStub = sandbox.stub(session.axiosInstance, 'get').callsFake(async () => {
        const err = new Error();
        err.response = {
          status: 429
        };
        throw err;
      });

      const res = await session.get('https://twitter.com');
      expect(getStub.called).to.be.true;
      expect(pickSpy.called).to.be.true;
      expect(res.status).to.eql(200);
    });

    it('replaces failing session and replays request on 403 errors', async () => {
      const failingSession = await GuestSession.createSession();
      const destroySpy = sandbox.spy(failingSession, 'destroy');
      const getStub = sandbox.stub(failingSession.axiosInstance, 'get').callsFake(async () => {
        const err = new Error();
        err.response = {
          status: 403
        };
        throw err;
      });
      const createSpy = sandbox.spy(GuestSession, 'createSession');

      expect(GuestSession.pool).to.include(failingSession);

      const res = await failingSession.get('https://twitter.com');
      expect(getStub.called).to.be.true;
      expect(destroySpy.called).to.be.true;
      expect(createSpy.called).to.be.true;
      expect(res.status).to.eql(200);
    });

    it('throws any request errors when passError option is truthy', async () => {
      const failingSession = await GuestSession.createSession();
      const err = new Error();
      sandbox.stub(failingSession.axiosInstance, 'get').callsFake(async () => {
        err.response = {
          status: 403
        };
        throw err;
      });

      const res = failingSession.get('https://twitter.com', {
        passError: true
      });
      await expect(res).to.be.rejectedWith(err);
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

  describe('#getTweet', () => {
    const deletedTweetId = '1214957301133647874';

    afterEach(() => sandbox.restore());

    it('returns a TweetObject for tweetId', async () => {
      const tweetId = '1183908355372273665';
      const tweet = await session.getTweet(tweetId);
      expect(tweet).to.be.instanceof(TweetObject);
      testProps(tweet, { tweetId });
    });

    it('throws a TweetDoesNotExistError when tweetId doesn\'t', async () => {
      const getTweetPromise = session.getTweet(deletedTweetId);
      await expect(getTweetPromise)
        .to.be.rejectedWith(TweetDoesNotExistError, deletedTweetId);
    });
  });

  describe('#getTimeline', () => {
    let timeline;
    let barrierOnlyTimeline;
    let getSpy;
    const tweetId = '1183908355372273665';
    const barrierOnlyTweetId = '1192199021307166720';
    const deletedTweetId = '1214957301133647874';

    before(async () => {
      getSpy = sandbox.spy(session, 'get');
      timeline = await session.getTimeline(tweetId);
      barrierOnlyTimeline = await session.getTimeline(barrierOnlyTweetId);
    });

    after(() => sandbox.restore());

    it('returns instructions for tweetId parameter', async () => {
      testProps(timeline, {
        id: tweetId,
        instructions: undefined
      });
      expect(timeline.instructions).to.be.an('array');
    });

    it('returns tweets for tweetId parameter', async () => {
      testProps(timeline.tweets, { [tweetId]: undefined });
      expect(Object.keys(timeline.tweets)).to.have.lengthOf.above(1);
    });

    it('returns the conversation owner tweet', () => {
      expect(new TweetObject(timeline.owner)).to.be.ok;
      expect(timeline.owner.id_str).to.eql(tweetId);
    });

    it('follows barrier if otherwise no tweets exist', () => {
      testProps(barrierOnlyTimeline, {
        id: barrierOnlyTweetId
      });
      testProps(barrierOnlyTimeline.tweets, { [barrierOnlyTweetId]: undefined });
      expect(Object.keys(barrierOnlyTimeline.tweets)).to.have.lengthOf.above(1);
    });

    it('throws a TweetDoesNotExistError when tweetId doesn\'t', async () => {
      const getTimelinePromise = session.getTimeline(deletedTweetId);
      await expect(getTimelinePromise)
        .to.be.rejectedWith(TweetDoesNotExistError, deletedTweetId);
    });

    it('uses session\'s .get wrapper', () => {
      expect(getSpy.called).to.be.true;
    });
  });

  describe('#getUser', () => {
    let getSpy;
    let userObject;
    const validScreenName = 'realDonaldTrump';
    const suspendedScreenName = 'fossybeer';
    const protectedScreenName = 'gunnarsonrani';
    const deletedScreenName = 'scottpa79047871';

    before(async () => {
      getSpy = sandbox.spy(session, 'get');
      userObject = await session.getUser(validScreenName);
    });

    after(() => sandbox.restore());

    it('returns a UserObject', () => {
      expect(userObject).to.be.instanceof(UserObject);
    });

    it('returns profile data for given screenName', () => {
      testProps(userObject, {
        id: '25073877',
        screenName: validScreenName
      });
    });

    it('identifies protected accounts', async () => {
      const user = await session.getUser(protectedScreenName);
      testProps(user, { protected: true });
    });

    it('identifies suspended accounts', async () => {
      const user = await session.getUser(suspendedScreenName);
      expect(user).to.be.instanceof(UserObject);
      testProps(user, { suspended: true });
    });

    it('identifies non-existent accounts', async () => {
      const user = await session.getUser(deletedScreenName);
      expect(user).to.be.instanceof(UserObject);
      testProps(user, { deleted: true });
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

    it('returns the user_id for given screenName', async () => {
      const userId = await session.getUserId('realdonaldtrump');
      expect(userId).to.eql('25073877');
    });

    it('uses session\'s .get wrapper', () => {
      expect(getSpy.called).to.be.true;
    });
  });

  describe('#getUserTimeline', () => {
    const userId = '25073877';
    let _cursor;
    let firstPage;
    let getSpy;
    before(() => {
      getSpy = sinon.spy(session, 'get');
    });

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

  describe('#destroy', () => {
    before(() => sandbox.stub(GuestSession, 'pool').value([]));
    after(() => sandbox.restore());

    it('removes itself from the session pool', async () => {
      const keepSession = await GuestSession.createSession();
      const destroySession = await GuestSession.createSession();
      expect(GuestSession.pool).to.eql([keepSession, destroySession]);
      destroySession.destroy();
      expect(GuestSession.pool).not.to.include(destroySession);
    });
  });

  describe('#scheduleReset', () => {
    it('sets a timeout to reset api rate limit counters', (done) => {
      const exhaustedSession = new GuestSession();
      exhaustedSession.rateLimitRemaining = 0;
      exhaustedSession.rateLimitReset = Date.now() + 1000;
      exhaustedSession.exhausted = true;

      exhaustedSession.scheduleReset();
      testProps(exhaustedSession.resetTimeout, {
        _destroyed: false
      });
      console.log('Timeout set - waiting for execution'); // eslint-disable-line
      setTimeout(() => {
        expect(exhaustedSession.exhausted).to.eql(false);
        done();
      }, 3000);
    });
  });
});
