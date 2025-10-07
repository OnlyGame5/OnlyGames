// src/rooms/Room3/DataStormPuzzle.js

import * as THREE from 'three';
import { gameStore } from '../../state/gameStore.js';

export class DataStormPuzzle {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'r3-data-storm';
    this.isSolved = false;

    this.correctPhrases = ["DON'T TRUST IT", "IT LIES", "SUBJECT FAILED"];
    this.distractorPhrases = [
      "OBEY NEXUS", "ANALYSIS COMPLETE", "YOU ARE SAFE", "PROTOCOL ACTIVE",
      "SYSTEM STABLE", "QUERY ACCEPTED", "ACCESS GRANTED", "DATA VALID",
      "INSTRUCTION PIPELINE", "BRANCH PREDICTION", "SPECULATIVE EXECUTION", "OUT-OF-ORDER",
      "REGISTER RENAMING", "TOMASULO ALGORITHM", "CACHE COHERENCY", "MESI PROTOCOL",
      "TLB MISS", "PAGE FAULT", "INTERRUPT HANDLER", "CONTEXT SWITCH",
      "SYSCALL INTERFACE", "KERNEL SPACE", "USER SPACE", "MEMORY MAPPING",
      "DMA TRANSFER", "BUS ARBITRATION", "CLOCK DOMAIN", "POWER GATING",
      "0x7FFE0000", "0xFFFF8000", "0x00007FFF", "0x80000000",
      "0x40000000", "0xC0000000", "0x20000000", "0xE0000000",
      "0x10000000", "0xF0000000", "0x08000000", "0xF8000000",
      "0x04000000", "0xFC000000", "0x02000000", "0xFE000000"
    ];
    this.allPhrases = [...this.correctPhrases, ...this.distractorPhrases];
    this.selectedPhrases = new Set();
    this.sprites = [];
    this._lastGlassesState = false;
    this._pulseTime = 0;

    this._buildStorm();
  }

  mount(parentGroup) { 
    parentGroup.add(this.group); 
  }

  unmount() { 
    if (this.group.parent) this.group.parent.remove(this.group); 
  }

  _createStatementSprite(text, isCorrect) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.font = 'bold 32px monospace'; // Smaller font size
    context.fillStyle = 'rgba(100, 200, 255, 0.7)';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 256, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true
    });
    const sprite = new THREE.Sprite(material);
    
    // Make sprites smaller
    sprite.scale.set(4, 0.6, 1); // Smaller scale
    sprite.userData.phrase = text;
    sprite.userData.isCorrect = isCorrect;
    
    return sprite;
  }

  _buildStorm() {
    this.allPhrases.forEach((phrase, i) => {
      const isCorrect = this.correctPhrases.includes(phrase);
      const sprite = this._createStatementSprite(phrase, isCorrect);

      // Position sprites in a spherical cloud around CPU core
      // Closer to the center and more spread out for better visibility
      const phi = Math.acos(-1 + (2 * i) / this.allPhrases.length);
      const theta = Math.sqrt(this.allPhrases.length * Math.PI) * phi;
      const radius = 2.5; // Closer to the CPU core
      sprite.position.setFromSphericalCoords(radius, phi, theta);
      
      // Ensure sprites are well above the floor - minimum Y of 1.5
      sprite.position.y = Math.max(sprite.position.y, 1.5);
      // Add some height variation above the minimum
      sprite.position.y += (Math.random() - 0.5) * 1.0;
      
      // Store original position and add random values for unique animation
      sprite.userData.originalPos = sprite.position.clone();
      sprite.userData.animSpeed = Math.random() * 0.5 + 0.3; // Random speed
      sprite.userData.animOffset = Math.random() * Math.PI * 2; // Random starting phase
      
      this.group.add(sprite);
      this.sprites.push(sprite);
    });
  }

  _updateTruthFilterEffect(isActive) {
    this.sprites.forEach((sprite) => {
      const isCorrect = sprite.userData.isCorrect;
      const material = sprite.material;
      
      if (isActive && isCorrect) {
        // Correct phrases: bright green, larger size, more opaque
        material.color.set(0x00ff88);
        material.opacity = 1.0;
        sprite.scale.set(5, 0.8, 1); // Larger than normal but not too big
      } else if (isActive && !isCorrect) {
        // Wrong phrases: dim red, smaller, less opaque
        material.color.set(0x442222);
        material.opacity = 0.3;
        sprite.scale.set(2.5, 0.3, 1); // Much smaller
      } else {
        // Normal state: reset to original blueish
        material.color.set(0x64c8ff);
        material.opacity = 0.7;
        sprite.scale.set(4, 0.6, 1); // Original smaller size
      }
    });
  }

  update(deltaTime, isGlassesActive = false) {
    this._pulseTime += deltaTime; // Use a single timer for all animations

    // Individual Sprite Animation - Bob up and down for a "floating" effect
    this.sprites.forEach(sprite => {
      const { originalPos, animSpeed, animOffset } = sprite.userData;
      // Bob up and down for a "floating" effect
      sprite.position.y = originalPos.y + Math.sin(this._pulseTime * animSpeed + animOffset) * 0.3;
    });

    if (isGlassesActive !== this._lastGlassesState) {
      this._lastGlassesState = isGlassesActive;
      this._updateTruthFilterEffect(isGlassesActive);
    }
    
    if (isGlassesActive) {
      this.sprites.forEach((sprite) => {
        if (sprite.userData.isCorrect) {
          const pulse = 1 + 0.2 * Math.sin(this._pulseTime * 5 + sprite.userData.animOffset);
          sprite.scale.x = 5 * pulse;
          sprite.scale.y = 0.8 * pulse;
        }
      });
    }
  }

  submitAttempt(phrases) {
    if (this.isSolved) return true;

    // Check if the submitted phrases match the correct phrases (order doesn't matter)
    const submittedSet = new Set(phrases);
    const correctSet = new Set(this.correctPhrases);
    const isCorrect = submittedSet.size === correctSet.size && [...submittedSet].every(p => correctSet.has(p));

    if (isCorrect) {
      this.isSolved = true;
      gameStore.setRoom3Flag('dataStormSolved', true);
      console.log("🎉 DATA STORM PUZZLE SOLVED! The truth has been revealed.");
      return true;
    } else {
      console.log("Incorrect phrases submitted.");
      return false;
    }
  }

  isSolved() { 
    return this.isSolved; 
  }

  // Get shuffled phrases for dropdown
  getShuffledPhrases() {
    const shuffled = [...this.allPhrases];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  // Get phrases for dropdown (excludes memory addresses)
  getDropdownPhrases() {
    // Filter out memory addresses (hex values starting with 0x)
    const dropdownPhrases = this.distractorPhrases.filter(phrase => !phrase.startsWith('0x'));
    const allDropdownPhrases = [...this.correctPhrases, ...dropdownPhrases];
    
    
    // Shuffle the dropdown phrases
    const shuffled = [...allDropdownPhrases];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
