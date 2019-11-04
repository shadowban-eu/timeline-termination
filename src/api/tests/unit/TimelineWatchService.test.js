/* eslint-disable no-unused-expressions */
const EventEmitter = require('events');
const { expect } = require('chai');
const forEach = require('lodash.foreach');

const TimelineWatchService = require('../../services/TimelineWatchService');
const GuestSession = require('../../services/GuestSession');
const TweetObject = require('../../utils/TweetObject');

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
  });

  it('extends EventEmitter', () => {
    const tws = new TimelineWatchService();
    expect(tws).to.be.instanceof(EventEmitter);
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

  describe('#pollTimeline', function testPollTimeline() {
    this.timeout(5000);
    it('queries user\'s profile and emits tweetObjects', (done) => {
      const userId = '25073877';
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
      const userId = '25073877';
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
      const userId = '25073877';
      const tws = new TimelineWatchService(userId);
      tws.start();
      expect(tws.pollingInterval).to.have.property('_destroyed', false);
      tws.stop();
      expect(tws.pollingInterval).to.be.null;
    });
  });
});
