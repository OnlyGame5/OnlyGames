import { gameStore } from '../state/gameStore.js';

export class MemoryPanel {
  constructor(rounds = 6) {
    this.rounds = rounds;
    this.container = null;
    this.overlay = null;
    this.audioContext = null;
    
    // Game configuration
    this.config = {
      startLength: 1,
      maxRoundsToWin: rounds,
      baseStepMs: 650,
      minStepMs: 250,
      accelPerRound: 35,
      interFlashGap: 110,
      strict: false,
      tonesHz: [440, 523, 659, 784]
    };
    
    // Game state
    this.sequence = [];
    this.inputIndex = 0;
    this.round = 0;
    this.best = 0;
    this.playingBack = false;
    this.log = "Press Start to begin.";
    this.showCongrats = false;
    
    this.pads = [];
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Listen for game store changes
    gameStore.subscribe('showMemoryUI', (show) => {
      if (show) {
        this.show();
      } else {
        this.hide();
      }
    });
  }
  
  show() {
    if (this.overlay) return; // Already showing
    
    this.createUI();
    document.body.appendChild(this.overlay);
    
    // Add keyboard listeners
    this.keyboardHandler = this.handleKeyboard.bind(this);
    window.addEventListener('keydown', this.keyboardHandler);
  }
  
