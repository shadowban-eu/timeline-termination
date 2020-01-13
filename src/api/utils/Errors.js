const httpStatus = require('http-status');

/**
 * @extends Error
 */
class ExtendableError extends Error {
  constructor({
    message, errors, status, isPublic, stack, code
  }) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.errors = errors;
    this.status = status;
    this.isPublic = isPublic;
    this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.
    this.stack = stack;
    this.code = code;
    // Error.captureStackTrace(this, this.constructor.name);
  }
}

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class APIError extends ExtendableError {
  /**
   * Creates an API error.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code of error.
   * @param {boolean} isPublic - Whether the message should be visible to user or not.
   */
  constructor({
    message,
    errors,
    stack,
    status = httpStatus.INTERNAL_SERVER_ERROR,
    isPublic = false,
  }) {
    super({
      message, errors, status, isPublic, stack,
    });
  }
}

class NoRepliesError extends ExtendableError {
  constructor(tweetId) {
    const message = `Tweet ${tweetId || '[unknown]'} has no replies.`;
    super({ message, code: 'ENOREPLIES', isPublic: false });
    this.tweetId = tweetId;
  }
}

class NotAReplyError extends ExtendableError {
  constructor(tweetId) {
    const message = `Tweet ${tweetId || '[unknown]'} is not a reply.`;
    super({ message, code: 'ENOTAREPLY', isPublic: true });
    this.tweetId = tweetId;
  }
}

const twitterErrors = {
  suspendedAccount: {
    status: 403,
    code: 63
  }
};

const isSuspendedError = (err) => {
  const { status, data } = err.response;
  const { code } = data.errors[0];
  const {
    status: suspendedStatus,
    code: suspendedCode
  } = twitterErrors.suspendedAccount;

  return status === suspendedStatus && code === suspendedCode;
};

module.exports.APIError = APIError;
module.exports.NoRepliesError = NoRepliesError;
module.exports.NotAReplyError = NotAReplyError;
module.exports.isSuspendedError = isSuspendedError;
