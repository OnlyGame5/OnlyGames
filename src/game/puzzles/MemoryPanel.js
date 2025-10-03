import { EventEmitter } from '../../utils/EventEmitter.js';
import { gameStore } from '../../state/gameStore.js';

export class MemoryPanelLogic extends EventEmitter {
  constructor() {
    super();
    
    this.state = {
      sequence: [],
      inputIndex: 0,
      round: 1,
      best: 0,
      playingBack: false,
      isComplete: false
    };
    
    this.colors = ['R', 'G', 'B', 'Y'];
    this.maxRounds = 6;
  }

  // Game logic methods only - no rendering or DOM manipulation

  startGame() {
    this.state.sequence = [];
    this.state.inputIndex = 0;
    this.state.round = 1;
    this.state.playingBack = false;
    this.state.isComplete = false;
    
    this.emit('gameStarted');
    this.newRound();
  }

  newRound() {
    this.state.sequence.push(this.colors[Math.floor(Math.random() * this.colors.length)]);
    this.state.inputIndex = 0;
    this.state.playingBack = true;
    
    this.emit('roundStarted', { round: this.state.round, sequence: this.state.sequence });
  }

  addInput(color) {
    if (this.state.playingBack) return false;
    
    this.emit('inputReceived', { color, inputIndex: this.state.inputIndex });
    
    if (color === this.state.sequence[this.state.inputIndex]) {
      this.state.inputIndex++;
      
      if (this.state.inputIndex === this.state.sequence.length) {
        // Round completed
        this.state.round++;
        this.state.best = Math.max(this.state.best, this.state.round - 1);
        
        if (this.state.round > this.maxRounds) {
          // Game completed
          this.state.isComplete = true;
          this.emit('gameCompleted');
          gameStore.setMemoryComplete(true);
          return true;
        } else {
          this.emit('roundCompleted', { round: this.state.round - 1 });
          setTimeout(() => this.newRound(), 1000);
          return true;
        }
      }
      return true;
    } else {
      // Wrong input - game over
      this.emit('gameOver', { round: this.state.round });
      return false;
    }
  }

  reset() {
    this.state.sequence = [];
    this.state.inputIndex = 0;
    this.state.round = 1;
    this.state.playingBack = false;
    this.state.isComplete = false;
    this.emit('gameReset');
  }

  getState() {
    return { ...this.state };
  }

  isPlayingBack() {
    return this.state.playingBack;
  }

  setPlayingBack(playing) {
    this.state.playingBack = playing;
    this.emit('playbackStateChanged', playing);
  }
}
