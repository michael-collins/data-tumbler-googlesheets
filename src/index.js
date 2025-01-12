import Papa from 'papaparse';
import './elements/tumbler-word.js';

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5jAMbi-ggWEDgRH3xURkCuVi2QQ_HiNPHAsq80EMMvqR0imJuaZTMSW3CdiXJtsXzAM2HQ_Hiizao/pub?gid=0&single=true&output=csv';

const sheetsUrl = document.getElementById('sheetsUrl');
const generateBtn = document.getElementById('generateBtn');
const fetchBtn = document.getElementById('fetchBtn');
const errorDiv = document.getElementById('error');
const loadingIndicator = document.getElementById('loadingIndicator');
const wordContainer = document.getElementById('wordContainer');

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

function createWordSlots(count, headers) {
  wordContainer.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const slot = document.createElement('tumbler-word');
    slot.setAttribute('label', headers[i] || `Column ${i + 1}`);
    slot.dataset.index = i;
    wordContainer.appendChild(slot);
  }
  currentWords = Array(count).fill('');
}

async function generateCombination() {
  if (wordColumns.length === 0) return;

  const wordElements = document.querySelectorAll('tumbler-word');
  const delays = wordElements.length;

  wordElements.forEach((element, index) => {
    setTimeout(() => {
      const column = wordColumns[index];
      const randomIndex = Math.floor(Math.random() * column.length);
      element.setAttribute('word', column[randomIndex]);
    }, index * 100);
  });
}

async function fetchSheetData(url) {
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
    }
    return result.success;
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
    // Pre-process CSV and force comma delimiter for Google Sheets
    const cleanCsv = csv.replace(/^\ufeff/, '').replace(/\r\n|\r/g, '\n');

    const results = Papa.parse(cleanCsv, {
      header: false,
      skipEmptyLines: 'greedy',
      delimiter: ',', // Force comma delimiter
      quoteChar: '"',
      encoding: 'UTF-8'
    });


    const data = results.data;
    if (!data || data.length === 0) {
      throw new Error('No data found in CSV');
    }

    const headers = data[0];
    const numColumns = headers.length;


    
    // Reset and initialize columns array
    wordColumns = [];
    for (let i = 0; i < numColumns; i++) {
      wordColumns[i] = [];
    }

    // Process data rows column by column
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

generateBtn.addEventListener('click', generateCombination);

fetchBtn.addEventListener('click', async () => {
  const url = sheetsUrl.value.trim() || DEFAULT_SHEET_URL;
  if (await fetchSheetData(url)) {
    generateCombination();
  }
});

// Initialize with default dataset
async function init() {
  sheetsUrl.value = DEFAULT_SHEET_URL;
  if (await fetchSheetData(DEFAULT_SHEET_URL)) {
    generateCombination();
  }
}

// Start the app
init();
