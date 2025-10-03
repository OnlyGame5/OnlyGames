// Test script specifically for Simon Says dialogue integration
import { AI } from '../ai.js';

console.log('Testing Simon Says Dialogue Integration...');

// Test Simon puzzle start dialogue
console.log('=== SIMON PUZZLE START ===');
AI.onSimonPuzzleStart();

// Wait a bit, then test completion dialogue
setTimeout(() => {
  console.log('=== SIMON PUZZLE COMPLETION ===');
  AI.onSimonPuzzleComplete();
}, 2000);

console.log('Simon Says dialogue test completed. Check console for any errors.');
