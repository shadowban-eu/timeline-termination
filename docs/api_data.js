define({ "api": [
  {
    "type": "get",
    "url": "v1/test/:id",
    "title": "Test a tweet for TimelineTermination",
    "description": "<p>Test a tweet ID whether it's subject to timeline termination</p>",
    "version": "0.1.0",
    "name": "TestTweet",
    "group": "Test",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "tweets",
            "description": "<p>Tweets involved in test</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "tweets.subject",
            "description": "<p>TweetObject for tested tweet</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.subject.id_str",
            "description": "<p>ID of tweet that was tested</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.subject.user_id_str",
            "description": "<p>Tweet Author's id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.subject.created_at",
            "description": "<p>When the tweet was created</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.subject.lang",
            "description": "<p>Tweet's language</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.subject.full_text",
            "description": "<p>Full text of the tweet</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.subject.possibly_sensitive_editable",
            "description": "<p>Sounds important?</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.subject.favorite_count",
            "description": "<p># of favorites at time of testing</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.subject.reply_count",
            "description": "<p># of replies at time of testing</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.subject.retweet_count",
            "description": "<p># of retweets at time of testing</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "tweets.testedWith",
            "description": "<p>TweetObject for tweet/comment used to test</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.testedWith.id_str",
            "description": "<p>ID of tweet that was tested</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.testedWith.user_id_str",
            "description": "<p>Tweet Author's id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.testedWith.created_at",
            "description": "<p>When the tweet was created</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.testedWith.lang",
            "description": "<p>Tweet's language</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.testedWith.full_text",
            "description": "<p>Full text of the tweet</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.testedWith.possibly_sensitive_editable",
            "description": "<p>Sounds important?</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.testedWith.favorite_count",
            "description": "<p># of favorites at time of testing</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.testedWith.reply_count",
            "description": "<p># of replies at time of testing</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "tweets.testedWith.retweet_count",
            "description": "<p># of retweets at time of testing</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "terminated",
            "description": "<p>Whether tweets.subject is timeline terminated</p>"
          }
        ]
      }
    },
    "filename": "src/api/routes/v1/test.route.js",
    "groupTitle": "Test"
  },
  {
    "type": "post",
    "url": "v1/watch",
    "title": "Add a Twitter user to watch",
    "description": "<p>Add a Twitter user for timeline-termination profile watching</p>",
    "version": "0.1.0",
    "name": "AddWatchedUser",
    "group": "Watch",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "screenName",
            "description": "<p>Twitter user's @handle</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "watchedUser",
            "description": "<p>User that has been added</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "BAD_REQUEST",
            "description": "<p>When screenName is missing</p>"
          }
        ]
      }
    },
    "filename": "src/api/routes/v1/watch.route.js",
    "groupTitle": "Watch"
  },
  {
    "type": "get",
    "url": "v1/watch",
    "title": "List all currently watched users",
    "description": "<p>Returns WatchedUser objects that are currently being watched, i.e. the ones having their timeline pulled. There might be more, inactive ones in the database.</p>",
    "version": "0.1.0",
    "name": "ListWatchedhUsers",
    "group": "Watch",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "WatchedUser[]",
            "optional": false,
            "field": "watchedUsers",
            "description": "<p>Array of WatchedUser objects</p>"
          }
        ]
      }
    },
    "filename": "src/api/routes/v1/watch.route.js",
    "groupTitle": "Watch"
  }
] });
