const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/watch.controller');
const { postRoot } = require('../../validations/watch.validation');

const router = express.Router();

router
  .route('/')
  /**
   * @api {get} v1/watch List all currently watched users
   * @apiDescription Returns WatchedUser objects that are currently being watched,
   *                 i.e. the ones having their timeline pulled. There might be
   *                 more, inactive ones in the database.
   * @apiVersion 0.1.1
   * @apiName WatchUser
   * @apiGroup Watch
   *
   * @apiSuccess {Array<WatchedUser>}  watchedUsers - Array of WatchedUser objects
   */
  .get(controller.listActive)
  /**
   * @api {post} v1/watch Add a Twitter user to watch
   * @apiDescription Add a Twitter user for timeline-termination profile watching
   * @apiVersion 0.1.0
   * @apiName WatchUser
   * @apiGroup Watch
   *
   * @apiParam   {String}  screenName                    - Twitter user's @handle
   *
   * @apiSuccess {Object}  watchedUser                   - User that has been added
   *
   * @apiError   {BAD_REQUEST}                           - When screenName is missing
   */
  .post(validate(postRoot), controller.add);

module.exports = router;
