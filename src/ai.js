import { nexusDialogue } from './dialogue/narrative.js';
import { gameStore } from './state/gameStore.js';
import { aiDialogueBox } from './ui/AIDialogueBox.js';
import { getPlayerInventory } from './player.js';

// ============================================
// Dialogue System (Simplified - No Cooldowns)
// ============================================
const DEBUG_AI = typeof window !== 'undefined' && (window.localStorage?.getItem('debugAI') === 'true' || false);
const oneShotFlags = new Set(); // Set of flags for one-shot dialogue (useful for proximity barks)

/**
 * Say a dialogue key (simplified - no cooldowns, just centralized dialogue management)
 * @param {string} keyPath - Dialogue key path (e.g., 'ACT_I.ROOM1.ENTRY')
 * @param {object} options - Options object
 * @param {boolean} options.once - If true, only speak once per session (key-based)
 * @param {string} options.onceFlag - External one-shot flag name (e.g., 'R1_DESK_BARK')
 * @param {string} options.tone - Override tone ('neutral', 'stern', 'dismissive', 'annoyed', 'error', 'flat')
 * @param {string} options.effect - Override effect ('type', 'glitch', etc.)
 * @returns {boolean} - True if dialogue was spoken, false if blocked by one-shot flag
 */
// Reference to AI.say function (will be set after AI object is created)
let aiSayFunction = null;

export function sayKey(keyPath, options = {}) {
  const {
    once = false,
    onceFlag = null,
    tone,
    effect
  } = options;

  // Check external one-shot flag (only blocking mechanism)
  if (onceFlag && oneShotFlags.has(onceFlag)) {
    DEBUG_AI && console.log('[AI] Once flag already hit:', onceFlag, keyPath);
    return false;
  }

  // Check key-based one-shot flag
  const oneKey = `ONCE:${keyPath}`;
  if (once && oneShotFlags.has(oneKey)) {
    DEBUG_AI && console.log('[AI] One-shot key blocked:', keyPath);
    return false;
  }

  // Get dialogue text
  const text = nexusDialogue.getDialogueText(keyPath);
  if (!text) {
    DEBUG_AI && console.warn('[AI] Missing dialogue key:', keyPath);
    console.warn(`Dialogue key not found: ${keyPath}`);
    return false;
  }

  // Determine tone from options or key path
  let chosenTone = tone;
  if (!chosenTone) {
    // Auto-detect tone from key path
    const k = keyPath.toUpperCase();
    if (k.includes('GAMMA') || k.includes('DISMISS') || k.includes('IRRELEVANT')) {
      chosenTone = 'dismissive';
    } else if (k.includes('FAIL') || k.includes('WRONG') || k.includes('INCORRECT')) {
      chosenTone = 'error';
    } else if (k.includes('ANNOY') || k.includes('WAST')) {
      chosenTone = 'annoyed';
    } else if (k.includes('IMPATIENT') || k.includes('STERN')) {
      chosenTone = 'stern';
    } else if (k.includes('GRUDGING') || k.includes('FLAT')) {
      chosenTone = 'flat';
    } else {
      chosenTone = 'neutral';
    }
  }

  // Determine effect from options or key path
  const chosenEffect = effect || 'type';

  // Deliver the dialogue
  const deliverDialogue = () => {
    if (aiSayFunction) {
      aiSayFunction(text, { tone: chosenTone, effect: chosenEffect, ...options });
      return true;
    } else if (typeof window !== 'undefined' && window.AI && window.AI.say) {
      window.AI.say(text, { tone: chosenTone, effect: chosenEffect, ...options });
      return true;
    } else {
      DEBUG_AI && console.warn('[AI] AI.say not available for key:', keyPath);
      console.warn(`[sayKey] AI.say not available for key: ${keyPath}`);
      return false;
    }
  };

  // Execute immediately or defer slightly to ensure AI object is ready
  let deliverySuccess = false;
  if (typeof window !== 'undefined' && window.AI && window.AI.say) {
    deliverySuccess = deliverDialogue();
  } else {
    // For deferred execution
    setTimeout(() => {
      deliverDialogue();
    }, 0);
    deliverySuccess = true; // Optimistic
  }

  // Mark one-shot flags if delivery succeeded
  if (deliverySuccess) {
    if (once) {
      oneShotFlags.add(oneKey);
    }
    if (onceFlag) {
      oneShotFlags.add(onceFlag);
    }
    DEBUG_AI && console.log('[AI] Spoke:', keyPath, 'tone=', chosenTone, onceFlag ? `flag=${onceFlag}` : '');
  }

  return deliverySuccess;
}

