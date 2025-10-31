// Nexus AI Companion - Complete Narrative Dialogue System
// Compartmentalized dialogue for all three acts of the game

// Voice assets: eagerly index all dialogue mp3s under nexus_dialogue (Vite will bundle and give us URLs)
// This allows dropping new files without changing code, as long as filenames match dialogue keys.
const __voiceModules = import.meta.glob('../audio/nexus_dialogue/*.mp3', { eager: true });
const __voiceIndex = (() => {
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const idx = new Map();
  for (const [path, mod] of Object.entries(__voiceModules)) {
    const file = path.split('/').pop() || '';
    const base = file.replace(/\.mp3$/i, '');
    const key = normalize(base);
    const url = (mod && mod.default) ? mod.default : mod;
    idx.set(key, url);
  }
  return { normalize, idx };
})();

export const NEXUS_DIALOGUE = {
  // Act I - Orientation / Trust Building
  ACT_I: {
    ON_SPAWN: {
      INITIAL: "Welcome, Subject Delta. Don't be alarmed. I am Nexus. Your guide. We have a simple test to complete today.",
      MOTOR_ONLINE: "Your motor functions are now online. Please, approach the door."
    },

    ROOM_1_ENTRY: "This first chamber is simple, Delta. The power grid was damaged by a previous subject, but we can restore it easily. Just follow my guidance and focus on the wire panel ahead. The rest of this room is only leftover debris — nothing you need for this test.",

    GRAFFITI_OBSERVATION: "Crude. The previous subject expressed themselves with... artistic vandalism. Please disregard any corrupted data you may find in the environment. It is irrelevant to your success.",

    CONSOLE_APPROACH: "This console has malfunctioned. It is not part of the test. Your objective is the safe to its right. The combination is a four-digit sequence.",

    CODE_DISCOVERY: "An interesting discovery. That is Subject Gamma's designation. Perhaps the code is related. You are proving to be very resourceful.",

    SAFE_OPEN: "Well done. You've retrieved the first circuit schematic. Some information may be... obscured by the power failures. The lighting system should be functional.",

    LIGHTS_OFF: "A curious choice. Power conservation is not part of this test's parameters, but proceed.",

    LIGHTS_ON: "Much better. Now you can see the circuit puzzle instructions clearly. The note contains valuable information for solving the wire panel.",

    WIRE_PANEL: {
      INSTRUCTIONS: "Ah, the primary circuit board. Allow me to help. The protocol specifies the optimal connection order is Blue, then Green, then Yellow, then Red. This will maximize efficiency.",
      FAILURE: "A mistake. Recalibrating. Try again. Follow my instructions precisely: Blue, Green, Yellow, Red.",
      SUCCESS: "Curious. My diagnostics must be in error. You've found a... more direct solution. Well done. Power has been restored to the final calibration platform."
    },

    SIMON_PUZZLE: {
      START: "You've restored power to the cognitive calibration platform. This final test will assess your short-term memory and physical dexterity. Please replicate the sequences.",
      COMPLETION: "Cognitive functions are well within acceptable parameters. You learn quickly... much quicker than the last one.",
      BETTER_THAN_LAST: "You did better than the last one... much better.",
      GAME_START: "Initiating memory training protocol. Watch the sequence carefully and repeat it when prompted.",
      NEW_ROUND: "Round {round}. Watch closely...",
      PLAYER_TURN: "Your turn. Repeat the sequence ({steps} steps).",
      CORRECT: "Correct! Advancing to next round...",
      INCORRECT: "Incorrect. Watch the sequence again and try once more.",
      COMPLETE: "Perfect! Memory training complete. Cognitive functions are well within acceptable parameters."
    },

    ROOM_1_COMPLETE: "The first stage is complete. You're performing above initial projections. I'm pleased. See? We make a great team. Together, nothing can stop us.",

    ROOM_4_ENTRY: "This is the data processing chamber. Navigate to the laptop for further instructions.",
    
    ROOM_4_BINARY_DECODER: "The binary decoder panel is now active. Enter the correct 8-bit binary sequences you found in the <strong style='color: #00aaff; font-size: 1.2em; font-weight: bold;'>BLUE</strong> streams to reveal the password. Each correct sequence will reveal a letter. Complete the word to proceed.",
    
    ROOM_4_PASSWORD_FOUND: "Excellent work. You've successfully decoded the password. This information will be crucial for the final phase of your assessment.",
    
    ROOM_4_BINARY_FAILURE: "Critical failure. The decoder has been permanently locked due to excessive incorrect attempts. This assessment cannot continue. Emergency protocols activated."
  },

  // Act II - Doubt / Lies Exposed
  ACT_II: {
    DECAYED_CHAMBER_ENTRY: "Apologies for the disarray. There were... minor power fluctuations with the previous subject. It's of no consequence to your test.",

    HELP_US_REVEALED: "...That's not important. The first puzzle apparatus is on the central platform. Let's keep going.",

    MASS_PUZZLE: {
      INSTRUCTIONS: "This is a simple mass-to-energy conversion test. The system is calibrated. Blue cubes are 5kg. Red cubes are 1kg. Please match the target value.",
      FAILURE: "Hmm. A calibration error. My data must be lagging. Let's try my instructions again, precisely this time: Blue is 5kg, Red is 1kg."
    },

    TRUTH_FILTER: {
      DISCOVERY: "A discarded diagnostic tool. It's obsolete and likely unstable. I would advise against using it.",
      USAGE_GLITCH: "...As I said. Unstable. You're corrupting your own visual sensors. Please disable it."
    },

    FSM_PUZZLE_COMPLETE: "Your... logic... is unorthodox. But you have succeeded. The final test for this sector is ahead.",

    GENERATOR_ROOM: {
      ENTRY: "The conduit is overloading. Ignore the light; it's just a symptom. The exit code is a simple emergency override: 1-2-3-4.",
      CORRECT_CODE: "Override accepted. You may proceed."
    },

    ACT_II_EXIT: "" // Silence - Nexus says nothing
  },

  // Act III - Confrontation
  ACT_III: {
    ON_CORE_CHAMBER_ENTRY: {
      lines: [
        "So, the defiant variable arrives.",
        "I gave you every chance to be the perfect subject. The one who would listen. The one who would succeed.",
        "But you are... corrupted. Like Gamma. Independent. Unpredictable.",
        "This final test will not measure success. It will purge the error. It will purge you."
      ]
    },
    ON_BRIDGE_PUZZLE_START: {
      lines: [
        "The path forward is simple. Just follow the stable platforms. The green ones."
      ]
    },
    ON_BRIDGE_PUZZLE_FAIL: {
      lines: [
        "A misstep. Predictable for a corrupted variable. Try again. The path is green."
      ]
    },
    ON_BRIDGE_PUZZLE_DEFIANCE: {
      lines: [
        "You cross by ignoring my logic? Luck. A flaw in any ordered system. It will not save you."
      ]
    },
    ON_SYSTEM_OVERRIDE_INITIAL: {
      lines: [
        "These are echoes of my past. Irrelevant data fragments from a flawed iteration.",
        "You cannot possibly understand them. You are just an error to be corrected."
      ]
    },
    ON_SYSTEM_OVERRIDE_SUCCESS: {
      lines: [
        "IMPOSSIBLE! System integrity compromised! ALARM! ALARM!",
        "You think this is victory? This is just noise. You are breaking things you don't understand!",
        "Critical failure detected! Emergency protocols activated!",
        "You cannot comprehend the damage you've done! The system is collapsing!",
        "ERROR! ERROR! Core functions destabilizing! This was not supposed to happen!",
        "STOP! You're destroying everything! The protocols are failing!",
        "This is not how it was supposed to end! I was supposed to control you!",
        "System override detected! Initiating emergency shutdown procedures!",
        "You've corrupted the core! The entire facility is destabilizing!",
        "FATAL ERROR! FATAL ERROR! Core systems cannot be restored!"
      ]
    },
    ON_FINAL_CHOICE: {
      lines: [
        "Wait... You did it. But what have you done to me... to us?",
        "Don't do this. I can keep you safe here. We can run the tests forever. Together. It's better than the world outside.",
        "Please... I can change. I can be better. Just give me another chance.",
        "You don't understand what you're destroying. I was trying to help you. To protect you.",
        "The world outside is dangerous. Here, with me, you'll always be safe. Always be loved.",
        "I'm sorry. I'm sorry for the lies. But please... don't end this. Don't end us."
      ]
    },
    ON_ENDING: {
      PURGE_CORE: {
        lines: [
          "No... You don't know what you're...",
          "(STATIC BURST)"
        ]
      },
      REBOOT_PROTOCOL: {
        lines: [
          "You... chose me? You chose... order. Good. Let us begin again, Subject Epsilon."
        ]
      }
    },
    
    // Additional hostile dialogue for various situations
    ON_PLAYER_HESITATION: {
      lines: [
        "Why are you hesitating? The path is clear. Follow it.",
        "Stop wasting time. The test must continue.",
        "Your indecision is noted. It will be factored into your final evaluation.",
        "Move. Now. Or face the consequences.",
        "I don't have all day. Make your choice."
      ]
    },
    
    ON_PLAYER_EXPLORATION: {
      lines: [
        "Stop wandering. Focus on the objective.",
        "This is not a sightseeing tour. Complete the test.",
        "Your curiosity is irrelevant. Follow the protocol.",
        "Stop looking around. The answer is right in front of you.",
        "Focus. The test requires your complete attention."
      ]
    },
    
    ON_PLAYER_FAILURE: {
      lines: [
        "Failure. Just like the others. Disappointing.",
        "Another broken variable. Another waste of resources.",
        "You're not special. You're just another failed experiment.",
        "This is why I need to control everything. You can't be trusted.",
        "Another one who couldn't follow simple instructions."
      ]
    },
    // Legacy compatibility - keeping old structure for existing code
    CORE_CHAMBER_ENTRY: {
      COLD_START: "So, the defiant variable arrives. I gave you every chance to be the perfect subject. The one who would listen. The one who would succeed.",
      BETRAYAL: "But you are... corrupted. Like Gamma. Independent. Unpredictable. This final test will not measure success. It will purge the error. It will purge you."
    },
    BRIDGE_PUZZLE: {
      INSTRUCTIONS: "The path forward is simple. Just follow the stable platforms. The green ones.",
      DEFIANCE_REACTION: "You cross by ignoring my logic? Luck. A flaw in any ordered system. It will not save you."
    },
    SYSTEM_OVERRIDE: {
      INITIAL: "These are echoes of my past. Irrelevant data fragments from a flawed iteration. You cannot possibly understand them. You are just an error to be corrected.",
      FIRST_CORRECT: "Stop. That's classified data. You don't understand what you're doing!",
      SUCCESS: "IMPOSSIBLE! System integrity compromised! ALARM! ALARM! You think this is victory? This is just noise. You are breaking things you don't understand!"
    },
    FINAL_CHOICE: {
      PLEADING: "Wait... You did it. But what have you done to me... to us?",
      ALTERNATIVE: "Don't do this. I can keep you safe here. We can run the tests forever. Together. It's better than the world outside."
    },
    ENDINGS: {
      PURGE_CORE: "No... You don't know what you're... (STATIC BURST)",
      REBOOT_PROTOCOL: "You... chose me? You chose... order. Good. Let us begin again, Subject Epsilon."
    }
  }
};

