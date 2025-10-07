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
      "SYSTEM STABLE", "QUERY ACCEPTED", "ACCESS GRANTED", "DATA VALID"
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
    context.font = 'bold 48px monospace';
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
    
    // Make sprites larger and more visible
    sprite.scale.set(6, 0.8, 1);
    sprite.userData.isInteractable = true;
    sprite.userData.interactionId = 'data_storm_fragment';
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
      
      // Add some height variation
      sprite.position.y += (Math.random() - 0.5) * 1.5;
      
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
        sprite.scale.set(7, 1.0, 1); // Larger
      } else if (isActive && !isCorrect) {
        // Wrong phrases: dim red, smaller, less opaque
        material.color.set(0x442222);
        material.opacity = 0.3;
        sprite.scale.set(4, 0.4, 1); // Smaller
      } else {
        // Normal state: reset to original blueish
        material.color.set(0x64c8ff);
        material.opacity = 0.7;
        sprite.scale.set(6, 0.8, 1); // Original size
      }
    });
  }

  update(deltaTime, isGlassesActive = false) {
    // Animate the storm to swirl around CPU core
    this.group.rotation.y += deltaTime * 0.1;
    this.group.rotation.x += deltaTime * 0.05;

    // Only update materials/scales if the glasses state has changed
    if (isGlassesActive !== this._lastGlassesState) {
      this._lastGlassesState = isGlassesActive;
      this._updateTruthFilterEffect(isGlassesActive);
    }
    
    // Apply pulsing animation every frame if glasses are active
    if (isGlassesActive) {
      this._pulseTime += deltaTime;
      this.sprites.forEach((sprite) => {
        if (sprite.userData.isCorrect) {
          // Efficient sine-wave pulse using accumulated time
          const pulse = 0.8 + 0.2 * Math.sin(this._pulseTime * 3);
          sprite.material.opacity = pulse;
        }
      });
    }
  }

  handleInteraction(intersectedObject) {
    if (this.isSolved) {
      console.log("Data Storm puzzle already solved.");
      return;
    }

    if (!intersectedObject.userData.isCorrect) {
      console.log("Incorrect fragment selected. Look for the truth among the lies.");
      // Flash red briefly to indicate wrong choice
      intersectedObject.material.color.set(0xff4444);
      setTimeout(() => {
        intersectedObject.material.color.set(0xffffff);
      }, 200);
      return;
    }

    const phrase = intersectedObject.userData.phrase;
    if (this.selectedPhrases.has(phrase)) {
      console.log("Fragment already selected.");
      return;
    }

    this.selectedPhrases.add(phrase);
    intersectedObject.material.color.set(0x00ff7f);
    console.log(`✓ Correct fragment selected: "${phrase}". Found ${this.selectedPhrases.size}/3.`);

    if (this.selectedPhrases.size === this.correctPhrases.length) {
      this.isSolved = true;
      gameStore.setRoom3Flag('dataStormSolved', true);
      console.log("🎉 DATA STORM PUZZLE SOLVED! The truth has been revealed.");
    }
  }

  isSolved() { 
    return this.isSolved; 
  }
}
