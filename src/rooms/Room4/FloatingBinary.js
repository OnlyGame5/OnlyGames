import * as THREE from 'three';

/**
 * Floating Binary Text Effect
 * Creates floating binary code sprites that orbit in front of the north wall
 */
export class FloatingBinary {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'floating-binary';
    
    // Generate many more binary strings to cover the wall
    this._binaryStrings = this._generateBinaryStrings(120); // Even more strings for intense waterfall effect
    this._sprites = [];
    this._t = 0;
    
    this._buildBinarySprites();
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
   * Create a sprite with binary text
   * @param {string} text - Binary text to display
   * @returns {THREE.Sprite} Sprite with binary text
   */
  _createBinarySprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 768; // Increased width for larger text
    canvas.height = 96;  // Increased height for larger text
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Style the text - larger and bolder
    ctx.fillStyle = 'rgba(0, 255, 100, 0.9)'; // Brighter Matrix green
    ctx.font = 'bold 36px monospace'; // Larger and bold
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for extra boldness
    ctx.shadowColor = 'rgba(0, 255, 100, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw the binary text
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    
    // Create sprite material
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.6 // Increased opacity for better visibility
    });
    
    // Create sprite
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.2, 0.5, 1); // Larger scale for bigger, bolder text
    sprite.userData.binaryText = text;
    
    return sprite;
  }

  /**
   * Build all binary sprites and position them
   */
  _buildBinarySprites() {
    this._sprites = this._binaryStrings.map((text, i) => {
      const sprite = this._createBinarySprite(text);
      
      // Random positioning throughout the room for waterfall effect
      const roomHalf = 9; // Room is 18x18, so half is 9
      const roomHeight = 4; // Room height
      
      // Random position within room bounds
      const x = (Math.random() - 0.5) * (roomHalf * 2 - 2); // Leave some margin
      const y = Math.random() * roomHeight; // Random height
      const z = (Math.random() - 0.5) * (roomHalf * 2 - 2); // Random depth
      
      // Random rotation for variety
      const rotationX = (Math.random() - 0.5) * Math.PI * 0.5;
      const rotationY = (Math.random() - 0.5) * Math.PI * 0.5;
      const rotationZ = (Math.random() - 0.5) * Math.PI * 0.5;
      
      sprite.position.set(x, y, z);
      sprite.rotation.set(rotationX, rotationY, rotationZ);
      
      // Store initial position and rotation for animation
      sprite.userData.initialX = x;
      sprite.userData.initialY = y;
      sprite.userData.initialZ = z;
      sprite.userData.initialRotationX = rotationX;
      sprite.userData.initialRotationY = rotationY;
      sprite.userData.initialRotationZ = rotationZ;
      sprite.userData.offset = i * 0.3; // Offset for animation
      sprite.userData.speed = 0.5 + Math.random() * 1.5; // Random animation speed
      sprite.userData.amplitude = 0.2 + Math.random() * 0.3; // Random movement amplitude
      
      this.group.add(sprite);
      return sprite;
    });
  }

  /**
   * Update animation for floating binary sprites
   * @param {number} delta - Time delta
   */
  update(delta) {
    this._t += delta;
    
    // Animate each sprite with waterfall effect
    this._sprites.forEach((sprite, i) => {
      const offset = sprite.userData.offset;
      const speed = sprite.userData.speed;
      const amplitude = sprite.userData.amplitude;
      const t = this._t + offset;
      
      // Waterfall-like falling motion
      sprite.position.x = sprite.userData.initialX + Math.sin(t * speed) * amplitude;
      sprite.position.y = sprite.userData.initialY - (this._t * 0.1 * speed) % 4; // Continuous falling
      sprite.position.z = sprite.userData.initialZ + Math.cos(t * speed * 0.7) * amplitude;
      
      // Random rotation for variety
      sprite.rotation.x = sprite.userData.initialRotationX + Math.sin(t * speed * 0.5) * 0.1;
      sprite.rotation.y = sprite.userData.initialRotationY + Math.cos(t * speed * 0.3) * 0.1;
      sprite.rotation.z = sprite.userData.initialRotationZ + Math.sin(t * speed * 0.4) * 0.1;
      
      // Pulsing opacity for breathing effect
      sprite.material.opacity = 0.4 + Math.sin(t * speed * 2) * 0.3;
      
      // Reset position when it falls too far
      if (sprite.position.y < -2) {
        sprite.position.y = 4; // Reset to top
      }
    });
  }

  /**
   * Mount the floating binary to a parent group
   * @param {THREE.Group} parentGroup - Parent group to mount to
   */
  mount(parentGroup) {
    parentGroup.add(this.group);
  }

  /**
   * Unmount the floating binary from its parent
   */
  unmount() {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this._sprites.forEach(sprite => {
      if (sprite.material.map) {
        sprite.material.map.dispose();
      }
      sprite.material.dispose();
    });
  }
}

