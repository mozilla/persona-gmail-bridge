const path = require('path');

const express = require('express');
const i18n = require('i18n-abide');
const openid = require('openid');

const openidRP = new openid.RelyingParty(
  'http://127.0.0.1:3000/authenticate/verify', // Verification URL
  null, // Realm
  true, // Use stateless verification
  false, // Strict mode
  [ // List of extensions to enable and include
    new openid.AttributeExchange(
      {'http://axschema.org/contact/email': 'required'})
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
  res.render('provision');
});

app.get('/authenticate', function (req, res) {
  res.render('authenticate');
});

app.get('/authenticate/forward', function (req, res) {
  openidRP.authenticate(googleEndpoint, false, function (error, authUrl) {
    if (error || !authUrl || !req.query.email) {
      res.send(500);
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
    } else if (error || !result.authenticated) {
      res.send(403, 'Authentication failed: ' + error.message);
    } else {
      res.send(200, 'Claim: ' + req.signedCookies.claimed + ', Proof: ' + result.email);
    }
  });
});

app.listen(3000);
