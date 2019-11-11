/* eslint-disable no-unused-expressions */
const EventEmitter = require('events');
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

describe.only('TimelineWatch Service', function TimelineWatchServiceTest() {
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

  it('extends EventEmitter', () => {
    const tws = new TimelineWatchService();
    expect(tws).to.be.instanceof(EventEmitter);
  });

  describe('loadUser', () => {
    it('loads the WatchedUser from database', async () => {
      const { userId } = testUser;
      const tws = new TimelineWatchService(userId);
      await tws.loadUser();
      expect(tws.user).to.be.instanceof(WatchedUser);
      expect(tws.user).to.have.property('userId', userId);
    });
  });

  describe('#emitNewTweets', () => {
    it('emits a `new-tweets` event', (done) => {
      const emitObjects = [
        { tweetId: '213213123' },
        { tweetId: '9481274' },
        { tweetId: '824726419' },
      ];
      const tws = new TimelineWatchService();
      tws.on('new-tweets', (tweetObjects) => {
        expect(tweetObjects).to.eql(emitObjects);
        done();
      });
      tws.emitNewTweets(emitObjects);
    });
  });

  describe('#pollTimeline', () => {
    it('queries user\'s profile and emits tweetObjects', (done) => {
      const { userId } = testUser;
      const tws = new TimelineWatchService(userId);

      tws.on('new-tweets', (tweetObjects) => {
        forEach(tweetObjects, (tweet) => {
          expect(tweet).to.be.instanceof(TweetObject);
          expect(tweet.userId).to.be.eql(userId);
        });
        done();
      });

      tws.pollTimeline();
    });
  });

  describe('#start', () => {
    let newTweetsFired = 0;

    it('starts polling the user\'s profile timeline', (done) => {
      const { userId } = testUser;
      const tws = new TimelineWatchService(userId);
      tws.on('new-tweets', (tweetObjects) => {
        expect(tweetObjects).to.be.ok;
        newTweetsFired += 1;
        if (newTweetsFired === 2) {
          clearInterval(tws.pollingInterval);
          done();
        }
      });

      tws.start();
      expect(tws.pollingInterval).to.have.property('_destroyed', false);
    });
  });

  describe('#stop', () => {
    it('stops a running pollingInterval', () => {
      const { userId } = testUser;
      const tws = new TimelineWatchService(userId);
      tws.start();
      expect(tws.pollingInterval).to.have.property('_destroyed', false);
      tws.stop();
      expect(tws.pollingInterval).to.be.null;
    });
  });
});
