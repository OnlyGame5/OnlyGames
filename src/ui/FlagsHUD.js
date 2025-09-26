import { gameStore } from '../state/gameStore.js';

/**
 * Simple QA HUD to show the three puzzle flags and door state
 * for debugging purposes. Remove this in production.
 */
export class FlagsHUD {
  constructor() {
    this.element = null;
    this.unsubscribers = [];
    this.setupHUD();
    this.subscribeToChanges();
  }
  
  setupHUD() {
    // Create HUD element
    this.element = document.createElement('div');
    this.element.id = 'flagsHUD';
    this.element.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0b1220cc;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #ffffff22;
      color: #cbd5e1;
      font-size: 12px;
      font-family: 'Courier New', monospace;
      z-index: 10000;
      min-width: 200px;
    `;
    
    document.body.appendChild(this.element);
    this.updateDisplay();
  }
  
  subscribeToChanges() {
    // Subscribe to all relevant state changes
    this.unsubscribers.push(
      gameStore.subscribe('wirePuzzleComplete', () => this.updateDisplay()),
      gameStore.subscribe('memoryPuzzleComplete', () => this.updateDisplay()),
      gameStore.subscribe('pageTakenFromSafe', () => this.updateDisplay()),
      gameStore.subscribe('bookshelfDoorOpen', () => this.updateDisplay())
    );
  }
  
  updateDisplay() {
    if (!this.element) return;
    
    const { wirePuzzleComplete, memoryPuzzleComplete, pageTakenFromSafe, bookshelfDoorOpen } = gameStore;
    
    this.element.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Puzzle Status</div>
      <div>Wire: <span style="color: ${wirePuzzleComplete ? '#22c55e' : '#ef4444'}">${wirePuzzleComplete}</span></div>
      <div>Memory: <span style="color: ${memoryPuzzleComplete ? '#22c55e' : '#ef4444'}">${memoryPuzzleComplete}</span></div>
      <div>Page: <span style="color: ${pageTakenFromSafe ? '#22c55e' : '#ef4444'}">${pageTakenFromSafe}</span></div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ffffff22;">
        <strong>Door: <span style="color: ${bookshelfDoorOpen ? '#22c55e' : '#ef4444'}">${bookshelfDoorOpen}</span></strong>
      </div>
    `;
  }
  
  destroy() {
    // Clean up subscriptions
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    
    // Remove element
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

// Create global instance for easy access
export const flagsHUD = new FlagsHUD();

// Make it globally accessible for debugging
window.flagsHUD = flagsHUD;
