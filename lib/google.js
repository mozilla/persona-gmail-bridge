/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require("../lib/config");

const CLIENT_ID = config.get('google.clientId');
const CLIENT_SECRET = config.get('google.clientSecret');
const REDIRECT_URI = config.get('server.publicUrl') + '/authenticate/verify';
const SCOPE = "https://www.googleapis.com/auth/userinfo.email";

// declared a var so that it can be overridden for testing.
var googleapis = require("googleapis");

function discoverUserInfoService(callback) {
  googleapis
    .discover('oauth2', 'v2')
    .execute(function (error, clients) {
      if (error) {
        return callback(error);
      }

      return callback(null, clients.oauth2.userinfo.get());
    });
}


// one userInfoService is shared among all clients,
// client discovery forces an update.
var userInfoService;
function getUserInfoService(options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  if (options.force !== true && userInfoService) {
    return callback(null, userInfoService);
  }

  discoverUserInfoService(function (error, service) {
    if (error) {
      return callback(error);
    }

    userInfoService = service;
    callback(null, userInfoService);
  });
}


function GoogleOAuthProvider() {
  this.googleClient =
      new googleapis.OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

}
GoogleOAuthProvider.prototype = {
  discover: function (callback) {
    getUserInfoService({ force: true }, callback);
  },

  verifyAssertion: function (req, callback) {
    this.setCredentialsFromRequest(req, function (error) {
      if (error) {
        return callback(error);
      }

      this.getEmail(function (error, email) {
        if (error) {
          return callback(error);
        }

        if (!email) {
          return callback(new Error("Could not get email"));
        }

        callback(null, {
          email: email,
          authenticated: true
        });
      });
    });
  },

  getAuthUrl: function (email, callback) {
    /*jshint camelcase: false*/
    var options = {
      login_hint: email,
      access_type: "offline",
      scope: SCOPE
    };
    var authUrl = this.googleClient.generateAuthUrl(options);
    callback(null, authUrl);
  },

  getCredentialsFromRequest: function (req, callback) {
    var code = req.query.code;
    if (!code) {
      return callback(new Error("Authentication cancelled"));
    }

    this.googleClient.getToken(code, callback);
  },

  setCredentialsFromRequest: function (req, callback) {
    var self = this;
    this.getCredentialsFromRequest(req, function (error, credentials) {
      if (error) {
        return callback(error);
      }

      self.credentials = credentials;
      callback(null);
    });
  },

  getEmail: function (callback) {
    this.getUserInfo(function (error, userInfo) {
      if (error) {
        return callback(error);
      }

      /*jshint camelcase: false*/
      callback(null, userInfo.verified_email && userInfo.email);
    });
  },

  getUserInfo: function (callback) {
    if (! this.credentials) {
      return callback(new Error("missing OAuth client credentials"));
    }

    var self = this;
    getUserInfoService(function (error, service) {
      if (error) {
        return callback(error);
      }

      service
        .withAuthClient(self)
        .execute(callback);
    });
  }
};

// The main OAuthProvider interface.
exports.OAuthProvider = GoogleOAuthProvider;

// used for testing
exports.setGoogleApis = function (_googleapis) {
  googleapis = _googleapis;
};

