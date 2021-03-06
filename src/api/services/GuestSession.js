const axios = require('axios');
const { twitterGuestBearer } = require('../../config/vars');

const DataConversion = require('../utils/DataConversion');
const TweetObject = require('../utils/TweetObject');
const UserObject = require('../utils/UserObject');
const { TweetDoesNotExistError } = require('../utils/Errors');
const {
  isSuspendedError,
  isDeletedTweetError,
  isDeletedAccountError
} = require('../utils/twitterErrors');

const { error, info } = require('../../config/logger');

const timelineParams = {
  include_entities: true,
  include_user_entities: true,
  include_ext_media_color: true,
  include_ext_media_availability: true,
  send_error_codes: true,
  include_profile_interstitial_type: 1,
  include_blocking: 1,
  include_blocked_by: 1,
  include_followed_by: 1,
  include_want_retweets: 1,
  include_mute_edge: 1,
  include_can_dm: 1,
  include_can_media_tag: 1,
  skip_status: 1,
  cards_platform: 'Web-12',
  include_cards: 1,
  include_composer_source: true,
  include_ext_alt_text: true,
  include_reply_count: 1,
  tweet_mode: 'extended',
  count: 20,
  ext: 'mediaStats,highlightedLabel,cameraMoment',
  simple_quoted_tweet: true
};

const GuestSession = function GuestSession() {
  this.axiosInstance = axios.create({
    headers: {
      common: {
        Authorization: `Bearer ${GuestSession.guestBearer}`,
        'User-Agent': GuestSession.UA
      }
    },
    withCredentials: true
  });
  this.guestToken = null;
  this.rateLimitRemaining = null;
  this.rateLimitReset = null;
  this.exhausted = false;
  this.resetTimeout = null;
};

GuestSession.UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36';
GuestSession.guestBearer = twitterGuestBearer;
GuestSession.pool = [];

GuestSession.createSession = async () => {
  const session = new GuestSession();
  session.setGuestToken(await session.getGuestToken());
  GuestSession.pool.push(session);
  return session;
};

GuestSession.pickSession = async () => {
  const availableSession = GuestSession.pool.length && GuestSession.pool.find(
    session => !session.exhausted
  );
  return availableSession || GuestSession.createSession();
};

GuestSession.getUser = async screenName =>
  (await GuestSession.pickSession()).getUser(screenName);

GuestSession.getUserId = async screenName =>
  (await GuestSession.pickSession()).getUserId(screenName);

GuestSession.getUserTimeline = async userId =>
  (await GuestSession.pickSession()).getUserTimeline(userId);

GuestSession.getTweet = async tweetId =>
  (await GuestSession.pickSession()).getTweet(tweetId);

GuestSession.getTimeline = async (tweetId, noReplyCheck = false) =>
  (await GuestSession.pickSession()).getTimeline(tweetId, noReplyCheck);

GuestSession.prototype.get = async function get(url, options) {
  try {
    const res = await this.axiosInstance.get(url, options);
    this.rateLimitRemaining = parseInt(res.headers['x-rate-limit-remaining'], 10);
    this.rateLimitReset = parseInt(res.headers['x-rate-limit-reset'], 10) * 1000;

    if (this.rateLimitRemaining === 0) {
      this.exhausted = true;
      this.scheduleReset();
    }
    return res;
  } catch (err) {
    if (options && options.passError) {
      throw err;
    }
    switch (err.response.status) {
      case 403:
        error('Recreating session due to 403 error', {
          err,
          response: err.response,
          session: this
        });
        this.destroy();
        return (await GuestSession.createSession()).get(url, options);
      case 429:
        error('Adding session due to 429 error', {
          err,
          response: err.response,
          session: this
        });
        return (await GuestSession.pickSession()).get(url, options);
      default:
        throw err;
    }
  }
};

GuestSession.prototype.getGuestToken = async function getGuestToken() {
  const res = await this.axiosInstance.post('https://api.twitter.com/1.1/guest/activate.json');
  const guestToken = res.data.guest_token;
  if (!guestToken) {
    throw new Error('Failed to get guestToken');
  }
  return guestToken;
};

