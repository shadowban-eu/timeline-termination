/* eslint-disable no-unused-expressions */
const request = require('supertest');
const httpStatus = require('http-status');
const { expect } = require('chai');

const app = require('../../../index');
const WatchedUser = require('../../models/WatchedUser.model');
const TimelineWatchService = require('../../services/TimelineWatchService');
const { getRootResponse, postRootResponse } = require('../../validations/watch.validation');

describe('User Watch API', () => {
  let getTestWatchedUser;
  before(async () => {
    await WatchedUser.create({ screenName: 'dupTest', userId: '213' });
    getTestWatchedUser = new WatchedUser({ screenName: 'getTest', userId: '312' });
    await getTestWatchedUser.save();
  });

  after(() => WatchedUser.deleteMany({}));

  describe('GET /v1/watch', () => {
    before(() => TimelineWatchService.add(getTestWatchedUser));
    after(() => TimelineWatchService.watching[getTestWatchedUser.userId].stop());

    it('returns all currently active WatchedUsers', async () => {
      const res = await request(app)
        .get('/v1/watch')
        .expect(httpStatus.OK);

      const { error } = getRootResponse.validate(res.body);
      expect(error).to.be.null;
      expect(res.body.watchedUsers).to.have.length.above(0);

      const testUserInResponse = res.body.watchedUsers.some(
        user => user.screenName === getTestWatchedUser.screenName
      );
      expect(testUserInResponse).to.be.true;
    });
  });

  describe('POST /v1/watch', () => {
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
      const res = await request(app)
        .post('/v1/watch')
        .send({ screenName });

      expect(res.body).to.have.property('watchedUser');
      const { error } = postRootResponse.validate(res.body.watchedUser);
      expect(error).to.be.null;
    });

    it('returns an error when user already exists', async () => {
      const screenName = 'dupTest';

      const res = await request(app)
        .post('/v1/watch')
        .send({ screenName })
        .expect(httpStatus.CONFLICT);

      expect(res.body).to.have.property('message', `${screenName} already exists.`);
    });
  });
});
