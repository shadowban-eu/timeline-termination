const EventEmitter = require('events');
const filter = require('lodash.filter');

const GuestSession = require('./GuestSession');
const TweetObject = require('../utils/TweetObject');

const { pollingInterval } = require('../../config/vars').userWatch;

class TimelineWatchService extends EventEmitter {
  constructor(userId) {
    super();
    this.userId = userId;
    this.seenIds = [];
    this.pollingInterval = null;
  }

  emitNewTweets(tweetObjects) {
    this.emit('new-tweets', tweetObjects);
  }

  setSeenIds(tweetIds) {
    this.seenIds = this.seenIds.concat(tweetIds);
  }

  start() {
    if (this.pollingInterval) {
      this.stop();
    }
    this.pollingInterval = setInterval(
      this.pollTimeline.bind(this),
      pollingInterval
    );
  }

  stop() {
    clearInterval(this.pollingInterval);
    this.pollingInterval = null;
  }

  async pollTimeline() {
    const { tweets } = await GuestSession.getUserTimeline(this.userId);
    const withoutRetweets = filter(tweets, { user_id_str: this.userId });
    const tweetIds = filter(withoutRetweets, tweet => !this.seenIds.includes(tweet.id_str))
      .map(tweet => tweet.id_str)
      .sort();
    const newTweets = filter(withoutRetweets, tweet => tweetIds.includes(tweet.id_str));

    this.setSeenIds(tweetIds);
    this.emitNewTweets(newTweets.map(tweet => new TweetObject(tweet)));
  }
}

module.exports = TimelineWatchService;
