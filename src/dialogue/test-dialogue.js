// Test script for the new dialogue system
import { AI } from '../ai.js';

// Test basic dialogue delivery
console.log('Testing Nexus Dialogue System...');

// Test Act I dialogue
console.log('=== ACT I TESTS ===');
AI.onSpawn();
setTimeout(() => AI.onRoom1Entry(), 1000);
setTimeout(() => AI.onSafeOpen(), 2000);
setTimeout(() => AI.onWirePanelInstructions(), 3000);
setTimeout(() => AI.onWirePanelSuccess(), 4000);
setTimeout(() => AI.onRoom1Complete(), 5000);

// Test Act II dialogue (with glitch effects)
setTimeout(() => {
  console.log('=== ACT II TESTS ===');
  AI.setAct('ACT_II');
  AI.setGlitchState(1);
  AI.onDecayedChamberEntry();
  AI.onHelpUsRevealed();
  AI.onTruthFilterUsage();
}, 6000);

// Test Act III dialogue (with major corruption)
setTimeout(() => {
  console.log('=== ACT III TESTS ===');
  AI.setAct('ACT_III');
  AI.setGlitchState(2);
  AI.onCoreChamberEntry();
  AI.onSystemOverrideInitial();
  AI.onFinalChoice();
}, 8000);

console.log('Dialogue system test completed. Check console for any errors.');
