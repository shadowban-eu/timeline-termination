const axios = require('axios');
const { twitterGuestBearer } = require('../../config/vars');

const DataConversion = require('../utils/DataConversion');

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
        Authorization: `Bearer ${GuestSession.guestBearer}`
      }
    },
    withCredentials: true
  });
  this.guestToken = null;
};

GuestSession.UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36';
GuestSession.guestBearer = twitterGuestBearer;
GuestSession.pool = [];

GuestSession.createSession = async () => {
  const session = new GuestSession();
  session.setGuestToken(await session.getGuestToken());
  GuestSession.pool.push(session);
};

GuestSession.pickSession = () => {
  if (GuestSession.pool.length === 0) {
    throw new RangeError('GuestSession pool is empty. Create one with GuestSession.createSession!');
  }
  return Math.floor(Math.random() * GuestSession.pool.length);
};

GuestSession.getUserTimeline = userId =>
  GuestSession.pool[GuestSession.pickSession()].getUserTimeline(userId);

GuestSession.getTimeline = tweetId =>
  GuestSession.pool[GuestSession.pickSession()].getTimeline(tweetId);

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

GuestSession.prototype.getUserId = async function getUserId(screenName) {
  const res = await this.axiosInstance.get(
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


GuestSession.prototype.getUserTimeline = async function getUserTimeline(userId, cursor) {
  const res = await this.axiosInstance.get(
    `https://api.twitter.com/2/timeline/profile/${userId}.json`,
    {
      params: Object.assign({}, timelineParams, {
        include_tweet_replies: false,
        userId,
        cursor,
      })
    }
  );
  return {
    tweets: res.data.globalObjects.tweets,
    cursor: DataConversion.getCursorFromTimeline(res.data.timeline)
  };
};

GuestSession.prototype.getTimeline = async function getTimeline(tweetId) {
  const res = await this.axiosInstance.get(
    `https://api.twitter.com/2/timeline/conversation/${tweetId}.json`,
    {
      params: timelineParams
    }
  );
  return {
    id: tweetId,
    instructions: res.data.timeline.instructions,
    tweets: res.data.globalObjects.tweets
  };
};

module.exports = GuestSession;
