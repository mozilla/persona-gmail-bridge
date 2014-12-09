/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const bidCrypto = require('browserid-crypto');

require('browserid-crypto/lib/algs/ds');
require('browserid-crypto/lib/algs/rs');

exports.sign = function sign(options, callback) {
  var pubKey = bidCrypto.loadPublicKey(options.pubkey);
  var privKey = bidCrypto.loadSecretKey(options.privkey);

  var expiration = new Date();
  var iat = new Date();

  expiration.setTime(new Date().valueOf() + (options.duration * 1000));
  // Set issuedAt to 10 seconds ago. Pads for verifier clock skew
  iat.setTime(iat.valueOf() - (10 * 1000));

  bidCrypto.cert.sign(
    { publicKey: pubKey, principal: { email: options.email } },
    { issuer: options.hostname, issuedAt: iat, expiresAt: expiration },
    null,
    privKey,
    callback);

};
