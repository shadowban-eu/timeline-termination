const TimelineWatchService = require('../services/TimelineWatchService');
const GuestSession = require('../services/GuestSession');

module.exports = (req, res) => {
  const statusReport = JSON.stringify({
    watching: TimelineWatchService.watching,
    sessions: GuestSession.pool
  }, (k, v) => {
    if (k === 'pollingTimeout') {
      return v._destroyed ? 'idle' : 'polling';
    }
    return v;
  });
  res.send(statusReport);
};
