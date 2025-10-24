// Matrix Sky - Animated Matrix rain skybox
import * as THREE from 'three';

export class MatrixSky {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.material = null;
    this.uniforms = {
      uTime: { value: 0.0 },
      uFallSpeed: { value: 0.001 }
    };
    this.enabled = true;
    this.rotationSpeed = 0.002;
    this.fallSpeed = 0.001;
    
    this.createMatrixSky();
  }

  createMatrixSky() {
    // Create large inverted sphere (camera inside)
    const geometry = new THREE.SphereGeometry(500, 32, 32);
    
    // Create Matrix rain shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uFallSpeed;
        varying vec2 vUv;
        
        // Hash function for pseudo-random numbers
        float hash(float n) {
          return fract(sin(n) * 43758.5453);
        }
        
        // Create small binary digits (1's and 0's)
        float getBinaryDigit(vec2 charUV, float charIndex) {
          // Simple patterns for 1 and 0
          float digit = 0.0;
          
          // Use hash to determine if this should be a 1 or 0
          float isOne = step(0.5, hash(charIndex + 123.456));
          
          if (isOne > 0.5) {
            // Draw a "1" - vertical line in center
            digit = step(0.4, charUV.x) * step(charUV.x, 0.6) * step(0.1, charUV.y) * step(charUV.y, 0.9);
          } else {
            // Draw a "0" - circle outline
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(charUV, center);
            digit = step(0.2, dist) * step(dist, 0.4) * step(0.1, charUV.y) * step(charUV.y, 0.9);
          }
          
          return digit;
        }
        
        void main() {
          // Base very dark green color
          vec3 baseColor = vec3(0.0, 0.02, 0.0); // Almost black green
          vec3 matrixColor = vec3(0.0, 0.3, 0.0); // Darker green
          vec3 headColor = vec3(0.1, 0.5, 0.1); // Darker white-green
          
          // Create many small columns for dense binary rain
          float columnWidth = 0.03; // Much smaller columns
          float column = floor(vUv.x / columnWidth);
          float columnX = fract(vUv.x / columnWidth);
          
          // Random offset for each column
          float columnOffset = hash(column) * 15.0;
          
          // Animate falling motion - use uniform for speed control
          float yPos = fract(vUv.y + uTime * uFallSpeed + columnOffset);
          
          // Create small character cells
          float charHeight = 0.06; // Much smaller characters
          float charIndex = floor(yPos / charHeight);
          float charY = fract(yPos / charHeight);
          
          // Character UV within cell
          vec2 charUV = vec2(columnX, charY);
          
          // Show more columns (denser rain)
          float showColumn = step(0.2, hash(column + 1.0));
          
          // Get binary digit pattern
          float digit = getBinaryDigit(charUV, charIndex + column);
          digit *= showColumn;
          
          // Add bright head effect (leading digit) - slower
          float headSize = 0.08;
          float headY = fract(vUv.y + uTime * uFallSpeed * 1.2 + columnOffset);
          float head = step(0.0, headY) * step(headY, headSize);
          head *= showColumn;
          
          // Add some sparkle effects - less frequent
          float sparkle = hash(column + uTime * 2.0 + vUv.y * 20.0);
          sparkle = step(0.995, sparkle) * showColumn;
          
          // Combine all effects with reduced intensity
          float intensity = digit * 0.6 + head * 1.5 + sparkle * 2.0;
          
          // Fade to black at bottom
          float depthFade = smoothstep(0.0, 0.2, vUv.y);
          intensity *= depthFade;
          
          // Mix colors with transparency
          vec3 finalColor = baseColor;
          if (intensity > 0.0) {
            if (head > 0.0) {
              finalColor = mix(finalColor, headColor, head * 0.7);
            } else if (digit > 0.0) {
              finalColor = mix(finalColor, matrixColor, digit * 0.5);
            }
            if (sparkle > 0.0) {
              finalColor = mix(finalColor, vec3(0.3, 0.6, 0.3), sparkle * 0.8);
            }
          }
          
          // Add transparency to make it less distracting
          float alpha = 0.3 + intensity * 0.4; // Semi-transparent
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      alphaTest: 0.1
    });
    
    // Create mesh
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = 'matrix-sky';
    this.scene.add(this.mesh);
    
    console.log('Matrix Sky created and added to scene');
  }

  update(deltaTime) {
    if (!this.enabled || !this.material) return;
    
    // Update time uniform for animation
    this.uniforms.uTime.value += deltaTime;
    
    // Debug: Log time every 5 seconds
    if (Math.floor(this.uniforms.uTime.value) % 5 === 0 && Math.floor(this.uniforms.uTime.value) !== Math.floor(this.uniforms.uTime.value - deltaTime)) {
      console.log('Matrix Sky time:', this.uniforms.uTime.value);
    }
    
    // Slow rotation for added effect
    if (this.mesh) {
      this.mesh.rotation.y += this.rotationSpeed;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.mesh) {
      this.mesh.visible = enabled;
    }
  }

  setSpeed(speed) {
    this.rotationSpeed = speed;
    // Use the provided speed parameter for the shader
    this.fallSpeed = speed;
    if (this.material && this.material.uniforms.uFallSpeed) {
      this.material.uniforms.uFallSpeed.value = this.fallSpeed;
      console.log('MatrixSky: setSpeed called, uFallSpeed set to:', this.fallSpeed);
    } else {
      console.log('MatrixSky: setSpeed called but material or uniform not found');
    }
  }

  setIntensity(intensity) {
    if (this.material && this.material.uniforms.uIntensity) {
      this.material.uniforms.uIntensity.value = intensity;
    }
  }

  dispose() {
    if (this.material) {
      this.material.dispose();
    }
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }
  }
}
