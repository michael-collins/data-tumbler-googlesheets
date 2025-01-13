// @ts-check
export class TumblerWord extends HTMLElement {
  static tag = 'tumbler-word';
  static observedAttributes = ["label", "word"];

  connectedCallback() {
    this.render();
  }

  /**
   * Called when an observed attribute has changed.
   */
  async attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'word') {
      await this.preRender(name, oldValue, newValue);
    }
    
    this.render();
    
    if (name === 'word') {
      await this.postRender(name, oldValue, newValue);
    }
  }

  render() {
    const label = this.getAttribute('label');
    const labelClass = !label?.trim() ? 'hidden' : '';

    this.innerHTML = `
      <div class="relative overflow-visible flex items-center justify-center min-h-[80px] bg-white p-6 shadow-sm border-l-4 border-black">
        <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap shadow-sm z-10 max-w-[90%] overflow-hidden text-ellipsis word-label ${labelClass}">
          ${label ?? ''}
        </div>
        <div class="word text-center text-lg font-medium break-words hyphens-auto">
          ${this.getAttribute('word') ?? ''}
        </div>
      </div>
    `;
  }

  async preRender(name, oldValue, newValue) {
    if (name !== 'word') { return };
    this.classList.remove('tumble');
  }

  async postRender(name, oldValue, newValue) {
    if (name !== 'word') { return };
    this.classList.add('tumble');
  }
}

customElements.define(TumblerWord.tag, TumblerWord);