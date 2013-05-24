const assert = require('assert');
const compare = require('../lib/compare');

/* global describe, it */

describe('Gmail Address Comparison', function () {
  describe('Identical inputs', function () {
    it('should be true if both are valid addresses', function () {
      assert(compare('alice@gmail.com', 'alice@gmail.com'));
    });
    it('should be false if either is not a valid address', function () {
      assert(!compare('alice-at-gmail.com', 'alice-at-gmail.com'));
      assert(!compare('alice@@gmail.com', 'alice@@gmail.com'));
      assert(!compare('', ''));
      assert(!compare(false, false));
      assert(!compare(undefined, undefined));
    });
    it('should be false if either is at a non-gmail domain', function () {
      assert(!compare('alice@google.com', 'alice@google.com'));
    });
  });
  describe('Letter casing', function () {
    it('should be ignored', function () {
      assert(compare('Alice@gmail.com', 'ALiCE@gmail.com'));
    });
  });
  describe('Dots in addresses', function () {
    it('should be ignored in the username part', function () {
      assert(compare('a.l.i.c.e@gmail.com', 'al.ice@gmail.com'));
    });
    it('should not be ignored in the domain part', function () {
      assert(!compare('alice@gmail.com', 'alice@g.mail.com'));
    });
  });
  describe('Plus aliases in addresses', function () {
    it('should be ignored', function () {
      assert(compare('alice+foo@gmail.com', 'alice+bar@gmail.com'));
    });
  });
  describe('Gmail.com and Googlemail.com', function () {
    it('should be interchangable', function () {
      assert(compare('alice@gmail.com', 'alice@googlemail.com'));
    });
  });
});
