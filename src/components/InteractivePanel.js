import * as THREE from 'three';
import { EventEmitter } from '../utils/EventEmitter.js';

export class InteractivePanel extends EventEmitter {
  constructor(options = {}) {
    super();
    this.group = new THREE.Group();
    this.content = options.content || '';
    this.interactionDistance = options.interactionDistance || 3.0;
    this.isExaminable = options.isExaminable || false;
    
    this.createPanel(options);
  }

  createPanel(options) {
    // Panel geometry
    const panelGeometry = new THREE.PlaneGeometry(options.width || 4, options.height || 2);
    
    // Create canvas for text content
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = options.backgroundColor || 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text content
    ctx.fillStyle = options.textColor || 'lime';
    ctx.font = options.font || '28px monospace';
    
    // Split content into lines and draw
    const lines = this.content.split('\n');
    lines.forEach((line, index) => {
      ctx.fillText(line, 20, 50 + (index * 40));
    });
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    
    // Panel material
    const panelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide,
      toneMapped: false,
      depthWrite: false
    });
    
    // Panel mesh
    const panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
    panelMesh.renderOrder = 1;
    this.group.add(panelMesh);
    
    // Add interaction data
    this.group.userData = {
      type: 'interactive-panel',
      interactable: this
    };
  }

  updateContent(newContent) {
    this.content = newContent;
    // Recreate the panel with new content
    this.group.clear();
    this.createPanel({
      width: 4,
      height: 2,
      content: this.content
    });
  }

  canInteract(playerPosition) {
    const distance = playerPosition.distanceTo(this.group.position);
    return distance <= this.interactionDistance;
  }

  interact(player) {
    if (this.isExaminable) {
      this.showExaminationView();
    }
    this.emit('interacted', player);
  }

  showExaminationView() {
    // Create examination overlay
    const overlay = document.createElement('div');
    overlay.id = 'panelExamination';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      z-index: 2000;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: #f5f5dc;
      border: 2px solid #8b4513;
      border-radius: 8px;
      padding: 40px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      color: #333;
      font-family: monospace;
      white-space: pre-line;
    `;
    content.textContent = this.content;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // Close on click
    overlay.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }
}
