import { gameStore } from '../state/gameStore.js';
import { memoryPanel } from './MemoryPanel.js';

export class UIRoot {
  constructor() {
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Listen for game store changes
    gameStore.subscribe('showMemoryUI', (show) => {
      if (show) {
        memoryPanel.show();
      } else {
        memoryPanel.hide();
      }
    });
  }
}

// Create global instance
export const uiRoot = new UIRoot();