  hide() {
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
    
    if (this.keyboardHandler) {
      window.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
  }
  
  createUI() {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(3, 6, 12, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1000;
    `;
    
    // Prevent cursor lock when clicking on overlay
    this.overlay.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    this.overlay.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    const card = document.createElement('div');
    card.style.cssText = `
      width: min(92vw, 560px);
      background: linear-gradient(180deg, #0f1523, #0a0f1a);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 18px 18px 22px;
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.6);
      color: #e8eeff;
    `;
    
    // Prevent cursor lock when clicking on card
    card.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    card.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    `;
    
    const title = document.createElement('div');
    title.style.cssText = `font-weight: 800;`;
    title.textContent = '🧠 Memory Puzzle';
    
    const chip = document.createElement('div');
    chip.style.cssText = `
      display: inline-flex;
      gap: 8px;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: #0c1220;
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 12px;
      color: #9aa7bf;
    `;
    
    const dot = document.createElement('span');
    dot.style.cssText = `
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #34d399;
      box-shadow: 0 0 10px #34d399aa;
    `;
    
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(' AI: "Don\'t worry, I\'ll keep this simple."'));
    
    header.appendChild(title);
    header.appendChild(chip);
    
    // Stats
    const stats = document.createElement('div');
    stats.style.cssText = `
      display: flex;
      gap: 12px;
      color: #9aa7bf;
      font-size: 13px;
      margin-bottom: 6px;
    `;
    
    this.roundDisplay = document.createElement('div');
    this.roundDisplay.innerHTML = 'Round: <b>0</b>';
    
    this.speedDisplay = document.createElement('div');
    this.speedDisplay.innerHTML = 'Speed: <b>650ms</b>';
    
    this.bestDisplay = document.createElement('div');
    this.bestDisplay.innerHTML = 'Best: <b>0</b>';
    
    stats.appendChild(this.roundDisplay);
    stats.appendChild(this.speedDisplay);
    stats.appendChild(this.bestDisplay);
    
    // Simon pads grid
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
      margin: 14px 0 18px;
    `;
    grid.setAttribute('aria-label', 'Simon Pads');
    
    const colors = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'];
    this.pads = [];
    
    for (let i = 0; i < 4; i++) {
      const bezel = document.createElement('div');
      bezel.style.cssText = `
        position: relative;
        aspect-ratio: 1/1;
        border-radius: 22px;
        padding: 14px;
        background: radial-gradient(120% 120% at 20% 15%, rgba(255,255,255,0.08), transparent 40%),
                   linear-gradient(145deg, #2a3144, #1c2233 55%);
        box-shadow: inset 0 2px 6px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.05), 0 10px 24px rgba(0,0,0,0.45);
        border: 1px solid rgba(255, 255, 255, 0.06);
      `;
      
      const pad = document.createElement('div');
      pad.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 24px;
        clip-path: polygon(50% 5%, 93% 50%, 50% 95%, 7% 50%);
        background: ${colors[i]}20;
        box-shadow: inset 0 8px 18px rgba(255,255,255,0.04), inset 0 -10px 22px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.08);
        transition: transform 0.1s ease, background 0.2s ease, box-shadow 0.2s ease;
      `;
      
      pad.style.setProperty('--on', colors[i]);
      pad.style.setProperty('--base-color', colors[i]);
      
      // Add pseudo-element for highlight effect
      const highlight = document.createElement('div');
      highlight.style.cssText = `
        position: absolute;
        inset: 0;
        border-radius: 24px;
        clip-path: inherit;
        background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.25) 100%),
                   repeating-linear-gradient(transparent 0 6px, rgba(255,255,255,0.03) 6px 7px);
        mix-blend-mode: screen;
        pointer-events: none;
      `;
      
      pad.appendChild(highlight);
      bezel.appendChild(pad);
      grid.appendChild(bezel);
      
      this.pads.push(pad);
      
      // Add click handler
      pad.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleInput(i);
      });
      pad.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        pad.style.transform = 'translateY(1px) scale(0.99)';
      });
      pad.addEventListener('mouseup', (e) => {
        e.preventDefault();
        e.stopPropagation();
        pad.style.transform = '';
      });
    }
    
    // Controls
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    `;
    
    const startBtn = document.createElement('button');
    startBtn.textContent = 'Start';
    startBtn.style.cssText = `
      background: #1c2742;
      color: #dbe7ff;
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      letter-spacing: 0.3px;
    `;
    startBtn.addEventListener('click', () => this.startGame());
    
    const replayBtn = document.createElement('button');
    replayBtn.textContent = '▶ Replay';
    replayBtn.style.cssText = `
      background: #0e1523;
      color: #dbe7ff;
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      letter-spacing: 0.3px;
    `;
    replayBtn.addEventListener('click', () => this.playSequence());
    
    const exitBtn = document.createElement('button');
    exitBtn.textContent = 'Exit';
    exitBtn.style.cssText = `
      background: #0e1523;
      color: #dbe7ff;
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      letter-spacing: 0.3px;
    `;
    exitBtn.addEventListener('click', () => this.closePanel());
    
    const keyHint = document.createElement('div');
    keyHint.style.cssText = `
      font-size: 12px;
      color: #9aa7bf;
      align-self: center;
    `;
    keyHint.textContent = 'Keys: R / G / B / Y';
    
    controls.appendChild(startBtn);
    controls.appendChild(replayBtn);
    controls.appendChild(exitBtn);
    controls.appendChild(keyHint);
    
    // Log
    this.logElement = document.createElement('div');
    this.logElement.style.cssText = `
      background: #0b1220;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 12px;
      min-height: 56px;
      color: #c7d2fe;
      font-size: 14px;
      line-height: 1.35;
      margin-top: 10px;
    `;
    this.logElement.innerHTML = this.log;
    
    card.appendChild(header);
    card.appendChild(stats);
    card.appendChild(grid);
    card.appendChild(controls);
    card.appendChild(this.logElement);
    
    this.overlay.appendChild(card);
  }
  
  handleKeyboard(e) {
    const map = { r: 0, g: 1, b: 2, y: 3 };
    const key = e.key.toLowerCase();
    if (key in map) {
      this.handleInput(map[key]);
    }
    if (key === 'escape') {
      this.closePanel();
    }
  }
  
  stepMs() {
    return Math.max(this.config.minStepMs, this.config.baseStepMs - (this.round - 1) * this.config.accelPerRound);
  }
  
  beep(idx, ms = 300) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = this.config.tonesHz[idx];
    gainNode.gain.value = 0.0001;
    
    oscillator.connect(gainNode).connect(ctx.destination);
    oscillator.start();
    
    gainNode.gain.linearRampToValueAtTime(0.65, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    oscillator.stop(ctx.currentTime + ms / 1000 + 0.02);
  }
  
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  randomPad() {
    return Math.floor(Math.random() * 4);
  }
  
  async flashPad(idx, duration) {
    const pad = this.pads[idx];
    if (!pad) return;
    
    pad.classList.add('lit');
    pad.style.background = `var(--on)`;
    pad.style.boxShadow = `0 0 22px color-mix(in oklab, var(--on) 65%, white 10%), 0 0 60px color-mix(in oklab, var(--on) 45%, black 0%), inset 0 0 28px color-mix(in oklab, var(--on) 65%, white 10%), inset 0 -10px 22px rgba(0,0,0,0.35)`;
    pad.style.filter = 'brightness(1.25) saturate(1.1)';
    
    this.beep(idx, Math.max(180, duration - 80));
    await this.wait(duration);
    
    pad.classList.remove('lit');
    pad.style.background = `var(--base-color)20`;
    pad.style.boxShadow = 'inset 0 8px 18px rgba(255,255,255,0.04), inset 0 -10px 22px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.08)';
    pad.style.filter = '';
  }
  
  async playSequence() {
    this.playingBack = true;
    const stepMs = this.stepMs();
    await this.wait(350);
    
    for (let i = 0; i < this.sequence.length; i++) {
      await this.flashPad(this.sequence[i], stepMs);
      await this.wait(this.config.interFlashGap);
    }
    
    this.playingBack = false;
    this.log = `Your turn. Repeat the sequence (${this.sequence.length}).`;
    this.updateLog();
  }
  
  startGame() {
    this.sequence = [];
    this.inputIndex = 0;
    this.round = 0;
    this.log = "Initiating training protocol…";
    this.updateLog();
    this.newRound([]);
  }
  
  async newRound(currSeq = this.sequence) {
    const nextSeq = [...currSeq, this.randomPad()];
    this.sequence = nextSeq;
    this.inputIndex = 0;
    this.round++;
    this.log = `Round ${this.round}. Watch closely…`;
    this.updateLog();
    this.updateStats();
    
    await this.wait(30);
    await this.playSequence();
  }
  
  async handleInput(idx) {
    if (this.playingBack) return;
    
    this.flashPad(idx, 200);
    
    const expected = this.sequence[this.inputIndex];
    if (idx === expected) {
      const nextIndex = this.inputIndex + 1;
      this.inputIndex = nextIndex;
      
      if (nextIndex === this.sequence.length) {
        this.best = Math.max(this.best, this.round);
        
        // Check for victory (6 rounds completed)
        if (this.round >= this.config.maxRoundsToWin) {
          this.log = "Perfect! Training complete!";
          this.updateLog();
          await this.wait(1000);
          this.showCongrats = true;
          this.showCongratsModal();
          return;
        }
        
        this.log = "Clean! Advancing…";
        this.updateLog();
        await this.wait(420);
        this.newRound(this.sequence);
      }
    } else {
      this.beep(0, 520);
      this.log = "Wrong! Try again — rewatching the sequence.";
      this.updateLog();
      this.inputIndex = 0;
      await this.wait(460);
      this.playSequence();
    }
  }
  
  closePanel() {
    gameStore.closeMemoryUI();
  }
  
  confirmCongratsAndExit() {
    this.showCongrats = false;
    this.hideCongratsModal();
    // Close the memory UI first
    gameStore.closeMemoryUI();
    // Then show success popup
    this.showSuccessPopup();
  }
  
  showSuccessPopup() {
    // Remove existing popup if any
    const existingPopup = document.getElementById('memorySuccessPopup');
    if (existingPopup) {
      existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.id = 'memorySuccessPopup';
    
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #00ff00;
      color: #000000;
      padding: 20px 30px;
      border-radius: 10px;
      border: 3px solid #ffffff;
      box-shadow: 0 0 20px rgba(0,0,0,0.8);
      z-index: 3000;
      text-align: center;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      max-width: 400px;
      animation: popupPulse 0.5s ease-in-out;
    `;

    popup.innerHTML = `
      <div style="font-size: 18px; margin-bottom: 10px; text-shadow: 0 0 5px rgba(0,0,0,0.5);">
        MEMORY TRAINING COMPLETE
      </div>
      <div style="font-size: 14px; line-height: 1.4;">
        Congratulations! You have successfully completed the memory training protocol. The system is now unlocked.
      </div>
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes popupPulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(popup);

    // Auto-close after 3 seconds and mark complete
    setTimeout(() => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
      gameStore.setMemoryComplete(true);
    }, 3000);
  }
  
  showCongratsModal() {
    if (this.showCongrats) return;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(2, 6, 12, 0.6);
      z-index: 1001;
    `;
    
    const modalCard = document.createElement('div');
    modalCard.style.cssText = `
      background: #0f172a;
      border: 1px solid #ffffff22;
      border-radius: 16px;
      padding: 18px;
      max-width: 420px;
      color: #e2e8f0;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
    `;
    
    const title = document.createElement('h3');
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 6px;
    `;
    title.textContent = '🎉 Congratulations!';
    
    const message = document.createElement('p');
    message.style.cssText = `
      margin: 0;
      opacity: 0.9;
    `;
    message.textContent = 'You completed 6 rounds. The panel unlocks and the puzzle is marked complete.';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 12px;
    `;
    
    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Continue';
    continueBtn.style.cssText = `
      background: #1c2742;
      color: #dbe7ff;
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      letter-spacing: 0.3px;
    `;
    continueBtn.addEventListener('click', () => this.confirmCongratsAndExit());
    
    buttonContainer.appendChild(continueBtn);
    modalCard.appendChild(title);
    modalCard.appendChild(message);
    modalCard.appendChild(buttonContainer);
    modal.appendChild(modalCard);
    
    this.overlay.appendChild(modal);
    this.congratsModal = modal;
  }
  
  hideCongratsModal() {
    if (this.congratsModal) {
      this.overlay.removeChild(this.congratsModal);
      this.congratsModal = null;
    }
  }
  
  updateLog() {
    if (this.logElement) {
      this.logElement.innerHTML = this.log;
    }
  }
  
  updateStats() {
    if (this.roundDisplay) {
      this.roundDisplay.innerHTML = `Round: <b>${this.round}</b>`;
    }
    if (this.speedDisplay) {
      this.speedDisplay.innerHTML = `Speed: <b>${this.stepMs()}ms</b>`;
    }
    if (this.bestDisplay) {
      this.bestDisplay.innerHTML = `Best: <b>${this.best}</b>`;
    }
  }
}

// Create global instance
export const memoryPanel = new MemoryPanel(6);