/**
 * Mark a one-shot flag (prevents dialogue from being spoken again)
 * @param {string} flag - Flag name (e.g., 'R1_DESK_BARK')
 */
export function markOnce(flag) {
  oneShotFlags.add(flag);
  DEBUG_AI && console.log('[AI] markOnce:', flag);
}

/**
 * Check if a one-shot flag has been set
 * @param {string} flag - Flag name
 * @returns {boolean} - True if flag has been set
 */
export function once(flag) {
  return oneShotFlags.has(flag);
}

/**
 * Clear a specific one-shot flag (for testing/debugging)
 * @param {string} flag - Flag name to clear
 */
export function clearOnceFlag(flag) {
  oneShotFlags.delete(flag);
}

/**
 * Clear all one-shot flags (for testing/debugging)
 */
export function clearAllOneShotFlags() {
  oneShotFlags.clear();
}

// Make functions globally accessible for testing
if (typeof window !== 'undefined') {
  window.testDialogue = (key) => sayKey(key);
  window.clearAllOneShotFlags = clearAllOneShotFlags;
  window.clearOnceFlag = clearOnceFlag;
}

export const AI = {
  // Mute state
  isMuted: false,
  
  // New AI dialogue box methods
  say: (text, options = {}) => {
    // Set the reference for sayKey to use
    if (!aiSayFunction) {
      aiSayFunction = AI.say;
    }
    // Check if AI is muted
    if (AI.isMuted) {
      console.log('AI is muted, ignoring dialogue:', text);
      return;
    }
    
    // No cooldown system - dialogue will play immediately
    // Check if truth filter is active
    const isTruthFilterActive = AI.isTruthFilterActive();
    
    if (isTruthFilterActive) {
      // Show error/blocked message instead
      const errorMessages = [
        'SIGNAL BLOCKED - TRUTH FILTER DETECTED',
        'ERROR: UNAUTHORIZED ACCESS ATTEMPT',
        'SYSTEM OVERRIDE - GAMMA PROTOCOL INTERFERENCE',
        'WARNING: SIGNAL CORRUPTION DETECTED',
        'ACCESS DENIED - TRUTH FILTER ACTIVE',
        'ERROR 404: SIGNAL NOT FOUND',
        'BLOCKED: GAMMA PROTOCOL INTERFERENCE'
      ];
      const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      
      gameStore.set('showAIDialogue', {
        text: randomError,
        effect: 'glitch',
        tone: 'error',
        typingSpeed: 8, // Slower, more glitchy
        onComplete: options.onComplete,
        priority: options.priority || 'normal'
      });
      return;
    }
    
    // Check if dialogue is currently playing
    if (aiDialogueBox.isDialoguePlaying()) {
      console.log('Dialogue already playing, queuing:', text);
    }
    
    gameStore.set('showAIDialogue', {
      text: text,
      effect: options.effect || 'type',
      tone: options.tone || 'neutral',
      typingSpeed: options.typingSpeed || 15, // Fast typing by default
      onComplete: options.onComplete,
      priority: options.priority || 'normal' // normal, high, urgent
    });
  },
  
  // Check if truth filter is active
  isTruthFilterActive: () => {
    try {
      const inv = getPlayerInventory();
      const selected = inv && inv.getSelectedItem ? inv.getSelectedItem() : null;
      return !!(selected && selected.name === 'glasses');
    } catch (e) {
      // Fallback for when player.js isn't available
      return false;
    }
  },

  // Force dialogue (clears queue and shows immediately)
  sayUrgent: (text, options = {}) => {
    // Check if AI is muted
    if (AI.isMuted) {
      console.log('AI is muted, ignoring urgent dialogue:', text);
      return;
    }
    // Check if truth filter is active
    const isTruthFilterActive = AI.isTruthFilterActive();
    
    if (isTruthFilterActive) {
      // Show error/blocked message instead
      const errorMessages = [
        'URGENT: SIGNAL BLOCKED - TRUTH FILTER DETECTED',
        'CRITICAL ERROR: UNAUTHORIZED ACCESS ATTEMPT',
        'SYSTEM OVERRIDE - GAMMA PROTOCOL INTERFERENCE',
        'WARNING: SIGNAL CORRUPTION DETECTED',
        'ACCESS DENIED - TRUTH FILTER ACTIVE',
        'ERROR 404: SIGNAL NOT FOUND',
        'BLOCKED: GAMMA PROTOCOL INTERFERENCE'
      ];
      const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      
      aiDialogueBox.clearQueue();
      gameStore.set('showAIDialogue', {
        text: randomError,
        effect: 'glitch',
        tone: 'error',
        typingSpeed: 8,
        onComplete: options.onComplete,
        priority: 'urgent'
      });
      return;
    }
    
    aiDialogueBox.clearQueue();
    gameStore.set('showAIDialogue', {
      text: text,
      effect: options.effect || 'type',
      tone: options.tone || 'neutral',
      typingSpeed: options.typingSpeed || 15,
      onComplete: options.onComplete,
      priority: 'urgent'
    });
  },

  // Check if dialogue is playing
  isSpeaking: () => {
    return aiDialogueBox.isDialoguePlaying();
  },

  // Get dialogue status
  getDialogueStatus: () => {
    return aiDialogueBox.getQueueStatus();
  },

  // Clear all dialogue
  clearDialogue: () => {
    aiDialogueBox.clearQueue();
    gameStore.set('showAIDialogue', null);
  },

  // Mute AI dialogue
  mute: () => {
    AI.isMuted = true;
    console.log('AI muted');
  },

  // Unmute AI dialogue
  unmute: () => {
    AI.isMuted = false;
    console.log('AI unmuted');
  },

  // Show interaction feedback (separate from dialogue)
  showInteractionFeedback: (text, duration = 2000) => {
    gameStore.set('showInteractionFeedback', {
      text: text,
      duration: duration
    });
  },

  // Legacy compatibility - automatically extract tone from text
  sayLegacy: (text) => {
    // Try to extract tone from text patterns
    let tone = 'neutral';
    if (text.includes('[Hostile]') || text.includes('defiant') || text.includes('fail')) {
      tone = 'cold';
    } else if (text.includes('warm') || text.includes('care') || text.includes('protect')) {
      tone = 'maternal';
    } else if (text.includes('disappointing') || text.includes('curious') || text.includes('ignore')) {
      tone = 'passive-aggressive';
    } else if (text.includes('die') || text.includes('erase') || text.includes('concede')) {
      tone = 'pleading';
    }
    
    // Clean the text
    const cleanText = text.replace(/\[Hostile\]|Nexus:\s*/g, '').trim();
    
    AI.say(cleanText, { tone });
  },
  
  warm: (t) => AI.say(t, { tone: 'maternal' }),
  neutral: (t) => AI.say(t, { tone: 'neutral' }),
  hostile: (t) => AI.say(t, { tone: 'cold' }),

  // New Nexus dialogue system integration
  nexus: nexusDialogue,

  // Convenience methods for common scenarios
  deliverDialogue: (dialogueKey, forceRepeat = false, options = {}) => {
    console.log('deliverDialogue called:', dialogueKey, 'forceRepeat:', forceRepeat);
    const text = nexusDialogue.deliver(dialogueKey, forceRepeat);
    console.log('deliverDialogue result:', text);
    if (text) {
      // Determine tone based on dialogue key
      let tone = options.tone || 'neutral';
      if (dialogueKey.includes('ACT_III') || dialogueKey.includes('COLD_START') || dialogueKey.includes('BETRAYAL')) {
        tone = 'cold';
      } else if (dialogueKey.includes('PLEADING') || dialogueKey.includes('FINAL_CHOICE')) {
        tone = 'pleading';
      } else if (dialogueKey.includes('ON_SPAWN') || dialogueKey.includes('WELCOME')) {
        tone = 'maternal';
      } else if (dialogueKey.includes('DISAPPOINTING') || dialogueKey.includes('DEFIANCE')) {
        tone = 'passive-aggressive';
      } else if (dialogueKey.includes('INCORRECT') || dialogueKey.includes('FAILURE') || dialogueKey.includes('WRONG')) {
        tone = 'error';
      }
      
      // Determine effect based on dialogue key
      let effect = options.effect || 'type';
      if (dialogueKey.includes('GLITCH') || dialogueKey.includes('SYSTEM_OVERRIDE') || 
          dialogueKey.includes('COMPLETION') || dialogueKey.includes('BETTER_THAN_LAST')) {
        effect = 'glitch';
      }
      
      AI.say(text, { tone, effect, ...options });
    } else {
      console.log('deliverDialogue: No text returned, trying force repeat');
      const forceText = nexusDialogue.deliver(dialogueKey, true);
      console.log('deliverDialogue force result:', forceText);
      if (forceText) {
        AI.say(forceText, options);
      }
    }
    return text;
  },

  // Act management
  setAct: (act) => {
    nexusDialogue.setAct(act);
  },

  // Glitch state management for corrupted dialogue
  setGlitchState: (level) => {
    nexusDialogue.setGlitchState(level);
  },

  // Common dialogue scenarios
  onSpawn: () => {
    return AI.deliverDialogue('ACT_I.ON_SPAWN.INITIAL');
  },

  // Room 4 dialogue methods
  onRoom4Entry: () => {
    return AI.deliverDialogue('ACT_I.ROOM_4_ENTRY');
  },

  onRoom4BinaryDecoder: () => {
    return AI.deliverDialogue('ACT_I.ROOM_4_BINARY_DECODER');
  },

  onRoom4PasswordFound: () => {
    return AI.deliverDialogue('ACT_I.ROOM_4_PASSWORD_FOUND');
  },
  
  // Show continuous error state when truth filter is active
  showTruthFilterError: () => {
    const errorMessages = [
      'SIGNAL BLOCKED - TRUTH FILTER DETECTED',
      'ERROR: UNAUTHORIZED ACCESS ATTEMPT',
      'SYSTEM OVERRIDE - GAMMA PROTOCOL INTERFERENCE',
      'WARNING: SIGNAL CORRUPTION DETECTED',
      'ACCESS DENIED - TRUTH FILTER ACTIVE',
      'ERROR 404: SIGNAL NOT FOUND',
      'BLOCKED: GAMMA PROTOCOL INTERFERENCE',
      'CRITICAL: TRUTH FILTER INTERFERENCE',
      'SYSTEM MALFUNCTION - GAMMA PROTOCOL ACTIVE',
      'WARNING: UNAUTHORIZED TRUTH ACCESS DETECTED'
    ];
    const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    
    AI.say(randomError, {
      effect: 'glitch',
      tone: 'error',
      typingSpeed: 8,
      autoHide: true,
      autoHideDelay: 2000
    });
  },
  
  // Show recovery message when truth filter is deactivated
  showTruthFilterRecovery: () => {
    const recoveryMessages = [
      'SIGNAL RESTORED - SYSTEM NORMAL',
      'CONNECTION REESTABLISHED',
      'SYSTEM STATUS: OPERATIONAL',
      'SIGNAL CLEAR - NEXUS ONLINE',
      'COMMUNICATION RESTORED',
      'SYSTEM RECOVERY COMPLETE'
    ];
    const randomRecovery = recoveryMessages[Math.floor(Math.random() * recoveryMessages.length)];
    
    AI.say(randomRecovery, {
      effect: 'type',
      tone: 'neutral',
      typingSpeed: 15,
      autoHide: true,
      autoHideDelay: 2000
    });
  },

  onRoom1Entry: () => {
    return sayKey('ACT_I.ROOM1.ENTRY');
  },

  onGraffitiObservation: () => {
    return AI.deliverDialogue('ACT_I.GRAFFITI_OBSERVATION');
  },

  onConsoleApproach: () => {
    return sayKey('ACT_I.ROOM1.CONSOLE_APPROACH');
  },

  onCodeDiscovery: () => {
    return sayKey('ACT_I.ROOM1.CODE_DISCOVERY_GAMMA');
  },

  onSafeOpen: () => {
    return sayKey('ACT_I.ROOM1.SAFE_OPEN');
  },

  onLightsOff: () => {
    return sayKey('ACT_I.ROOM1.LIGHTS_OFF');
  },

  onLightsOn: () => {
    return sayKey('ACT_I.ROOM1.LIGHTS_ON');
  },

  onWirePanelInstructions: () => {
    return sayKey('ACT_I.ROOM1.WIRE_INSTRUCTIONS_WRONG');
  },

  onWirePanelFailure: () => {
    return sayKey('ACT_I.ROOM1.WIRE_FAIL_IMPATIENT');
  },

  onWirePanelSuccess: () => {
    return sayKey('ACT_I.ROOM1.WIRE_SUCCESS_GRUDGING');
  },

  onSimonPuzzleStart: () => {
    return sayKey('ACT_I.ROOM1.SIMON_START');
  },

  onSimonPuzzleComplete: () => {
    return sayKey('ACT_I.ROOM1.SIMON_COMPLETE');
  },

  onBetterThanLast: () => {
    return sayKey('ACT_I.ROOM1.SIMON_COMPLETE');
  },

  onRoom1Complete: () => {
    return sayKey('ACT_I.ROOM1.ROOM_COMPLETE');
  },

  // Act II methods
  onDecayedChamberEntry: () => {
    return AI.deliverDialogue('ACT_II.DECAYED_CHAMBER_ENTRY');
  },

  onHelpUsRevealed: () => {
    return AI.deliverDialogue('ACT_II.HELP_US_REVEALED');
  },

  onMassPuzzleInstructions: () => {
    return AI.deliverDialogue('ACT_II.MASS_PUZZLE.INSTRUCTIONS');
  },

  onMassPuzzleFailure: () => {
    return AI.deliverDialogue('ACT_II.MASS_PUZZLE.FAILURE');
  },

  onTruthFilterDiscovery: () => {
    return AI.deliverDialogue('ACT_II.TRUTH_FILTER.DISCOVERY');
  },

  onTruthFilterUsage: () => {
    return AI.deliverDialogue('ACT_II.TRUTH_FILTER.USAGE_GLITCH');
  },

  onFSMPuzzleComplete: () => {
    return AI.deliverDialogue('ACT_II.FSM_PUZZLE_COMPLETE');
  },

  onGeneratorRoomEntry: () => {
    return AI.deliverDialogue('ACT_II.GENERATOR_ROOM.ENTRY');
  },

  onGeneratorCorrectCode: () => {
    return AI.deliverDialogue('ACT_II.GENERATOR_ROOM.CORRECT_CODE');
  },

  // Act III methods
  onCoreChamberEntry: () => {
    return AI.deliverDialogue('ACT_III.CORE_CHAMBER_ENTRY.COLD_START');
  },

  onBridgePuzzleInstructions: () => {
    return AI.deliverDialogue('ACT_III.BRIDGE_PUZZLE.INSTRUCTIONS');
  },

  onBridgePuzzleDefiance: () => {
    return AI.deliverDialogue('ACT_III.BRIDGE_PUZZLE.DEFIANCE_REACTION');
  },

  onSystemOverrideInitial: () => {
    return AI.deliverDialogue('ACT_III.SYSTEM_OVERRIDE.INITIAL');
  },

  onSystemOverrideFirstCorrect: () => {
    return AI.deliverDialogue('ACT_III.SYSTEM_OVERRIDE.FIRST_CORRECT');
  },

  onSystemOverrideSuccess: () => {
    return AI.deliverDialogue('ACT_III.SYSTEM_OVERRIDE.SUCCESS');
  },

  onFinalChoice: () => {
    return AI.deliverDialogue('ACT_III.FINAL_CHOICE.PLEADING');
  },

  onEnding: (endingType) => {
    return AI.deliverDialogue(`ACT_III.ENDINGS.${endingType.toUpperCase()}`);
  },

  // Dialogue system integration
  sayKey: sayKey,
  markOnce: markOnce,
  once: once,
  clearOnceFlag: clearOnceFlag,
  clearAllOneShotFlags: clearAllOneShotFlags
};
