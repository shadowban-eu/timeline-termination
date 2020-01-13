const TestService = require('../services/TestService');
const { APIError, NotAReplyError } = require('../utils/Errors');

module.exports.resurrect = async (req, res, next) => {
  const { probeId } = req.params;

  try {
    const testCase = await TestService.resurrect(probeId);
    return res.json(testCase.transform());
  } catch (err) {
    if (err instanceof NotAReplyError) {
      return next(new APIError({
        message: `${probeId} can't be used as a probe, because it is not a reply.`,
        errors: [err],
        stack: err.stack
      }));
    }
    throw err;
  }
};
