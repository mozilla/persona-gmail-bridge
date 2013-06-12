/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function mockid(options) {
  return {
    authenticate: function authenticate(endpoint, bool, callback) {
      process.nextTick(function() {
        if (options.error) {
          callback(new Error('Mock Error'));
        } else {
          callback(null, options.url);
        }
      });
    },
    verifyAssertion: function verifyAssertion(req, callback) {
      process.nextTick(function() {
        if (options.error) {
          callback(new Error('Mock Error'));
        } else {
          callback(null, options.result);
        }
      });
    }
  };
};
