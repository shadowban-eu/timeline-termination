const filter = require('lodash.filter');

const GuestSession = require('./GuestSession');
const TweetObject = require('../utils/TweetObject');
const WatchedUser = require('../models/WatchedUser.model');

class TimelineWatchService {
  constructor(userId) {
    this.userId = userId;
    this.user = null;
    this.seenIds = [];
    this.pollingInterval = null;
  }

  async loadUser() {
    this.user = await WatchedUser.findOne({ userId: this.userId });
  }

  setSeenIds(tweetIds) {
    this.user.seenIds = this.user.seenIds.concat(tweetIds);
    return this.user.save();
  }

  start() {
    if (this.pollingInterval) {
      this.stop();
    }
    this.pollingInterval = setInterval(
      this.pollTimeline.bind(this),
      this.user.pollingTimeout
    );
  }

  stop() {
    clearInterval(this.pollingInterval);
    this.pollingInterval = null;
  }

  async pollTimeline() {
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
