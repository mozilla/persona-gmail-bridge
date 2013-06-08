const assert = require('assert');

const jwcrypto = require('jwcrypto');
const request = require('request');

const sideshow = require('../server');
const mockid = require('./lib/mockid');

const BASE_URL = 'http://localhost:3033';
const TEST_EMAIL = 'test.does.not.exist.for.sure@gmail.com';

/* globals describe, before, after, it */

describe('server', function() {

  var server;
  sideshow.setOpenIDRP(mockid({
    url: 'http://does.not.exist',
    result: {
      authenticated: true,
      email: TEST_EMAIL
    }
  }));

  var pubkey;
  before(function(done) {
    jwcrypto.generateKeypair({
      algorithm: 'RS',
      keysize: 64
    }, function(err, pair) {
      pubkey = pair.publicKey.serialize();
      server = sideshow.listen(3033, done);
    });
  });

  describe('provisioning', function() {
  
    it('should forward to auth url', function(done) {
      request.get({
        url: BASE_URL + '/authenticate/forward?email=' + TEST_EMAIL,
        followRedirect: false
      }, function(err, res, body) {
        assert.ifError(err);
        assert.equal(res.statusCode, 302);
        assert.equal(res.headers.location, 'http://does.not.exist');
        done();
      });
    });

    it('should verify on return', function(done) {
      request.get(BASE_URL + '/authenticate/verify', function(err, res, body) {
        assert.ifError(err);
        assert.equal(res.statusCode, 200);
        done();
      });
    });

    var csrf;
    it('should get a csrf token', function(done) {
      request.get(BASE_URL + '/provision', function(err, res, body) {
        // please forgive me Cthulu
        var re = /<input type="hidden" id="csrf" value="([^"]+)"\/>/;
        csrf = body.match(re)[1];

        assert(csrf);

        done();
      });
    });

    it('should sign a certificate', function(done) {
      request.post({
        url: BASE_URL + '/provision/certify',
        headers: {
         'X-CSRF-Token': csrf
        },
        json: {
          email: TEST_EMAIL,
          pubkey: pubkey,
          duration: 1000 * 60 * 5
        }
      }, function(err, res, body) {
        assert.ifError(err);
        assert(body.cert);
        assert.equal(body.cert.split('.').length, 3);
        done();
      });
    });
  
  });


  after(function(done) {
    server.close(done);
  });

});
