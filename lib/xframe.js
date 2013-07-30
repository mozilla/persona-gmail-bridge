/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const HEADER = 'X-Frame-Options';
const VALUE = 'DENY';

module.exports = function xFrameFactory(options) {
  var exclude = options.exclude || [];
  return function csp(req, res, next) {
    if (exclude.indexOf(req.path) === -1) {
      res.setHeader(HEADER, VALUE);
    }
    next();
  };
};
