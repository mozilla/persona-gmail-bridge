/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it */

const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');

const jshint = require('jshint').JSHINT;
const walk = require('walkdir');

function format(errs) {
  return errs.map(function (e) { return e.line + ': ' + e.reason; }).join('\n');
}

describe('JSHint', function () {
  var rcPath = path.join(__dirname, '..', '.jshintrc');
  var rcFile = fs.readFileSync(rcPath, 'utf8');
  var configuration = JSON.parse(rcFile);

  var commonPath = path.join(__dirname, '..');

  var files = Array.prototype.concat(
    path.join(__dirname, '..', 'bin', 'sideshow.js'),
    walk.sync(path.join(__dirname, '..', 'lib')),
    walk.sync(path.join(__dirname, '..', 'scripts')),
    walk.sync(path.join(__dirname, '..', 'static')),
    walk.sync(path.join(__dirname, '..', 'test'))
  );

  files = files.filter( function(file) { return (/\.js$/).test(file); } );

  files.forEach(function (file) {
    var relativeName = file.substring(commonPath.length);
    it(relativeName + ' should pass', function () {
      var source = fs.readFileSync(file, 'utf8');
      if (!jshint(source, configuration)) {
        throw new Error('JSHint failed.\n' + format(jshint.errors));
      }
    });
  });
});
