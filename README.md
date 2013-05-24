Sideshow
========

Sideshow is an experiment in building a minimal identity bridge for Gmail.

Getting Started
---------------

Running sideshow is simple:

1. `git clone https://github.com/callahad/sideshow.git`
2. `cd sideshow`
3. `npm install`
4. `npm start`

For local development, set the `SHIMMED_PRIMARIES` environment variable for gmail.com and googlemail.com before you start up browserid:

1. `cd /path/to/browserid`
2. `export SHIMMED_PRIMARIES='gmail.com|http://127.0.0.1:3000|/path/to/sideshow/fake-well-known.json,googlemail.com|http://127.0.0.1:3000|/path/to/sideshow/fake-well-known.json'`
3. `npm start`

You're done!

Visit http://127.0.0.1:10001/ and try signing in with your Gmail account!
