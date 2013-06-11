module.exports = function mockid(options) {
  return {
    authenticate: function authenticate(endpoint, bool, callback) {
      process.nextTick(function() {
        if (options.error) {
          callback(new Error('Mock Error'));
        } else {
          callback(null, options.url);
        }
      });
    },
    verifyAssertion: function verifyAssertion(req, callback) {
      process.nextTick(function() {
        if (options.error) {
          callback(new Error('Mock Error'));
        } else {
          callback(null, options.result);
        }
      });
    }
  };
};
