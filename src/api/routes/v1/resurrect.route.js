const express = require('express');
const validate = require('express-validation');
const { resurrect } = require('../../controllers/resurrect.controller');
const { root } = require('../../validations/resurrect.validation');

const router = express.Router();

router
  .route('/:probeId')
  /**
   * @api {get} v1/resurrect/:id Get a resurrect test result with :id being the probe tweet
   * @apiDescription Test the parent of tweet ID whether it's deleted or timeline terminated
   * @apiVersion 0.1.0
   * @apiName ResurrectTweet
   * @apiGroup Test
   *
   * @apiSuccess {Object}  tweets                      Tweets involved in test
   * @apiSuccess {Object}  tweets.subject              TweetObject for tested tweet
   * @apiSuccess {Object}  tweets.testedWith           TweetObject for tweet/comment used to test
   * @apiSuccess {Boolean} terminated                  `true` when parent of probe tweet is
   *                                                   hidden from probe's timeline, yet can be
   *                                                   found via its own
   * @apiSuccess {Boolean} deleted                     `true` when parent of probe tweet is deleted
   * @apiSuccess {Boolean} resurrected                 This is always `true` for resurrect results
   */
  .get(validate(root), resurrect);

module.exports = router;
