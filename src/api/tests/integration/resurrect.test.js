/* eslint-disable no-unused-expressions */
const request = require('supertest');
const httpStatus = require('http-status');
const { expect } = require('chai');

const app = require('../../../index');
const { rootResponse } = require('../../validations/resurrect.validation');
const { testProps } = require('../utils');

const terminatedProbeId = '1183909147072520193';
const noParentProbeId = '1214936748276559873';
const deletedTweetId = '1214957301133647874';

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
          testProps(testCase, {
            resurrected: true,
            terminated: true,
            deleted: false,
            resurrectCandidate: true
          });
          expect(testCase.tweets.subject).to.not.be.null;
        }));

    it('rejects non-numerical or 10 > length > 20 :probeIds', async () => {
      const fooIds = ['foo', '9283', '19387a928d8f1'];
      await Promise.all(fooIds.map(probeId => request(app)
        .get(`/v1/resurrect/${probeId}`)
        .expect(httpStatus.BAD_REQUEST)
      ));
    });

    it('rejects with a ENOTAREPLY error when probe has no parent', async () =>
      request(app)
        .get(`/v1/resurrect/${noParentProbeId}`)
        .expect(httpStatus.INTERNAL_SERVER_ERROR)
        .then((res) => {
          const actualError = res.body.errors[0];
          testProps(actualError, {
            name: 'NotAReplyError',
            code: 'ENOTAREPLY',
            tweetId: noParentProbeId
          });
        })
    );

    it('rejects with a ENOTEXIST error when probe does not exist', () =>
      request(app)
        .get(`/v1/resurrect/${deletedTweetId}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          const actualError = res.body.errors[0];
          testProps(actualError, {
            name: 'TweetDoesNotExistError',
            code: 'ENOTEXIST',
            tweetId: deletedTweetId
          });
        })
    );
  });
});
