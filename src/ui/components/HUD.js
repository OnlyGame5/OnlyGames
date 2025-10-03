import { EventEmitter } from '../../utils/EventEmitter.js';
import { gameStore } from '../../state/gameStore.js';

export class HUD extends EventEmitter {
  constructor() {
    super();
    this.element = null;
    this.isVisible = true;
    
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'gameHUD';
    this.element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 100;
      font-family: 'Courier New', monospace;
      color: white;
    `;
    
    this.element.innerHTML = `
      <!-- Crosshair -->
      <div id="crosshair" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        display: none;
      "></div>
      
      <!-- Inventory -->
      <div id="inventory" style="
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 5px;
      ">
        <div class="inventory-slot" style="
          width: 50px;
          height: 50px;
          border: 2px solid #666;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        "></div>
        <div class="inventory-slot" style="
          width: 50px;
          height: 50px;
          border: 2px solid #666;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        "></div>
        <div class="inventory-slot" style="
          width: 50px;
          height: 50px;
          border: 2px solid #666;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        "></div>
        <div class="inventory-slot" style="
          width: 50px;
          height: 50px;
          border: 2px solid #666;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        "></div>
        <div class="inventory-slot" style="
          width: 50px;
          height: 50px;
          border: 2px solid #666;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        "></div>
      </div>
      
      <!-- Instructions -->
      <div id="instructions" style="
        position: absolute;
        bottom: 80px;
        left: 20px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 4px;
        font-size: 14px;
      ">
        <div>WASD: Move</div>
        <div>E: Interact</div>
        <div>V: Toggle View</div>
        <div>M: Menu</div>
        <div>I: Inspect Item</div>
      </div>
      
      <!-- Debug HUD -->
      <div id="debugHUD" style="
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 4px;
        font-size: 12px;
        display: none;
      ">
        <div>Wire Puzzle: <span id="wireStatus">false</span></div>
        <div>Memory Puzzle: <span id="memoryStatus">false</span></div>
        <div>Page Taken: <span id="pageStatus">false</span></div>
        <div>Bookshelf Door: <span id="doorStatus">false</span></div>
      </div>
    `;
    
    document.body.appendChild(this.element);
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Subscribe to game store changes
    gameStore.subscribe('wirePuzzleComplete', (complete) => {
      this.updateDebugHUD();
    });
    
    gameStore.subscribe('memoryPuzzleComplete', (complete) => {
      this.updateDebugHUD();
    });
    
    gameStore.subscribe('pageTakenFromSafe', (taken) => {
      this.updateDebugHUD();
    });
    
    gameStore.subscribe('bookshelfDoorOpen', (open) => {
      this.updateDebugHUD();
    });
    
    // Toggle debug HUD with F1
    document.addEventListener('keydown', (e) => {
      if (e.code === 'F1') {
        this.toggleDebugHUD();
      }
    });
  }

  updateDebugHUD() {
    const wireStatus = this.element.querySelector('#wireStatus');
    const memoryStatus = this.element.querySelector('#memoryStatus');
    const pageStatus = this.element.querySelector('#pageStatus');
    const doorStatus = this.element.querySelector('#doorStatus');
    
    if (wireStatus) {
      wireStatus.textContent = gameStore.wirePuzzleComplete ? 'true' : 'false';
      wireStatus.style.color = gameStore.wirePuzzleComplete ? '#00ff00' : '#ff0000';
    }
    
    if (memoryStatus) {
      memoryStatus.textContent = gameStore.memoryPuzzleComplete ? 'true' : 'false';
      memoryStatus.style.color = gameStore.memoryPuzzleComplete ? '#00ff00' : '#ff0000';
    }
    
    if (pageStatus) {
      pageStatus.textContent = gameStore.pageTakenFromSafe ? 'true' : 'false';
      pageStatus.style.color = gameStore.pageTakenFromSafe ? '#00ff00' : '#ff0000';
    }
    
    if (doorStatus) {
      doorStatus.textContent = gameStore.bookshelfDoorOpen ? 'true' : 'false';
      doorStatus.style.color = gameStore.bookshelfDoorOpen ? '#00ff00' : '#ff0000';
    }
  }

  toggleDebugHUD() {
    const debugHUD = this.element.querySelector('#debugHUD');
    if (debugHUD) {
      debugHUD.style.display = debugHUD.style.display === 'none' ? 'block' : 'none';
    }
  }

  updateInstructions() {
    const instructions = this.element.querySelector('#instructions');
    if (instructions && window.player) {
      const inputSystem = window.player.getInputSystem();
      if (inputSystem) {
        const bindings = inputSystem.getBindings();
        instructions.innerHTML = `
          <div>${this.getKeyDisplayName(bindings.moveForward)}: Move Forward</div>
          <div>${this.getKeyDisplayName(bindings.moveBack)}: Move Back</div>
          <div>${this.getKeyDisplayName(bindings.moveLeft)}: Move Left</div>
          <div>${this.getKeyDisplayName(bindings.moveRight)}: Move Right</div>
          <div>${this.getKeyDisplayName(bindings.interact)}: Interact</div>
          <div>${this.getKeyDisplayName(bindings.toggleView)}: Toggle View</div>
          <div>${this.getKeyDisplayName(bindings.openMenu)}: Menu</div>
        `;
      }
    }
  }

  getKeyDisplayName(keyCode) {
    return keyCode.replace('Key', '').replace('Digit', '');
  }

  show() {
    this.isVisible = true;
    this.element.style.display = 'block';
  }

  hide() {
    this.isVisible = false;
    this.element.style.display = 'none';
  }

  update(deltaTime) {
    // Update HUD elements
    this.updateInstructions();
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
