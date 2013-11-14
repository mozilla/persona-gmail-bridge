/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs');
const path = require('path');

const jwcrypto = require('jwcrypto');

const config = require('./config');
const logger = require('./logging').getLogger('sideshow.keys');

require('jwcrypto/lib/algs/rs');

const PUB_KEY_PATH = config.get('cert.pubKeyPath');
const PRIV_KEY_PATH = config.get('cert.privKeyPath');
const VAR = path.join(__dirname, '../var');


function ephemeralWellKnown(pubKey) {
  var wellKnown = {
    'public-key': JSON.parse(pubKey),
    'authentication': '/authenticate',
    'provisioning': '/provision'
  };

  if (!fs.existsSync(VAR)) {
    fs.mkdirSync(VAR);
  }

  const WELL_KNOWN_PATH = path.join(VAR, 'well-known.json');
  fs.writeFileSync(WELL_KNOWN_PATH, JSON.stringify(wellKnown));
  logger.debug('*** Ephemeral well-known written to var.***');
  process.on('exit', function onExit() {
    fs.unlinkSync(WELL_KNOWN_PATH);
  });
}

var pubKey;
var privKey;
module.exports = function keys(callback) {
  if (!callback) {
    callback = function() {};
  }

  if (pubKey && privKey) {
    callback(pubKey, privKey);
  } else if (fs.existsSync(PUB_KEY_PATH) && fs.existsSync(PRIV_KEY_PATH)) {
    pubKey = fs.readFileSync(PUB_KEY_PATH).toString();
    privKey = fs.readFileSync(PRIV_KEY_PATH).toString();

    callback(pubKey, privKey);
  } else {
    logger.warn('*** Using ephemeral keys ***');
    jwcrypto.generateKeypair({
      algorithm: 'RS',
      keysize: 64
    }, function(err, keypair) {
      pubKey = keypair.publicKey.serialize();
      privKey = keypair.secretKey.serialize();

      ephemeralWellKnown(pubKey);
      callback(pubKey, privKey);
    });
  }
};
