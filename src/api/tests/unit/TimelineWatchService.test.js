/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const forEach = require('lodash.foreach');

const TimelineWatchService = require('../../services/TimelineWatchService');
const GuestSession = require('../../services/GuestSession');
const TweetObject = require('../../utils/TweetObject');
const WatchedUser = require('../../models/WatchedUser.model');

describe('TimelineWatch Service', function TimelineWatchServiceTest() {
  this.timeout(10000);

  const testUser = {
    userId: '25073877',
    screenName: 'realDonaldTrump',
    active: true
  };
  let watchedUser;

  before(async () => {
    try {
      // try to pick a session to test with
      GuestSession.pickSession();
    } catch (err) {
      // create one, if none is available
      if (err instanceof RangeError) {
        await GuestSession.createSession();
      }
    }
    watchedUser = new WatchedUser(testUser);
    await watchedUser.save();
  });

  after(() => WatchedUser.deleteMany({}));

  it('throws a ReferenceError when constructed without WatchedUser', async () => {
    const asObject = watchedUser.toJSON();

    expect(() => new TimelineWatchService()).to.throw(
      ReferenceError,
      'First parameter must be a WatchedUser instance.'
    );
    expect(() => new TimelineWatchService(asObject)).to.throw(
      ReferenceError,
      'First parameter must be a WatchedUser instance.'
    );
    expect(() => new TimelineWatchService(watchedUser)).not.to.throw();
  });

  describe('#setSeenIds', () => {
    let tws;
    before(() => {
      tws = new TimelineWatchService(watchedUser);
    });

    it('appends array of tweet ids to user\'s seenIds', async () => {
      tws.user.seenIds = ['1', '2', '3'];
      await tws.setSeenIds(['foo', 'bar']);
      expect(tws.user.seenIds).to.eql(['1', '2', '3', 'foo', 'bar']);
    });

    it('saves the user', async () => {
      const updated = await WatchedUser.findOne({ userId: watchedUser.userId });
      expect(updated.seenIds).to.eql(['1', '2', '3', 'foo', 'bar']);
    });
  });

  describe('#pollTimeline', () => {
    it('queries user\'s profile and returns tweetObjects', async () => {
      const tws = new TimelineWatchService(watchedUser);

      const tweetObjects = await tws.pollTimeline();
      forEach(tweetObjects, (tweet) => {
        expect(tweet).to.be.instanceof(TweetObject);
        expect(tweet.userId).to.be.eql(watchedUser.userId);
      });
    });
  });

  describe('#start', () => {
    let tws;
    before(() => {
      tws = new TimelineWatchService(watchedUser);
    });
    after(() => tws.stop());

    it('starts polling the user\'s profile timeline', () => {
      tws.start();
      expect(tws.pollingInterval).to.have.property('_destroyed', false);
    });

    it('uses the user\'s pollingTimeout value', () =>
      expect(tws.pollingInterval).to.have.property('_idleTimeout', tws.user.pollingTimeout)
    );
  });

  describe('#stop', () => {
    it('stops a running pollingInterval', async () => {
      const tws = new TimelineWatchService(watchedUser);
      tws.start();
      expect(tws.pollingInterval).to.have.property('_destroyed', false);
      tws.stop();
      expect(tws.pollingInterval).to.be.null;
    });
  });
});
