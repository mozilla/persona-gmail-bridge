/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const googleapis = require("googleapis");
const config = require("../lib/config");

const OAuth2Client = googleapis.OAuth2Client;

const CLIENT_ID = config.get('server.googleClientId');
const CLIENT_SECRET = config.get('server.googleClientSecret');
const REDIRECT_URI = config.get('server.publicUrl') + '/authenticate/verify';
const SCOPE = "https://www.googleapis.com/auth/userinfo.email";


exports.authenticate = function (email, callback) {
  var client = getAuthClient();
  var authUrl = client.generateAuthUrl({
    login_hint: email,
    access_type: "offline",
    scope: SCOPE
  });

  callback(null, authUrl);
};

exports.verifyAssertion = function (req, callback) {
  getEmailForRequestCode(req, function(error, email) {
    if (error) return callback(error);
    if (!email) return callback(new Error("Could not get email"));

    callback(null, {
      email: email,
      authenticated: true
    });
  });
};

exports.discover = function(callback) {
  getUserInfoService({ force: true }, callback);
};


function getAuthClient() {
  return new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

function getTokenFromRequest(req, client, callback) {
  var code = req.query.code;
  if (!code) return callback(new Error("Authentication cancelled"));

  client.getToken(code, callback);
}

function getEmailForRequestCode(req, callback) {
  var client = getAuthClient();
  getTokenFromRequest(req, client, function(error, token) {
    if (error) return callback(error);

    client.credentials = token;
    getEmailForClient(client, callback);
  });
}

function getEmailForClient(client, callback) {
  getUserInfoForClient(client, function(error, results) {
    if (error) return callback(error);

    console.log("results", JSON.stringify(results, null, 2));
    callback(null, results.verified_email && results.email);
  });
}

function getUserInfoForClient(client, callback) {
  getUserInfoService(client, function(error, service) {
    if (error) return callback(error);

    service
      .withAuthClient(client)
      .execute(callback);
  });
}


// only one oauthService is shared among all requests.
var userInfoService;
function getUserInfoService(options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  if (options.force !== true && userInfoService)
    return callback(null, userInfoService);

  discoverUserInfoService(function(error, service) {
    if (error) return callback(error);

    userInfoService = service;
    callback(null, userInfoService);
  });
}

function discoverUserInfoService(callback) {
  googleapis
    .discover('oauth2', 'v2')
    .execute(function(error, clients) {
      if (error) return callback(error);

      return callback(null, clients.oauth2.userinfo.get());
    });
}

