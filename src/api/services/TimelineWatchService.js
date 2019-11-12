const filter = require('lodash.filter');

const GuestSession = require('./GuestSession');
const TweetObject = require('../utils/TweetObject');
const WatchedUser = require('../models/WatchedUser.model');

const { debug } = require('../../config/logger');

const userTag = user => (user ? `${user.screenName} (${user.userId})` : 'null (null)');

class TimelineWatchService {
  constructor(user) {
    if (!(user instanceof WatchedUser)) {
      throw new ReferenceError('First parameter must be a WatchedUser instance.');
    }
    this.user = user;
    this.pollingInterval = null;
  }

  setSeenIds(tweetIds) {
    debug(`Updating seenIds for ${userTag(this.user)} with ${tweetIds}`);
    this.user.seenIds = this.user.seenIds.concat(tweetIds);
    return this.user.save();
  }

  start() {
    debug(`Starting to watch ${userTag(this.user)}`);
    if (this.pollingInterval) {
      this.stop();
    }
    this.pollingInterval = setInterval(
      this.pollTimeline.bind(this),
      this.user.pollingTimeout
    );
  }

  stop() {
    debug(`Stopping to watch ${userTag(this.user)}`);
    clearInterval(this.pollingInterval);
    this.pollingInterval = null;
  }

  async pollTimeline() {
    debug(`Polling timeline of ${userTag(this.user)}`);
    const { tweets } = await GuestSession.getUserTimeline(this.user.userId);
    const withoutRetweets = filter(tweets, { user_id_str: this.user.userId });
    const tweetIds = filter(withoutRetweets, tweet => !this.user.seenIds.includes(tweet.id_str))
      .map(tweet => tweet.id_str)
      .sort();
    const newTweets = filter(withoutRetweets, tweet => tweetIds.includes(tweet.id_str));

    this.setSeenIds(tweetIds);
    return newTweets.map(tweet => new TweetObject(tweet));
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
