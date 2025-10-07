import { nexusDialogue } from './dialogue/narrative.js';
import { gameStore } from './state/gameStore.js';
import { aiDialogueBox } from './ui/AIDialogueBox.js';
import { getPlayerInventory } from './player.js';

export const AI = {
  // New AI dialogue box methods
  say: (text, options = {}) => {
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
    return AI.deliverDialogue('ACT_I.ROOM_1_ENTRY');
  },

  onGraffitiObservation: () => {
    return AI.deliverDialogue('ACT_I.GRAFFITI_OBSERVATION');
  },

  onConsoleApproach: () => {
    return AI.deliverDialogue('ACT_I.CONSOLE_APPROACH');
  },

  onCodeDiscovery: () => {
    return AI.deliverDialogue('ACT_I.CODE_DISCOVERY');
  },

  onSafeOpen: () => {
    return AI.deliverDialogue('ACT_I.SAFE_OPEN');
  },

  onLightsOff: () => {
    return AI.deliverDialogue('ACT_I.LIGHTS_OFF');
  },

  onLightsOn: () => {
    return AI.deliverDialogue('ACT_I.LIGHTS_ON');
  },

  onWirePanelInstructions: () => {
    return AI.deliverDialogue('ACT_I.WIRE_PANEL.INSTRUCTIONS');
  },

  onWirePanelFailure: () => {
    return AI.deliverDialogue('ACT_I.WIRE_PANEL.FAILURE');
  },

  onWirePanelSuccess: () => {
    return AI.deliverDialogue('ACT_I.WIRE_PANEL.SUCCESS');
  },

  onSimonPuzzleStart: () => {
    return AI.deliverDialogue('ACT_I.SIMON_PUZZLE.START');
  },

  onSimonPuzzleComplete: () => {
    return AI.deliverDialogue('ACT_I.SIMON_PUZZLE.COMPLETION');
  },

  onBetterThanLast: () => {
    return AI.deliverDialogue('ACT_I.SIMON_PUZZLE.BETTER_THAN_LAST');
  },

  onRoom1Complete: () => {
    return AI.deliverDialogue('ACT_I.ROOM_1_COMPLETE');
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
  }
};
