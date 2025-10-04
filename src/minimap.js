import * as THREE from 'three';

export class Minimap {
  constructor(scene, player, renderer) {
    this.scene = scene;
    this.player = player;
    this.renderer = renderer;
    
    // Minimap dimensions
    this.width = 200;
    this.height = 200;
    this.enlargedWidth = 400;
    this.enlargedHeight = 400;
    this.isEnlarged = false;
    
    // Create minimap UI element
    this.createMinimapUI();
  }
  
  createMinimapUI() {
    // Create minimap container
    this.minimapContainer = document.createElement('div');
    this.minimapContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: ${this.width}px;
      height: ${this.height}px;
      border: 2px solid #ffffff;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      overflow: hidden;
      transition: all 0.3s ease;
    `;
    
    // Create canvas for minimap
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = this.width;
    this.minimapCanvas.height = this.height;
    this.minimapCanvas.style.cssText = `
      width: 100%;
      height: 100%;
      display: block;
    `;
    
    this.minimapContainer.appendChild(this.minimapCanvas);
    document.body.appendChild(this.minimapContainer);
    
    // Get 2D context for drawing player marker
    this.ctx = this.minimapCanvas.getContext('2d');
    
    // Add title text
    this.addTitleText();
  }
  
  addTitleText() {
    // Add title text to minimap
    this.titleText = document.createElement('div');
    this.titleText.textContent = 'MINIMAP';
    this.titleText.style.cssText = `
      position: absolute;
      top: 5px;
      left: 5px;
      color: #ffffff;
      font-family: monospace;
      font-size: 12px;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      pointer-events: none;
    `;
    this.minimapContainer.appendChild(this.titleText);
  }
  
  update() {
    // Draw minimap to canvas
    this.drawMinimapToCanvas();
  }
  
  drawMinimapToCanvas() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw a simple background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw room outlines
    this.drawRoomOutlines();
    
    // Draw player marker as a red triangle
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Calculate player position relative to minimap center
    const playerX = centerX + (this.player.position.x * 2); // Scale factor
    const playerY = centerY + (this.player.position.z * 2); // Scale factor
    
    // Draw player marker
    this.ctx.fillStyle = '#ff0000';
    this.ctx.beginPath();
    this.ctx.moveTo(playerX, playerY - 8);
    this.ctx.lineTo(playerX - 6, playerY + 8);
    this.ctx.lineTo(playerX + 6, playerY + 8);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Draw player direction indicator
    if (this.player.rotation) {
      const angle = this.player.rotation.y;
      const dirX = Math.sin(angle) * 12;
      const dirY = Math.cos(angle) * 12;
      
      this.ctx.strokeStyle = '#ff0000';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(playerX, playerY);
      this.ctx.lineTo(playerX + dirX, playerY + dirY);
      this.ctx.stroke();
    }
  }
  
  drawRoomOutlines() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    
    // Room 0
    this.ctx.strokeRect(centerX - 20, centerY - 20, 40, 40);
    
    // Room 1
    this.ctx.strokeRect(centerX - 20, centerY - 50, 40, 40);
    
    // Room 2
    this.ctx.strokeRect(centerX - 28, centerY - 80, 40, 40);
    
    // Room 3
    this.ctx.strokeRect(centerX - 20, centerY - 110, 40, 40);
    
    // Hallway
    this.ctx.strokeRect(centerX - 2, centerY - 35, 4, 30);
  }
  
  toggle() {
    if (this.minimapContainer.style.display === 'none') {
      this.minimapContainer.style.display = 'block';
    } else {
      this.minimapContainer.style.display = 'none';
    }
  }
  
  toggleEnlarge() {
    this.isEnlarged = !this.isEnlarged;
    
    if (this.isEnlarged) {
      // Enlarge to center of screen
      this.minimapContainer.style.width = `${this.enlargedWidth}px`;
      this.minimapContainer.style.height = `${this.enlargedHeight}px`;
      this.minimapContainer.style.bottom = '50%';
      this.minimapContainer.style.left = '50%';
      this.minimapContainer.style.transform = 'translate(-50%, 50%)';
      this.minimapContainer.style.zIndex = '2000';
      
      // Update canvas size
      this.minimapCanvas.width = this.enlargedWidth;
      this.minimapCanvas.height = this.enlargedHeight;
      
      // Update title text
      this.titleText.style.fontSize = '18px';
      this.titleText.textContent = 'MAP VIEW';
    } else {
      // Return to normal size in bottom left
      this.minimapContainer.style.width = `${this.width}px`;
      this.minimapContainer.style.height = `${this.height}px`;
      this.minimapContainer.style.bottom = '20px';
      this.minimapContainer.style.left = '20px';
      this.minimapContainer.style.transform = 'none';
      this.minimapContainer.style.zIndex = '1000';
      
      // Update canvas size
      this.minimapCanvas.width = this.width;
      this.minimapCanvas.height = this.height;
      
      // Update title text
      this.titleText.style.fontSize = '12px';
      this.titleText.textContent = 'MINIMAP';
    }
  }
  
  destroy() {
    if (this.minimapContainer && this.minimapContainer.parentNode) {
      this.minimapContainer.parentNode.removeChild(this.minimapContainer);
    }
  }
}
