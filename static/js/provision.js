(function() {
  "use strict";

  function request(type, url, contentType, callback, data) {
    var req;

    function stateChange() {
      try {
        if (req.readyState === 4)
          callback(req.responseText, req.status);
      }catch(e) {}
    }

    function getRequest() {
      if (window.ActiveXObject)
        return new window.ActiveXObject('Microsoft.XMLHTTP');
      else if (window.XMLHttpRequest)
        return new XMLHttpRequest();
      return false;
    }

    req = getRequest();
    if(req) {
      req.onreadystatechange = stateChange;

      req.open(type, url, true);
      req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      if (data) {
        req.setRequestHeader('Content-type', contentType);
      }

      req.setRequestHeader('Accept', 'application/json;text/plain');
      req.setRequestHeader('Connection', 'close');

      req.send(data || null);
    }
  }

  function POST(options) {
    request("POST", options.url, "application/json", function(responseText, status) {
      if (status >= 200 && status < 300) {
        var respData = responseText;
        try {
          respData = JSON.parse(respData);
        } catch (ohWell) {}

        options.success(respData);
      } else {
        options.error({ status: status, responseText: responseText });
      }
    }, JSON.stringify(options.data));
  }



  navigator.id.beginProvisioning(function (email, duration) {
    navigator.id.genKeyPair(function(pubkey) {
      POST({
        url: '/cert',
        data: {
          pubkey: pubkey,
          duration: duration,
          email: email
        },
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

})();
