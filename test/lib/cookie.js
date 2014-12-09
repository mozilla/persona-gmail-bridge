const clientSessions = require('client-sessions');

const config = require('../../lib/config');

const options = {
  cookieName: 'session',
  secret: config.get('session.secret')
};

module.exports = function cookie(contents) {
  if (!contents.csrfSecret) {
    contents.csrfSecret = 'testSecret';
  }
  return clientSessions.util.encode(options, contents);
};