GuestSession.prototype.setGuestToken = function setGuestToken(guestToken) {
  this.guestToken = guestToken;
  this.axiosInstance.defaults.headers.common['X-Guest-Token'] = this.guestToken;
};

GuestSession.prototype.getUser = async function getUser(screenName) {
  try {
    const res = await this.get(
      'https://api.twitter.com/1.1/users/show.json',
      {
        params: { screen_name: screenName },
        passError: true
      }
    );
    return new UserObject(res.data);
  } catch (err) {
    if (isSuspendedError(err)) {
      return new UserObject({ screen_name: screenName, suspended: true });
    }
    if (isDeletedAccountError(err)) {
      return new UserObject({ screen_name: screenName, deleted: true });
    }
    throw err;
  }
};

GuestSession.prototype.getUserId = async function getUserId(screenName) {
  const res = await this.get(
    'https://api.twitter.com/graphql/G6Lk7nZ6eEKd7LBBZw9MYw/UserByScreenName',
    {
      params: {
        variables: {
          screen_name: screenName,
          withHighlightedLabel: true
        }
      }
    }
  );
  return res.data.data.user.rest_id;
};

GuestSession.prototype.getUserTimeline = async function getUserTimeline({
  userId,
  cursor
}) {
  const res = await this.get(
    `https://api.twitter.com/2/timeline/profile/${userId}.json`,
    {
      params: Object.assign({}, timelineParams, {
        include_tweet_replies: false,
        userId,
        cursor,
      })
    }
  );
  const { tweets } = res.data.globalObjects;
  const tweetObjects = Object.keys(tweets).map(tweetId => new TweetObject(tweets[tweetId]));

  return {
    tweets: tweetObjects,
    cursor: DataConversion.getCursorFromTimeline(res.data.timeline)
  };
};

GuestSession.prototype.getTweet = async function getTweet(tweetId) {
  try {
    const url = `https://api.twitter.com/2/timeline/conversation/${tweetId}.json`;
    const res = await this.get(url, {
      params: {
        ...timelineParams,
        count: 1
      }
    });
    const { tweets } = res.data.globalObjects;
    return new TweetObject(tweets[tweetId]);
  } catch (err) {
    throw isDeletedTweetError(err)
      ? new TweetDoesNotExistError(tweetId)
      : err;
  }
};

// eslint-disable-next-line
GuestSession.prototype.getTimeline = async function getTimeline(tweetId) {
  const url = `https://api.twitter.com/2/timeline/conversation/${tweetId}.json`;

  try {
    let res = await this.get(url, { params: timelineParams });
    let { instructions } = res.data.timeline;
    let { tweets } = res.data.globalObjects;
    const tweetCount = Object.keys(tweets).length;

    if (tweetCount <= 1) {
      const showMore = DataConversion.getShowMoreCursor(instructions);
      if (showMore) {
        res = await this.axiosInstance.get(url, {
          params: {
            ...timelineParams,
            cursor: showMore.cursor
          }
        });
        instructions = res.data.timeline.instructions; // eslint-disable-line
        tweets = res.data.globalObjects.tweets; // eslint-disable-line
      }
    }
    return {
      id: tweetId,
      owner: tweets[tweetId],
      instructions,
      tweets
    };
  } catch (err) {
    throw isDeletedTweetError(err)
      ? new TweetDoesNotExistError(tweetId)
      : err;
  }
};

GuestSession.prototype.destroy = function destroy() {
  GuestSession.pool.splice(GuestSession.pool.findIndex(session => session === this), 1);
};

GuestSession.prototype.scheduleReset = function scheduleReset() {
  const timeoutDelta = (this.rateLimitReset - Date.now()) + 1000;
  info('Scheduling rate-limit reset', { session: this });
  this.resetTimeout = setTimeout(() => {
    this.rateLimitReset = null;
    this.rateLimitRemaing = null;
    this.exhausted = false;
    this.resetTimeout = null;
  }, timeoutDelta);
};

module.exports = GuestSession;
