import { EventEmitter } from '../../utils/EventEmitter.js';

export class AI extends EventEmitter {
  constructor() {
    super();
    this.dialogueElement = null;
    this.setupDialogueElement();
  }

  setupDialogueElement() {
    // Create dialogue element if it doesn't exist
    if (!document.getElementById('dialogue')) {
      this.dialogueElement = document.createElement('div');
      this.dialogueElement.id = 'dialogue';
      this.dialogueElement.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: #ffffff;
        padding: 15px;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        z-index: 1000;
        max-width: 600px;
        margin: 0 auto;
        border: 1px solid #333;
      `;
      document.body.appendChild(this.dialogueElement);
    } else {
      this.dialogueElement = document.getElementById('dialogue');
    }
  }

  say(text) {
    if (this.dialogueElement) {
      this.dialogueElement.textContent = "AI Companion: " + text;
      this.emit('dialogue', text);
    }
  }

  warm(text) {
    this.say(text);
  }

  neutral(text) {
    this.say(text);
  }

  hostile(text) {
    this.say("[Hostile] " + text);
  }

  clear() {
    if (this.dialogueElement) {
      this.dialogueElement.textContent = "";
    }
  }

  destroy() {
    if (this.dialogueElement && this.dialogueElement.parentNode) {
      this.dialogueElement.parentNode.removeChild(this.dialogueElement);
    }
    this.dialogueElement = null;
  }
}

// Create global instance
export const ai = new AI();
