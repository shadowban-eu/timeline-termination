const TestService = require('../services/TestService');

module.exports.resurrect = async (req, res) => {
  const { probeId } = req.params;
  const testCase = await TestService.resurrect(probeId);
  return res.json(testCase.transform());
};
