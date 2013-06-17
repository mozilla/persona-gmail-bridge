/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function valid(address) {
  if (typeof address !== 'string') {
    return false;
  }

  // http://blog.gerv.net/2011/05/html5_email_address_regexp/
  // jshint maxlen:154
  var regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$/;

  var parts = address.split('@');

  return (regex.test(address) &&
          address.length <= 254 &&
          parts[0].length <= 64 &&
          parts[1].length <= 253);
}

function canonicalized(s) {
  // Normalize case
  s = s.toLowerCase();

  var parts = s.split('@');
  var lhs = parts[0];
  var rhs = parts[1];

  // Ignore dots
  lhs = lhs.replace(/\./g, '');

  // Trim plus addresses
  if (lhs.indexOf('+') > -1) {
    lhs = lhs.slice(0, lhs.indexOf('+'));
  }

  // Normalize googlemail.com to gmail.com
  if (rhs === 'googlemail.com') {
    rhs = 'gmail.com';
  }

  // Reject non-gmail domains
  if (rhs !== 'gmail.com') {
    return NaN; // Because it's falsey and not equal to itself
  }

  return lhs + '@' + rhs;
}

function compare(a, b) {
  // Both arguments must be valid email addresses
  if (!valid(a) || !valid(b)) {
    return false;
  }

  a = canonicalized(a);
  b = canonicalized(b);

  return a === b;
}

function isGmail(email) {
  return !!canonicalized(email);
}

exports.compare = compare;
exports.valid = valid;
exports.isGmail = isGmail;
