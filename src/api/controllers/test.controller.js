const TestService = require('../services/TestService');
const TestCase = require('../models/TestCase.model');

module.exports.single = async (req, res) => {
  const { testedWith, subject } = await TestService.getTweetsForSubject(req.params.subjectId);
  const testCase = new TestCase({
    tweets: {
      testedWith,
      subject,
    },
    terminated: false
  });
  testCase.terminated = await TestService.test(subject.tweetId, testedWith.tweetId);
  await testCase.save();
  res.json(testCase.toJSON());
};

