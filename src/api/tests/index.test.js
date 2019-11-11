const { join } = require('path');
const { readdirSync } = require('fs');

const { init, closeConnections } = require('../../index');

const getTestPaths = (dir = './') => {
  const absoluteRoot = join(module.path, dir);
  const filenames = readdirSync(absoluteRoot);
  return filenames
    .filter(filename => filename.endsWith('.test.js'))
    .map(filename => join(absoluteRoot, filename));
};

const suitesToRun = process.env.NODE_TEST_SUITE
  ? [process.env.NODE_TEST_SUITE]
  : ['unit', 'integration'];

describe('TimelineTermination Test', function timelineTerminationTests() {
  this.timeout(20000);

  before(init);

  suitesToRun.forEach(type =>
    getTestPaths(type).forEach(path => require(path)) // eslint-disable-line
  );

  after(closeConnections);
});
