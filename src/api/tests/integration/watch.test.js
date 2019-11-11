/* eslint-disable no-unused-expressions */
const request = require('supertest');
const httpStatus = require('http-status');
const { expect } = require('chai');

const app = require('../../../index');
const WatchedUser = require('../../models/WatchedUser.model');
const { postRootResponse } = require('../../validations/watch.validation');

describe('User Watch API', () => {
  describe('POST /v1/watch', () => {
    before(() => WatchedUser.create({ screenName: 'dupTest', userId: '213' }));
    after(() => WatchedUser.deleteOne({ screenName: 'dupTest' }));

    it('requires a valid screenName', async () => {
      const noValueRes = await request(app)
        .post('/v1/watch')
        .send({})
        .expect(httpStatus.BAD_REQUEST);
      const tooLongValueRes = await request(app)
        .post('/v1/watch')
        .send({ screenName: '@waytoolongforaTwitterHandle' })
        .expect(httpStatus.BAD_REQUEST);
      const invalidCharsRes = await request(app)
        .post('/v1/watch')
        .send({ screenName: '@waytoolongforaTwitterHandle' })
        .expect(httpStatus.BAD_REQUEST);

      expect(noValueRes.body).to.have.property('errors');
      expect(noValueRes.body.errors[0].messages[0]).to.eql('"screenName" is required');

      expect(tooLongValueRes.body).to.have.property('errors');
      expect(tooLongValueRes.body.errors[0].messages[0]).to.include('fails to match');

      expect(invalidCharsRes.body).to.have.property('errors');
      expect(invalidCharsRes.body.errors[0].messages[0]).to.include('fails to match');
    });

    it('adds a new Twitter user to be watched', async () => {
      const screenName = 'foo';
      after(() => WatchedUser.deleteOne({ screenName }));

      const res = await request(app)
        .post('/v1/watch')
        .send({ screenName });

      expect(res.body).to.have.property('watchedUser');
      const { error } = postRootResponse.validate(res.body.watchedUser);
      expect(error).to.be.null;
    });

    it('returns an error when user alreay exists', async () => {
      const screenName = 'dupTest';

      const res = await request(app)
        .post('/v1/watch')
        .send({ screenName })
        .expect(httpStatus.CONFLICT);

      expect(res.body).to.have.property('message', `${screenName} already exists.`);
    });
  });
});
