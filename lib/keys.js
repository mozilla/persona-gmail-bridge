const fs = require('fs');
const path = require('path');

const jwcrypto = require('jwcrypto');
const config = require('./config');

require('jwcrypto/lib/algs/rs');

const PUB_KEY_PATH = config.get('pub_key_path');
const PRIV_KEY_PATH = config.get('priv_key_path');
const VAR = path.join(__dirname, '../var');


function ephemeralWellKnown(pubKey) {
  var wellKnown = {
    'public-key': JSON.parse(pubKey),
    'authentication': '/authenticate',
    'provisioning': '/provision'
  };
  
  if (!fs.existsSync(VAR)) fs.mkdirSync(VAR);

  const WELL_KNOWN_PATH = path.join(VAR, 'well-known.json');
  fs.writeFileSync(WELL_KNOWN_PATH, JSON.stringify(wellKnown));
  console.log('*** Ephemeral well-known written to var.***');
  process.on('exit', function onExit() {
    fs.unlinkSync(WELL_KNOWN_PATH);
  });
}

var pubKey;
var privKey;
module.exports = function keys(callback) {
  if (!callback) callback = function() {};

  if (pubKey && privKey) {
    callback(pubKey, privKey);
  } else if (fs.existsSync(PUB_KEY_PATH) && fs.existsSync(PRIV_KEY_PATH)) {
    pubKey = fs.readFileSync(PUB_KEY_PATH).toString();
    privKey = fs.readFileSync(PRIV_KEY_PATH).toString();

    callback(pubKey, privKey);
  } else {
    console.log('*** Using ephemeral keys ***');
    jwcrypto.generateKeypair({ algorithm: 'RS', keysize: 64 }, function(err, keypair) {
      pubKey = keypair.publicKey.serialize();
      privKey = keypair.secretKey.serialize();

      ephemeralWellKnown(pubKey);
      callback(pubKey, privKey);
    });
  }
};
