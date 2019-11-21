const TestService = require('../services/TestService');

module.exports.single = async (req, res) => {
  try {
    const testCase = await TestService.test(req.params.tweetId);
    res.json(testCase.transform());
  } catch (err) {
    if (err instanceof RangeError) {
      res.json(null);
    }
  }
};
