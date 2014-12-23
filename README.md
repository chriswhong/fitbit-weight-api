fitbit-weight-api
=================

This node server surfaces fitbit's API for bodyweight.  This is not a multi-user app, it is meant to surface a single user's fitbit bodyweight data.

It uses OAUTH to authenticate with the fitbit API, then stores the authentication tokens in a mongoDB collection for later use.  You will need to create an app at dev.fitbit.com

###Endpoints:

`/authorize` - starts the OAUTH process.  You will need to authorize the app.
`/weight` - responds with the fitbit weight data in JSON format

###Environment Variables:

`CONSUMER_KEY` Your app's consumer key from dev.fitbit.com
`CONSUMER_SECRET` Your app's consumer secret from dev.fitbit.com
`MONGOURL` URL for your mongodb instance

