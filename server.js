const path = require('path');

const express = require('express');
const i18n = require('i18n-abide');

const app = express();

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

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

app.listen(3000);
