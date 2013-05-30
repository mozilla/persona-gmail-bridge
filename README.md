Sideshow
========

Sideshow is an experiment in building a minimal identity bridge for Gmail.

Getting Started
---------------

Running Sideshow is simple:

1. `git clone https://github.com/callahad/sideshow.git`
2. `cd sideshow`
3. `npm install`
4. `npm start`

For local development, set the `SHIMMED_PRIMARIES` environment variable for gmail.com and googlemail.com before you start up browserid:

1. `cd /path/to/browserid`
2. `export SHIMMED_PRIMARIES='gmail.com|http://127.0.0.1:3000|/path/to/sideshow/var/well-known.json,googlemail.com|http://127.0.0.1:3000|/path/to/sideshow/var/well-known.json'`
3. `npm start`

You're done!

Visit http://127.0.0.1:10001/ and try signing in with your Gmail account!

Configuration
-------------

### General Configuration

For information on what parameters can be configured in Sideshow, please review [lib/config.js][].

You can set values via individual environment variables, or you can set `CONFIG_FILES` to point to JSON files containing settings.
To pass multiple files, concatenate their paths with commas.

Example:

    CONFIG_FILES='/app/foo.json,/app/bar.json' npm start


[lib/config.js]: https://github.com/callahad/sideshow/blob/master/lib/config.js

### HTTP Proxies

As part of the OpenID protocol, Sideshow needs to make outbound connections to Google.
To route these requests through a proxy, set the following environment variables:

- `HTTP_PROXY_HOST` and `HTTP_PROXY_PORT` control how `http://` requests are sent
- `HTTPS_PROXY_HOST` and `HTTPS_PROXY_PORT` control how `https://` requests are sent


