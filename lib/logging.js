const winston = require('winston');
const express = require('express');

const config = require('./config');


var transports = [];
var logPath = config.get('logPath');

if (logPath) {
  transports.push(new (winston.transports.File)({
    timestamp: function() { return new Date().toISOString(); },
    filename: logPath,
    colorize: true,
    handleException: true
  }));
} else {
  transports.push(new (winston.transports.Console)({
    colorize: true,
    handleException: true,
    level: 'debug'
  }));
}

exports.logger = new (winston.Logger)({
  transports: transports,
  exitOnError: false
});

