// Lightweight loading screen system
export class LoadingScreen {
  constructor() {
    this.overlay = null;
    this.progressBar = null;
    this.statusText = null;
    this.isVisible = false;
    this.loadingItems = new Map();
    this.totalItems = 0;
    this.loadedItems = 0;
  }

  // Create the loading screen UI
  create() {
    if (this.overlay) return; // Already created

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'loadingOverlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: 'Courier New', monospace;
      color: #ffffff;
    `;

    // Create loading container
    const container = document.createElement('div');
    container.style.cssText = `
      text-align: center;
      max-width: 400px;
      padding: 20px;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = 'LOADING GAME ASSETS';
    title.style.cssText = `
      color: #00ff00;
      font-size: 24px;
      margin-bottom: 30px;
      text-shadow: 0 0 10px #00ff00;
      letter-spacing: 2px;
    `;

    // Progress bar container
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 100%;
      height: 8px;
      background: #333;
      border-radius: 4px;
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
    `;

    // Progress bar
    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #00ff00, #00cc00);
      border-radius: 4px;
      transition: width 0.3s ease;
      box-shadow: 0 0 10px #00ff00;
    `;

    // Status text
    this.statusText = document.createElement('div');
    this.statusText.textContent = 'Initializing...';
    this.statusText.style.cssText = `
      color: #cccccc;
      font-size: 14px;
      margin-bottom: 10px;
    `;

    // Progress percentage
    this.percentageText = document.createElement('div');
    this.percentageText.textContent = '0%';
    this.percentageText.style.cssText = `
      color: #00ff00;
      font-size: 18px;
      font-weight: bold;
    `;

    // Assemble the UI
    progressContainer.appendChild(this.progressBar);
    container.appendChild(title);
    container.appendChild(progressContainer);
    container.appendChild(this.statusText);
    container.appendChild(this.percentageText);
    this.overlay.appendChild(container);

    // Add to document
    document.body.appendChild(this.overlay);
    this.isVisible = true;
  }

  // Register a loading item
  registerItem(name, total = 1) {
    this.loadingItems.set(name, { loaded: 0, total: total });
    this.totalItems += total;
    this.updateProgress();
  }

  // Update progress for a specific item
  updateItem(name, loaded, total = null) {
    if (!this.loadingItems.has(name)) {
      this.registerItem(name, total);
    }
    
    const item = this.loadingItems.get(name);
    item.loaded = loaded;
    if (total !== null) {
      item.total = total;
    }
    
    this.updateProgress();
  }

  // Complete an item
  completeItem(name) {
    if (this.loadingItems.has(name)) {
      const item = this.loadingItems.get(name);
      item.loaded = item.total;
      this.loadedItems++;
    }
    this.updateProgress();
  }

  // Update the progress display
  updateProgress() {
    if (!this.isVisible) return;

    let totalLoaded = 0;
    let totalItems = 0;
    
    this.loadingItems.forEach(item => {
      totalLoaded += item.loaded;
      totalItems += item.total;
    });

    const percentage = totalItems > 0 ? Math.round((totalLoaded / totalItems) * 100) : 0;
    
    if (this.progressBar) {
      this.progressBar.style.width = percentage + '%';
    }
    
    if (this.percentageText) {
      this.percentageText.textContent = percentage + '%';
    }

    // Auto-hide when complete
    if (percentage >= 100) {
      setTimeout(() => this.hide(), 500);
    }
  }

  // Set status text
  setStatus(text) {
    if (this.statusText) {
      this.statusText.textContent = text;
    }
  }

  // Show loading screen
  show() {
    if (!this.overlay) {
      this.create();
    }
    if (this.overlay) {
      this.overlay.style.display = 'flex';
      this.isVisible = true;
    }
  }

  // Hide loading screen
  hide() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
      this.isVisible = false;
    }
  }

  // Remove loading screen completely
  dispose() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    this.progressBar = null;
    this.statusText = null;
    this.isVisible = false;
  }
}

// Global loading screen instance
export const loadingScreen = new LoadingScreen();
