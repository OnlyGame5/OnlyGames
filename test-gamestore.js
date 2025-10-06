// Test script to verify GameStore backward compatibility
import { gameStore } from './src/state/gameStore.js';

console.log('=== GameStore Backward Compatibility Test ===');

// Test 1: Check that old properties are accessible
console.log('1. Testing old property access:');
console.log('   wirePuzzleComplete:', gameStore.wirePuzzleComplete);
console.log('   memoryPuzzleComplete:', gameStore.memoryPuzzleComplete);
console.log('   pageTakenFromSafe:', gameStore.pageTakenFromSafe);
console.log('   bookshelfDoorOpen:', gameStore.bookshelfDoorOpen);
console.log('   stage:', gameStore.stage);

// Test 2: Check that old properties can be set
console.log('\n2. Testing old property setting:');
gameStore.wirePuzzleComplete = true;
console.log('   Set wirePuzzleComplete to true:', gameStore.wirePuzzleComplete);
console.log('   New structure value:', gameStore.rooms.room1.puzzles.wirePuzzleComplete);

gameStore.memoryPuzzleComplete = true;
console.log('   Set memoryPuzzleComplete to true:', gameStore.memoryPuzzleComplete);
console.log('   New structure value:', gameStore.rooms.room1.puzzles.memoryPuzzleComplete);

gameStore.pageTakenFromSafe = true;
console.log('   Set pageTakenFromSafe to true:', gameStore.pageTakenFromSafe);
console.log('   New structure value:', gameStore.rooms.room1.puzzles.pageTakenFromSafe);

// Test 3: Check that old methods still work
console.log('\n3. Testing old methods:');
gameStore.setWireComplete(false);
console.log('   setWireComplete(false):', gameStore.wirePuzzleComplete);

gameStore.setMemoryComplete(false);
console.log('   setMemoryComplete(false):', gameStore.memoryPuzzleComplete);

gameStore.setPageTaken(false);
console.log('   setPageTaken(false):', gameStore.pageTakenFromSafe);

// Test 4: Check flags object compatibility
console.log('\n4. Testing flags object:');
console.log('   flags.room3:', gameStore.flags.room3);
console.log('   flags.room3.bridgeSolved:', gameStore.flags.room3.bridgeSolved);

gameStore.setRoom3Flag('bridgeSolved', true);
console.log('   After setRoom3Flag("bridgeSolved", true):', gameStore.flags.room3.bridgeSolved);

// Test 5: Check new structure
console.log('\n5. Testing new structure:');
console.log('   currentRoomId:', gameStore.currentRoomId);
console.log('   hub.tokensPlaced:', gameStore.hub.tokensPlaced);
console.log('   rooms.room1.puzzles:', gameStore.rooms.room1.puzzles);
console.log('   rooms.room2.puzzles:', gameStore.rooms.room2.puzzles);

// Test 6: Check new methods
console.log('\n6. Testing new methods:');
gameStore.setCurrentRoom('room1');
console.log('   setCurrentRoom("room1"):', gameStore.currentRoomId);

gameStore.collectRoomToken('room1');
console.log('   collectRoomToken("room1"):', gameStore.rooms.room1.tokenCollected);

console.log('\n=== All tests completed successfully! ===');
