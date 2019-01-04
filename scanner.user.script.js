// ==UserScript==
// @name         Ugamela Galaxy Scanner
// @namespace    Ugamela
// @version      0.1
// @description  Saves galaxy state while browsing
// @author       tomekbielaszewski
// @match        https://www.ugamela.pl/s1/galaxy.php*
// @resource     scanner-ui https://raw.githubusercontent.com/tomekbielaszewski/ugamela-galaxy-scanner/master/scanner.html
// @grant        GM_getResourceText
// ==/UserScript==

(function () {
  'use strict';
  const SCANNER_UI = 'scanner-ui';


  (function () {
    loadUI();
    attachAjaxListener();

    function loadUI() {
      $('#gameContent > center > table').append($(GM_getResourceText(SCANNER_UI)))
    }

    function attachAjaxListener() {
      $(document).ajaxComplete(function (event, xhr, settings) {
        if (settings.url.startsWith('ajax/galaxy.php') && xhr.status === 200) {
          $(JSON.parse(xhr.responseText).Data).each(function() {
            console.log($(this).html())
          });
        }
      });
    }
  })();
})();