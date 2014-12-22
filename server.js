var express = require('express'),
    app = express(),
    Fitbit = require('fitbit'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    dotenv = require('dotenv'),
    MongoClient = require('mongodb').MongoClient;

dotenv.load();
var credentials = {};

// Connect to the db
MongoClient.connect(process.env.MONGOURL, function(err, db) {
    if (!err) {
        console.log("Connected to MongoDB");
        app.use(cookieParser());
        app.use(session({
            secret: 'hekdhthigib',
            resave: true,
            saveUninitialized: true
        }));

        var config = db.collection('config', function() {});
        
        var credentials;
        config.findOne({
            configId: 0
        }, function(err, item) {
            if(item != null){
              console.log(item);
              credentials = item;
              console.log("Current token: " + credentials.accessToken);
              console.log("Current secret: " + credentials.accessTokenSecret);
            }
        });

        var port = process.env.PORT || 3000;
        
        app.listen(port)
        console.log ("Node app listening on port " + port);

            // OAuth flow
        app.get('/authorize', function(req, res) {
            console.log('Someone is attempting OAuth');
            // Create an API client and start authentication via OAuth
            var client = new Fitbit(process.env.CONSUMER_KEY,
                process.env.CONSUMER_SECRET);

            client.getRequestToken(function(err, token,
                tokenSecret) {
                req.session.oauth = {
                    requestToken: token,
                    requestTokenSecret: tokenSecret
                };

                res.redirect(client.authorizeUrl(token));
            });
        });


        // On return from the authorization
        app.get('/oauth_callback', function(req, res) {
            console.log("Authorization Successful");
            var verifier = req.query.oauth_verifier,
                oauthSettings = req.session.oauth,
                client = new Fitbit(process.env.CONSUMER_KEY,
                    process.env.CONSUMER_SECRET);
            // Request an access token
            client.getAccessToken(oauthSettings.requestToken,
                oauthSettings.requestTokenSecret, verifier,
                function(err, token, secret) {
                    if (err) {
                        // Take action
                        return;
                    }
                    oauthSettings.accessToken = token;
                    oauthSettings.accessTokenSecret =
                        secret;
                    //credentials.accessToken = token;
                    //credentials.accessTokenSecret = secret;
                    config.update({
                        configId: 0
                    }, {
                        configId: 0,
                        accessToken: token,
                        accessTokenSecret: secret
                    }, {
                        upsert: true
                    }, function() {})
                    config.findOne({
                        configId: 0
                    }, function(err, item) {
                        credentials = item;
                    });
                    res.redirect('/weight');
                });
        });
        // Display some stats
        app.get('/weight', function(req, res) {
            console.log('loading /weight JSON endpoint')
            client = new Fitbit(process.env.CONSUMER_KEY,
                process.env.CONSUMER_SECRET, { // Now set with access tokens
                    //accessToken: req.session.oauth.accessToken
                    accessToken: credentials.accessToken,
                    accessTokenSecret: credentials.accessTokenSecret
                        //, accessTokenSecret: req.session.oauth.accessTokenSecret
                        ,
                    unitMeasure: 'en_US'
                });
            // Fetch todays activities
            client.getBodyWeight(function(err, weight) {
                if (err) {
                    // Take action
                    console.log(err);
                    return;
                }
                // `activities` is a Resource model
                res.send(weight);
            });
        });
    }
});