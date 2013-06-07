const crypto = require('crypto');
const url = require('url');

const convict = require('convict');

const conf = convict({
  publicUrl: {
    doc: 'The full, public-facing bridge URL. Include scheme, host, and port.',
    env: 'PUBLIC_URL',
    format: 'url',
    default: 'http://127.0.0.1:3000'
  },
  issuer: {
    doc: 'The hostname used in the signed certificate.',
    env: 'ISSUER_HOSTNAME',
    format: String,
    default: 'localhost' // in production, url.parse(publicUrl).hostname
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
  sessionDuration: {
    doc: 'The duration of session cookies, in milliseconds.',
    env: 'SESSION_DURATION',
    format: 'nat',
    default: 15 * 60 * 1000
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
  },
  pubKeyPath: {
    doc: "Path to the public key to render the .well-known",
    env: "PUB_KEY_PATH",
    format: String,
    default: "var/key.publickey"
  },
  privKeyPath: {
    doc: "Path to the private key to sign certs.",
    env: "PRIV_KEY_PATH",
    format: String,
    default: "var/key.secretkey"
  },
  certMaxDuration: {
    doc: "Maximum duration in milliseconds of a signed certificate",
    env: "MAX_CERT_DURATION",
    format: "int",
    default: 1000 * 60 * 60 * 24 // 24 hours max
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

// if issuer is localhost, use gmail.com and log to console
if (conf.get('issuer') === 'localhost') {
  conf.set('issuer', url.parse(conf.get('publicUrl')).hostname);
}
console.log('Issuer: ', conf.get('issuer'));

conf.validate();

module.exports = conf;
