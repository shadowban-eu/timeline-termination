const twitterErrors = {
  suspendedAccount: {
    status: 403,
    code: 63
  },
  deletedTweet: {
    status: 404,
    code: 34
  },
  deletedAccount: {
    status: 404,
    code: 50
  }
};

const isTwitterError = (err, twitterError) => {
  try {
    const { status, data } = err.response;
    const { code } = data.errors[0];
    const {
      status: twitterErrorStatus,
      code: twitterErrorCode
    } = twitterError;

    return status === twitterErrorStatus && code === twitterErrorCode;
  } catch (_) {
    return false;
  }
};

module.exports.twitterErrors = twitterErrors;
module.exports.isTwitterError = isTwitterError;

module.exports.isSuspendedError = err => isTwitterError(err, twitterErrors.suspendedAccount);
// poor name; indicates 404 request errors for conversation-timelines, without
// determining whether tweet ever existed
module.exports.isDeletedTweetError = err => isTwitterError(err, twitterErrors.deletedTweet);
module.exports.isDeletedAccountError = err => isTwitterError(err, twitterErrors.deletedAccount);
