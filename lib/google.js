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

function GoogleUserInfoService() {
  // userInfoService is cached. discover forces an update.
  this.userInfoService = null;
}
GoogleUserInfoService.prototype = {
  discover: function (callback) {
    var self = this;
    googleapis
      .discover('oauth2', 'v2')
      .execute(function (error, clients) {
        if (error) {
          return callback(error);
        }

        self.userInfoService = clients.oauth2.userinfo.get();
        return callback(null, self.userInfoService);
      });
  },

  getUserInfo: function (authClient, callback) {
    this.getUserInfoService(function (error, service) {
      if (error) {
        return callback(error);
      }

      service
        .withAuthClient(authClient)
        .execute(callback);
    });
  },

  getUserInfoService: function (callback) {
    if (this.userInfoService) {
      return callback(null, this.userInfoService);
    }

    this.discover(callback);
  }
};

var userInfoService;
function getUserInfoService(callback) {
  if (!userInfoService) {
    userInfoService = new GoogleUserInfoService();
  }
  callback(null, userInfoService);
}


function GoogleOAuthProvider() {
  this.googleClient =
      new googleapis.OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}
GoogleOAuthProvider.prototype = {
  discover: function (callback) {
    getUserInfoService(function (error, service) {
      if (error) {
        return callback(error);
      }
      service.discover(callback);
    });
  },

  verifyAssertion: function (req, callback) {
    var self = this;
    self.setCredentialsFromRequest(req, function (error) {
      if (error) {
        return callback(error);
      }

      self.getEmail(function (error, email) {
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
    var googleClient = this.googleClient;
    this.getCredentialsFromRequest(req, function (error, credentials) {
      if (error) {
        return callback(error);
      }

      googleClient.credentials = credentials;
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
    var googleClient = this.googleClient;
    if (! googleClient.credentials) {
      return callback(new Error("missing Google OAuth client credentials"));
    }

    getUserInfoService(function (error, service) {
      if (error) {
        return callback(error);
      }

      service.getUserInfo(googleClient, callback);
    });
  }
};

// The main OAuthProvider interface.
exports.OAuthProvider = GoogleOAuthProvider;

// used for testing
exports.setGoogleApis = function (_googleapis) {
  googleapis = _googleapis;
};

