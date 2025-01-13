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
      hideSheetConfig: params.get('hide-sheet-config') === 'true'
    };
  }

  function setControlsVisibility(hide, hideSheetConfig) {
    // Hide all controls if hideControls is true
    document.querySelectorAll('.controls-toggle').forEach(element => {
      element.style.display = hide ? 'none' : '';
    });
    
    // Separately handle sheet config visibility
    const sheetConfig = document.querySelector('.sheet-config');
    if (sheetConfig) {
      sheetConfig.style.display = (hide || hideSheetConfig) ? 'none' : '';
    }
  }

  function createWordSlots(count) {
    wordContainer.innerHTML = '';
    
    if (count === 0 || !headers || headers.length === 0 || !getUrlParams().seed) {
      wordContainer.classList.add('hidden');
      return;
    }
    
    wordContainer.classList.remove('hidden');
    
    for (let i = 0; i < count; i++) {
      const slot = document.createElement('tumbler-word');
      if (headers[i]?.trim()) {
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
      generateBtn.disabled = false; // Enable button if data already loaded
      return true;
    }
  
    try {
      sheetLoader?.setLoading(true);
      generateBtn.disabled = true; // Disable during load
      
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
        generateBtn.disabled = false; // Enable after successful load
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

      headers = data[0];
      const numColumns = headers.length;

      wordColumns = [];
      for (let i = 0; i < numColumns; i++) {
        wordColumns[i] = [];
      }

      for (let row = 1; row < data.length; row++) {
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

  generateBtn.addEventListener('click', () => generateCombination(true));

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
    }
  });

  async function init() {
    const params = getUrlParams();
    sheetLoader?.setValue(params.sheetUrl);
    setControlsVisibility(params.hideControls, params.hideSheetConfig);
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
  }

  init();
});