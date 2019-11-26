/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const sinon = require('sinon');

const TimelineWatchService = require('../../services/TimelineWatchService');
const TestService = require('../../services/TestService');
const GuestSession = require('../../services/GuestSession');
const TweetObject = require('../../utils/TweetObject');
const WatchedUser = require('../../models/WatchedUser.model');

const sandbox = sinon.createSandbox();

describe('TimelineWatch Service', () => {
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
    let setSeenSpy;
    let runTestsSpy;
    before(() => {
      runTestsSpy = sandbox.spy(TimelineWatchService, 'runTests');
    });
    after(() => sandbox.restore());

    it('queries user\'s profile and returns TweetObjects', async () => {
      const tws = new TimelineWatchService(watchedUser);
      setSeenSpy = sandbox.spy(tws, 'setSeenIds');

      const tweetObjects = await tws.pollTimeline();
      expect(tweetObjects).to.be.an('array').with.length.above(0);
      tweetObjects.forEach((tweet) => {
        expect(tweet).to.be.instanceof(TweetObject);
        expect(tweet.userId).to.be.eql(watchedUser.userId);
      });
    });

    it('sets the new tweet\'s ids to seen', () => {
      expect(setSeenSpy.called).to.be.true;
    });

    it('runs tests for new found tweets', () => {
      expect(runTestsSpy.called).to.be.true;
    });
  });

  describe('.runTests', () => {
    after(() => sandbox.restore());

    it('runs and returns TestCases for Array of tweet ids', async () => {
      const tweetIds = [
        '1186643044432564224',
        '1192197447948394496',
        '1192208700330655746',
        '1192213962659680257',
        '1192226377325527041'
      ];
      const testSpy = sandbox.stub(TestService, 'test').returnsArg(0);
      const testCases = await TimelineWatchService.runTests(tweetIds);
      expect(testSpy.callCount).to.eql(tweetIds.length);
      expect(testCases).to.eql(tweetIds);
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
