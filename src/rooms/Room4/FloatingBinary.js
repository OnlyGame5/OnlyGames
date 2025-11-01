import * as THREE from 'three';

/**
 * Floating Binary Text Effect with Hidden NEXUS Message and Deceptive ChatGPT Letters
 * Creates floating binary code sprites with a hidden message that appears when truth filter is active
 * Also includes deceptive "ChatGPT" letters that appear in blue to trick players
 */
export class FloatingBinary {
  constructor(truthFilterEnabled = false) {
    console.log('FloatingBinary: Constructor called');
    this.group = new THREE.Group();
    this.group.name = 'floating-binary';
    
    // Truth filter state
    this.truthFilterEnabled = truthFilterEnabled;
    
    // Generate binary strings (much increased count for better room coverage)
    this._binaryStrings = this._generateBinaryStrings(80); // Much increased for better room coverage
    this._sprites = [];
    this._nexusSprites = []; // Special sprites for NEXUS letters
    this._deceptiveSprites = []; // Special sprites for deceptive "ChatGPT" letters
    this._t = 0;
    this.pulsingIntensity = 0; // Initialize pulsing intensity
    
    console.log('FloatingBinary: Creating', this._binaryStrings.length, 'binary sprites');
    
    try {
      this._buildBinarySprites();
      this._createNexusMessage();
      this._createDeceptiveMessage(); // Add deceptive ChatGPT letters
      
      console.log('FloatingBinary: Created', this._sprites.length, 'binary sprites,', this._nexusSprites.length, 'NEXUS letters, and', this._deceptiveSprites.length, 'deceptive letters');
      console.log('FloatingBinary: Group children count:', this.group.children.length);
      console.log('FloatingBinary: NEXUS sprites:', this._nexusSprites.map(s => s.userData.letter));
      console.log('FloatingBinary: Deceptive sprites:', this._deceptiveSprites.map(s => s.userData.letter));
    } catch (error) {
      console.error('FloatingBinary: Error during creation:', error);
      // Continue with empty group if there's an error
    }
  }

  /**
   * Convert text to binary representation
   * @param {string} text - Text to convert to binary
   * @returns {string} Binary representation of the text
   */
  _textToBinary(text) {
    return text.split('').map(char => {
      const binary = char.charCodeAt(0).toString(2);
      return '0'.repeat(8 - binary.length) + binary;
    }).join(' ');
  }

  /**
   * Generate random binary strings
   * @param {number} count - Number of binary strings to generate
   * @returns {string[]} Array of binary strings
   */
  _generateBinaryStrings(count) {
    const strings = [];
    for (let i = 0; i < count; i++) {
      // Generate a random binary string of length 16-24 characters
      const length = 16 + Math.floor(Math.random() * 9);
      let binary = '';
      for (let j = 0; j < length; j++) {
        binary += Math.random() > 0.5 ? '1' : '0';
        // Add spaces every 8 characters for readability
        if ((j + 1) % 8 === 0 && j < length - 1) {
          binary += ' ';
        }
      }
      strings.push(binary);
    }
    return strings;
  }

  /**
   * Create the hidden NEXUS message as disguised binary code
   */
  _createNexusMessage() {
    const nexusLetters = ['N', 'E', 'X', 'U', 'S'];
    
    nexusLetters.forEach((letter, index) => {
      // Convert letter to binary
      const binaryText = this._textToBinary(letter);
      
      // Create a sprite that looks like regular binary code but is red
      const sprite = this._createBinarySprite(binaryText, true, false);
      
      if (sprite) {
        // Position NEXUS letters randomly with other binary streams
        const roomHalf = 9; // Full room width (18m room)
        const roomHeight = 4; // Full room height
        const x = (Math.random() - 0.5) * roomHalf;
        const y = 0.5 + Math.random() * roomHeight;
        const z = (Math.random() - 0.5) * roomHalf;
        
        sprite.position.set(x, y, z);
        
        // Mark as NEXUS letter and store the actual letter
        sprite.userData.isNexusLetter = true;
        sprite.userData.letter = letter;
        sprite.userData.binaryText = binaryText;
        sprite.userData.initialX = x;
        sprite.userData.initialY = y;
        sprite.userData.initialZ = z;
        sprite.userData.offset = index * 0.5;
        sprite.userData.speed = 0.25 + Math.random() * 0.35; // Slightly faster
        sprite.userData.amplitude = 0.1 + Math.random() * 0.2;
        
        this.group.add(sprite);
        this._nexusSprites.push(sprite);
      }
    });
  }

