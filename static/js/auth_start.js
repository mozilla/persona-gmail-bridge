/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var GOOGLE_AUTH_HEIGHT = 492;
var GOOGLE_AUTH_WIDTH = 886;

function resizeWindow() {
  var viewportWidth = document.documentElement.clientWidth;
  var resizeByX = GOOGLE_AUTH_WIDTH - viewportWidth;
  // diff values stored in sessionStorage so the viewport can be resized back
  // to its original size when the user returns from the IdP
  sessionStorage.resizeByX = -resizeByX;

  var viewportHeight = document.documentElement.clientHeight;
  var resizeByY = GOOGLE_AUTH_HEIGHT - viewportHeight;
  sessionStorage.resizeByY = -resizeByY;

  window.resizeBy(resizeByX, resizeByY);
}

navigator.id.beginAuthentication(function (email) {
  resizeWindow();
  var escapedEmail = encodeURIComponent(email);
  window.location = '/authenticate/forward?email=' + escapedEmail;
});

