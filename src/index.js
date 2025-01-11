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
      console.log(element, column[randomIndex]);
      element.setAttribute('word', column[randomIndex]);
    }, index * 100);
  });
}

async function fetchSheetData(url) {
  try {
    setLoading(true);
    hideError();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch sheet data. Make sure the URL is public and correctly formatted.');
    }

    const csvData = await response.text();
    return processCSV(csvData);
  } catch (error) {
    showError(error.message);
    return false;
  } finally {
    setLoading(false);
  }
}

function processCSV(csv) {
  try {
    const results = Papa.parse(csv, { header: false });

    if (results.errors.length > 0) {
      throw new Error('Invalid CSV format');
    }

    const data = results.data;
    if (data.length < 2) {
      throw new Error('Please provide at least one header row and one data row');
    }

    const headers = data[0];
    wordColumns = [];
    const numColumns = headers.length;

    for (let col = 0; col < numColumns; col++) {
      wordColumns[col] = [];
      for (let row = 1; row < data.length; row++) {
        if (data[row][col]?.trim()) {
          wordColumns[col].push(data[row][col].trim());
        }
      }
    }

    if (wordColumns.some(col => col.length === 0)) {
      throw new Error('Each column must contain at least one word');
    }

    createWordSlots(numColumns, headers);
    hideError();
    generateBtn.disabled = false;
    return true;
  } catch (error) {
    showError(error.message);
    generateBtn.disabled = true;
    return false;
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
