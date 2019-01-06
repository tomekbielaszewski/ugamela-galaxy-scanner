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

  function refreshResult() {
    console.log('dupa');
  }

  loadUI();
  attachAjaxListener();
  attachControls();

  function loadUI() {
    $('#gameContent > center > table').append($(GM_getResourceText(SCANNER_UI)))
  }

  function attachAjaxListener() {
    $(document).ajaxComplete(function (event, xhr, settings) {
      if (settings.url.startsWith('ajax/galaxy.php') && xhr.status === 200) {
        let start = Date.now();
        let response = JSON.parse(xhr.responseText);
        saveSystem(response.G, response.S, response.Data);
        console.log(Date.now() - start)
      }
    });
  }

  function attachControls() {
    $('#GS_player_search_input').change(refreshResult);
    $('#GS_alliance_search_input').change(refreshResult);
    $('#GS_longinactive_filter').change(refreshResult);
    $('#GS_inactive_filter').change(refreshResult);
    $('#GS_active_filter').change(refreshResult);
    $('#GS_debris_low_filter').change(refreshResult);
    $('#GS_debris_high_filter').change(refreshResult);
    $('#GS_moon_filter').change(refreshResult);
  }

  function saveSystem(galaxy, system, planets) {
    let systemData = [];
    $(planets).each(function (planetNumber) {
      planetNumber += 1;
      let planetData = parsPlanet(galaxy, system, planetNumber, $(this).wrap('<tr></tr>'));
      if (planetData) {
        systemData.push(planetData);
      }
    });

    saveScannerData(systemData);
  }

  function parsPlanet(galaxy, system, planetNumber, planetRow) {
    if (planetExist(planetRow)) {
      let playerName = getPlanetOwner(planetRow);
      let playerActivity = getPlayerActivity(planetRow);
      let hasMoon = getMoon(planetRow);
      let debrisFieldType = getDebrisType(planetRow);
      let playerRank = getPlayerRank(planetRow);
      let alliance = getAlliance(planetRow);
      let rawHTML = planetRow.html();

      return {
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
    }
  }

  function planetExist(planetRow) {
    return planetRow.find('th:eq(2) > a').length > 0;
    ;
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
    return planetRow.find('th:eq(3) > a').length > 0;
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

  function saveScannerData(systemData) {
    let scannerData = GM_getValue(SCANNER_DATA, {});
    systemData.forEach(function (planet) {
      scannerData[planetID(planet.galaxy, planet.system, planet.planetNumber)] = planet;
    });
    GM_setValue(SCANNER_DATA, scannerData);
  }

  function planetID(galaxy, system, planet) {
    return `${galaxy}:${system}:${planet}`
  }
})();