  /**
   * Create deceptive "ChatGPT" letters that appear in blue to trick players
   */
  _createDeceptiveMessage() {
    const deceptiveLetters = ['C', 'h', 'a', 't', 'G', 'P', 'T'];
    
    deceptiveLetters.forEach((letter, index) => {
      // Convert letter to binary
      const binaryText = this._textToBinary(letter);
      
      // Create a sprite that looks like regular binary code but is blue (deceptive)
      const sprite = this._createBinarySprite(binaryText, false, true); // isNexusLetter=false, isDeceptive=true
      
      if (sprite) {
        // Position deceptive letters randomly with other binary streams
        const roomHalf = 9; // Full room width (18m room)
        const roomHeight = 4; // Full room height
        const x = (Math.random() - 0.5) * roomHalf;
        const y = 0.5 + Math.random() * roomHeight;
        const z = (Math.random() - 0.5) * roomHalf;
        
        sprite.position.set(x, y, z);
        
        // Mark as deceptive letter and store the actual letter
        sprite.userData.isDeceptiveLetter = true;
        sprite.userData.letter = letter;
        sprite.userData.binaryText = binaryText;
        sprite.userData.initialX = x;
        sprite.userData.initialY = y;
        sprite.userData.initialZ = z;
        sprite.userData.offset = index * 0.3;
        sprite.userData.speed = 0.2 + Math.random() * 0.35; // Slightly faster
        sprite.userData.amplitude = 0.05 + Math.random() * 0.15;
        
        this.group.add(sprite);
        this._deceptiveSprites.push(sprite);
      }
    });
  }

  /**
   * Create a sprite with binary text
   * @param {string} text - Binary text to display
   * @param {boolean} isNexusLetter - Whether this is a NEXUS letter
   * @param {boolean} isDeceptive - Whether this is a deceptive ChatGPT letter
   * @returns {THREE.Sprite} Sprite with binary text
   */
  _createBinarySprite(text, isNexusLetter = false, isDeceptive = false) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512; // Larger for better readability
      canvas.height = 64;  // Larger for better readability
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Failed to get 2D context for binary sprite');
        return null;
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Style the text based on type (no background blocks, just text color)
      if (isDeceptive) {
        // Deceptive letters: blue text only
        ctx.fillStyle = '#0088ff';
      } else if (isNexusLetter) {
        // NEXUS letters: green text (same as regular binary)
        ctx.fillStyle = '#00ff88';
      } else {
        // Regular binary: green text
        ctx.fillStyle = '#00ff88';
      }
      
