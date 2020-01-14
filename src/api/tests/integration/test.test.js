/* eslint-disable no-unused-expressions */
const request = require('supertest');
const httpStatus = require('http-status');
const { expect } = require('chai');

const app = require('../../../index');
const { rootResponse } = require('../../validations/test.validation');
const { testProps } = require('../utils');

const testId = '1183908355372273665';
const noRepliesId = '1200410351008976898';

describe('Test API', () => {
  describe('GET /v1/test/:tweetId', () => {
    it('returns test results', () =>
      request(app)
        .get(`/v1/test/${testId}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const { error } = rootResponse.validate(res.body);
          expect(error).to.be.null;
        }));

    it('returns an APIError when subject has no replies', () =>
      request(app)
        .get(`/v1/test/${noRepliesId}`)
        .expect(httpStatus.INTERNAL_SERVER_ERROR)
        .then((res) => {
          const actualError = res.body.errors[0];
          testProps(actualError, {
            name: 'NoRepliesError',
            tweetId: noRepliesId
          });
        })
    );
  });
});
