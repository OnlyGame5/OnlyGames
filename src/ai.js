import { nexusDialogue } from './dialogue/narrative.js';

export const AI = {
  // Legacy methods for backward compatibility
  say: (text) => {
    const d = document.getElementById('dialogue');
    if (d) d.textContent = text;
  },
  
  warm: (t) => AI.say("Nexus: " + t),
  neutral: (t) => AI.say("Nexus: " + t),
  hostile: (t) => AI.say("[Hostile] Nexus: " + t),

  // New Nexus dialogue system integration
  nexus: nexusDialogue,

  // Convenience methods for common scenarios
  deliverDialogue: (dialogueKey, forceRepeat = false) => {
    console.log('deliverDialogue called:', dialogueKey, 'forceRepeat:', forceRepeat);
    const text = nexusDialogue.deliver(dialogueKey, forceRepeat);
    console.log('deliverDialogue result:', text);
    if (text) {
      AI.say(text);
    } else {
      console.log('deliverDialogue: No text returned, trying force repeat');
      const forceText = nexusDialogue.deliver(dialogueKey, true);
      console.log('deliverDialogue force result:', forceText);
      if (forceText) {
        AI.say(forceText);
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
