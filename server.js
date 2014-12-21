var express = require('express')
  , config = require('./config/app')
  , app = express()
  , Fitbit = require('fitbit')
  , cookieParser = require('cookie-parser')
  , session = require('express-session');

var credentials = {};

app.use(cookieParser());
app.use(session({
  secret: 'hekdhthigib',
  resave: true,
  saveUninitialized: true
}));

var port = process.env.PORT || 3000;
app.listen(port)

// OAuth flow
app.get('/', function (req, res) {
  // Create an API client and start authentication via OAuth
  
  var client = new Fitbit(config.CONSUMER_KEY, config.CONSUMER_SECRET);



  client.getRequestToken(function (err, token, tokenSecret) {

    console.log(err);

    req.session.oauth = {
        requestToken: token
      , requestTokenSecret: tokenSecret
    };

    console.log(token);
    res.redirect(client.authorizeUrl(token));

  });
});

// On return from the authorization
app.get('/oauth_callback', function (req, res) {
  var verifier = req.query.oauth_verifier
    , oauthSettings = req.session.oauth
    , client = new Fitbit(config.CONSUMER_KEY, config.CONSUMER_SECRET);

  // Request an access token
  client.getAccessToken(
      oauthSettings.requestToken
    , oauthSettings.requestTokenSecret
    , verifier
    , function (err, token, secret) {
        if (err) {
          // Take action
          return;
        }

        oauthSettings.accessToken = token;
        oauthSettings.accessTokenSecret = secret;

        credentials.accessToken = token;
        credentials.accessTokenSecret = secret;

        console.log(credentials);

        res.redirect('/stats');
      }
  );
});

// Display some stats
app.get('/stats', function (req, res) {
  console.log(credentials);
  client = new Fitbit(
      config.CONSUMER_KEY
    , config.CONSUMER_SECRET
    , { // Now set with access tokens
          //accessToken: req.session.oauth.accessToken
          accessToken: credentials.accessToken
          , accessTokenSecret: credentials.accessTokenSecret
        //, accessTokenSecret: req.session.oauth.accessTokenSecret
        , unitMeasure: 'en_US'
      }
  );

  // Fetch todays activities
  client.getBodyWeight(function (err, weight) {
    if (err) {
      // Take action
      console.log(err);
      return;
    }

  

    // `activities` is a Resource model
    res.send(weight);
  });
});