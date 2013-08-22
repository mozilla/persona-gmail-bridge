/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var OAuthProvider;

/**
 * This is a generic OAuth client interface. An OAuthProvider must
 * be set to make use of the interface.
 */
function getOAuthProvider() {
  if (!OAuthProvider) {
    throw new Error("No OAuth client specified");
  }

  return new OAuthProvider();
}

exports.authenticate = function (email, callback) {
  var client = getOAuthProvider();
  client.getAuthUrl(email, callback);
};

exports.verifyAssertion = function (req, callback) {
  var client = getOAuthProvider();
  client.verifyAssertion(req, callback);
};

exports.discover = function (callback) {
  var client = getOAuthProvider();
  client.discover(callback);
};

exports.setOAuthProvider = function (_OAuthProvider) {
  OAuthProvider = _OAuthProvider;
};


