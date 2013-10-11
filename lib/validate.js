/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const check = require('validator').check;

const email = require('./email');
const logger = require('./logging').getLogger('sideshow.validate');

const types = {
  email: function(x) {
    if (!email.valid(x)) {
      throw new Error('invalid email format');
    }
  },
  gmail: function(x) {
    if (!email.isGmail(x)) {
      throw new Error('invalid Gmail format');
    }
  },
  number: function(x) {
    check(x).isInt();
  },
  pubkey: function(x) {
    check(x).len(50, 10240);
    JSON.parse(x);
  }
};

/*
 * Middleware that cleans req.body, .query, and .params
 *
 * If a property doesn't validate, the value will be dropped. All
 * properties that do validate will be kept on the appropriate request
 * property.
 *
 * Example:
 *  app.get('/', validate({ email: 'gmail' }), function(req, res) {
 *    // /?email=foo@bar.com
 *    req.query.email === undefined
 *
 *    // /?email=foo@gmail.com
 *    req.query.email === 'foo@gmail.com';
 *  });
 */
module.exports = function validateFactory(expectedParams) {

  Object.keys(expectedParams).forEach(function(p) {
    // error during startup, in case developer declares unknown type
    var v = expectedParams[p];
    if (!types[v]) {
      throw new Error('unknown type: ' + v);
    }
  });


  return function validateMiddleware(req, res, next) {
    var paramsName = req.method === "POST" ? 'body' : 'query';
    var reqParams = req[paramsName];

    // clear body and query to prevent wsapi handlers from accessing
    // un-validated input parameters
    req.body = {};
    req.query = {};
    req.params = {};

    // now validate
    Object.keys(expectedParams).forEach(function(p) {
      if (reqParams[p] === undefined) {
        return;
      }

      // validate
      try {
        types[expectedParams[p]](reqParams[p]);

        req[paramsName][p] = reqParams[p];
      } catch (validationError) {
        logger.debug("invalid request parameter '" + p + "'");
      }
    });
    req.params = req[paramsName];

    next();
  };
};
