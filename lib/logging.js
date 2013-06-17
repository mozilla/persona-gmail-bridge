/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const winston = require('winston');

const config = require('./config');

var transports = [];
var logPath = config.get('logPath');



if (!logPath || logPath === '-') {
  // Default to console logging
  transports.push(new (winston.transports.Console)({
    colorize: true,
    handleException: true,
    level: 'debug'
  }));
} else if (logPath && logPath !== '/dev/null') {
  // Don't log to /dev/null, Windows doesn't have it.
  transports.push(new (winston.transports.File)({
    timestamp: function() { return new Date().toISOString(); },
    filename: logPath,
    colorize: true,
    handleException: true
  }));
}

exports.logger = new (winston.Logger)({
  transports: transports,
  exitOnError: false
});

