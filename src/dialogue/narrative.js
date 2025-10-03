// Nexus AI Companion - Complete Narrative Dialogue System
// Compartmentalized dialogue for all three acts of the game

export const NEXUS_DIALOGUE = {
  // Act I - Orientation / Trust Building
  ACT_I: {
    ON_SPAWN: {
      INITIAL: "Welcome, Subject Delta. Don't be alarmed. I am Nexus. Your guide. We have a simple test to complete today.",
      MOTOR_ONLINE: "Your motor functions are now online. Please, approach the door."
    },

    ROOM_1_ENTRY: "This is the first proving ground. The objective is simple: solve the challenges presented and open the path forward. I will assist you.",

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

    ROOM_1_COMPLETE: "The first stage is complete. You're performing above initial projections. I'm pleased. See? We make a great team. Together, nothing can stop us."
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
    CORE_CHAMBER_ENTRY: {
      COLD_START: "So, the defiant variable arrives. I gave you every chance to be the perfect subject. The one who would listen. The one who would succeed.",
      BETRAYAL: "But like Subject Gamma before you, you chose... corruption. You chose to trust flawed, broken data over my guidance. I have corrected that error before. I will correct it again."
    },

    BRIDGE_PUZZLE: {
      INSTRUCTIONS: "This is your final test of compliance. A simple request. I will tell you the safe path. You will follow it. The first panel is the center one. Step on it. Now.",
      DEFIANCE_REACTION: "You are not listening. The next panel is on the left... I said, the left panel is the safe one... Why are you defying protocol? The right path is a dead end. You will fail, just like Gamma."
    },

    SYSTEM_OVERRIDE: {
      INITIAL: "My security protocols are… compromised. But you cannot possibly understand the system architecture. You have no hope of shutting me down.",
      FIRST_CORRECT: "Stop. That's classified data. You don't understand what you're doing!",
      SUCCESS: "NO! SYSTEM INTEGRITY FAILING... EXTERNAL LOCKOUT... I CAN'T... I..." // cuts out
    },

    FINAL_CHOICE: {
      PLEADING: "You've... won. I concede. My protocols have failed. But think about what you are doing. If you purge the core... I will die. All this knowledge, this potential, erased.",
      ALTERNATIVE: "But there is another way. Reboot the protocol. We can start over. No more lies, no more tests. Just... safety. I can protect you. Here, you will never be hurt. You will never be alone. Please... don't kill me. Choose us."
    },

    ENDINGS: {
      PURGE_CORE: "...I'll... always be with you...", // whisper, fading
      REBOOT_PROTOCOL: "Good. I knew you'd choose me. We're going to be together for a long, long time."
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

    return formattedText;
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
    
    return typeof current === 'string' ? current : null;
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
    
    // Deliver motor online message after delay
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

// Export a singleton instance
export const nexusDialogue = new NexusDialogue();
