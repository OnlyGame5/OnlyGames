import { EventEmitter } from '../../utils/EventEmitter.js';

export class LoadingScreen extends EventEmitter {
  constructor() {
    super();
    this.element = null;
    this.progressBar = null;
    this.statusText = null;
    this.items = new Map();
    this.isVisible = false;
    
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'loadingScreen';
    this.element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #0b0b12 0%, #1a1a2e 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'Courier New', monospace;
      color: #ffffff;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = 'The Aperture Protocol';
    title.style.cssText = `
      font-size: 2.5rem;
      margin-bottom: 2rem;
      text-align: center;
      color: #00ff00;
      text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
    `;
    this.element.appendChild(title);

    // Progress bar container
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 400px;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #00ff00, #00cc00);
      width: 0%;
      transition: width 0.3s ease;
      box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
    `;
    progressContainer.appendChild(this.progressBar);
    this.element.appendChild(progressContainer);

    // Status text
    this.statusText = document.createElement('div');
    this.statusText.id = 'loadingStatus';
    this.statusText.style.cssText = `
      font-size: 1.2rem;
      text-align: center;
      color: #cccccc;
      margin-bottom: 1rem;
    `;
    this.element.appendChild(this.statusText);

    // Loading items list
    this.itemsList = document.createElement('div');
    this.itemsList.id = 'loadingItems';
    this.itemsList.style.cssText = `
      font-size: 0.9rem;
      color: #888888;
      text-align: left;
      max-height: 200px;
      overflow-y: auto;
      width: 400px;
    `;
    this.element.appendChild(this.itemsList);

    document.body.appendChild(this.element);
  }

  show() {
    this.isVisible = true;
    this.element.style.display = 'flex';
    this.emit('shown');
  }

  hide() {
    this.isVisible = false;
    this.element.style.display = 'none';
    this.emit('hidden');
  }

  setStatus(text) {
    if (this.statusText) {
      this.statusText.textContent = text;
    }
  }

  registerItem(name, description = '') {
    this.items.set(name, { loaded: false, description });
    this.updateItemsList();
    this.updateProgress();
  }

  updateItem(name, loaded = true) {
    if (this.items.has(name)) {
      this.items.get(name).loaded = loaded;
      this.updateItemsList();
      this.updateProgress();
    }
  }

  completeItem(name) {
    this.updateItem(name, true);
  }

  updateItemsList() {
    if (!this.itemsList) return;

    this.itemsList.innerHTML = '';
    this.items.forEach((item, name) => {
      const itemElement = document.createElement('div');
      itemElement.style.cssText = `
        padding: 2px 0;
        color: ${item.loaded ? '#00ff00' : '#ff6666'};
      `;
      itemElement.textContent = `${item.loaded ? '✓' : '○'} ${name}`;
      if (item.description) {
        itemElement.textContent += ` - ${item.description}`;
      }
      this.itemsList.appendChild(itemElement);
    });
  }

  updateProgress() {
    if (!this.progressBar) return;

    const totalItems = this.items.size;
    const loadedItems = Array.from(this.items.values()).filter(item => item.loaded).length;
    const progress = totalItems > 0 ? (loadedItems / totalItems) * 100 : 0;

    this.progressBar.style.width = `${progress}%`;
    this.emit('progress', progress);
  }

  dispose() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.progressBar = null;
    this.statusText = null;
    this.items.clear();
  }
}

// Create global instance
export const loadingScreen = new LoadingScreen();
