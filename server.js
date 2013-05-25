const path = require('path');
const fs = require('fs');

const express = require('express');
const i18n = require('i18n-abide');
const openid = require('openid');

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

app.get('/provision', function (req, res) {
  res.render('provision');
});

app.post('/cert', function(req, res) {
  var cookie = req.signedCookies.certify;
  var authedEmail = '';
  var ttl = 1000 * 60 * 5; // invalidate signing cookies after 5 minutes
  if (cookie && cookie.email && cookie.issued && (Date.now() - cookie.issued) < ttl) {
    authedEmail = cookie.email;
  }
  var isCorrectEmail = compare(req.body.email, authedEmail);

  // trying to sign a cert? then kill this cookie while we're here.
  res.clearCookie('certify');
  if (!isCorrectEmail) {
    return res.send(401, "Email isn't verified.");
  }
  keys(function(pubKey, privKey) {
    cert.sign({
      privkey: privKey,
      hostname: config.get('issuer'),
      duration: req.body.duration,
      pubkey: req.body.pubkey,
      email: req.body.email // use user supplied email, not normalized email
    }, function onCert(err, cert) {
      if (err) return res.send(500, err);

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

