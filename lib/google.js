/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require("../lib/config");

const CLIENT_ID = config.get('server.googleClientId');
const CLIENT_SECRET = config.get('server.googleClientSecret');
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


// only one userInfoService is shared among all requests.
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


function getCredentialsFromRequest(req, callback) {
  var code = req.query.code;
  if (!code) {
    return callback(new Error("Authentication cancelled"));
  }

  this.getToken(code, callback);
}

function getUserInfo(callback) {
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

function setCredentialsFromRequest(req, callback) {
  var self = this;
  this.getCredentialsFromRequest(req, function (error, credentials) {
    if (error) {
      return callback(error);
    }

    self.credentials = credentials;
    callback(null);
  });
}

function getEmail(callback) {
  this.getUserInfo(function (error, userInfo) {
    if (error) {
      return callback(error);
    }

    /*jshint camelcase: false*/
    callback(null, userInfo.verified_email && userInfo.email);
  });
}

function getOAuthClient() {
  var client =
      new googleapis.OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  // extend the client with some of our own functions.
  client.getCredentialsFromRequest = getCredentialsFromRequest;
  client.setCredentialsFromRequest = setCredentialsFromRequest;
  client.getEmail = getEmail;
  client.getUserInfo = getUserInfo;

  return client;
}

exports.authenticate = function (email, callback) {
  var client = getOAuthClient();
  /*jshint camelcase: false*/
  var authUrl = client.generateAuthUrl({
    login_hint: email,
    access_type: "offline",
    scope: SCOPE
  });

  callback(null, authUrl);
};

exports.verifyAssertion = function (req, callback) {
  var client = getOAuthClient();
  client.setCredentialsFromRequest(req, function (error) {
    if (error) {
      return callback(error);
    }

    client.getEmail(function (error, email) {
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
};

exports.discover = function (callback) {
  getUserInfoService({ force: true }, callback);
};

exports.setGoogleApis = function (_googleapis) {
  googleapis = _googleapis;
};