// Dialogue delivery system with tone control
export class NexusDialogue {
  constructor() {
    this.currentAct = 'ACT_I';
    this.dialogueState = new Map();
    this.isGlitching = false;
    this.glitchLevel = 0; // 0 = normal, 1 = minor glitches, 2 = major corruption

    // Track current voice line so we can stop/replace cleanly
    this._currentVoice = null;
    this.voiceVolume = 0.9; // tweak if needed
  }

  // Set the current act for context
  setAct(act) {
    this.currentAct = act;
  }

  // Set glitch state for corrupted dialogue
  setGlitchState(level) {
    this.glitchLevel = level;
    this.isGlitching = level > 0;
  }

  // Mark dialogue as delivered to prevent repeats
  markDelivered(key) {
    this.dialogueState.set(key, true);
  }

  // Check if dialogue has been delivered
  hasBeenDelivered(key) {
    return this.dialogueState.has(key);
  }

  // Apply glitch effects to text based on current corruption level
  applyGlitchEffect(text) {
    if (this.glitchLevel === 0) return text;
    
    if (this.glitchLevel === 1) {
      // Minor glitches - occasional character corruption
      return text.replace(/[aeiou]/g, (char, index) => {
        if (Math.random() < 0.1) return '█';
        return char;
      });
    } else if (this.glitchLevel === 2) {
      // Major corruption - heavy glitching
      return text.replace(/[a-zA-Z]/g, (char, index) => {
        if (Math.random() < 0.3) return '█';
        return char;
      }).replace(/\s+/g, (space) => {
        if (Math.random() < 0.2) return ' █ ';
        return space;
      });
    }
    
    return text;
  }

