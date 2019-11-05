const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/watch.controller');
const { postRoot } = require('../../validations/watch.validation');

const router = express.Router();

router
  .route('/')
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
