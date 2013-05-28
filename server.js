const path = require('path');

const express = require('express');
const i18n = require('i18n-abide');
const openid = require('openid');

const compare = require('./lib/compare');
const config = require('./lib/config');

const openidRP = new openid.RelyingParty(
  config.get('bridgeUrl') + '/authenticate/verify', // Verification URL
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

app.use(express.cookieParser('CHANGE ME'));

app.use(i18n.abide({
  supported_languages: ['en-US', 'it-CH'],
  default_lang: 'en-US',
  debug_lang: 'it-CH',
  translation_directory: 'i18n'
}));

app.get('/__heartbeat__', function (req, res) {
  res.send('ok');
});

app.get('/.well-known/browserid', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.sendfile('fake-well-known.json');
});

app.get('/provision', function (req, res) {
  var email = '';
  var meta = {};
  var ttl = 5 * 60 * 1000; // Invalidate signing cookies after 5 minutes

  try { meta = JSON.parse(req.signedCookies.certify); }
  catch (e) { /* ignore invalid JSON */ }

  if (meta.email && meta.issued && (Date.now() - meta.issued) < ttl) {
    email = meta.email;
  }

  res.clearCookie('certify');
  res.render('provision', { certify: email });
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
      res.redirect('http://127.0.0.1:10002/sign_in#AUTH_RETURN_CANCEL');
    } else if (error || !result.authenticated || !result.email) {
      res.status(403).render('error',
        { title: req.gettext('Error'), info: error.message });
    } else if (compare(req.signedCookies.claimed, result.email)) {
      res.cookie('certify',
                 JSON.stringify({ email: result.email, issued: Date.now() }),
                 { signed: true });
      res.render('authenticate_finish', { title: req.gettext('Loading...') });
    } else {
      res.status(409).render('error_mismatch',
        { title: req.gettext('Accounts do not match'),
          claimed: req.signedCookies.claimed, proven: result.email });
    }
  });
});

app.listen(config.get('port'), config.get('host'));
