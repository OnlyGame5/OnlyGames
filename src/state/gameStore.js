// Global game state management for puzzle gates and UI
import { addToInventory } from '../player.js';

class GameStore {
  constructor() {
    // --- NEW NON-LINEAR STRUCTURE ---
    this.currentRoomId = 'hub'; // 'hub', 'room1', 'room2', etc.
    
    // Matrix Sky settings
    this.settings = {
      enableMatrixSky: true,
      matrixSkySpeed: 0.01, // 2x faster than 0.005
      matrixSkyIntensity: 1.0
    };
    this.hub = {
      tokensPlaced: {
        room1: false,
        room2: false,
        room3: false,
        room4: false
      },
      isShutdown: false
    };
    this.rooms = {
      room1: {
        isComplete: false,
        tokenCollected: false,
        puzzles: {
          wirePuzzleComplete: false,
          memoryPuzzleComplete: false,
          pageTakenFromSafe: false,
          bookshelfDoorOpen: false
        }
      },
      room2: {
        isComplete: false,
        tokenCollected: false,
        puzzles: {
          scalePuzzleComplete: false,
          itemsPlacedOnScale: [],
          seventhObjectRevealed: false,
          seventhObjectCollected: false
        }
      },
      room3: {
        isComplete: false,
        tokenCollected: false,
        puzzles: {
          bridgeSolved: false,
          overrideSolved: false,
          dataStormSolved: false,
          finalChoice: null,
          coreUnlocked: false
        }
      },
      room4: {
        isComplete: false,
        tokenCollected: false,
        puzzles: {
          // To be defined
        }
      }
    };

    // UI flags (global)
    this.showMemoryUI = false;
    this.memoryLockedReason = "Complete the wire puzzle first.";
    
    // Truth Filter state (read by rooms; toggled by the TF system elsewhere)
    this.isTruthFilterOn = false;

    // Listeners for state changes
    this.listeners = new Map();
  }

  // --- BACKWARD COMPATIBILITY GETTERS/SETTERS ---

  get stage() {
    // This is a simple mapping for legacy code.
    const roomMap = { 'hub': 0, 'room0': 0, 'room1': 1, 'room2': 2, 'room3': 3, 'room4': 4 };
    return roomMap[this.currentRoomId] || 0;
  }

  get wirePuzzleComplete() {
    return this.rooms.room1.puzzles.wirePuzzleComplete;
  }
  set wirePuzzleComplete(value) {
    this.rooms.room1.puzzles.wirePuzzleComplete = value;
  }

  get memoryPuzzleComplete() {
    return this.rooms.room1.puzzles.memoryPuzzleComplete;
  }
  set memoryPuzzleComplete(value) {
    this.rooms.room1.puzzles.memoryPuzzleComplete = value;
  }
  
  get pageTakenFromSafe() {
    return this.rooms.room1.puzzles.pageTakenFromSafe;
  }
  set pageTakenFromSafe(value) {
    this.rooms.room1.puzzles.pageTakenFromSafe = value;
  }

  get bookshelfDoorOpen() {
    return this.rooms.room1.puzzles.bookshelfDoorOpen;
  }
  set bookshelfDoorOpen(value) {
    this.rooms.room1.puzzles.bookshelfDoorOpen = value;
  }

