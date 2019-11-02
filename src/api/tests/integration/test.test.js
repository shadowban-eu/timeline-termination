/* eslint-disable no-unused-expressions */
const request = require('supertest');
const httpStatus = require('http-status');
const { expect } = require('chai');

const app = require('../../../index');
const { rootResponse } = require('../../validations/test.validation');

const testId = '1183908355372273665';

describe('Test API', () => {
  before(app.init);

  describe('GET /v1/test/:id', () => {
    it('returns test results', () =>
      request(app)
        .get(`/v1/test/${testId}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const { error } = rootResponse.test.validate(res.body);
          expect(error).to.be.undefined;
        }));
  });
});
