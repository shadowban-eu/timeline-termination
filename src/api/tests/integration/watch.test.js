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
  let dupTestWatchedUser;
  let postTestWatchedUser;
  before(async () => {
    const dbUsers = await WatchedUser.create(
      { screenName: 'dupTest', userId: '213' },
      { screenName: 'getTest', userId: '312' }
    );
    [dupTestWatchedUser, getTestWatchedUser] = dbUsers;
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
      const screenName = 'realdonaldtrump';
      const res = await request(app)
        .post('/v1/watch')
        .send({ screenName });

      expect(res.body).to.have.property('watchedUser');
      const { error } = postRootResponse.validate(res.body.watchedUser);
      expect(error).to.be.null;
      postTestWatchedUser = res.body.watchedUser;
    });

    it('starts a TimelineWatchService for new user', async () => {
      const tws = TimelineWatchService.watching[postTestWatchedUser.userId];
      expect(tws.user.transform()).to.eql(postTestWatchedUser);
      tws.stop();
    });

    it('returns an error when user already exists', async () => {
      const { screenName } = dupTestWatchedUser;
      const res = await request(app)
        .post('/v1/watch')
        .send({ screenName })
        .expect(httpStatus.CONFLICT);

      expect(res.body).to.have.property('message', `${screenName} already exists.`);
    });
  });
});
