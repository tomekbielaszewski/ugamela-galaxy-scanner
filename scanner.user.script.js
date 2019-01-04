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

  const PLAYER_ACTIVE = 'active';
  const PLAYER_INACTIVE = 'inactive';
  const PLAYER_LONGINACTIVE = 'longinactive';

  const DEBRIS_NONE = 'none';
  const DEBRIS_GREEN = 'green';
  const DEBRIS_ORANGE = 'orange';
  const DEBRIS_RED = 'red';

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
      $(planets).each(function (planetNumber) {
        savePlanet(galaxy, system, planetNumber, $(this).wrap('<tr></tr>'));
      });
    }

    function savePlanet(galaxy, system, planetNumber, planetRow) {
      let playerName = getPlanetOwner(planetRow);
      let playerActivity = getPlayerActivity(planetRow);
      let hasMoon = getMoon(planetRow);
      let debrisFieldType = getDebrisType(planetRow);
      let playerRank = getPlayerRank(planetRow);
      let alliance = getAlliance(planetRow);
      let rawHTML = planetRow.html();

      let scannerData = GM_getValue(SCANNER_DATA, {});
      let planetData = {
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
      console.log(planetData);
      scannerData[planetID(galaxy, system, planetNumber)] = planetData;
      GM_setValue(SCANNER_DATA, scannerData);
    }

    function getPlanetOwner(planetRow) {
      return planetRow.find('th:eq(5) > a > b').text().trim();
    }

    function getPlayerActivity(planetRow) {
      let status = PLAYER_ACTIVE;
      let playerDiv = planetRow.find('th:eq(5) > a > b');
      if (playerDiv.hasClass('inactive')) {
        status = PLAYER_INACTIVE;
      } else if (playerDiv.hasClass('longinactive')) {
        status = PLAYER_LONGINACTIVE;
      }
      return status;
    }

    function getMoon(planetRow) {
      return planetRow.find('th:eq(3) > a').length >= 0;
    }

    function getDebrisType(planetRow) {
      let debrisType = DEBRIS_NONE;
      let debrisDiv = planetRow.find('th:eq(4)');

      if (debrisDiv.hasClass('bgSmall')) {
        debrisType = DEBRIS_GREEN;
      } else if (debrisDiv.hasClass('bgMed')) {
        debrisType = DEBRIS_ORANGE;
      } else if (debrisDiv.hasClass('bgBig')) {
        debrisType = DEBRIS_RED;
      }

      return debrisType;
    }

    function getPlayerRank(planetRow) {
      return planetRow.find('th:eq(6)').text().trim();
    }

    function getAlliance(planetRow) {
      return planetRow.find('th:eq(7)').text().trim();
    }
  })();
})();