// Test script for Room 1 entry dialogue flow
import { AI } from '../ai.js';

console.log('Testing Room 1 Entry Dialogue Flow...');

// Simulate hallway dialogue (what happens when door opens)
console.log('=== HALLWAY DIALOGUE ===');
AI.say("The door opens, granting you access to the hallway. Walk through to reach the first challenge room.");

// Wait a bit, then simulate entering Room 1
setTimeout(() => {
  console.log('=== ROOM 1 ENTRY (should replace hallway dialogue) ===');
  AI.onRoom1Entry();
}, 2000);

console.log('Room entry dialogue test completed. The Room 1 dialogue should replace the hallway dialogue.');