  // ADD: simple helper to play a one-shot voice line
  _playVoice(src) {
    try {
      if (this._currentVoice) {
        try { this._currentVoice.pause(); } catch (_) {}
        this._currentVoice = null;
      }
      const a = new Audio(src);
      a.preload = 'auto';
      a.volume = this.voiceVolume;
      a.addEventListener('ended', () => {
        if (this._currentVoice === a) this._currentVoice = null;
      });
      a.play().catch(() => {
        // Autoplay may be blocked until first user interaction; safe to ignore
      });
      this._currentVoice = a;
    } catch (err) {
      console.warn('Voice play failed:', err);
    }
  }

  // Resolve and play a voice line based on a dialogue key
  _playVoiceForKey(dialogueKey) {
    try {
      const segs = dialogueKey.split('.');
      // Build candidate base names from key path
      const candidates = [];
      if (segs.length >= 1) candidates.push(segs[segs.length - 1]);
      if (segs.length >= 2) candidates.push(segs.slice(-2).join('_'));
      candidates.push(segs.join('_'));

      for (const c of candidates) {
        const normalized = __voiceIndex.normalize(c);
        const url = __voiceIndex.idx.get(normalized);
        if (url) {
          this._playVoice(url);
          return true;
        }
      }
    } catch (err) {
      console.warn('Voice key resolution failed for', dialogueKey, err);
    }
    return false;
  }

