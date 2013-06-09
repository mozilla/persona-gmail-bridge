const assert = require('assert');

const jwcrypto = require('jwcrypto');
const request = require('request');

const app = require('../server');
const mockid = require('./lib/mockid');

const BASE_URL = 'http://localhost:3033';
const TEST_EMAIL = 'hikingfan@gmail.com';

/* globals describe, before, after, it */

describe('HTTP Endpoints', function () {
  var server;

  before(function (done) {
    server = app.listen(3033, undefined, undefined, function () { done(); });
  });

  after(function (done) {
    server.close(function () { done(); });
  });

  describe('/__heartbeat__', function () {
    var res;
    var body;

    before(function (done) {
      request.get(BASE_URL + '/__heartbeat__', function (err, _res, _body) {
        res = _res;
        body = _body;
        done(err);
      });
    });

    it('should respond to GET', function () {
      assert.equal(res.statusCode, 200);
    });

    it('should have an "ok" body', function () {
      assert.equal(body, 'ok');
    });
  });

  describe('/.well-known/browserid', function () {
    var res;
    var body;

    before(function (done) {
      request.get(BASE_URL + '/.well-known/browserid', function (err, _res, _body) {
        res = _res;
        body = _body;
        done(err);
      });
    });

    it('should respond to GET', function () {
      assert.equal(res.statusCode, 200);
    });

    it('should use application/json', function () {
      var contentType = res.headers['content-type'].split(';')[0];
      assert.equal(contentType, 'application/json');
    });

    it('should be valid JSON', function () {
      assert.doesNotThrow(function () { JSON.parse(body); });
    });

    it('should contain all necessary parameters', function () {
      var doc = JSON.parse(body);
      assert.equal(doc.authentication, '/authenticate');
      assert.equal(doc.provisioning, '/provision');
      assert('public-key' in doc);
    });

    it('should contain a valid public key', function () {
      var doc = JSON.parse(body);
      var pubKey = JSON.stringify(doc['public-key']);
      assert(jwcrypto.loadPublicKey(pubKey));
    });
  });

  describe('/provision', function () {
  });

  describe('/provision/certify', function () {
  });

  describe('/authenticate', function () {
  });

  describe('/authenticate/forward', function () {
  });

  describe('/authenticate/verify', function () {
  });
});

/*
describe('server', function() {

  var server;
  sideshow.setOpenIDRP(mockid({
    url: 'http://openid.example',
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
        assert.equal(res.headers.location, 'http://openid.example');
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
*/
