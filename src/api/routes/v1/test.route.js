const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/test.controller');
const { root } = require('../../validations/test.validation');

const router = express.Router();

router
  .route('/:subjectId')
  /**
   * @api {get} v1/test/:id Test a tweet for TimelineTermination
   * @apiDescription Test a tweet ID whether it's subject to timeline termination
   * @apiVersion 0.1.0
   * @apiName TestTweet
   * @apiGroup Test
   *
   * @apiSuccess {Object}  tweets                        - Tweets involved in test
   * @apiSuccess {Object}  tweets.subject                - TweetObject for tested tweet
   * @apiSuccess {String}  tweets.subject.id_str         - ID of tweet that was tested
   * @apiSuccess {String}  tweets.subject.user_id_str    - Tweet Author's id
   * @apiSuccess {String}  tweets.subject.created_at     - When the tweet was created
   * @apiSuccess {String}  tweets.subject.lang           - Tweet's language
   * @apiSuccess {String}  tweets.subject.full_text      - Full text of the tweet
   * @apiSuccess {String}  tweets.subject.possibly_sensitive_editable - Sounds important?
   * @apiSuccess {String}  tweets.subject.favorite_count - # of favorites at time of testing
   * @apiSuccess {String}  tweets.subject.reply_count    - # of replies at time of testing
   * @apiSuccess {String}  tweets.subject.retweet_count  - # of retweets at time of testing
   *
   * @apiSuccess {Object}  tweets.testedWith                - TweetObject for tweet/comment
   *                                                          used to test
   * @apiSuccess {String}  tweets.testedWith.id_str         - ID of tweet that was tested
   * @apiSuccess {String}  tweets.testedWith.user_id_str    - Tweet Author's id
   * @apiSuccess {String}  tweets.testedWith.created_at     - When the tweet was created
   * @apiSuccess {String}  tweets.testedWith.lang           - Tweet's language
   * @apiSuccess {String}  tweets.testedWith.full_text      - Full text of the tweet
   * @apiSuccess {String}  tweets.testedWith.possibly_sensitive_editable - Sounds important?
   * @apiSuccess {String}  tweets.testedWith.favorite_count - # of favorites at time of testing
   * @apiSuccess {String}  tweets.testedWith.reply_count    - # of replies at time of testing
   * @apiSuccess {String}  tweets.testedWith.retweet_count  - # of retweets at time of testing
   * @apiSuccess {Boolean} terminated - Whether tweets.subject is timeline terminated
   */
  .get(validate(root), controller.single);

module.exports = router;
