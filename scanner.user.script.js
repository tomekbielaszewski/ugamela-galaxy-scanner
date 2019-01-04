// ==UserScript==
// @name         Ugamela Galaxy Scanner
// @namespace    Ugamela
// @version      0.1
// @description  Saves galaxy state while browsing
// @author       tomekbielaszewski
// @match        https://www.ugamela.pl/s1/galaxy.php*
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @resource     scanner-ui https://raw.githubusercontent.com/tomekbielaszewski/ugamela-galaxy-scanner/master/scanner.html
// @grant        GM_getResourceText
// ==/UserScript==

(function() {
  'use strict';

  loadUI();

  function loadUI() {
    $('#gameContent > center > table').append($(GM_getResourceText('scanner-ui')))
  }
})();