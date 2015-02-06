/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
const querystring = require('querystring');

var MockOAuth2Client = {
  generateAuthUrl: function (options) {
    return this.options.url + '?' + querystring.stringify(options);
  },

  getToken: function (code, callback) {
    callback(null, 'token');
  }
};

var MockUserInfo = {
  get: function (params, callback) {
    // make sure the credentials get set to the expected token
    if (params.auth.credentials === 'token') {
      callback(null, {
        /*jshint camelcase: false*/
        verified_email: this.options.result.authenticated,
        email: this.options.result.email
      });
    }
  }
};

module.exports = function mockid(options) {
  return {
    auth: {
      OAuth2: function (clientId, clientSecret, redirectUri) {
        assert.ok(clientId);
        assert.ok(clientSecret);
        assert.ok(redirectUri);

        var client = Object.create(MockOAuth2Client);
        client.options = options;

        return client;
      }
    },

    oauth2: function (version) {
      assert.ok(version);

      var userInfo = Object.create(MockUserInfo);
      userInfo.options = options;

      return {
        userinfo: userInfo
      };
    }
  };
};

