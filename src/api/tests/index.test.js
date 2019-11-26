const { join } = require('path');
const { readdirSync } = require('fs');
const { promisify } = require('util');
const mochaOnlyDetector = require('mocha-only-detector');

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

const checkOnlyWhenValidating = async () => {
  const checkFolder = promisify(mochaOnlyDetector.checkFolder);

  try {
    await checkFolder(join(__dirname, '/**', '*.test.js'));
    return true;
  } catch (errors) {
    /* eslint-disable no-console */
    console.error('/=========================================================\\');
    console.error('| You are not running all tests.                          |');
    console.error('| Please remove all .only calls during commit/validation! |');
    console.error('\\=========================================================/\n');
    console.error(errors.map(err => err.message.replace(__dirname, '.')).join('\n'));
    /* eslint-enable no-console */
    process.exit(1);
  }
  return true;
};

describe('TimelineTermination Test', () => {
  before(function beforeAllDescribes() {
    if (process.env.VALIDATING) {
      checkOnlyWhenValidating(this);
    }
    return init();
  });

  suitesToRun.forEach(type =>
    getTestPaths(type).forEach(path => require(path)) // eslint-disable-line
  );

  after(closeConnections);
});
