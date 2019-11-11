const TestService = require('../services/TestService');

module.exports.single = async (req, res) => {
  const testCase = await TestService.test(req.params.tweetId);
  res.json(testCase.transform());
};
