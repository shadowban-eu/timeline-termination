/* eslint-disable no-unused-expressions */
const request = require('supertest');
const httpStatus = require('http-status');
const { expect } = require('chai');

const app = require('../../../index');
const { rootResponse } = require('../../validations/resurrect.validation');

const terminatedProbeId = '1183909147072520193';
const noParentProbeId = '1214936748276559873';

const testProps = (expectedProps, testCase) =>
  Object.keys(expectedProps).forEach(propKey =>
    expect(testCase).to.have.property(propKey, expectedProps[propKey])
  );

describe('Resurrect API', () => {
  describe('GET /v1/resurrect/:probeId', () => {
    it('returns resurrect test results', () =>
      request(app)
        .get(`/v1/resurrect/${terminatedProbeId}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const testCase = res.body;
          const { error } = rootResponse.validate(testCase);
          expect(error).to.be.null;
          testProps({
            resurrected: true,
            terminated: true,
            deleted: false,
            resurrectCandidate: true
          }, testCase);
          expect(testCase.tweets.subject).to.not.be.null;
        }));

    it('rejects non-numerical :probeIds', async () => {
      const fooIds = ['foo', '9283', '19387a928d8f1'];
      await Promise.all(fooIds.map(probeId => request(app)
        .get(`/v1/resurrect/${probeId}`)
        .expect(httpStatus.BAD_REQUEST)
      ));
    });

    it('rejects with a NOTAREPLY Error when probe has no parent', async () =>
      request(app)
        .get(`/v1/resurrect/${noParentProbeId}`)
        .expect(httpStatus.INTERNAL_SERVER_ERROR)
        .then((res) => {
          expect(res.body).to.have.property('name', 'APIError');
          const actualError = res.body.errors[0];
          expect(actualError).to.have.property('name', 'NotAReplyError');
          expect(actualError).to.have.property('tweetId', noParentProbeId);
        })
    );
  });
});