  // Proxy for the old flags object
  get flags() {
    return {
      room3: this.rooms.room3.puzzles
    };
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

  // Generic set method for AI dialogue and other dynamic properties
  set(key, value) {
    this[key] = value;
    this.notify(key, value);
  }

  // Convenience getters/setters for commonly observed properties
  setStage(n) {
    // Map stage number back to room ID
    const stageMap = { 0: 'hub', 1: 'room1', 2: 'room2', 3: 'room3', 4: 'room4' };
    this.currentRoomId = stageMap[n] || 'hub';
    this.notify('stage', n);
  }

  setTruthFilter(on) {
    this.isTruthFilterOn = !!on;
    this.notify('isTruthFilterOn', this.isTruthFilterOn);
  }

  // Update Room 3 flags with notification
  setRoom3Flag(flagKey, value) {
    this.rooms.room3.puzzles[flagKey] = value;
    this.notify(`flags.room3.${flagKey}`, value);
    // Emit aggregate change as well for simple subscribers
    this.notify('flags.room3', { ...this.rooms.room3.puzzles });
  }
  
  // --- UPDATED METHODS ---
  setWireComplete(value) {
    console.log('setWireComplete called with:', value);
    this.rooms.room1.puzzles.wirePuzzleComplete = value;
    this.memoryLockedReason = value ? null : "Complete the wire puzzle first.";
    this.notify('wirePuzzleComplete', value);
    this.notify('memoryLockedReason', this.memoryLockedReason);
    this.tryOpenBookshelfDoor();
    this.checkRoom1Completion();
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
    this.rooms.room1.puzzles.memoryPuzzleComplete = value;
    this.showMemoryUI = false;
    this.notify('memoryPuzzleComplete', value);
    this.notify('showMemoryUI', false);
    this.tryOpenBookshelfDoor();
    this.checkRoom1Completion();
  }
  
  setPageTaken(value) {
    console.log('setPageTaken called with:', value);
    this.rooms.room1.puzzles.pageTakenFromSafe = value;
    this.notify('pageTakenFromSafe', value);
    this.tryOpenBookshelfDoor();
  }
  
  setBookshelfDoorOpen(value) {
    this.rooms.room1.puzzles.bookshelfDoorOpen = value;
    this.notify('bookshelfDoorOpen', value);
  }
  
  tryOpenBookshelfDoor() {
    const puzzles = this.rooms.room1.puzzles;
    console.log('tryOpenBookshelfDoor called. Current state:', {
      bookshelfDoorOpen: puzzles.bookshelfDoorOpen,
      wirePuzzleComplete: puzzles.wirePuzzleComplete,
      memoryPuzzleComplete: puzzles.memoryPuzzleComplete,
      pageTakenFromSafe: puzzles.pageTakenFromSafe
    });
    
    if (!puzzles.bookshelfDoorOpen && 
        puzzles.wirePuzzleComplete && 
        puzzles.memoryPuzzleComplete && 
        puzzles.pageTakenFromSafe) {
      console.log('Opening bookshelf door!');
      puzzles.bookshelfDoorOpen = true;
      this.notify('bookshelfDoorOpen', true);
    }
  }

  checkRoom1Completion() {
    const puzzles = this.rooms.room1.puzzles;
    // Room 1 is complete when both wire and memory puzzles are done
    const allComplete = puzzles.wirePuzzleComplete && puzzles.memoryPuzzleComplete;
    
    if (allComplete && !this.rooms.room1.isComplete) {
      this.rooms.room1.isComplete = true;
      this.notify('room1Complete', true);
      
      console.log('Room 1 completed! All puzzles solved.');
      if (window.AI) {
        window.AI.say('First assessment complete. The path forward is now accessible.');
      }
      
      // Grant the player the access key card once all puzzles are complete
      try {
        if (!window.room1KeyCardAwarded) {
          const granted = addToInventory({ name: 'key_card', description: 'Access Key Card', type: 'key' });
          if (granted) {
            window.room1KeyCardAwarded = true;
            if (window.AI) window.AI.say('Access Key Card issued. You may need this later.');
            if (window.gameStore) window.gameStore.notify('room1.keyCardAwarded', true);
          }
        }
      } catch (e) { console.warn('Failed to grant key card at completion:', e); }
    }
  }

  // --- NEW ROOM MANAGEMENT METHODS ---

  setRoom4Complete(value) {
    this.rooms.room4.isComplete = !!value;
    this.notify('room4Complete', this.rooms.room4.isComplete);
  }

  setCurrentRoom(roomId) {
    if (this.currentRoomId !== roomId) {
      this.currentRoomId = roomId;
      this.notify('currentRoomId', roomId);
    }
  }

  getCurrentRoom() {
    return this.currentRoomId;
  }

  // Token management methods
  collectRoomToken(roomId) {
    if (this.rooms[roomId]) {
      this.rooms[roomId].tokenCollected = true;
      this.notify(`roomTokenCollected.${roomId}`, true);
      this.checkAllTokensCollected();
    }
  }

  placeTokenInHub(roomId) {
    if (this.hub.tokensPlaced[roomId] !== undefined) {
      this.hub.tokensPlaced[roomId] = true;
      this.notify(`tokenPlaced.${roomId}`, true);
      this.checkAllTokensPlaced();
    }
  }

  checkAllTokensCollected() {
    const allCollected = Object.values(this.rooms).every(room => room.tokenCollected);
    this.notify('allTokensCollected', allCollected);
  }

  checkAllTokensPlaced() {
    const allPlaced = Object.values(this.hub.tokensPlaced).every(placed => placed);
    this.notify('allTokensPlaced', allPlaced);
    if (allPlaced) {
      this.hub.isShutdown = true;
      this.notify('hubShutdown', true);
    }
  }

  // Room 2 puzzle completion methods
  setRoom2PuzzleComplete(puzzleName, value) {
    if (this.rooms.room2.puzzles[puzzleName] !== undefined) {
      this.rooms.room2.puzzles[puzzleName] = value;
      this.notify(`room2Puzzle.${puzzleName}`, value);
      this.checkRoom2Completion();
    }
  }

  checkRoom2Completion() {
    const puzzles = this.rooms.room2.puzzles;
    const allComplete = puzzles.scalePuzzleComplete && 
                       puzzles.candleBeamPuzzleComplete && 
                       puzzles.seventhObjectRevealed;
    
    if (allComplete && !this.rooms.room2.isComplete) {
      this.rooms.room2.isComplete = true;
      this.notify('room2Complete', true);
      this.notify('room3AccessGranted', true);
    }
  }

  // Room 3 access control
  isRoom3Accessible() {
    // Room 3 (Server Room) is accessible when Room 4 is completed
    return this.rooms.room4.isComplete;
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