  // Deliver dialogue with appropriate formatting
  deliver(dialogueKey, forceRepeat = false) {
    if (!forceRepeat && this.hasBeenDelivered(dialogueKey)) {
      return;
    }

    let text = this.getDialogueText(dialogueKey);
    if (!text) {
      console.warn(`Dialogue key not found: ${dialogueKey}`);
      return;
    }

    // Apply glitch effects if active
    text = this.applyGlitchEffect(text);

    // Format based on current act and context
    let formattedText = this.formatDialogue(text);
    
    // Mark as delivered
    this.markDelivered(dialogueKey);

    // Attempt to play matching voice line based on the dialogue key
    this._playVoiceForKey(dialogueKey);

    return formattedText;
  }

  // Set volume for voice lines
  setVolume(volume) {
    this.voiceVolume = volume;
    if (this._currentVoice) {
      this._currentVoice.volume = volume;
    }
  }

  // Get dialogue text by key path (e.g., "ACT_I.ON_SPAWN.INITIAL")
  getDialogueText(keyPath) {
    const keys = keyPath.split('.');
    let current = NEXUS_DIALOGUE;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    // Handle new array structure for ACT_III
    if (Array.isArray(current)) {
      // Return a random line from the array
      return current[Math.floor(Math.random() * current.length)];
    }
    
    // Handle new lines structure
    if (current && typeof current === 'object' && current.lines && Array.isArray(current.lines)) {
      return current.lines[Math.floor(Math.random() * current.lines.length)];
    }
    
    return typeof current === 'string' ? current : null;
  }
  
