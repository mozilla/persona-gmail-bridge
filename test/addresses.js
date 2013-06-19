/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
const email = require('../lib/email');

/* global describe, it */

describe('Email validity', function () {
  describe('valid addresses', function () {
    var addresses = [
      'foo@example.com',
      '.foo@example.com',
      'f...oo@example.com',
      'foo+bar@example.com'
    ];

    addresses.forEach(function(address) {
      it('should be valid: ' + address, function () {
        assert(email.valid(address));
      });
    });
  });

  describe('invalid addresses', function () {
    var addresses = [
      '@example.com',
      'foo@',
      'foo@@example.com',
      'foo@-example-.com',
      '',
      undefined,
      null,
      false
    ];

    addresses.forEach(function(address) {
      it('should not be valid: ' + address, function () {
        assert(!email.valid(address));
      });
    });
  });
});

describe('Gmail Address Comparison', function () {
  describe('Identical inputs', function () {
    it('should be true if both are valid addresses', function () {
      assert(email.compare('alice@gmail.com', 'alice@gmail.com'));
    });
    it('should be false if either is not a valid address', function () {
      assert(!email.compare('alice-at-gmail.com', 'alice-at-gmail.com'));
      assert(!email.compare('alice@@gmail.com', 'alice@@gmail.com'));
      assert(!email.compare('', ''));
      assert(!email.compare(false, false));
      assert(!email.compare(undefined, undefined));
    });
    it('should be false if either is at a non-gmail domain', function () {
      assert(!email.compare('alice@google.com', 'alice@google.com'));
    });
  });
  describe('Letter casing', function () {
    it('should be ignored', function () {
      assert(email.compare('Alice@gmail.com', 'ALiCE@gmail.com'));
    });
  });
  describe('Dots in addresses', function () {
    it('should be ignored in the username part', function () {
      assert(email.compare('a.l.i.c.e@gmail.com', 'al.ice@gmail.com'));
    });
    it('should not be ignored in the domain part', function () {
      assert(!email.compare('alice@gmail.com', 'alice@g.mail.com'));
    });
  });
  describe('Plus aliases in addresses', function () {
    it('should be ignored', function () {
      assert(email.compare('alice+foo@gmail.com', 'alice+bar@gmail.com'));
    });
  });
  describe('Gmail.com and Googlemail.com', function () {
    it('should be interchangable', function () {
      assert(email.compare('alice@gmail.com', 'alice@googlemail.com'));
    });
  });
});

describe('Gmail detection', function() {
  describe('valid addresses', function() {
    it('should return true from isGmail', function() {
      assert(email.isGmail('alice.foo+bar@gmail.com'));
    });
  });

  describe('malformed addresses', function() {
    it('should return false from isGmail', function() {
      assert(!email.isGmail('@gmail.com'));
    });
  });

  describe('non-Gmail address', function() {
    it('should return false from isGmail', function() {
      assert(!email.isGmail('alice@bar.com'));
    });
  });
});
