const filter = require('lodash.filter');

const GuestSession = require('./GuestSession');
const TweetObject = require('../utils/TweetObject');
const WatchedUser = require('../models/WatchedUser.model');

const { debug } = require('../../config/logger');

const userTag = user => `${user.screenName} (${user.userId})`;

class TimelineWatchService {
  constructor(userId) {
    this.userId = userId;
    this.user = null;
    this.seenIds = [];
    this.pollingInterval = null;
  }

  async loadUser() {
    debug(`Loading ${userTag(this.user)}`);
    this.user = await WatchedUser.findOne({ userId: this.userId });
  }

  setSeenIds(tweetIds) {
    debug(`Updating seenIds for ${userTag(this.user)} with ${tweetIds}`);
    this.user.seenIds = this.user.seenIds.concat(tweetIds);
    return this.user.save();
  }

  start() {
    debug(`Starting to watch ${userTag(this.user.screenName)}`);
    if (this.pollingInterval) {
      this.stop();
    }
    this.pollingInterval = setInterval(
      this.pollTimeline.bind(this),
      this.user.pollingTimeout
    );
  }

  stop() {
    debug(`Stopping to watch ${userTag(this.user.screenName)}`);
    clearInterval(this.pollingInterval);
    this.pollingInterval = null;
  }

  async pollTimeline() {
    debug(`Polling timeline of ${userTag(this.user.screenName)}`);
    const { tweets } = await GuestSession.getUserTimeline(this.userId);
    const withoutRetweets = filter(tweets, { user_id_str: this.userId });
    const tweetIds = filter(withoutRetweets, tweet => !this.user.seenIds.includes(tweet.id_str))
      .map(tweet => tweet.id_str)
      .sort();
    const newTweets = filter(withoutRetweets, tweet => tweetIds.includes(tweet.id_str));

    this.setSeenIds(tweetIds);
    return newTweets.map(tweet => new TweetObject(tweet));
  }
}

module.exports = TimelineWatchService;
