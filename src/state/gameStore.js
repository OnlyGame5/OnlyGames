import { EventEmitter } from '../utils/EventEmitter.js';

export class GameStore extends EventEmitter {
  constructor() {
    super();
    
    // Puzzle completion states
    this.wirePuzzleComplete = false;
    this.memoryPuzzleComplete = false;
    this.pageTakenFromSafe = false;
    this.bookshelfDoorOpen = false;
    
    // UI states
    this.showMemoryUI = false;
    
    // Game progress
    this.currentStage = 0;
    this.completedPuzzles = new Set();
    
    // Load from localStorage
    this.loadFromStorage();
  }

  // Wire puzzle methods
  setWireComplete(complete = true) {
    this.wirePuzzleComplete = complete;
    if (complete) {
      this.completedPuzzles.add('wire');
    }
    this.emit('wirePuzzleComplete', complete);
    this.tryOpenBookshelfDoor();
    this.saveToStorage();
  }

  // Memory puzzle methods
  setMemoryComplete(complete = true) {
    this.memoryPuzzleComplete = complete;
    if (complete) {
      this.completedPuzzles.add('memory');
    }
    this.emit('memoryPuzzleComplete', complete);
    this.tryOpenBookshelfDoor();
    this.saveToStorage();
  }

  // Safe page methods
  setPageTaken(taken = true) {
    this.pageTakenFromSafe = taken;
    if (taken) {
      this.completedPuzzles.add('safe');
    }
    this.emit('pageTakenFromSafe', taken);
    this.tryOpenBookshelfDoor();
    this.saveToStorage();
  }

  // Bookshelf door methods
  setBookshelfDoorOpen(open = true) {
    this.bookshelfDoorOpen = open;
    this.emit('bookshelfDoorOpen', open);
    this.saveToStorage();
  }

  tryOpenBookshelfDoor() {
    if (this.wirePuzzleComplete && this.memoryPuzzleComplete && this.pageTakenFromSafe) {
      this.setBookshelfDoorOpen(true);
    }
  }

  // UI state methods
  setShowMemoryUI(show = true) {
    this.showMemoryUI = show;
    this.emit('showMemoryUI', show);
  }

  // Game progress methods
  setCurrentStage(stage) {
    this.currentStage = stage;
    this.emit('currentStage', stage);
    this.saveToStorage();
  }

  // Storage methods
  saveToStorage() {
    const state = {
      wirePuzzleComplete: this.wirePuzzleComplete,
      memoryPuzzleComplete: this.memoryPuzzleComplete,
      pageTakenFromSafe: this.pageTakenFromSafe,
      bookshelfDoorOpen: this.bookshelfDoorOpen,
      currentStage: this.currentStage,
      completedPuzzles: Array.from(this.completedPuzzles)
    };
    
    try {
      localStorage.setItem('aperture-protocol-game-state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save game state:', error);
    }
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('aperture-protocol-game-state');
      if (saved) {
        const state = JSON.parse(saved);
        this.wirePuzzleComplete = state.wirePuzzleComplete || false;
        this.memoryPuzzleComplete = state.memoryPuzzleComplete || false;
        this.pageTakenFromSafe = state.pageTakenFromSafe || false;
        this.bookshelfDoorOpen = state.bookshelfDoorOpen || false;
        this.currentStage = state.currentStage || 0;
        this.completedPuzzles = new Set(state.completedPuzzles || []);
      }
    } catch (error) {
      console.warn('Failed to load game state:', error);
    }
  }

  // Reset methods
  resetPuzzleStates() {
    this.wirePuzzleComplete = false;
    this.memoryPuzzleComplete = false;
    this.pageTakenFromSafe = false;
    this.bookshelfDoorOpen = false;
    this.completedPuzzles.clear();
    this.saveToStorage();
  }

  resetAll() {
    this.resetPuzzleStates();
    this.showMemoryUI = false;
    this.currentStage = 0;
    this.saveToStorage();
  }

  // Getters
  getPuzzleCompletion() {
    return {
      wire: this.wirePuzzleComplete,
      memory: this.memoryPuzzleComplete,
      safe: this.pageTakenFromSafe,
      bookshelf: this.bookshelfDoorOpen
    };
  }

  getCompletedPuzzles() {
    return Array.from(this.completedPuzzles);
  }

  isPuzzleCompleted(puzzleName) {
    return this.completedPuzzles.has(puzzleName);
  }
}

// Create global instance
export const gameStore = new GameStore();