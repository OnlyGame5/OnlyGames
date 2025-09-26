// Global game state management for puzzle gates and UI
class GameStore {
  constructor() {
    // Puzzle gates
    this.wirePuzzleComplete = false;
    this.memoryPuzzleComplete = false;
    
    // UI flags
    this.showMemoryUI = false;
    this.memoryLockedReason = "Complete the wire puzzle first.";
    
    // Listeners for state changes
    this.listeners = new Map();
  }
  
  // Subscribe to state changes
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }
  
  // Notify listeners of state changes
  notify(key, value) {
    this.listeners.get(key)?.forEach(callback => callback(value));
  }
  
  // Actions
  setWireComplete(value) {
    this.wirePuzzleComplete = value;
    this.memoryLockedReason = value ? null : "Complete the wire puzzle first.";
    this.notify('wirePuzzleComplete', value);
    this.notify('memoryLockedReason', this.memoryLockedReason);
  }
  
  openMemoryUI() {
    if (!this.wirePuzzleComplete || this.memoryPuzzleComplete) return;
    this.showMemoryUI = true;
    this.notify('showMemoryUI', true);
  }
  
  closeMemoryUI() {
    this.showMemoryUI = false;
    this.notify('showMemoryUI', false);
  }
  
  setMemoryComplete(value) {
    this.memoryPuzzleComplete = value;
    this.showMemoryUI = false;
    this.notify('memoryPuzzleComplete', value);
    this.notify('showMemoryUI', false);
  }
}

// Create global instance
export const gameStore = new GameStore();

// Make it globally accessible
window.gameStore = gameStore;
