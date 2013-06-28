/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('./config');

const HEADERS = ['X-Content-Security-Policy', 'Content-Security-Policy'];
const VALUE = [
  "default-src 'self' " + config.get('server.personaUrl'),
  "img-src 'self' data:",
  "frame-src https://accounts.google.com"
].join(';');

module.exports = function cspFactory(routes) {
  return function csp(req, res, next) {
    if (routes.indexOf(req.path) > -1) {
      HEADERS.forEach(function(header) {
        res.setHeader(header, VALUE);
      });
    }
    next();
  };
};
