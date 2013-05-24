function valid(address) {
  if (typeof address !== 'string') {
    return false;
  }

  // http://blog.gerv.net/2011/05/html5_email_address_regexp/
  var regex = /^[\w.!#$%&'*+\-/=?\^`{|}~]+@[a-z\d-]+(\.[a-z\d-]+)+$/i;

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

  return lhs + '@' + rhs;
}

module.exports = function (a, b) {
  // Both arguments must be valid email addresses
  if (!valid(a) || !valid(b)) {
    return false;
  }

  a = canonicalized(a);
  b = canonicalized(b);

  return a === b;
};
