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
const fonts = require('connect-fonts');
const opensans = require('connect-fonts-opensans');

const caching = require('../lib/caching');
const config = require('../lib/config');
const csp = require('../lib/csp');
const email = require('../lib/email');
const logger = require('../lib/logging').logger;
const cert = require('../lib/cert');
const keys = require('../lib/keys');
const statsd = require('../lib/statsd');
const validate = require('../lib/validate');

const USE_TLS = url.parse(config.get('server.publicUrl')).protocol === 'https:';
const OPENID_EMAIL_PARAM = 'ext1.value.email';

if (config.get('session.secret') === config.default('session.secret')) {
  logger.warn('*** Using ephemeral secret for signing cookies. ***');
}

// start loading, or make ephmeral keys if none exist
keys(function() {
  logger.debug('*** Keys loaded. ***');
});

var openidRP = new openid.RelyingParty(
  config.get('server.publicUrl') + '/authenticate/verify', // Verification URL
  config.get('server.openidRealm'), // Realm
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

app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

app.locals.personaUrl = config.get('server.personaUrl');
app.locals.errorInfo = undefined;

// -- Express Middleware --

app.use(statsd.middleware());
app.use(express.json());

if (USE_TLS) {
  app.use(function(req, res, next) {
    req.connection.proxySecure = true;
    res.setHeader('Strict-Transport-Security',
        'max-age=10886400; includeSubdomains');
    next();
  });
}

app.use(csp([
  '/provision',
  '/authenticate',
  '/authenticate/forward',
  '/authenticate/verify'
]));

app.use(express.favicon(
  path.join(__dirname, '..', 'static', 'i', 'favicon.ico')));

app.use(clientSessions({
  cookieName: 'session',
  secret: config.get('session.secret'),
  duration: config.get('session.duration'),
  cookie: {
    maxAge: config.get('session.duration'),
    secure: USE_TLS
  }
}));

app.use(express.csrf());

express.logger.token('path', function(req) {
  return req.path;
});
express.logger.token('safe-referrer', function(req) {
  var referrer = req.headers.referer || req.headers.referrer || '';
  var queryIdx = referrer.indexOf('?');
  return (queryIdx < 0) ? referrer : referrer.slice(0, queryIdx);
});
app.use(express.logger({
  format: ':remote-addr - - ":method :path HTTP/:http-version" :status ' +
          ':response-time :res[content-length] ":safe-referrer" ":user-agent"',
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
  '/authenticate/verify',
  '/session'
]));

app.use(i18n.abide({
  supported_languages: config.get('locale.list'),
  default_lang: config.get('locale.base'),
  debug_lang: config.get('locale.debug'),
  translation_directory: config.get('locale.dir')
}));

app.use(fonts.setup({
  fonts: [ opensans ],
  allow_origin: config.get('server.publicUrl'),
  maxage: 1000 * 24 * 60 * 60 * 180 // 180 days
}));

// -- Express Routes --

app.get('/', function (req, res) {
  res.redirect(config.get('server.personaUrl'));
});

app.get('/ver.txt', function (req, res) {
  res.redirect('/static/ver.txt');
});

app.get('/__heartbeat__', function (req, res) {
  openid.discover(googleEndpoint, true, function(err/*, providers*/) {
    if (err) {
      return res.status(500).end('bad');
    }
    res.send('ok');
  });
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

app.get('/session', function(req, res) {
  // the authed email will have been normalized, but navigator.id should
  // give us the claimed email again. As long we're sure the original
  // claimed email normalizes to the authed email, we can proceed.
  var claimed = req.session.claimed;
  var proven = req.session.proven;
  res.json({
    csrf: req.session._csrf,
    proven: email.compare(claimed, proven) && claimed
  });
});

app.get('/provision', function (req, res) {
  res.render('provision');
});

app.post('/provision/certify', validate({
    email: 'gmail',
    pubkey: 'pubkey',
    duration: 'number'
  }), function(req, res) {
    var isCorrectEmail = email.compare(req.body.email, req.session.proven);

    // trying to sign a cert? then kill this cookie while we're here.
    req.session.reset(['_csrf']);
    if (!isCorrectEmail) {
      logger.error('Email not proven, will not sign certificate');
      statsd.increment('certification.failure.no_proof');
      return res.send(401, "Email isn't verified.");
    }
    if (!req.body.pubkey) {
      logger.error('Valid public key missing, can\'t sign it.');
      statsd.increment('certification.failure.invalid_pubkey');
      return res.send(400, "Pubkey isn't valid.");
    }
    if (req.body.duration === undefined) {
      req.body.duration = config.get('cert.minDuration');
    }

    keys(function(pubKey, privKey) {
      cert.sign({
        privkey: privKey,
        hostname: config.get('cert.domain'),
        duration: Math.min(req.body.duration, config.get('cert.maxDuration')),
        pubkey: req.body.pubkey,
        email: req.body.email // use user supplied email, not normalized email
      }, function onCert(err, cert) {
        if (err) {
          logger.error('Error signing certificate: %s', String(err));
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

app.get('/authenticate/forward', validate({ email: 'gmail' }),
  function (req, res) {
    // if there is no email address, a valid email wasn't sent
    if (!req.query.email) {
      logger.error('Authentication forwarding attempted with bad input');
      statsd.increment('authentication.forwarding.failure.bad_input');
      return res.status(400).render('error', {
        title: req.gettext('Error'),
        errorInfo: 'Invalid or missing email.'
      });
    }

    openidRP.authenticate(googleEndpoint, false, function (error, authUrl) {
      if (error || !authUrl) {
        logger.error('Auth forwarding failed [Error: %s, authUrl: %s]',
          String(error), authUrl);
        statsd.increment('authentication.forwarding.failure.openid_error');
        res.status(500).render('error', { title: req.gettext('Error') });
      } else {
        statsd.increment('authentication.forwarding.success');
        req.session.claimed = req.query.email;
        res.redirect(authUrl);
      }
    });
  });

app.get('/authenticate/verify', function (req, res) {
  // Check input precondition:
  // Session should include a valid email address that the user is claiming.
  if (!email.valid(req.session.claimed)) {
    logger.error('Invalid or missing claimed email');
    statsd.increment('authentication.openid.failure.no_claim');
    return res.status(400).render('error',
      { title: req.gettext('Error'), errorInfo: 'Invalid or missing claim.' });
  }
  var signed = req.query['openid.signed'] || '';
  if (signed.split(',').indexOf(OPENID_EMAIL_PARAM) === -1) {
    return res.status(401).render('error',
      { title: req.gettext('Error'), errorInfo: 'Email not signed.' });
  }

  openidRP.verifyAssertion(req, function (error, result) {
    if (error && error.message === 'Authentication cancelled') {
      logger.info('User cancelled during openid dialog');
      statsd.increment('authentication.openid.failure.cancelled');
      res.render('authenticate_finish',
        { title: req.gettext('Loading...'), success: false });
    } else if (error || !result.authenticated || !email.valid(result.email)) {
      if (!error) {
        error = new Error('Not authenticated');
      }
      logger.error('OpenID verification failed: %s', String(error));
      statsd.increment('authentication.openid.failure.bad_result');
      res.status(403).render('error',
        { title: req.gettext('Error'), errorInfo: error.message });
    } else if (email.compare(req.session.claimed, result.email)) {
      statsd.increment('authentication.openid.success');
      req.session.proven = result.email;
      res.render('authenticate_finish',
        { title: req.gettext('Loading...'), success: true });
    } else {
      logger.info('User accounts do no match');
      statsd.increment('authentication.openid.failure.mismatch');
      res.status(409).render('error_mismatch',
        { title: req.gettext("Accounts don't match"),
          claimed: req.session.claimed, proven: result.email });
    }
  });
});

app.use('/static', express.static(path.join(__dirname, '..', 'static')));

// -- Module Setup --

if (require.main === module) {
  var server = app.listen(config.get('server.port'), config.get('server.host'),
    function() {
      var a = server.address();
      logger.info("sideshow running on http://" + a.address + ":" + a.port);
    }
  );
}

module.exports = app;

// expose openidRP so we can mock in tests
app.setOpenIDRP = function setOpenIDRP(rp) {
  openidRP = rp;
};
