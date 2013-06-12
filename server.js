#!/usr/bin/env node
// jshint camelcase:false

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path');
const fs = require('fs');
const url = require('url');

const express = require('express');
const i18n = require('i18n-abide');
const openid = require('openid');
const clientSessions = require('client-sessions');

const caching = require('./lib/caching');
const compare = require('./lib/compare');
const config = require('./lib/config');
const logger = require('./lib/logging').logger;
const cert = require('./lib/cert');
const keys = require('./lib/keys');
const statsd = require('./lib/statsd');

const IS_SECURE = url.parse(config.get('publicUrl')).protocol === 'https:';
if (config.get('secret') === config.default('secret')) {
  logger.warn('*** Using ephemeral secret for signing cookies. ***');
}

// start loading, or make ephmeral keys if none exist
keys(function() {
  logger.debug('*** Keys loaded. ***');
});

var openidRP = new openid.RelyingParty(
  config.get('publicUrl') + '/authenticate/verify', // Verification URL
  null, // Realm
  true, // Use stateless verification
  false, // Strict mode
  [ // List of extensions to enable and include
    new openid.AttributeExchange(
      {'http://axschema.org/contact/email': 'required'}),
    new openid.UserInterface({mode: 'popup'})
  ]);
const googleEndpoint = 'https://www.google.com/accounts/o8/id';

const app = express();

// -- Express Configuration --

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

app.locals.personaUrl = config.get('personaUrl');
app.locals.errorInfo = undefined;

// -- Express Middleware --

app.use(statsd.middleware());
app.use(express.json());

if (IS_SECURE) {
  app.use(function(req, res, next) {
    req.connection.proxySecure = true;
    res.setHeader('Strict-Transport-Security',
        'max-age=1088640; includeSubdomains');
    next();
  });
}

app.use(clientSessions({
  cookieName: 'session',
  secret: config.get('secret'),
  duration: config.get('sessionDuration'),
  cookie: {
    maxAge: config.get('sessionDuration'),
    secure: IS_SECURE
  }
}));

app.use(express.csrf());

express.logger.token('path', function(req) {
  return req.path;
});
app.use(express.logger({
  format: ':remote-addr - - ":method :path HTTP/:http-version" :status ' +
          ':response-time :res[content-length] ":referrer" ":user-agent"',
  stream: {
    write: function(x) {
      logger.info(String(x).trim());
    }
  }
}));

// No user-specific information. Localized or caching otherwise discouraged.
app.use(caching.revalidate([
  '/.well-known/browserid',
  '/authenticate',
  '/authenticate/forward'
]));

// User-specific information or caching prohibited.
app.use(caching.prevent([
  '/__heartbeat__',
  '/provision',
  '/provision/certify',
  '/authenticate/verify'
]));

app.use(i18n.abide({
  supported_languages: config.get('localeList'),
  default_lang: config.get('localeDefault'),
  debug_lang: config.get('localeDebug'),
  translation_directory: config.get('localePath')
}));

// -- Express Routes --

app.get('/__heartbeat__', function (req, res) {
  res.send('ok');
});

app.get('/.well-known/browserid', function (req, res) {
  keys(function(pubKey) {
    res.json({
      "public-key": JSON.parse(pubKey),
      "authentication": "/authenticate",
      "provisioning": "/provision"
    });
  });
});

app.get('/provision', function (req, res) {
  var claimed = req.session.claimed;
  // the authed email will have been normalized, but navigator.id should
  // give us the claimed email again. As long we're sure the original
  // claimed email normalizes to the authed email, we can proceed.
  if (!compare(claimed, req.session.proven)) {
    claimed = '';
  }
  res.render('provision', { certify: claimed, _csrf: req.session._csrf });
});

app.post('/provision/certify', function(req, res) {
  var isCorrectEmail = compare(req.body.email, req.session.proven);

  // trying to sign a cert? then kill this cookie while we're here.
  req.session.reset(['_csrf']);
  if (!isCorrectEmail) {
    statsd.increment('certification.failure.no_proof');
    return res.send(401, "Email isn't verified.");
  }
  keys(function(pubKey, privKey) {
    cert.sign({
      privkey: privKey,
      hostname: config.get('issuer'),
      duration: Math.min(req.body.duration, config.get('certMaxDuration')),
      pubkey: req.body.pubkey,
      email: req.body.email // use user supplied email, not normalized email
    }, function onCert(err, cert) {
      if (err) {
        statsd.increment('certification.failure.signing_error');
        return res.send(500, err);
      }

      statsd.increment('certification.success');
      res.json({
        cert: cert
      });
    });
  });
});

app.get('/authenticate', function (req, res) {
  res.render('authenticate', { title: req.gettext('Loading...') });
});

app.get('/authenticate/forward', function (req, res) {
  openidRP.authenticate(googleEndpoint, false, function (error, authUrl) {
    if (error || !authUrl || !req.query.email) {
      statsd.increment('authentication.forwarding.failure');
      res.status(500).render('error', { title: req.gettext('Error') });
    } else {
      statsd.increment('authentication.forwarding.success');
      req.session.claimed = req.query.email;
      res.redirect(authUrl);
    }
  });
});

app.get('/authenticate/verify', function (req, res) {
  openidRP.verifyAssertion(req, function (error, result) {
    if (error && error.message === 'Authentication cancelled') {
      statsd.increment('authentication.openid.failure.cancelled');
      res.render('authenticate_finish',
        { title: req.gettext('Loading...'), success: false });
    } else if (error || !result.authenticated || !result.email) {
      statsd.increment('authentication.openid.failure.bad_result');
      res.status(403).render('error',
        { title: req.gettext('Error'), errorInfo: error.message });
    } else if (compare(req.session.claimed, result.email)) {
      statsd.increment('authentication.openid.success');
      req.session.proven = result.email;
      res.render('authenticate_finish',
        { title: req.gettext('Loading...'), success: true });
    } else {
      statsd.increment('authentication.openid.failure.mismatch');
      res.status(409).render('error_mismatch',
        { title: req.gettext('Accounts do not match'),
          claimed: req.session.claimed, proven: result.email });
    }
  });
});

app.use('/static', express.static('static'));

// -- Module Setup --

if (require.main === module) {
  var server = app.listen(config.get('port'), config.get('host'), function() {
    var addy = server.address();
    logger.info("sideshow running on http://" + addy.address + ":" + addy.port);
  });
}

module.exports = app;

// expose openidRP so we can mock in tests
app.setOpenIDRP = function setOpenIDRP(rp) {
  openidRP = rp;
};
