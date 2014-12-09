/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const url = require('url');

const StatsD = require('node-statsd').StatsD;

const config = require('./config');

const sanitizeRE = /[^a-zA-Z0-9]/g;
function getRouteName(req) {
  var path  = url.parse(req.url).pathname || '';
  path = path.replace(sanitizeRE, '_');

  return ['routes', path, req.method].join('.').toLowerCase();
}

const statsd = new StatsD({
  host: config.get('statsd.host'),
  port: config.get('statsd.port'),
  prefix: 'persona-gmail-bridge.',
  mock: config.get('statsd.enabled')
});

module.exports = exports = statsd;

exports.middleware = function() {
  return function statsdMiddleware(req, res, next) {
    var start = new Date();

    var end = res.end;
    res.end = function statsdEnd() {
      end.apply(res, arguments);

      // record the response code
      statsd.increment('response_code.' + res.statusCode);

      // record the timing of this request
      statsd.timing(getRouteName(req), new Date() - start);
    };
    next();
  };
};
