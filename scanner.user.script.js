// ==UserScript==
// @name         Ugamela Galaxy Scanner
// @namespace    Ugamela
// @version      0.1
// @description  Saves galaxy state while browsing
// @author       tomekbielaszewski
// @match        https://www.ugamela.pl/s1/galaxy.php*
// @resource     scanner-ui https://raw.githubusercontent.com/tomekbielaszewski/ugamela-galaxy-scanner/master/scanner.html
// @grant        GM_getResourceText
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
  'use strict';
  const SCANNER_UI = 'scanner-ui';
  const SCANNER_DATA = 'scannerData';

  function planetID(galaxy, system, planet) {
    return `${galaxy}:${system}:${planet}`
  }


  (function () {
    loadUI();
    attachAjaxListener();

    function loadUI() {
      $('#gameContent > center > table').append($(GM_getResourceText(SCANNER_UI)))
    }

    function attachAjaxListener() {
      $(document).ajaxComplete(function (event, xhr, settings) {
        if (settings.url.startsWith('ajax/galaxy.php') && xhr.status === 200) {
          let response = JSON.parse(xhr.responseText);
          saveSystem(response.G, response.S, response.Data);
        }
      });
    }

    function saveSystem(galaxy, system, planets) {
      $(planets).each(function () {
        savePlanet(galaxy, system, $(this));
      });
    }

    function savePlanet(galaxy, system, planetRow) {
      let planetNumber = getPlanetNumber(planetRow);
      let playerName = getPlanetOwner(planetRow);
      let playerActivity = getPlayerActivity(planetRow);
      let hasMoon = getMoon(planetRow);
      let debrisFieldType = getDebrisFieldType(planetRow);
      let playerRank = getPlayerRank(planetRow);
      let alliance = getAlliance(planetRow);
      let rawHTML = planetRow.html();

      let scannerData = GM_getValue(SCANNER_DATA, {});
      scannerData[planetID(galaxy, system, planetNumber)] = {
        galaxy,
        system,
        planetNumber,
        playerName,
        hasMoon,
        debrisFieldType,
        playerRank,
        alliance,
        playerActivity,
        rawHTML
      };
      GM_setValue(SCANNER_DATA, scannerData);
    }

    function getPlanetNumber(planetRow) {
      return undefined;
    }

    function getPlanetOwner(planetRow) {
      return undefined;
    }

    function getPlayerActivity(planetRow) {
      return undefined;
    }

    function getMoon(planetRow) {
      return undefined;
    }

    function getDebrisFieldType(planetRow) {
      return undefined;
    }

    function getPlayerRank(planetRow) {
      return undefined;
    }

    function getAlliance(planetRow) {
      return undefined;
    }
  })();
})();