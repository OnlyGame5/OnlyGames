import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EventEmitter } from '../../utils/EventEmitter.js';
import { gameStore } from '../../state/gameStore.js';

export class WirePanel extends EventEmitter {
  constructor() {
    super();
    this.group = new THREE.Group();
    this.group.name = 'wirePanel';
    
    this.state = {
      order: ['R', 'G', 'B', 'Y'],
      input: [],
      solved: false,
      holding: null,
      isOpen: false
    };
    
    this.model = null;
    this.ui = null;
    
    this.createPanel();
    this.setupUI();
  }

  createPanel() {
    const loader = new GLTFLoader();
    loader.load('/models/electric_box.glb', (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(1, 1, 1);
      this.model.castShadow = true;
      this.model.receiveShadow = true;
      
      // Optimize for performance
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2
          });
        }
      });
      
      this.group.add(this.model);
    });
  }

  setupUI() {
    // Create wire panel UI
    this.ui = document.createElement('div');
    this.ui.id = 'wirePanel';
    this.ui.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      padding: 20px;
      border-radius: 8px;
      z-index: 1000;
      display: none;
    `;
    
    this.ui.innerHTML = `
      <h3>Wire Connection Panel</h3>
      <p>Connect the wires in the correct order: R-G-B-Y</p>
      <div id="wireConnections">
        <div class="wire-socket" data-color="R">R</div>
        <div class="wire-socket" data-color="G">G</div>
        <div class="wire-socket" data-color="B">B</div>
        <div class="wire-socket" data-color="Y">Y</div>
      </div>
      <div id="wireInputs">
        <div class="wire-input" data-color="R">R</div>
        <div class="wire-input" data-color="G">G</div>
        <div class="wire-input" data-color="B">B</div>
        <div class="wire-input" data-color="Y">Y</div>
      </div>
      <button onclick="window.gameState.currentRoom.wirePanel.closePanel()">Close</button>
    `;
    
    document.body.appendChild(this.ui);
    
    // Add wire connection logic
    this.setupWireConnections();
  }

  setupWireConnections() {
    const sockets = this.ui.querySelectorAll('.wire-socket');
    const inputs = this.ui.querySelectorAll('.wire-input');
    
    inputs.forEach(input => {
      input.addEventListener('click', () => {
        if (this.state.holding === null) {
          this.state.holding = input.dataset.color;
          input.classList.add('selected');
        }
      });
    });
    
    sockets.forEach(socket => {
      socket.addEventListener('click', () => {
        if (this.state.holding !== null) {
          const inputIndex = this.state.input.length;
          const socketColor = socket.dataset.color;
          
          this.state.input[inputIndex] = this.state.holding;
          
          // Visual feedback
          socket.style.backgroundColor = this.getColorForWire(this.state.holding);
          socket.textContent = this.state.holding;
          
          // Clear selection
          this.state.holding = null;
          inputs.forEach(i => i.classList.remove('selected'));
          
          // Check if puzzle is solved
          if (this.state.input.length === 4) {
            this.checkSolution();
          }
        }
      });
    });
  }

  getColorForWire(color) {
    const colors = {
      'R': '#ff0000',
      'G': '#00ff00',
      'B': '#0000ff',
      'Y': '#ffff00'
    };
    return colors[color] || '#ffffff';
  }

  checkSolution() {
    const isCorrect = this.state.input.every((color, index) => 
      color === this.state.order[index]
    );
    
    if (isCorrect) {
      this.state.solved = true;
      this.emit('solved');
      gameStore.setWireComplete(true);
      this.showSuccessMessage();
    } else {
      this.triggerSparkEffect();
      this.resetPuzzle();
    }
  }

  showSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 255, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 1001;
    `;
    message.textContent = 'Wire panel solved!';
    document.body.appendChild(message);
    
    setTimeout(() => {
      document.body.removeChild(message);
    }, 2000);
  }

  triggerSparkEffect() {
    // Visual spark effect
    const sparks = document.createElement('div');
    sparks.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ff0000;
      font-size: 24px;
      z-index: 1001;
    `;
    sparks.textContent = 'SPARK!';
    document.body.appendChild(sparks);
    
    setTimeout(() => {
      document.body.removeChild(sparks);
    }, 1000);
  }

  resetPuzzle() {
    this.state.input = [];
    this.state.holding = null;
    
    // Reset UI
    const sockets = this.ui.querySelectorAll('.wire-socket');
    const inputs = this.ui.querySelectorAll('.wire-input');
    
    sockets.forEach(socket => {
      socket.style.backgroundColor = '';
      socket.textContent = socket.dataset.color;
    });
    
    inputs.forEach(input => {
      input.classList.remove('selected');
    });
  }

  openPanel() {
    this.state.isOpen = true;
    this.ui.style.display = 'block';
    window.disablePlayerControls = true;
  }

  closePanel() {
    this.state.isOpen = false;
    this.ui.style.display = 'none';
    window.disablePlayerControls = false;
  }

  canInteract(playerPosition) {
    const distance = playerPosition.distanceTo(this.group.position);
    return distance <= 3.0;
  }

  update(deltaTime) {
    // LOD culling for performance
    if (this.model) {
      const distance = this.group.position.distanceTo(this.group.position);
      this.model.visible = distance < 50;
    }
  }

  destroy() {
    if (this.ui && this.ui.parentNode) {
      this.ui.parentNode.removeChild(this.ui);
    }
  }
}
