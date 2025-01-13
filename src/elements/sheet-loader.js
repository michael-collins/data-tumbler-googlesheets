// elements/sheet-loader.js
// @ts-check
export class SheetLoader extends HTMLElement {
    static tag = 'sheet-loader';
    
    connectedCallback() {
      this.render();
      this.attachEventListeners();
    }
  
    attachEventListeners() {
      const input = this.querySelector('#sheetsUrl');
      const button = this.querySelector('#fetchBtn');
      
      button?.addEventListener('click', () => {
        const url = input?.value.trim();
        if (url) {
          this.dispatchEvent(new CustomEvent('sheet-load', {
            bubbles: true,
            composed: true,
            detail: { url }
          }));
        }
      });
    }
  
    render() {
      this.innerHTML = `
        <div class="mt-8 p-6 sheet-config">
          <input 
            type="url" 
            id="sheetsUrl" 
            class="w-full p-2 bg-white border border-gray-400 rounded-md text-base mb-4"
            placeholder="Enter Google Sheets CSV URL">
          <button 
            id="fetchBtn"
            class="bg-gray-500 text-white px-5 py-2 rounded-md text-sm flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Load Sheet
          </button>
        </div>
      `;
    }
  
    setLoading(isLoading) {
      const button = this.querySelector('#fetchBtn');
      if (button) {
        button.disabled = isLoading;
      }
    }
  
    setValue(url) {
      const input = this.querySelector('#sheetsUrl');
      if (input) {
        input.value = url;
      }
    }
  }
  
  customElements.define(SheetLoader.tag, SheetLoader);