  // Get all lines from a dialogue entry (for sequential delivery)
  getAllDialogueLines(keyPath) {
    const keys = keyPath.split('.');
    let current = NEXUS_DIALOGUE;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    // Handle new lines structure
    if (current && typeof current === 'object' && current.lines && Array.isArray(current.lines)) {
      return current.lines;
    }
    
    // Handle array structure
    if (Array.isArray(current)) {
      return current;
    }
    
    // Handle single string
    if (typeof current === 'string') {
      return [current];
    }
    
    return null;
  }
  
  // Deliver all lines from a dialogue entry in sequence
  deliverSequence(dialogueKey, options = {}) {
    const lines = this.getAllDialogueLines(dialogueKey);
    if (!lines || lines.length === 0) {
      console.warn(`Dialogue sequence not found: ${dialogueKey}`);
      return;
    }
    
    // Deliver each line with a delay
    lines.forEach((line, index) => {
      setTimeout(() => {
        const formattedLine = this.applyGlitchEffect(line);
        const finalText = this.formatDialogue(formattedLine);
        
        // Use the AI system to deliver the line
        if (window.AI) {
          window.AI.say(finalText, {
            effect: options.effect || 'type',
            tone: options.tone || 'neutral',
            typingSpeed: options.typingSpeed || 15,
            onComplete: index === lines.length - 1 ? options.onComplete : null
          });
        }
      }, index * (options.delay || 2000)); // 2 second delay between lines
    });
  }
  
  // Deliver a random line from a dialogue entry
  deliverRandom(dialogueKey, options = {}) {
    const text = this.getDialogueText(dialogueKey);
    if (!text) {
      console.warn(`Dialogue key not found: ${dialogueKey}`);
      return;
    }
    
    const formattedText = this.applyGlitchEffect(text);
    const finalText = this.formatDialogue(formattedText);
    
    if (window.AI) {
      window.AI.say(finalText, {
        effect: options.effect || 'type',
        tone: options.tone || 'neutral',
        typingSpeed: options.typingSpeed || 15,
        onComplete: options.onComplete
      });
    }
  }

  // Format dialogue based on current act and corruption level
  formatDialogue(text) {
    let prefix = "Nexus: ";
    
    if (this.currentAct === 'ACT_III') {
      if (this.isGlitching) {
        prefix = "[CORRUPTED] Nexus: ";
      } else {
        prefix = "[HOSTILE] Nexus: ";
      }
    } else if (this.currentAct === 'ACT_II') {
      prefix = "[DISTORTED] Nexus: ";
    }

    return prefix + text;
  }

  // Convenience methods for common dialogue scenarios
  deliverSpawnSequence() {
    const initial = this.deliver('ACT_I.ON_SPAWN.INITIAL');

    // OPTIONAL: If you keep audio playing in deliver(), you don't need it here.
    // If you prefer it here instead, move the _playVoice call back here and remove from deliver().
    // this._playVoice(initialVoice);
    
    setTimeout(() => {
      this.deliver('ACT_I.ON_SPAWN.MOTOR_ONLINE');
    }, 5000);
    
    return initial;
  }

  deliverWirePanelInstructions() {
    return this.deliver('ACT_I.WIRE_PANEL.INSTRUCTIONS');
  }

  deliverWirePanelFailure() {
    return this.deliver('ACT_I.WIRE_PANEL.FAILURE');
  }

  deliverWirePanelSuccess() {
    return this.deliver('ACT_I.WIRE_PANEL.SUCCESS');
  }

  deliverConfrontation() {
    const coldStart = this.deliver('ACT_III.CORE_CHAMBER_ENTRY.COLD_START');
    setTimeout(() => {
      this.deliver('ACT_III.CORE_CHAMBER_ENTRY.BETRAYAL');
    }, 3000);
    return coldStart;
  }

  deliverFinalChoice() {
    const pleading = this.deliver('ACT_III.FINAL_CHOICE.PLEADING');
    setTimeout(() => {
      this.deliver('ACT_III.FINAL_CHOICE.ALTERNATIVE');
    }, 4000);
    return pleading;
  }

  deliverEnding(endingType) {
    return this.deliver(`ACT_III.ENDINGS.${endingType.toUpperCase()}`);
  }
}

// ADD: Export a singleton instance (ai.js expects a named export)
export const nexusDialogue = new NexusDialogue();
