#!/usr/bin/env node

const express = require('express');

const app = express();

app.get('/.well-known/browserid', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send('{"disable": true}');
});

app.get('/provision', function (req, res) {
  res.send('TODO: Add provisioning page');
});

app.get('/authenticate', function (req, res) {
  res.send('TODO: Add authentication page');
});

app.listen(3000);
