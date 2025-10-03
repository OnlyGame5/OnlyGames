import * as THREE from 'three';
import { EventEmitter } from '../../utils/EventEmitter.js';
import { gameStore } from '../../state/gameStore.js';
import { Door } from '../../components/Door.js';

export class BookshelfDoor extends EventEmitter {
  constructor() {
    super();
    this.group = new THREE.Group();
    this.group.name = 'bookshelfDoor';
    
    // Create and compose the Door component
    this.doorComponent = new Door({
      width: 3,
      height: 3.5,
      color: 0x8b4513,
      openDistance: 4.0,
      duration: 0.8
    });
    
    this.group.add(this.doorComponent.group);
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Subscribe to game store changes to check puzzle completion
    gameStore.subscribe('wirePuzzleComplete', () => {
      this.checkPuzzleCompletion();
    });
    
    gameStore.subscribe('memoryPuzzleComplete', () => {
      this.checkPuzzleCompletion();
    });
    
    // Listen to door component events
    this.doorComponent.on('opened', () => {
      this.emit('doorOpened');
    });
    
    this.doorComponent.on('closed', () => {
      this.emit('doorClosed');
    });
  }

  checkPuzzleCompletion() {
    // Check if both required puzzles are complete
    if (gameStore.wirePuzzleComplete && gameStore.memoryPuzzleComplete) {
      this.openDoor();
    }
  }

  openDoor() {
    if (!this.doorComponent.isOpen) {
      this.doorComponent.open();
    }
  }

  closeDoor() {
    if (this.doorComponent.isOpen) {
      this.doorComponent.close();
    }
  }

  update(deltaTime) {
    // Delegate update to the door component
    this.doorComponent.update(deltaTime);
  }

  destroy() {
    // Cleanup if needed
    if (this.doorComponent) {
      this.doorComponent.removeAllListeners();
    }
  }
}
