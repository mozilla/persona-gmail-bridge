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
    app.setOpenIDRP(mockid({
      url: 'http://openid.example',
      result: {
        authenticated: true,
        email: TEST_EMAIL
      }
    }));

    server = app.listen(3033, undefined, undefined, done);
  });

  after(function () {
    server.close();
  });

  describe('/__heartbeat__', function () {
    var url = BASE_URL + '/__heartbeat__';
    var res;
    var body;

    before(function (done) {
      request.get(url, function (err, _res, _body) {
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
    var url = BASE_URL + '/.well-known/browserid';
    var res;
    var body;

    before(function (done) {
      request.get(url, function (err, _res, _body) {
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
    var url = BASE_URL + '/provision';
    url; // Make JSHint shut up for the moment...
    it('should have tests');
  });

  describe('/provision/certify', function () {
    var url = BASE_URL + '/provision/certify';
    url; // Make JSHint shut up for the moment...
    it('should have tests');
  });

  describe('/authenticate', function () {
    var url = BASE_URL + '/authenticate';
    url; // Make JSHint shut up for the moment...
    it('should have tests');
  });

  describe('/authenticate/forward', function () {
    var url = BASE_URL + '/authenticate/forward';

    describe('well-formed requests', function () {
      var options = {
        qs: { email: 'hikingfan@gmail.com' },
        followRedirect: false
      };
      var res;
      var body;

      before(function (done) {
        request.get(url, options, function (err, _res, _body) {
          res = _res;
          body = _body;
          done(err);
        });
      });

      it('should respond to GET with a redirect', function () {
        assert.equal(res.statusCode, 302);
      });

      it('should redirect to the OpenID endpoint', function () {
        assert.equal(res.headers.location, 'http://openid.example');
      });
    });

    describe('malformed requests', function () {
      it('should fail on GET for non-google addresses', function (done) {
        var options = {
          qs: { email: 'hikingfan@example.invalid' },
          followRedirect: false
        };

        request.get(url, options, function (err, res) {
          assert.equal(res.statusCode, 500);
          done(err);
        });
      });

      it('should fail on GET if no email is provided', function (done) {
        var options = {
          qs: { },
          followRedirect: false
        };

        request.get(url, options, function (err, res) {
          assert.equal(res.statusCode, 500);
          done(err);
        });
      });
    });
  });

  describe('/authenticate/verify', function () {
    var url = BASE_URL + '/authenticate/verify';
    url; // Make JSHint shut up for the moment...
    it('should have tests');
  });
});

/*
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
*/
