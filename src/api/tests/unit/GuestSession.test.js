/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const sinon = require('sinon');

const GuestSession = require('../../services/GuestSession');
const { twitterGuestBearer } = require('../../../config/vars');

describe.only('GuestSession Service', () => {
  let session;
  let guestToken;
  before(() => {
    session = new GuestSession();
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
    it('instanciates a new guest session and adds it to .pool', async () => {
      await GuestSession.createSession();
      expect(GuestSession.pool).to.have.a.lengthOf(1);
      expect(GuestSession.pool[0]).to.be.instanceof(GuestSession);
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

  describe('#getGuestToken', () => {
    it('returns a twitter guest token', async () => {
      guestToken = await session.getGuestToken();
      expect(guestToken).not.to.be.undefined;
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
    const tweetId = '1183908355372273665';
    before(async () => {
      timeline = await session.getTimeline(tweetId);
    });
    it('returns instructions for tweetId parameter', async () => {
      expect(timeline).to.have.property('id', tweetId);
      expect(timeline).to.have.property('instructions');
      expect(timeline.instructions).to.be.an('array');
    });
    it('returns tweets for tweetId parameter', async () => {
      expect(timeline).to.have.property('tweets');
      expect(timeline.tweets).to.have.property(tweetId);
    });
  });

  describe.only('#getUserId', () => {
    it('returns the user_id for given screen_name', async () => {
      const userId = await session.getUserId('realdonaldtrump');
      expect(userId).to.eql('25073877');
    });
  });

  // describe('#getUserTimeline', () => {
  //   let timeline;
  //   const userId =
  // });
});
