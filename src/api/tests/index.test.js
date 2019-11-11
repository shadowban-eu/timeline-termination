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

describe('TimelineTermination Test', () => {
  before(init);

  ['unit', 'integration'].forEach(type =>
    getTestPaths(type).forEach(path => require(path)) // eslint-disable-line
  );

  after(closeConnections);
});
