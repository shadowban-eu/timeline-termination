/* eslint-disable no-unused-expressions */
const request = require('supertest');
const httpStatus = require('http-status');
const { expect } = require('chai');

const app = require('../../../index');
const { rootResponse } = require('../../validations/resurrect.validation');

const resurrectTerminatedProbeId = '1183909147072520193';

describe('Resurrect API', () => {
  describe('GET /v1/resurrect/:tweetId', () => {
    it('returns resurrect test results', () =>
      request(app)
        .get(`/v1/resurrect/${resurrectTerminatedProbeId}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const testCase = res.body;
          const { error } = rootResponse.validate(testCase);
          expect(error).to.be.null;
          expect(testCase).to.have.property('resurrected', true);
          expect(testCase).to.have.property('terminated', true);
          expect(testCase).to.have.property('deleted', false);
          expect(testCase.tweets.subject).to.not.be.null;
        }));
  });
});
