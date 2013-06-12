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
  host: config.get('statsdHost'),
  port: config.get('statsdPort'),
  prefix: 'sideshow.',
  mock: config.get('statsdEnabled')
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
