const httpStatus = require('http-status');

const TestService = require('../services/TestService');
const { APIError, NotAReplyError } = require('../utils/Errors');

module.exports.resurrect = async (req, res) => {
  const { probeId } = req.params;

  try {
    const testCase = await TestService.resurrect(probeId);
    return res.json(testCase.transform());
  } catch (err) {
    if (err instanceof NotAReplyError) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIError({
        message: `${probeId} can't be used as a probe, because it is not a reply.`,
        errors: [err],
        stack: err.stack
      }));
    }
    throw err;
  }
};
