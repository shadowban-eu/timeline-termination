const mongoose = require('mongoose');
const { userWatch } = require('../../config/vars');

/**
 * Watched User Schema
 * @private
 */
const watchedUserSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true
  },
  screenName: {
    type: String,
    unique: true,
    required: true
  },
  seenIds: {
    type: [String],
    default: []
  },
  pollingTimeout: {
    type: Number,
    default: userWatch.pollingTimeout * 1000
  },
  active: Boolean
});

watchedUserSchema.method({
  transform() {
    const transformed = {};
    const userFields = ['userId', 'screenName', 'active', 'pollingTimeout'];

    userFields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  }
});

module.exports = mongoose.model('WatchedUser', watchedUserSchema);
