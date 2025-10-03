import { gameStore } from '../state/gameStore.js';
import { memoryPanel } from './MemoryPanel.js';
import { aiDialogueBox } from './AIDialogueBox.js';

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

    // Listen for AI dialogue events
    gameStore.subscribe('showAIDialogue', (data) => {
      if (data) {
        aiDialogueBox.show(data.text, {
          effect: data.effect || 'type',
          tone: data.tone || 'neutral',
          typingSpeed: data.typingSpeed || 15,
          onComplete: data.onComplete
        });
      } else {
        aiDialogueBox.hide();
      }
    });

    // Listen for dialogue tone changes
    gameStore.subscribe('setDialogueTone', (tone) => {
      aiDialogueBox.setTone(tone);
    });

    // Listen for dialogue header changes
    gameStore.subscribe('setDialogueHeader', (header) => {
      aiDialogueBox.setHeaderLabel(header);
    });
  }
}

// Create global instance
export const uiRoot = new UIRoot();
