/*
URL Parameters for API-like access:
- ?seed=123 : Use specific seed for consistent random combinations (e.g. ?seed=42)
- ?random=true : Generate new random combination
- ?hide-controls=true : Hide all UI controls (clean view mode)
- ?sheet=URL : Use custom Google Sheets URL (must be published to web as CSV)

Examples:
/index.html?seed=42 
/index.html?random=true
/index.html?hide-controls=true
/index.html?seed=42&sheet=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2Fe%2F2PACX-1vS5jAMbi-ggWEDgRH3xURkCuVi2QQ_HiNPHAsq80EMMvqR0imJuaZTMSW3CdiXJtsXzAM2HQ_Hiizao%2Fpub%3Fgid%3D0%26single%3Dtrue%26output%3Dcsv
*/
import Papa from 'papaparse';
import './elements/tumbler-word.js';

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
  const sheetsUrl = document.getElementById('sheetsUrl');
  const generateBtn = document.getElementById('generateBtn');
  const fetchBtn = document.getElementById('fetchBtn');
  const errorDiv = document.getElementById('error');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const wordContainer = document.getElementById('wordContainer');

  let loadedSheetUrl = null;
  let wordColumns = [];
  let currentWords = [];

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  function hideError() {
    errorDiv.classList.add('hidden');
  }

  function setLoading(isLoading) {
    loadingIndicator.classList.toggle('hidden', !isLoading);
    fetchBtn.disabled = isLoading;
    generateBtn.disabled = isLoading;
  }

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      random: params.get('random') === 'true',
      seed: parseInt(params.get('seed')),
      sheetUrl: params.get('sheet') || DEFAULT_SHEET_URL,
      hideControls: params.get('hide-controls') === 'true'
    };
  }

  function setControlsVisibility(hide) {
    document.querySelectorAll('.controls-toggle').forEach(element => {
      element.style.display = hide ? 'none' : '';
    });
  }

  function generateShareableUrl() {
    const url = new URL(window.location.href);
    const params = getUrlParams();
    if (params.seed) {
      url.searchParams.set('seed', params.seed);
    } else {
      url.searchParams.set('random', 'true');
    }
    if (params.sheetUrl !== DEFAULT_SHEET_URL) {
      url.searchParams.set('sheet', params.sheetUrl);
    }
    return url.toString();
  }

  function createWordSlots(count, headers) {
    wordContainer.innerHTML = '';
    
    if (count === 0 || !headers || headers.length === 0 || !getUrlParams().seed) {
      wordContainer.classList.add('hidden');
      return;
    }
    
    wordContainer.classList.remove('hidden');
    
    for (let i = 0; i < count; i++) {
      const slot = document.createElement('tumbler-word');
      slot.setAttribute('label', headers[i] || `Column ${i + 1}`);
      slot.dataset.index = i;
      wordContainer.appendChild(slot);
    }
    currentWords = Array(count).fill('');
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
    window.history.pushState({}, '', newUrl);
  
    if (!wordContainer.children.length) {
      createWordSlots(wordColumns.length, wordColumns.map((_, i) => `Column ${i + 1}`));
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
      return true;
    }

    try {
      setLoading(true);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csv = await response.text();
      const result = processCSV(csv);
      if (result.success) {
        hideError();
        createWordSlots(wordColumns.length, result.headers);
        loadedSheetUrl = url;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Fetch error:', error);
      showError(error.message);
      return false;
    } finally {
      setLoading(false);
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

      const headers = data[0];
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

  fetchBtn.addEventListener('click', async () => {
    const url = sheetsUrl.value.trim() || DEFAULT_SHEET_URL;
    if (await fetchSheetData(url)) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('sheet', url);
      window.history.pushState({}, '', newUrl);
      generateCombination();
    }
  });

  window.addEventListener('popstate', async () => {
    const params = getUrlParams();
    sheetsUrl.value = params.sheetUrl;
    if (await fetchSheetData(params.sheetUrl)) {
      if (params.seed) {
        generateCombination(false);
      }
    }
  });

  async function init() {
    const params = getUrlParams();
    sheetsUrl.value = params.sheetUrl;
    setControlsVisibility(params.hideControls);
    if (await fetchSheetData(params.sheetUrl)) {
      if (params.random || params.seed) {
        generateCombination(false);
      }
    }
  }

  init();
});