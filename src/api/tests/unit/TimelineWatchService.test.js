/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const forEach = require('lodash.foreach');

const TimelineWatchService = require('../../services/TimelineWatchService');
const GuestSession = require('../../services/GuestSession');
const TweetObject = require('../../utils/TweetObject');
const WatchedUser = require('../../models/WatchedUser.model');

const testUser = {
  userId: '25073877',
  screenName: 'realDonaldTrump',
  active: true
};

describe('TimelineWatch Service', function TimelineWatchServiceTest() {
  this.timeout(10000);

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
    const user = new WatchedUser(testUser);
    await user.save();
  });

  after(() => WatchedUser.deleteMany({}));

  describe('#loadUser', () => {
    it('loads the WatchedUser from database', async () => {
      const { userId } = testUser;
      const tws = new TimelineWatchService(userId);
      await tws.loadUser();
      expect(tws.user).to.be.instanceof(WatchedUser);
      expect(tws.user).to.have.property('userId', userId);
    });
  });

  describe('#setSeenIds', () => {
    const { userId } = testUser;
    const tws = new TimelineWatchService(userId);

    before(() => tws.loadUser());

    it('appends array of tweet ids to user\'s seenIds', async () => {
      tws.user.seenIds = ['1', '2', '3'];
      await tws.setSeenIds(['foo', 'bar']);
      expect(tws.user.seenIds).to.eql(['1', '2', '3', 'foo', 'bar']);
    });

    it('saves the user', async () => {
      const updated = await WatchedUser.findOne({ userId });
      expect(updated.seenIds).to.eql(['1', '2', '3', 'foo', 'bar']);
    });
  });

  describe('#pollTimeline', () => {
    it('queries user\'s profile and returns tweetObjects', async () => {
      const { userId } = testUser;
      const tws = new TimelineWatchService(userId);
      await tws.loadUser();

      const tweetObjects = await tws.pollTimeline();
      forEach(tweetObjects, (tweet) => {
        expect(tweet).to.be.instanceof(TweetObject);
        expect(tweet.userId).to.be.eql(userId);
      });
    });
  });

  describe('#start', () => {
    const { userId } = testUser;
    const tws = new TimelineWatchService(userId);

    before(() => tws.loadUser());
    after(tws.stop);

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
      const { userId } = testUser;
      const tws = new TimelineWatchService(userId);
      await tws.loadUser();
      tws.start();
      expect(tws.pollingInterval).to.have.property('_destroyed', false);
      tws.stop();
      expect(tws.pollingInterval).to.be.null;
    });
  });
});
