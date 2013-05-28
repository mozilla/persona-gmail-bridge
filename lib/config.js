const convict = require('convict');

const conf = convict({
  bridgeUrl: {
    doc: 'The full, public-facing bridge URL. Include scheme, host, and port.',
    env: 'BRIDGE_URL',
    format: 'url',
    default: 'http://127.0.0.1:3000'
  },
  port: {
    doc: 'The port to listen on.',
    env: 'PORT',
    format: 'port',
    default: 3000
  },
  host: {
    doc: 'The hostname or IP to bind to.',
    env: 'HOST',
    format: String,
    default: '127.0.0.1'
  },
  ticketDuration: {
    doc: 'The validity period before signing tickets expire, in milliseconds.',
    env: 'TICKET_DURATION',
    format: 'nat',
    default: 5 * 60 * 1000
  },
  personaUrl : {
    doc: 'The full URL of the Persona service. Used to find JavaScript shims.',
    env: 'PERSONA_URL',
    format: 'url',
    default: 'http://127.0.0.1:10002'
  }
});

conf.validate();

module.exports = conf;
