// @ts-check
export class TumblerWord extends HTMLElement {
  static tag = 'tumbler-word';
  static observedAttributes = ["label", "word"];

  /**
   * Called when an observed attribute has changed.
   * @param {string} name 
   * @param {string | undefined} oldValue 
   * @param {string | undefined} newValue 
   */
  async attributeChangedCallback(name, oldValue, newValue) {
    console.log(name, newValue);
    await this.preRender(name, oldValue, newValue);
    this.render();
    await this.postRender(name, oldValue, newValue);
  }

  /**
   * Perform operations before render.
   * @param {string} name 
   * @param {string | undefined} oldValue 
   * @param {string | undefined} newValue 
   */
  async preRender(name, oldValue, newValue) {
    if (name !== 'word') { return };
    this.classList.remove('tumble');
  }

  /**
   * Perform operations after render.
   * @param {string} name 
   * @param {string | undefined} oldValue 
   * @param {string | undefined} newValue 
   */
  async postRender(name, oldValue, newValue) {
    if (name !== 'word') { return };
    this.classList.add('tumble');
  }

  render() {
    this.innerHTML = `
      <div
        class="relative overflow-visible flex items-center justify-center min-h-[80px] bg-white p-6 shadow-sm border-l-4 border-black">
        <div
          class="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap shadow-sm z-10 max-w-[90%] overflow-hidden text-ellipsis">
            ${this.getAttribute('label') ?? ''}
        </div>
        <div class="word text-center text-lg font-medium break-words hyphens-auto">
          ${this.getAttribute('word') ?? ''}
        </div>
      </div>
    `;
  }
}

customElements.define(TumblerWord.tag, TumblerWord);
