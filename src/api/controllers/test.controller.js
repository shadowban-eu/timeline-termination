const httpStatus = require('http-status');

const TestService = require('../services/TestService');
const { APIError, NoRepliesError } = require('../utils/Errors');

module.exports.single = async (req, res) => {
  const subjectId = req.params.tweetId;
  const testCase = await TestService.test(subjectId);
  if (testCase instanceof NoRepliesError) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIError({
      message: `${subjectId} can't be tested, because it has no replies.`,
      errors: [testCase],
      stack: testCase.stack
    }));
  }

  return res.json(testCase.transform());
};
