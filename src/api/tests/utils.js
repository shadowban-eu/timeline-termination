const { expect } = require('chai');

module.exports.testProps = (testObject, expectedProps) => Object.keys(expectedProps).forEach(
  propKey => (expectedProps[propKey] === undefined
    ? expect(testObject).to.have.property(propKey)
    : expect(testObject).to.have.property(propKey, expectedProps[propKey]))
);