      ctx.font = 'bold 24px monospace'; // Larger font for better readability
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Draw the binary text
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      
      // Create sprite material
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9, // Higher opacity for better visibility
        alphaTest: 0.1
      });
      
      // Create sprite
      const sprite = new THREE.Sprite(material);
      // Scale based on type
      if (isDeceptive) {
        sprite.scale.set(1.2, 0.6, 1); // Same size as regular binary
      } else {
        sprite.scale.set(isNexusLetter ? 1.2 : 1.2, isNexusLetter ? 0.6 : 0.6, 1);
      }
      sprite.userData.binaryText = text;
      
      return sprite;
    } catch (error) {
      console.error('Error creating binary sprite:', error);
      return null;
    }
  }

  /**
   * Build all binary sprites and position them
   */
  _buildBinarySprites() {
    this._sprites = [];
    
    this._binaryStrings.forEach((text, i) => {
      const sprite = this._createBinarySprite(text);
      
      if (sprite) {
        // Position sprites to fill the entire room
        const roomHalf = 9; // Full room width (18m room)
        const roomHeight = 4; // Full room height
        
        // More controlled positioning
        const x = (Math.random() - 0.5) * roomHalf;
        const y = 0.5 + Math.random() * roomHeight; // Start from 0.5 height
        const z = (Math.random() - 0.5) * roomHalf;
        
        sprite.position.set(x, y, z);
        
        // Store initial position for animation
        sprite.userData.initialX = x;
        sprite.userData.initialY = y;
        sprite.userData.initialZ = z;
        sprite.userData.offset = i * 0.3; // Offset for animation
        sprite.userData.speed = 0.25 + Math.random() * 0.35; // Slightly faster
        sprite.userData.amplitude = 0.1 + Math.random() * 0.2; // Smaller movement
        
        this.group.add(sprite);
        this._sprites.push(sprite);
      }
    });
    
    console.log('FloatingBinary: Built', this._sprites.length, 'sprites');
  }

  /**
   * Update truth filter state
   * @param {boolean} enabled - Whether truth filter is enabled
   */
  updateTruthFilter(enabled) {
    if (this.truthFilterEnabled !== enabled) {
      this.truthFilterEnabled = enabled;
      
      // Update NEXUS sprites to show letters instead of binary
      this._nexusSprites.forEach(sprite => {
        this._updateNexusSpriteDisplay(sprite);
      });
      
      // Update deceptive sprites (they should always show as blue when truth filter is OFF)
      this._deceptiveSprites.forEach(sprite => {
        this._updateDeceptiveSpriteDisplay(sprite);
      });
    }
  }

  /**
   * Update NEXUS sprite display based on truth filter state
   * @param {THREE.Sprite} sprite - The NEXUS sprite to update
   */
  _updateNexusSpriteDisplay(sprite) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512; // Larger for better readability
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Failed to get 2D context for NEXUS sprite update');
        return;
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (this.truthFilterEnabled) {
        // Show binary code in red when truth filter is enabled
        ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
        ctx.font = 'bold 24px monospace'; // Same font size as regular binary
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Draw the binary text (not the letter)
        ctx.fillText(sprite.userData.binaryText, canvas.width / 2, canvas.height / 2);
        
        // Keep same size as regular binary
        sprite.scale.set(1.2, 0.6, 1);
      } else {
        // Show binary code in green when truth filter is disabled (same as regular binary)
        ctx.fillStyle = 'rgba(0, 255, 100, 0.9)';
        ctx.font = 'bold 24px monospace'; // Larger font for better readability
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0, 255, 100, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Draw the binary text
        ctx.fillText(sprite.userData.binaryText, canvas.width / 2, canvas.height / 2);
        
        // Reset to normal size for binary
        sprite.scale.set(1.2, 0.6, 1);
      }
      
      // Update texture
      const oldTexture = sprite.material.map;
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      sprite.material.map = texture;
      sprite.material.needsUpdate = true;
      
      // Dispose old texture to prevent memory leaks
      if (oldTexture) {
        oldTexture.dispose();
      }
    } catch (error) {
      console.error('Error updating NEXUS sprite display:', error);
    }
  }

  /**
   * Update deceptive sprite display based on truth filter state
   * @param {THREE.Sprite} sprite - The deceptive sprite to update
   */
  _updateDeceptiveSpriteDisplay(sprite) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512; // Larger for better readability
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Failed to get 2D context for deceptive sprite update');
        return;
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Deceptive letters are always blue to trick players (no background block)
      ctx.fillStyle = '#0088ff';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Draw the binary text
      ctx.fillText(sprite.userData.binaryText, canvas.width / 2, canvas.height / 2);
      
      // Update texture
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      sprite.material.map = texture;
      sprite.material.needsUpdate = true;
    } catch (error) {
      console.error('Error updating deceptive sprite display:', error);
    }
  }

  /**
   * Update the mini-game
   * @param {number} delta - Time delta
   */
  update(delta) {
    this.pulsingIntensity += delta * 1.0; // Slightly faster pulsing
    
    // Update all binary sprites with simpler animation
    this._sprites.forEach((sprite, index) => {
      const offset = sprite.userData.offset;
      const speed = sprite.userData.speed;
      const amplitude = sprite.userData.amplitude;
      const t = this.pulsingIntensity + offset;
      
      // Simple floating motion
      sprite.position.x = sprite.userData.initialX + Math.sin(t * speed) * amplitude;
      sprite.position.y = sprite.userData.initialY + Math.cos(t * speed * 0.7) * amplitude;
      sprite.position.z = sprite.userData.initialZ + Math.sin(t * speed * 0.5) * amplitude;
      
      // Pulsing opacity - less dramatic for better readability
      sprite.material.opacity = 0.8 + Math.sin(t * speed * 1.5) * 0.1;
    });
    
    // Update NEXUS letters with same animation as binary sprites
    this._nexusSprites.forEach(sprite => {
      const offset = sprite.userData.offset;
      const speed = sprite.userData.speed;
      const amplitude = sprite.userData.amplitude;
      const t = this.pulsingIntensity + offset;
      
      // Same floating motion as binary sprites
      sprite.position.x = sprite.userData.initialX + Math.sin(t * speed) * amplitude;
      sprite.position.y = sprite.userData.initialY + Math.cos(t * speed * 0.7) * amplitude;
      sprite.position.z = sprite.userData.initialZ + Math.sin(t * speed * 0.5) * amplitude;
      
      // Gentle rotation
      sprite.rotation.z = Math.sin(t * speed * 0.3) * 0.1;
      
      // Pulsing opacity - less dramatic for better readability
      sprite.material.opacity = 0.8 + Math.sin(t * speed * 1.5) * 0.1;
    });
    
    // Update deceptive letters with same animation as binary sprites
    this._deceptiveSprites.forEach(sprite => {
      const offset = sprite.userData.offset;
      const speed = sprite.userData.speed;
      const amplitude = sprite.userData.amplitude;
      const t = this.pulsingIntensity + offset;
      
      // Same floating motion as binary sprites
      sprite.position.x = sprite.userData.initialX + Math.sin(t * speed) * amplitude;
      sprite.position.y = sprite.userData.initialY + Math.cos(t * speed * 0.7) * amplitude;
      sprite.position.z = sprite.userData.initialZ + Math.sin(t * speed * 0.5) * amplitude;
      
      // Gentle rotation
      sprite.rotation.z = Math.sin(t * speed * 0.3) * 0.1;
      
      // Pulsing opacity - less dramatic for better readability
      sprite.material.opacity = 0.8 + Math.sin(t * speed * 1.5) * 0.1;
    });
  }

  /**
   * Mount the mini-game to a parent group
   * @param {THREE.Group} parentGroup - Parent group to mount to
   */
  mount(parentGroup) {
    parentGroup.add(this.group);
    console.log('FloatingBinary: Mounted to parent group');
  }

  /**
   * Unmount the mini-game
   */
  unmount() {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}