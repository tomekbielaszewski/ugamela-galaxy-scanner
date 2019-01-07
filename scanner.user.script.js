// ==UserScript==
// @name         Ugamela Galaxy Scanner
// @namespace    Ugamela
// @version      0.1
// @description  Saves galaxy state while browsing
// @author       tomekbielaszewski
// @match        https://www.ugamela.pl/s1/galaxy.php*
// @resource     scanner-ui https://raw.githubusercontent.com/tomekbielaszewski/ugamela-galaxy-scanner/master/scanner.html
// @updateURL    https://raw.githubusercontent.com/tomekbielaszewski/ugamela-galaxy-scanner/master/scanner.user.script.js
// @installURL   https://raw.githubusercontent.com/tomekbielaszewski/ugamela-galaxy-scanner/master/scanner.user.script.js
// @downloadURL  https://raw.githubusercontent.com/tomekbielaszewski/ugamela-galaxy-scanner/master/scanner.user.script.js
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

  let scannerData = GM_getValue(SCANNER_DATA, {});

  loadUI();
  attachAjaxListener();
  attachControls();

  function loadUI() {
    $('#gameContent > center > table').append($(GM_getResourceText(SCANNER_UI)))
  }

  function isAutoScanSelected() {
    return $('#GS_auto').is(":checked");
  }

  function showNextSystem() {
    $('#galaxy_form > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr:nth-child(2) > th:nth-child(3) > input').click();
  }

  function attachAjaxListener() {
    $(document).ajaxComplete(function (event, xhr, settings) {
      if (settings.url.startsWith('ajax/galaxy.php') && xhr.status === 200) {
        let start = Date.now();
        let response = JSON.parse(xhr.responseText);

        let autoScanSelected = isAutoScanSelected();
        saveSystem(response.G, response.S, response.Data, autoScanSelected);
        console.log(Date.now() - start);

        if (autoScanSelected) {
          showNextSystem();
        }
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
    $('#GS_debris_med_filter').change(refreshResult);
    $('#GS_debris_high_filter').change(refreshResult);
    $('#GS_moon_filter').change(refreshResult);
    $('#GS_ranking').change(refreshResult);
    $('#GS_auto').change(showNextSystem);
    $('#GS_reset').click(reset);
  }

  function reset() {
    if (confirm('Jesteś pewien, że chcesz wyczyścić wszystkie dane?')) {
      scannerData = {};
      saveScannerData([]);
    }
  }

  function refreshResult() {
    let filteredScanner = Object.entries(scannerData)
      .map(entry => entry[1])
      .filter(scannerFilter);
    refreshUI(filteredScanner);
  }

  function scannerFilter(data) {
    let result = true;

    let playerSearch = $('#GS_player_search_input').val();
    if (playerSearch) {
      result = result && data.playerName.indexOf(playerSearch) !== -1;
    }

    let allianceSearch = $('#GS_alliance_search_input').val();
    if (allianceSearch) {
      result = result && data.alliance.indexOf(allianceSearch) !== -1;
    }

    let longinactive = $('#GS_longinactive_filter').is(":checked");
    let inactive = $('#GS_inactive_filter').is(":checked");
    let active = $('#GS_active_filter').is(":checked");
    if (longinactive || inactive || active) {
      result = result && (
        longinactive && (data.playerActivity === PLAYER_LONGINACTIVE) ||
        inactive && (data.playerActivity === PLAYER_INACTIVE) ||
        active && (data.playerActivity === PLAYER_ACTIVE)
      );
    }

    let debrisHigh = $('#GS_debris_high_filter').is(":checked");
    let debrisMed = $('#GS_debris_med_filter').is(":checked");
    let debrisLow = $('#GS_debris_low_filter').is(":checked");
    if (debrisHigh || debrisMed || debrisLow) {
      result = result && (data.debrisFieldType !== DEBRIS_NONE) && (
        debrisHigh && (data.debrisFieldType === DEBRIS_RED) ||
        debrisMed && (data.debrisFieldType === DEBRIS_ORANGE) ||
        debrisLow && (data.debrisFieldType === DEBRIS_GREEN)
      );
    }

    let hasMoon = $('#GS_moon_filter').is(":checked");
    if (hasMoon) {
      result = result && data.hasMoon;
    }

    let topRank = parseInt($('#GS_ranking').val());
    if (topRank < 1000) {
      result = result && (data.playerRank <= topRank && data.playerRank > topRank - 100);
    }

    if (!(playerSearch || allianceSearch || longinactive || inactive || active || debrisHigh || debrisMed || debrisLow || hasMoon || topRank < 1000)) {
      result = false;
    }

    return result
  }

  function refreshUI(filteredScanner) {
    $('#galRows_scanner').empty();
    filteredScanner.forEach(function (data) {
      let uiResultRow = $(data.rawHTML);
      uiResultRow.find('th:eq(0) > a').text(planetID(data.galaxy, data.system, data.planetNumber));
      uiResultRow.find('th:eq(0) > a')
        .attr("href", `https://www.ugamela.pl/s1/galaxy.php?mode=3&galaxy=${data.galaxy}&system=${data.system}`)
      $('#galRows_scanner').append(uiResultRow);
    })
  }

  function saveSystem(galaxy, system, planets, skipSavingInStorage) {
    let systemData = [];
    $(planets).each(function (planetNumber) {
      planetNumber += 1;
      let planetData = parsPlanet(galaxy, system, planetNumber, $(this));
      if (planetData) {
        systemData.push(planetData);
      }
    });

    if (!skipSavingInStorage) {
      saveScannerData(systemData);
    }
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
      rawHTML = `<tr>${rawHTML}</tr>`;

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
    return planetRow.find('th:eq(1) > a').length > 0;
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
    console.log('Saving scanner data');
    systemData.forEach(function (planet) {
      scannerData[planetID(planet.galaxy, planet.system, planet.planetNumber)] = planet;
    });
    setDataCounter(scannerData);
    GM_setValue(SCANNER_DATA, scannerData);
  }

  function setDataCounter(scannerData) {
    let count = Object.entries(scannerData).length;
    $('#GS_count_planets_in_DB').text(`Planets in DB: ${count}`);
  }

  function planetID(galaxy, system, planet) {
    return `${galaxy}:${system}:${planet}`
  }
})();