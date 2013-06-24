/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
    arg: 'issuer',
    format: String,
    default: undefined // Derives from publicUrl by default.
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
    format: function (raw) {
      var p = url.parse(raw);

      if (!/^https?:$/.test(p.protocol)) {
        throw new Error('must have http or https scheme');
      }

      if (!p.hostname) {
        throw new Error('must supply hostname or ip address');
      }

      if (p.path !== '/') { // url.parse normalizes path to '/' when omitted
        throw new Error('must not provide a path or query string');
      }

      if (p.hash) {
        throw new Error('must not provide an anchor');
      }
    },
    default: 'http://127.0.0.1:10002'
  },
  secret: {
    doc: 'The secret used for signing cookies',
    env: 'SECRET',
    format: String,
    default: String(crypto.randomBytes(256)) // Ephemeral. OVERRIDE THIS.
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
  logPath: {
    doc: "Path to log file.",
    env: "LOG_PATH",
    format: String,
    default: '-' // Log to stdout / stderr.
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
  certDefaultDuration: {
    doc: "Default duration in milliseconds if client doesn't provide duration.",
    env: "DEFAULT_CERT_DURATION",
    format: "int",
    default: 1000 * 60 * 5 // 5 minutes default
  },
  certMaxDuration: {
    doc: "Maximum duration in milliseconds of a signed certificate",
    env: "MAX_CERT_DURATION",
    format: "int",
    default: 1000 * 60 * 60 * 24 // 24 hours max
  },
  proxyHost: {
    doc: 'Host for HTTP proxy of outgoing requests.',
    env: 'HTTP_PROXY_HOST',
    format: String,
    default: ''
  },
  proxyPort: {
    doc: 'Port for HTTP proxy of outgoing requests.',
    env: 'HTTP_PROXY_PORT',
    format: Number,
    default: 0
  },
  statsdEnabled: {
    doc: 'Whether statsd should record its data.',
    env: 'STATSD',
    format: Boolean,
    default: false
  },
  statsdHost: {
    doc: 'Host of statsd daemon.',
    env: 'STATSD_HOST',
    format: String,
    default: 'localhost'
  },
  statsdPort: {
    doc: 'Port of statsd daemon.',
    env: 'STATSD_PORT',
    format: 'port',
    default: 8125
  }
});

// Load configuration files specified in the environment
if (process.env.CONFIG_FILES) {
  conf.loadFile(process.env.CONFIG_FILES.split(','));
}

// Derive default issuer from publicUrl
if (conf.get('issuer') === undefined) {
  conf.set('issuer', url.parse(conf.get('publicUrl')).hostname);
}

if (conf.get('proxyHost')) {
  process.env.HTTP_PROXY_HOST = conf.get('proxyHost');
  process.env.HTTPS_PROXY_HOST = conf.get('proxyHost');
}
if (conf.get('proxyPort')) {
  process.env.HTTP_PROXY_PORT = conf.get('proxyPort');
  process.env.HTTPS_PROXY_PORT = conf.get('proxyPort');
}

conf.validate();

module.exports = conf;
