const express = require('express');
const i18n = require('i18n-abide');

const app = express();

app.use(i18n.abide({
  supported_languages: ['en-US', 'it-CH'],
  default_lang: 'en-US',
  debug_lang: 'it-CH',
  translation_directory: 'i18n'
}));

app.get('/.well-known/browserid', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send('{"disable": true}');
});

app.get('/provision', function (req, res) {
  res.send(req.gettext('TODO: Add provisioning page'));
});

app.get('/authenticate', function (req, res) {
  res.send(req.gettext('TODO: Add authentication page'));
});

app.listen(3000);
