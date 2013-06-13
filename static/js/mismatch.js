/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function() {
  "use strict";

  var tryAgain = document.getElementById('tryAgain');

  if (tryAgain) {
    tryAgain.onclick = function() {
      var iframe = document.createElement('iframe');
      iframe.style.visibility = 'hidden';
      iframe.style.width = '1px';
      iframe.style.height = '1px';

      iframe.src = 'https://accounts.google.com/Logout';
      iframe.onload = function() {
        navigator.id.raiseAuthenticationFailure();
      };

      document.body.appendChild(iframe);
    };
  }

})();
