const httpStatus = require('http-status');

const WatchedUser = require('../models/WatchedUser.model');
const GuestSession = require('../services/GuestSession');
const APIError = require('../utils/APIError');

module.exports.add = async (req, res, next) => {
  const { screenName } = req.body;
  try {
    const userId = await GuestSession.getUserId(req.body.screenName);
    const watchedUser = new WatchedUser({
      userId,
      screenName,
      active: true
    });
    await watchedUser.save();
    return res.json({
      watchedUser: watchedUser.transform()
    });
  } catch (err) {
    if (err.code === 11000) {
      const apiErr = new APIError(err);
      apiErr.status = httpStatus.CONFLICT;
      apiErr.message = `${screenName} already exists.`;
      return next(apiErr);
    }
    return next(err);
  }
};
