const clientSessions = require('client-sessions');

const config = require('../../lib/config');

const options = {
  cookieName: 'session',
  secret: config.get('secret')
};

module.exports = function cookie(contents) {
  if (!contents._csrf) {
    contents._csrf = 'test';
  }
  return clientSessions.util.encode(options, contents);
};
