/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('../lib/config');

const CLIENT_ID = config.get('google.clientId');
const CLIENT_SECRET = config.get('google.clientSecret');
const REDIRECT_URI = config.get('server.publicUrl') + '/authenticate/verify';
const OPENID_REALM = config.get('server.openidRealm');
const SCOPE = 'openid email';

// declared a var so that it can be overridden for testing.
var googleapis = require('googleapis');

function setClientCredentialsFromCode (oauthClient, code, callback) {
  oauthClient.getToken(code, function (error, credentials) {
    if (error) {
      return callback(error);
    }

    oauthClient.credentials = credentials;
    callback(null);
  });
}

function getUserInfo (oauthClient, callback) {
  if (! oauthClient.credentials) {
    return callback(new Error('missing Google OAuth client credentials'));
  }

  var userInfo = googleapis.oauth2('v2').userinfo;

  userInfo.get({ auth: oauthClient }, callback);
}

function getVerifiedEmail (oauthClient, callback) {
  getUserInfo(oauthClient, function (error, userInfo) {
    if (error) {
      return callback(error);
    }

    /*jshint camelcase: false*/
    callback(null, userInfo.verified_email && userInfo.email);
  });
}

function createClient() {
  return new googleapis.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

module.exports = {
  getAuthUrl: function (email, state, callback) {
    /*jshint camelcase: false*/
    var options = {
      login_hint: email,
      access_type: 'online',
      scope: SCOPE,
      state: state,
      'openid.realm': OPENID_REALM
    };
    var authUrl = createClient().generateAuthUrl(options);
    callback(null, authUrl);
  },

  tradeCodeForEmail: function (code, callback) {
    // `credentials` is modified for each transaction, meaning
    // every verification needs its own client.
    var oauthClient = createClient();
    setClientCredentialsFromCode(oauthClient, code, function (error) {
      if (error) {
        return callback(error);
      }

      getVerifiedEmail(oauthClient, function (error, verifiedEmail) {
        if (error) {
          return callback(error);
        }

        if (! verifiedEmail) {
          return callback(new Error('Could not get email'));
        }

        callback(null, {
          email: verifiedEmail,
          authenticated: true
        });
      });
    });
  }
};

// used for testing
exports.setGoogleApis = function (_googleapis) {
  googleapis = _googleapis;
};

