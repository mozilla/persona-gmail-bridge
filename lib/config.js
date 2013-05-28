const crypto = require('crypto');

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
  },
  secret: {
    doc: 'The secret used for signing cookies',
    env: 'SECRET',
    format: String,
    default: 'CHANGE ME'
  },
  localeList: {
    doc: 'An array of locales to enabled.',
    env: 'LOCALE_LIST',
    format: Array,
    default: ['en-US', 'it-CH']
  },
  localeDefault: {
    doc: 'The default locale.',
    env: 'LOCALE_DEFAULT',
    format: String,
    default: 'en-US'
  },
  localeDebug: {
    doc: 'The debug locale.',
    env: 'LOCALE_DEBUG',
    format: String,
    default: 'it-CH'
  },
  localePath: {
    doc: 'The path to the directory containing translations.',
    env: 'LOCALE_PATH',
    format: String,
    default: 'i18n'
  }
});

// Load configuration files specified in the environment
if (process.env.CONFIG_FILES) {
  conf.loadFile(process.env.CONFIG_FILES.split(','));
}

// Never allow the cookie secret to actually be 'CHANGE ME'
if (conf.get('secret') === 'CHANGE ME') {
  conf.set('secret', String(crypto.randomBytes(256)));
}

conf.validate();

module.exports = conf;
