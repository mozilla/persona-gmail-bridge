const winston = require('winston');
const express = require('express');

const config = require('./config');
express.logger.format(':remote-addr - - ":method :url HTTP/:http-version"' +
    ' :status :response-time :res[content-length] ":referrer" ":user-agent"');
express.logger.format('sideshow_dev', ':method :url :status :response-time');


var transports = [];
var logPath = config.get('logPath');

if (logPath === 'CONSOLE') {
  transports.push(new (winston.transports.Console)({
    colorize: true,
    handleException: true,
    level: 'debug'
  }));
} else {
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

