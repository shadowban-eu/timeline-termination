/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const forEach = require('lodash.foreach');
const sinon = require('sinon');

const TimelineWatchService = require('../../services/TimelineWatchService');
const GuestSession = require('../../services/GuestSession');
const TweetObject = require('../../utils/TweetObject');
const WatchedUser = require('../../models/WatchedUser.model');

describe('TimelineWatch Service', function TimelineWatchServiceTest() {
  this.timeout(10000);

  let watchedUser;
  const watchedUserData = {
    userId: '25073877',
    screenName: 'realDonaldTrump',
    active: true
  };

  let notActiveWatchedUser;
  const notActiveWatchedUserData = {
    userId: '12301',
    screenName: 'definitelyNotValid',
    active: false
  };


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
    watchedUser = new WatchedUser(watchedUserData);
    notActiveWatchedUser = new WatchedUser(notActiveWatchedUserData);
    await watchedUser.save();
    await notActiveWatchedUser.save();
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
    let stopSpy;

    before(() => {
      tws = new TimelineWatchService(watchedUser);
      stopSpy = sinon.spy(tws, 'stop');
    });
    after(() => {
      sinon.restore();
      tws.stop();
    });

    it('starts polling the user\'s profile timeline', () => {
      tws.start();
      expect(tws.pollingTimeout).to.have.property('_destroyed', false);
    });

    it('uses the user\'s pollingTimeout value', () =>
      expect(tws.pollingTimeout).to.have.property('_idleTimeout', tws.user.pollingTimeout)
    );

    it('stops/replaces a running polling Timer', () => {
      tws.start();
      expect(stopSpy.called).to.be.true;
    });
  });

  describe('#stop', () => {
    it('stops a running pollingTimeout', async () => {
      const tws = new TimelineWatchService(watchedUser);
      tws.start();
      expect(tws.pollingTimeout).to.have.property('_destroyed', false);
      tws.stop();
      expect(tws.pollingTimeout).to.be.null;
    });
  });

  describe('.add', () => {
    let addedService;
    before(() => {
      addedService = TimelineWatchService.add(watchedUser);
    });

    after(() => addedService.stop());

    it('adds a WatchedUser to .watching', () => {
      expect(TimelineWatchService.watching).to.have.property(watchedUser.userId);
    });

    it('returns created/added TimelineWatchService instance', () => {
      expect(addedService).to.be.instanceof(TimelineWatchService);
      expect(addedService.user).to.eql(watchedUser);
    });

    it('starts watching, if watchedUser.active is true', () => {
      expect(addedService.pollingTimeout).to.have.property('_destroyed', false);
    });

    it('does not start watching, if watchedUser.active is false', () => {
      const tws = TimelineWatchService.add(notActiveWatchedUser);
      expect(tws.pollingTimeout).to.be.null;
    });
  });
});
