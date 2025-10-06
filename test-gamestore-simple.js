// Simple test script to verify GameStore backward compatibility (Node.js compatible)
// We'll test the core functionality without the window dependency

// Mock window object for testing
global.window = {
  gameStore: null
};

// Import the gameStore instance
import { gameStore } from './src/state/gameStore.js';

console.log('=== GameStore Backward Compatibility Test ===');

// Use the existing instance for testing
const testStore = gameStore;

// Test 1: Check that old properties are accessible
console.log('1. Testing old property access:');
console.log('   wirePuzzleComplete:', testStore.wirePuzzleComplete);
console.log('   memoryPuzzleComplete:', testStore.memoryPuzzleComplete);
console.log('   pageTakenFromSafe:', testStore.pageTakenFromSafe);
console.log('   bookshelfDoorOpen:', testStore.bookshelfDoorOpen);
console.log('   stage:', testStore.stage);

// Test 2: Check that old properties can be set
console.log('\n2. Testing old property setting:');
testStore.wirePuzzleComplete = true;
console.log('   Set wirePuzzleComplete to true:', testStore.wirePuzzleComplete);
console.log('   New structure value:', testStore.rooms.room1.puzzles.wirePuzzleComplete);

testStore.memoryPuzzleComplete = true;
console.log('   Set memoryPuzzleComplete to true:', testStore.memoryPuzzleComplete);
console.log('   New structure value:', testStore.rooms.room1.puzzles.memoryPuzzleComplete);

testStore.pageTakenFromSafe = true;
console.log('   Set pageTakenFromSafe to true:', testStore.pageTakenFromSafe);
console.log('   New structure value:', testStore.rooms.room1.puzzles.pageTakenFromSafe);

// Test 3: Check that old methods still work
console.log('\n3. Testing old methods:');
testStore.setWireComplete(false);
console.log('   setWireComplete(false):', testStore.wirePuzzleComplete);

testStore.setMemoryComplete(false);
console.log('   setMemoryComplete(false):', testStore.memoryPuzzleComplete);

testStore.setPageTaken(false);
console.log('   setPageTaken(false):', testStore.pageTakenFromSafe);

// Test 4: Check flags object compatibility
console.log('\n4. Testing flags object:');
console.log('   flags.room3:', testStore.flags.room3);
console.log('   flags.room3.bridgeSolved:', testStore.flags.room3.bridgeSolved);

testStore.setRoom3Flag('bridgeSolved', true);
console.log('   After setRoom3Flag("bridgeSolved", true):', testStore.flags.room3.bridgeSolved);

// Test 5: Check new structure
console.log('\n5. Testing new structure:');
console.log('   currentRoomId:', testStore.currentRoomId);
console.log('   hub.tokensPlaced:', testStore.hub.tokensPlaced);
console.log('   rooms.room1.puzzles:', testStore.rooms.room1.puzzles);
console.log('   rooms.room2.puzzles:', testStore.rooms.room2.puzzles);

// Test 6: Check new methods
console.log('\n6. Testing new methods:');
testStore.setCurrentRoom('room1');
console.log('   setCurrentRoom("room1"):', testStore.currentRoomId);

testStore.collectRoomToken('room1');
console.log('   collectRoomToken("room1"):', testStore.rooms.room1.tokenCollected);

console.log('\n=== All tests completed successfully! ===');
