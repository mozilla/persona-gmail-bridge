/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// jshinting (syntax checking) of the source

const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');

const jshint = require('jshint').JSHINT;
const walk = require('walk');

function jshintFormatter(errors) {
  return errors.map(function(e) {
    return e.error.reason + ' ' + e.file + ':' + e.error.line;
  });
}

describe('jshint', function() {
  // read jshintrc
  var jshintrc;

  it('.jshintrc should be readable', function() {
    jshintrc = JSON.parse(fs.readFileSync(path.join(__dirname, '../.jshintrc')).toString());
    assert(Object.prototype.toString.call(jshintrc), '[object Object]');
  });

  var filesToLint = [
    path.join(__dirname, '../server.js')
  ];

  it('we should be able to discover files to lint', function(done) {
    var walker = walk.walkSync(path.join(__dirname, '../lib'), {});

    walker.on("file", function(root, fStat, next) {
      var f = path.join(root, fStat.name);
      if (/\.js$/.test(f)) {
        filesToLint.push(f);
      }
      next();
    });
    walker.on("end", done);
  });

  it('syntax checking should yield no errors', function(done) {
    var errors = [];

    function checkNext() {
      if (!filesToLint.length) {
        if (errors.length) {
          var buf = util.format("\n        %d errors:\n        * ",
                                errors.length);
          buf += errors.join("\n        * ");
          done(new Error(buf));
        } else {
          done(null);
        }
        return;
      }
      var f = filesToLint.shift();
      fs.readFile(f.toString(), function(err, data) {
        // now
        f = path.relative(process.cwd(), f);
        if (!jshint(data.toString(), jshintrc)) {
          jshint.errors.forEach(function(e) {
            errors.push(util.format("%s %s:%d - %s", e.id, f, e.line, e.reason));
          });
        }
        checkNext();
      });
    }
    checkNext();
  });
});

