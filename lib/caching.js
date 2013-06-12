/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.prevent = function (paths) {
  return function (req, res, next) {
    if (paths.indexOf(req.path) > -1) {
      res.setHeader('Cache-Control', 'private, max-age=0, no-cache, no-store');
    }
    next();
  };
};

exports.revalidate = function (paths) {
  return function (req, res, next) {
    if (paths.indexOf(req.path) > -1) {
      res.setHeader('Vary', 'Accept-Encoding, Accept-Language');
      res.setHeader('Cache-Control', 'public, max-age=0');
    }
    next();
  };
};
