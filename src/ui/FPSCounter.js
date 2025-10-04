// FPS Counter UI Component
export class FPSCounter {
  constructor() {
    this.fpsElement = null;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.isVisible = true;
    
    this.create();
  }
  
  create() {
    // Create FPS counter element
    this.fpsElement = document.createElement('div');
    this.fpsElement.id = 'fpsCounter';
    this.fpsElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 240px;
      background: rgba(0, 0, 0, 0.7);
      color: #00ff00;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: bold;
      z-index: 1000;
      pointer-events: none;
      border: 1px solid #00ff00;
      backdrop-filter: blur(5px);
      min-width: 60px;
      text-align: center;
    `;
    
    this.fpsElement.textContent = 'FPS: --';
    document.body.appendChild(this.fpsElement);
  }
  
  update() {
    if (!this.fpsElement || !this.isVisible) return;
    
    this.frameCount++;
    const currentTime = performance.now();
    
    // Update FPS every second
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.fpsElement.textContent = `FPS: ${this.fps}`;
      
      // Color coding based on FPS
      if (this.fps >= 60) {
        this.fpsElement.style.color = '#00ff00'; // Green for good FPS
        this.fpsElement.style.borderColor = '#00ff00';
      } else if (this.fps >= 30) {
        this.fpsElement.style.color = '#ffff00'; // Yellow for moderate FPS
        this.fpsElement.style.borderColor = '#ffff00';
      } else {
        this.fpsElement.style.color = '#ff0000'; // Red for poor FPS
        this.fpsElement.style.borderColor = '#ff0000';
      }
      
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }
  
  toggle() {
    this.isVisible = !this.isVisible;
    if (this.fpsElement) {
      this.fpsElement.style.display = this.isVisible ? 'block' : 'none';
    }
  }
  
  show() {
    this.isVisible = true;
    if (this.fpsElement) {
      this.fpsElement.style.display = 'block';
    }
  }
  
  hide() {
    this.isVisible = false;
    if (this.fpsElement) {
      this.fpsElement.style.display = 'none';
    }
  }
  
  dispose() {
    if (this.fpsElement && this.fpsElement.parentNode) {
      this.fpsElement.parentNode.removeChild(this.fpsElement);
    }
    this.fpsElement = null;
  }
}
