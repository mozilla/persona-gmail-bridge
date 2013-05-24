const assert = require('assert');

/* global describe, it */

describe('Mocha', function () {
  it('should pass trivial tests', function () {
    assert.equal(2, 1 + 1);
  });
});
