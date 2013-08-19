/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');

var MockUserInfoService = {
  withAuthClient: function (client) {
    return {
      execute: function (callback) {
        callback(client);
      }
    };
  }
};

var MockGoogleServices = {
  oauth2: {
    userinfo: {
      get: function () {
        var userInfoService = Object.create(MockUserInfoService);
        return userInfoService;
      }
    }
  }
};

var MockOAuth2Client = {
  generateAuthUrl: function () {
    return this.options.url;
  }
};

module.exports = function mockid(options) {
  return {
    OAuth2Client: function (clientId, clientSecret, redirectUri) {
      assert.ok(clientId);
      assert.ok(clientSecret);
      assert.ok(redirectUri);

      var client = Object.create(MockOAuth2Client);
      client.options = options;
      return client;
    },
    discover: function (/*type, version*/) {
      return {
        execute: function (callback) {
          var googleServices = Object.create(MockGoogleServices);
          callback(null, googleServices);
        }
      };
    }
  };
};

