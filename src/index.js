/*
URL Parameters for API-like access:
- ?seed=123 : Use specific seed for consistent random combinations
- ?random=true : Generate new random combination
- ?hide-controls=true : Hide all UI controls
- ?hide-sheet-config=true : Hide the sheet upload controls
- ?sheet=URL : Use custom Google Sheets URL (must be published to web as CSV)
*/

import Papa from 'papaparse';
import './elements/tumbler-word.js';
import './elements/sheet-loader.js';

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5jAMbi-ggWEDgRH3xURkCuVi2QQ_HiNPHAsq80EMMvqR0imJuaZTMSW3CdiXJtsXzAM2HQ_Hiizao/pub?gid=0&single=true&output=csv';

function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const errorDiv = document.getElementById('error');
  const wordContainer = document.getElementById('wordContainer');
  const sheetLoader = document.querySelector('sheet-loader');

  // Add iframe generator elements
  const iframeHideControls = document.getElementById('iframe-hide-controls');
  const iframeHideSheetConfig = document.getElementById('iframe-hide-sheet-config');
  const iframeHideLabels = document.getElementById('iframe-hide-labels');
  const iframeUseCurrentSheet = document.getElementById('iframe-use-current-sheet');
  const iframeHideEmbedConfig = document.getElementById('iframe-hide-embed-config');
  const iframeRandom = document.getElementById('iframe-random');
  const iframeSeed = document.getElementById('iframe-seed');
  const iframeOutput = document.getElementById('iframe-output');
  const copyIframeBtn = document.getElementById('copy-iframe-btn');

  let loadedSheetUrl = null;
  let wordColumns = [];
  let headers = [];

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  function hideError() {
    errorDiv.classList.add('hidden');
  }

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      random: params.get('random') === 'true',
      seed: parseInt(params.get('seed')),
      sheetUrl: params.get('sheet') || DEFAULT_SHEET_URL,
      hideControls: params.get('hide-controls') === 'true',
      hideSheetConfig: params.get('hide-sheet-config') === 'true',
      hideLabels: params.get('hide-labels') === 'true',
      hideEmbedConfig: params.get('hide-embed-config') === 'true'
    };
  }

  function setControlsVisibility(hide, hideSheetConfig, hideEmbedConfig) {
    document.querySelectorAll('.controls-toggle').forEach(element => {
      if (element.classList.contains('embed-config') && hideEmbedConfig === false) {
         element.style.display = '';
      } else {
         element.style.display = hide ? 'none' : '';
      }
    });

    const sheetConfig = document.querySelector('.sheet-config');
    if (sheetConfig) {
      sheetConfig.style.display = (hide || hideSheetConfig) ? 'none' : '';
    }

    const embedConfig = document.querySelector('.embed-config');
    if (embedConfig) {
      embedConfig.style.display = (hide || hideEmbedConfig) ? 'none' : '';
    }
  }

  function createWordSlots(count) {
    wordContainer.innerHTML = '';
    
    if (count === 0 || !headers || headers.length === 0 || !getUrlParams().seed) {
      wordContainer.classList.add('hidden');
      return;
    }
    
    wordContainer.classList.remove('hidden');
    const params = getUrlParams();
    
    for (let i = 0; i < count; i++) {
      const slot = document.createElement('tumbler-word');
      if (headers[i]?.trim() && !params.hideLabels) {
        slot.setAttribute('label', headers[i]);
      }
      slot.dataset.index = i;
      wordContainer.appendChild(slot);
    }
  }

  async function generateCombination(forceNewSeed = false) {
    if (wordColumns.length === 0) return;
  
    const params = getUrlParams();
    const newSeed = forceNewSeed ? Math.floor(Math.random() * 1000000) : (params.seed || Math.floor(Math.random() * 1000000));
    const random = mulberry32(newSeed);
  
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('seed', newSeed);
    if (params.sheetUrl !== DEFAULT_SHEET_URL) {
      newUrl.searchParams.set('sheet', params.sheetUrl);
    }

    window.history.pushState({
      sheetUrl: params.sheetUrl,
      wordColumns: wordColumns,
      headers: headers,
      seed: newSeed
    }, '', newUrl);
  
    if (!wordContainer.children.length) {
      createWordSlots(wordColumns.length);
    }
  
    wordContainer.classList.remove('hidden');
  
    const wordElements = document.querySelectorAll('tumbler-word');
    wordElements.forEach((element, index) => {
      setTimeout(() => {
        const column = wordColumns[index];
        const randomIndex = Math.floor(random() * column.length);
        element.setAttribute('word', column[randomIndex]);
      }, index * 100);
    });
  }

  async function fetchSheetData(url) {
    if (url === loadedSheetUrl) {
      generateBtn.disabled = false;
      return true;
    }
  
    try {
      sheetLoader?.setLoading(true);
      generateBtn.disabled = true;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csv = await response.text();
      const result = processCSV(csv);
      if (result.success) {
        hideError();
        headers = result.headers;
        createWordSlots(wordColumns.length);
        loadedSheetUrl = url;
        generateBtn.disabled = false;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Fetch error:', error);
      showError(error.message);
      return false;
    } finally {
      sheetLoader?.setLoading(false);
    }
  }

  function processCSV(csv) {
    try {
      const cleanCsv = csv.replace(/^\ufeff/, '').replace(/\r\n|\r/g, '\n');
  
      const results = Papa.parse(cleanCsv, {
        header: false,
        skipEmptyLines: 'greedy',
        delimiter: ',',
        quoteChar: '"',
        encoding: 'UTF-8'
      });
  
      const data = results.data;
      if (!data || data.length === 0) {
        throw new Error('No data found in CSV');
      }
  
      const firstRow = data[0];
      const isHeaderless = firstRow.length === 1 && firstRow[0]?.trim();
      
      headers = isHeaderless ? Array(firstRow.length).fill('') : firstRow;
      const startRow = isHeaderless ? 0 : 1;
  
      const numColumns = headers.length;
      wordColumns = [];
      for (let i = 0; i < numColumns; i++) {
        wordColumns[i] = [];
      }
  
      for (let row = startRow; row < data.length; row++) {
        const rowData = data[row];
        for (let col = 0; col < numColumns; col++) {
          if (rowData[col] && rowData[col].trim()) {
            wordColumns[col].push(rowData[col].trim());
          }
        }
      }
  
      return { success: true, headers: headers };
  
    } catch (error) {
      console.error('Process error:', error);
      showError(error.message);
      return { success: false, headers: null };
    }
  }

  // Function to generate the iframe URL
  function generateIframeUrl() {
    const baseUrl = window.location.origin + window.location.pathname;
    const currentParams = getUrlParams();
    const iframeParams = new URLSearchParams();

    // Handle seed and random parameters
    if (iframeRandom.checked) {
      iframeParams.set('random', 'true');
    } else if (iframeSeed.value) {
      iframeParams.set('seed', iframeSeed.value);
    } else if (currentParams.seed) {
      iframeParams.set('seed', currentParams.seed);
    }

    // Add params based on checkboxes
    if (iframeHideControls.checked) {
      iframeParams.set('hide-controls', 'true');
    }
    if (iframeHideSheetConfig.checked) {
      iframeParams.set('hide-sheet-config', 'true');
    }
    if (iframeHideLabels.checked) {
      iframeParams.set('hide-labels', 'true');
    }
    if (iframeHideEmbedConfig.checked) {
      iframeParams.set('hide-embed-config', 'true');
    }
    
    // Handle sheet URL based on checkbox
    if (iframeUseCurrentSheet.checked) {
      if (currentParams.sheetUrl && currentParams.sheetUrl !== DEFAULT_SHEET_URL) {
        iframeParams.set('sheet', currentParams.sheetUrl);
      }
    } else {
      iframeParams.set('sheet', DEFAULT_SHEET_URL);
    }

    const queryString = iframeParams.toString();
    return `${baseUrl}${queryString ? '?' + queryString : ''}`;
  }

  // Function to update the iframe output
  function updateIframeOutput() {
    const iframeUrl = generateIframeUrl();
    const embedCode = `<iframe src="${iframeUrl}" width="100%" height="400" frameborder="0"></iframe>`;
    if (iframeOutput) {
      iframeOutput.value = embedCode;
    }
  }

  generateBtn.addEventListener('click', () => {
    generateCombination(true);
    updateIframeOutput();
  });

  document.addEventListener('sheet-load', async (event) => {
    const url = event.detail.url;
    if (await fetchSheetData(url)) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('sheet', url);
      window.history.pushState({
        sheetUrl: url,
        wordColumns: wordColumns,
        headers: headers,
        seed: null
      }, '', newUrl);
      generateCombination();
      updateIframeOutput();
    }
  });

  window.addEventListener('popstate', (event) => {
    if (event.state) {
      const { sheetUrl, wordColumns: storedColumns, headers: storedHeaders, seed } = event.state;
      sheetLoader?.setValue(sheetUrl);
      wordColumns = storedColumns;
      headers = storedHeaders;
      createWordSlots(wordColumns.length);
      
      if (seed) {
        const random = mulberry32(seed);
        const wordElements = document.querySelectorAll('tumbler-word');
        wordElements.forEach((element, index) => {
          const column = wordColumns[index];
          const randomIndex = Math.floor(random() * column.length);
          element.setAttribute('word', column[randomIndex]);
        });
      }
      updateIframeOutput();
    }
  });

  // Event listeners for iframe parameters
  document.querySelectorAll('.iframe-param').forEach(input => {
    if (input.type === 'checkbox') {
      input.addEventListener('change', () => {
        if (input.id === 'iframe-random' && input.checked) {
          iframeSeed.value = '';
        }
        updateIframeOutput();
      });
    } else if (input.type === 'number') {
      input.addEventListener('input', () => {
        if (input.value) {
          iframeRandom.checked = false;
        }
        updateIframeOutput();
      });
    }
  });

  // Copy button functionality
  copyIframeBtn.addEventListener('click', () => {
    iframeOutput.select();
    document.execCommand('copy');
    copyIframeBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyIframeBtn.textContent = 'Copy Code';
    }, 1500);
  });

  async function init() {
    const params = getUrlParams();
    sheetLoader?.setValue(params.sheetUrl);
    setControlsVisibility(params.hideControls, params.hideSheetConfig, params.hideEmbedConfig);
    if (await fetchSheetData(params.sheetUrl)) {
      window.history.replaceState({
        sheetUrl: params.sheetUrl,
        wordColumns: wordColumns,
        headers: headers,
        seed: params.seed
      }, '', window.location.href);
      
      if (params.random || params.seed) {
        generateCombination(false);
      }
    }
    updateIframeOutput();
  }

  init();
});