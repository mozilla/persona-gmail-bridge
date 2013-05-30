const path = require('path');
const fs = require('fs');

const express = require('express');
const i18n = require('i18n-abide');
const openid = require('openid');

const caching = require('./lib/caching');
const compare = require('./lib/compare');
const config = require('./lib/config');
const cert = require('./lib/cert');
const keys = require('./lib/keys');

// start loading, or make ephmeral keys if none exist
keys(function() {
  console.log('*** Keys loaded. ***');
});

const openidRP = new openid.RelyingParty(
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

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use('/static', express.static('static'));
app.use(express.json());

app.use(express.cookieParser(config.get('secret')));

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

/*jshint camelcase:false*/
app.use(i18n.abide({
  supported_languages: config.get('localeList'),
  default_lang: config.get('localeDefault'),
  debug_lang: config.get('localeDebug'),
  translation_directory: config.get('localePath')
}));

app.locals.personaUrl = config.get('personaUrl');

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

function getAuthedEmail(req) {
  var cookie = req.signedCookies.certify;
  var authedEmail = '';
  var ttl = config.get('ticketDuration');
  var now = Date.now();
  if (cookie && cookie.email && cookie.issued && (now - cookie.issued) < ttl) {
    authedEmail = cookie.email;
  }
  return authedEmail;
}

app.get('/provision', function (req, res) {
  var claimed = req.signedCookies.claimed;
  // the authed email will have been normalized, but navigator.id should
  // give us the claimed email again. As long we're sure the original
  // claimed email normalizes to the authed email, we can proceed.
  if (!compare(claimed, getAuthedEmail(req))) {
    claimed = '';
  }
  res.render('provision', { certify: claimed });
});

app.post('/provision/certify', function(req, res) {
  var isCorrectEmail = compare(req.body.email, getAuthedEmail(req));

  // trying to sign a cert? then kill this cookie while we're here.
  res.clearCookie('certify');
  if (!isCorrectEmail) {
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
        return res.send(500, err);
      }

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
      res.status(500).render('error', { title: req.gettext('Error') });
    } else {
      res.cookie('claimed', req.query.email, { signed: true });
      res.redirect(authUrl);
    }
  });
});

app.get('/authenticate/verify', function (req, res) {
  openidRP.verifyAssertion(req, function (error, result) {
    if (error && error.message === 'Authentication cancelled') {
      res.render('authenticate_finish',
        { title: req.gettext('Loading...'), success: false });
    } else if (error || !result.authenticated || !result.email) {
      res.status(403).render('error',
        { title: req.gettext('Error'), info: error.message });
    } else if (compare(req.signedCookies.claimed, result.email)) {
      res.cookie('certify', { email: result.email, issued: Date.now() },
                 { signed: true });
      res.render('authenticate_finish',
        { title: req.gettext('Loading...'), success: true });
    } else {
      res.status(409).render('error_mismatch',
        { title: req.gettext('Accounts do not match'),
          claimed: req.signedCookies.claimed, proven: result.email });
    }
  });
});

if (require.main === module) {
  app.listen(config.get('port'), config.get('host'));
}

module.exports = app;

