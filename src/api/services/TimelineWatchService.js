const filter = require('lodash.filter');

const GuestSession = require('./GuestSession');
const WatchedUser = require('../models/WatchedUser.model');

const { debug, info } = require('../../config/logger');

const userTag = user => (user ? `${user.screenName} (${user.userId})` : 'null (null)');

class TimelineWatchService {
  constructor(user) {
    if (!(user instanceof WatchedUser)) {
      throw new ReferenceError('First parameter must be a WatchedUser instance.');
    }
    this.user = user;
    this.pollingTimeout = null;
  }

  setSeenIds(tweetIds) {
    debug(`Updating seenIds for ${userTag(this.user)} with ${tweetIds}`);
    this.user.seenIds = this.user.seenIds.concat(tweetIds);
    return this.user.save();
  }

  start() {
    debug(`Starting to watch ${userTag(this.user)}`);
    if (this.pollingTimeout) {
      this.stop();
    }
    this.pollingTimeout = setInterval(
      this.pollTimeline.bind(this),
      this.user.pollingTimeout
    );
  }

  stop() {
    debug(`Stopping to watch ${userTag(this.user)}`);
    clearInterval(this.pollingTimeout);
    this.pollingTimeout = null;
  }

  async pollTimeline() {
    info(`Polling timeline of ${userTag(this.user)}`);
    const { userId, seenIds } = this.user;
    const { tweets } = await GuestSession.getUserTimeline({ userId });
    const withoutRetweets = filter(tweets, { userId });
    const tweetIds = filter(withoutRetweets, tweet => !seenIds.includes(tweet.tweetId))
      .map(tweet => tweet.tweetId)
      .sort();
    const newTweets = filter(withoutRetweets, tweet => tweetIds.includes(tweet.tweetId));

    this.setSeenIds(tweetIds);
    return newTweets;
  }

  static add(watchedUser) {
    const watchService = new TimelineWatchService(watchedUser);
    if (watchedUser.active) {
      watchService.start();
    }
    TimelineWatchService.watching[watchedUser.userId] = watchService;
    return watchService;
  }
}

TimelineWatchService.watching = {};

module.exports = TimelineWatchService;
