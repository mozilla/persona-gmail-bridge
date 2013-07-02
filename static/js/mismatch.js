/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function() {
  "use strict";

  var tryAgain = document.getElementById('tryAgain');

  function onFrameLoad(src, callback) {
    var iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.src = src;

    var done = false;
    function complete() {
      if (done) {
        return;
      }
      done = true;
      callback();
    }

    iframe.onload = complete;
    setTimeout(complete, 5000);

    document.body.appendChild(iframe);
  }

  if (tryAgain) {

    tryAgain.onclick = function() {
      if (tryAgain.disabled) {
        return;
      }
      tryAgain.disabled = true;
      onFrameLoad('https://accounts.google.com/Logout', function() {
        var email = encodeURIComponent(tryAgain.getAttribute('data-claimed'));
        window.location = '/authenticate/forward?email=' + email;
      });
    };
  }

})();
