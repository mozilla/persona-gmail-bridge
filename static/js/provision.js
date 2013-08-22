/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function() {
  "use strict";

  function xhr(type, url, contentType, callback, data, csrf) {
    var req;

    function stateChange() {
      try {
        if (req.readyState === 4) {
          callback(req.responseText, req.status);
        }
      }catch(e) {}
    }

    function getRequest() {
      // From // http://blogs.msdn.com/b/ie/archive/2011/08/31/browsing-without-plug-ins.aspx
      // Best Practice: Use Native XHR, if available
      if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
      } else if (window.ActiveXObject) {
        return new window.ActiveXObject('Microsoft.XMLHTTP');
      }
      return false;
    }

    req = getRequest();
    if(req) {
      req.onreadystatechange = stateChange;

      req.open(type, url, true);
      req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      if (csrf) {
        req.setRequestHeader('X-CSRF-Token', csrf);
      }

      if (data) {
        req.setRequestHeader('Content-type', contentType);
      }

      req.setRequestHeader('Accept', 'application/json;text/plain');

      req.send(data || null);
    }
  }

  function request(options) {
    xhr(options.method, options.url, "application/json",
        function(responseText, status) {
        if (status >= 200 && status < 300) {
          var respData = responseText;
          try {
            respData = JSON.parse(respData);
          } catch (ohWell) {}

          options.success(respData);
        } else {
          options.error({ status: status, responseText: responseText });
        }
      }, JSON.stringify(options.data), options.csrf);
  }

  function GET(options) {
    options.method = 'GET';
    request(options);
  }

  function POST(options) {
    options.method = 'POST';
    request(options);
  }

  function withProvenEmail(email, callback) {
    GET({
      url: "/session",
      success: function(r) {
        if (r.proven === email) {
          callback(r.csrf);
        } else {
          navigator.id.raiseProvisioningFailure();
        }
      },
      error: function() {
        navigator.id.raiseProvisioningFailure();
      }
    });
  }


  navigator.id.beginProvisioning(function (email, duration) {
    withProvenEmail(email, function(csrf) {
      navigator.id.genKeyPair(function(pubkey) {
        POST({
          url: '/provision/certify',
          data: {
            pubkey: pubkey,
            duration: duration,
            email: email
          },
          csrf: csrf,
          success: function(r) {
            // all done!  woo!
            navigator.id.registerCertificate(r.cert);
          },
          error: function() {
            navigator.id.raiseProvisioningFailure();
          }
        });
      });
    });
  });

})();

