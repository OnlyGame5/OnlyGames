// Global game state management for puzzle gates and UI
class GameStore {
  constructor() {
    // Puzzle gates
    this.wirePuzzleComplete = false;
    this.memoryPuzzleComplete = false;
    
    // UI flags
    this.showMemoryUI = false;
    this.memoryLockedReason = "Complete the wire puzzle first.";
    
    // Bookshelf logic
    this.pageTakenFromSafe = false;
    this.bookshelfDoorOpen = false;
    
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
    console.log('setWireComplete called with:', value);
    this.wirePuzzleComplete = value;
    this.memoryLockedReason = value ? null : "Complete the wire puzzle first.";
    this.notify('wirePuzzleComplete', value);
    this.notify('memoryLockedReason', this.memoryLockedReason);
    this.tryOpenBookshelfDoor();
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
    console.log('setMemoryComplete called with:', value);
    this.memoryPuzzleComplete = value;
    this.showMemoryUI = false;
    this.notify('memoryPuzzleComplete', value);
    this.notify('showMemoryUI', false);
    this.tryOpenBookshelfDoor();
  }
  
  setPageTaken(value) {
    console.log('setPageTaken called with:', value);
    this.pageTakenFromSafe = value;
    this.notify('pageTakenFromSafe', value);
    this.tryOpenBookshelfDoor();
  }
  
  setBookshelfDoorOpen(value) {
    this.bookshelfDoorOpen = value;
    this.notify('bookshelfDoorOpen', value);
  }
  
  tryOpenBookshelfDoor() {
    console.log('tryOpenBookshelfDoor called. Current state:', {
      bookshelfDoorOpen: this.bookshelfDoorOpen,
      wirePuzzleComplete: this.wirePuzzleComplete,
      memoryPuzzleComplete: this.memoryPuzzleComplete,
      pageTakenFromSafe: this.pageTakenFromSafe
    });
    
    if (!this.bookshelfDoorOpen && 
        this.wirePuzzleComplete && 
        this.memoryPuzzleComplete && 
        this.pageTakenFromSafe) {
      console.log('Opening bookshelf door!');
      this.bookshelfDoorOpen = true;
      this.notify('bookshelfDoorOpen', true);
    }
  }
}

// Create global instance
export const gameStore = new GameStore();

// Make it globally accessible
window.gameStore = gameStore;

// --- AUTO-OPEN SAFEGUARD ---
// Opens the bookshelf the moment all three are true, even if a puzzle
// sets the flags from a different module or bypasses the helper actions.
try {
  // Subscribe to all three puzzle completion events
  const checkAutoOpen = () => {
    const { wirePuzzleComplete, memoryPuzzleComplete, pageTakenFromSafe, bookshelfDoorOpen } = gameStore;
    if (!bookshelfDoorOpen && wirePuzzleComplete && memoryPuzzleComplete && pageTakenFromSafe) {
      console.log('Auto-open safeguard triggered - opening bookshelf door!');
      gameStore.setBookshelfDoorOpen(true);
    }
  };
  
  // Subscribe to each puzzle completion
  gameStore.subscribe('wirePuzzleComplete', checkAutoOpen);
  gameStore.subscribe('memoryPuzzleComplete', checkAutoOpen);
  gameStore.subscribe('pageTakenFromSafe', checkAutoOpen);
  
  // Also check immediately in case all are already true
  checkAutoOpen();
} catch (e) {
  console.log('Auto-open safeguard setup failed:', e);
}
