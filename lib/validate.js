/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const check = require('validator').check;

const email = require('./email');
const logger = require('./logging').logger;

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

module.exports = function validateFactory(params) {
  
  Object.keys(params).forEach(function(p) {
    var v = params[p];
    if (typeof v === 'string') {
      v = { type: v };
    }

    if (typeof v.required === 'undefined') {
      v.required = true;
    }

    if (!types[v.type]) {
      throw new Error('unknown type: ' + v.type);
    }
    params[p] = v;
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
    try {
      Object.keys(params).forEach(function(p) {
        if (params[p].required && !reqParams.hasOwnProperty(p)) {
          throw new Error("missing required parameter: '" + p + "'");
        }
        if (reqParams[p] === undefined) {
          return;
        }

        // validate
        try {
          types[params[p].type](reqParams[p]);
        } catch (e) {
          throw new Error(p + ": " + e.toString());
        }
        req[paramsName][p] = reqParams[p];
        delete reqParams[p];
      });
      req.params = req[paramsName];
    } catch(e) {
      var msg = {
        success: false,
        reason: e.toString()
      };
      logger.warn("bad request received: " + msg.reason);
      res.statusCode = 400;
      return res.json(msg);
    }


    // this is called outside the try/catch because errors
    // in the handling of the request should be caught separately
    next();

  };
};
