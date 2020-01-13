const TestService = require('../services/TestService');
const { APIError, NoRepliesError } = require('../utils/Errors');

module.exports.single = async (req, res, next) => {
  const subjectId = req.params.tweetId;
  const testCase = await TestService.test(subjectId);
  if (testCase instanceof NoRepliesError) {
    return next(new APIError({
      message: `${subjectId} can't be tested, because it has no replies.`,
      errors: [testCase],
      stack: testCase.stack
    }));
  }

  return res.json(testCase.transform());
};
