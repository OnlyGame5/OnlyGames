import * as THREE from 'three';

/**
 * Interactive NEXUS Panel for Room 4
 * Allows players to input binary sequences to reveal the hidden "NEXUS" message
 */
export class NexusPanel {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'nexus-panel';
    
    // Binary to letter mapping for NEXUS
    this.binaryToLetter = {
      '01001110': 'N',
      '01000101': 'E', 
      '01011000': 'X',
      '01010101': 'U',
      '01010011': 'S'
    };
    
    // Track revealed letters
    this.revealedLetters = {
      'N': false,
      'E': false, 
      'X': false,
      'U': false,
      'S': false
    };
    
    // Track incorrect attempts for failure system
    this.incorrectAttempts = 0;
    this.maxAttempts = 3; // Reduced to 3 attempts before failure
    this.hasFailed = false;
    
    // Panel state
    this.panelOpen = false;
    this.inputCode = '';
    
    // Animation properties
    this.animationTime = 0;
    
    this._createPanel();
    this._createUI();
    this._setupEventListeners();
  }

  /**
   * Create the 3D panel structure
   */
  _createPanel() {
    // Red border removed - only the binary decoder screen remains
    // Create a placeholder panel object for compatibility with color change logic
    this.panel = {
      material: {
        color: { setHex: () => {}, getHex: () => 0xff0000 },
        needsUpdate: false,
        opacity: 0.9
      }
    };

    // Add the binary decoder screen
    this._createPanelText();
  }

  /**
   * Create text display on the panel
   */
  _createPanelText() {
    // Create canvas for text - larger for better visibility
    const canvas = document.createElement('canvas');
    canvas.width = 960; // Increased from 640
    canvas.height = 480; // Increased from 320
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with black background (for borders)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw screen area with colored background, inset with black borders
    const isComplete = this._isComplete();
    const borderWidth = 30; // Black border width (scaled up)
    const screenX = borderWidth;
    const screenY = borderWidth;
    const screenWidth = canvas.width - (borderWidth * 2);
    const screenHeight = canvas.height - (borderWidth * 2);
    
    // Fill screen area with background color (green when complete, red otherwise)
    ctx.fillStyle = isComplete ? '#00ff88' : '#ff0000';
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
    
    // Draw title in black (on colored background) - scaled up
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px monospace'; // Increased from 24px
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BINARY DECODER', canvas.width / 2, 75); // Adjusted y position
    
    // Draw letter slots - centered on the screen
    const letters = ['N', 'E', 'X', 'U', 'S'];
    const boxWidth = 90; // Width of each box
    const spacing = 112; // Center-to-center spacing between boxes
    const totalWidth = (letters.length - 1) * spacing + boxWidth; // Total width of all boxes
    const startX = (canvas.width - totalWidth) / 2 + boxWidth / 2; // Center the first box
    letters.forEach((letter, index) => {
      const x = startX + (index * spacing);
      const y = 160; // Raised higher so boxes sit above the 3D panel
      
      // Draw letter box with dark background - larger for bigger text
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x - 45, y - 37, 90, 75); // Scaled up
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4; // Scaled up
      ctx.strokeRect(x - 45, y - 37, 90, 75);
      
      // Draw letter or ? in white initially - larger font
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px monospace'; // Increased from 28px
      ctx.fillText('?', x, y);
    });
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create static text display using a plane mesh - larger size (same as old red border was)
    const textGeometry = new THREE.PlaneGeometry(8, 5); // Increased from 6x3 to 8x5
    const textMaterial = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 0, 0); // Centered, no offset needed
    this.group.add(textMesh);
    
    this.panelText = textMesh;

  }

  /**
   * Create the UI elements (simple keypad like Room 1)
   */
  _createUI() {
    // Add custom cursor styling for binary UI (same as laptop UI)
    const style = document.createElement('style');
    style.textContent = `
      /* Custom cursor styling for binary UI */
      .binary-ui-active {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%2300ff00" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%2300ff00"/></svg>'), auto !important;
      }
      .binary-ui-active * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%2300ff00" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%2300ff00"/></svg>'), auto !important;
      }

      /* Binary UI red glitch effect (mirrors AI dialogue error glitch) */
      #binaryUI.binary-ui-glitch {
        border-color: #ff0040 !important;
        color: #ffb8d1 !important;
        box-shadow: 0 0 25px rgba(255, 0, 64, 0.6), inset 0 0 30px rgba(0, 0, 0, 0.6);
        animation: binaryErrorGlitch 0.3s ease-in-out infinite;
      }
      #binaryUI.binary-ui-glitch #binaryDisplay,
      #binaryUI.binary-ui-glitch input,
      #binaryUI.binary-ui-glitch button {
        border-color: #ff0040 !important;
        color: #ffb8d1 !important;
      }
      #binaryUI .glitching-text {
        text-shadow: 2px 0 0 rgba(255, 0, 0, 0.5), -2px 0 0 rgba(0, 255, 255, 0.5);
        animation: binaryTextGlitch 0.3s ease-in-out infinite;
      }
      /* Important: do not animate transform; it overrides translate(-50%, -50%) and moves the panel. */
      @keyframes binaryErrorGlitch {
        0%   { filter: hue-rotate(0deg) brightness(1); }
        10%  { filter: hue-rotate(30deg) brightness(1.15); }
        20%  { filter: hue-rotate(90deg) brightness(0.9); }
        30%  { filter: hue-rotate(150deg) brightness(1.2); }
        40%  { filter: hue-rotate(210deg) brightness(0.95); }
        50%  { filter: hue-rotate(270deg) brightness(1.25); }
        60%  { filter: hue-rotate(330deg) brightness(0.9); }
        100% { filter: hue-rotate(360deg) brightness(1); }
      }
      /* Text glitch: animate only text-shadow intensity/colors, never transform */
      @keyframes binaryTextGlitch {
        0%, 100% {
          text-shadow:
            2px 0 0 rgba(255, 0, 0, 0.4),
            -2px 0 0 rgba(0, 255, 255, 0.4);
        }
        25% {
          text-shadow:
            2px 0 0 rgba(255, 0, 0, 0.8),
            -2px 0 0 rgba(0, 255, 255, 0.2);
        }
        50% {
          text-shadow:
            2px 0 0 rgba(255, 0, 0, 0.2),
            -2px 0 0 rgba(0, 255, 255, 0.8);
        }
        75% {
          text-shadow:
            2px 0 0 rgba(255, 0, 0, 0.7),
            -2px 0 0 rgba(0, 255, 255, 0.7);
        }
      }
    `;
    document.head.appendChild(style);

    // Create the binary input UI (similar to Room 1 keypad)
    const binaryUI = document.createElement('div');
    binaryUI.id = 'binaryUI';
    binaryUI.style.cssText = `
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #111;
      padding: 20px;
      border: 2px solid #0f0;
      border-radius: 10px;
      text-align: center;
      z-index: 1000;
      font-family: monospace;
      color: #0f0;
    `;

    // Display for current input
    const display = document.createElement('div');
    display.id = 'binaryDisplay';
    display.style.cssText = `
      margin-bottom: 10px;
      font-size: 20px;
      min-height: 30px;
    `;
    display.textContent = 'Enter 8-bit binary:';
    binaryUI.appendChild(display);

    // Add instruction text
    const instructionText = document.createElement('div');
    instructionText.style.cssText = `
      color: #0f0;
      font-size: 12px;
      margin-bottom: 10px;
    `;
    instructionText.textContent = 'Press Q to close';
    binaryUI.appendChild(instructionText);

    // Input field
    const inputField = document.createElement('input');
    inputField.id = 'binaryInput';
    inputField.type = 'text';
    inputField.placeholder = '01001110';
    inputField.maxLength = 8;
    inputField.style.cssText = `
      width: 200px;
      padding: 10px;
      font-size: 18px;
      font-family: monospace;
      background: #000;
      color: #0f0;
      border: 1px solid #0f0;
      text-align: center;
      margin-bottom: 10px;
    `;
    binaryUI.appendChild(inputField);

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 10px;
    `;

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.id = 'submitBtn';
    submitBtn.textContent = 'DECODE';
    submitBtn.style.cssText = `
      background: #222;
      border: 1px solid #0f0;
      color: #0f0;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
    `;
    buttonsContainer.appendChild(submitBtn);

    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.id = 'clearBtn';
    clearBtn.textContent = 'CLEAR';
    clearBtn.style.cssText = `
      background: #222;
      border: 1px solid #0f0;
      color: #0f0;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
    `;
    buttonsContainer.appendChild(clearBtn);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.id = 'closeBtn';
    closeBtn.textContent = 'CLOSE';
    closeBtn.style.cssText = `
      background: #222;
      border: 1px solid #0f0;
      color: #0f0;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
    `;
    buttonsContainer.appendChild(closeBtn);

    binaryUI.appendChild(buttonsContainer);
    document.body.appendChild(binaryUI);

    this.binaryUI = binaryUI;
    this.binaryDisplay = display;
    this.binaryInput = inputField;
  }

  /**
   * Briefly glitch the binary UI in red (error state)
   */
  _triggerBinaryUIGlitch(duration = 2000) {
    try {
      if (!this.binaryUI) return;
      this.binaryUI.classList.add('binary-ui-glitch');
      if (this.binaryDisplay) this.binaryDisplay.classList.add('glitching-text');
      setTimeout(() => {
        if (this.binaryUI) this.binaryUI.classList.remove('binary-ui-glitch');
        if (this.binaryDisplay) this.binaryDisplay.classList.remove('glitching-text');
      }, duration);
    } catch (e) {
      console.warn('Failed to glitch binary UI:', e);
    }
  }

  /**
   * Setup event listeners (like Room 1 keypad)
   */
  _setupEventListeners() {
    // Submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this._handleSubmit());
    }

    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this._clearInput());
    }

    // Close button
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Input validation (only allow 0s and 1s)
    if (this.binaryInput) {
      this.binaryInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^01]/g, '');
      });

      // Enter key to submit
      this.binaryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this._handleSubmit();
        }
      });
    }

    // Add global key listener for Q key to close panel
    this._globalKeyListener = (e) => {
      if (this.panelOpen && (e.key === 'q' || e.key === 'Q')) {
        this.hide();
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', this._globalKeyListener);
  }

  /**
   * Handle binary input submission
   */
  _handleSubmit() {
    const input = this.binaryInput.value.trim();
    
    // Validate input
    if (input.length !== 8) {
      this.binaryDisplay.textContent = 'ERROR: Need 8 digits';
      return;
    }

    if (!/^[01]+$/.test(input)) {
      this.binaryDisplay.textContent = 'ERROR: Only 0s and 1s';
      return;
    }

    // Check if binary matches a NEXUS letter
    if (this.binaryToLetter[input]) {
      const letter = this.binaryToLetter[input];
      if (this.revealedLetters[letter]) {
        this.binaryDisplay.textContent = `Letter ${letter} already revealed!`;
      } else {
        this._revealLetter(letter);
        this.binaryDisplay.textContent = `Letter ${letter} revealed!`;
        this._updatePanelDisplay();
      }
    } else {
      this._handleIncorrectInput();
    }

    // Clear input
    this.binaryInput.value = '';
    this.binaryInput.focus();
  }

  /**
   * Clear input
   */
  _clearInput() {
    this.binaryInput.value = '';
    this.binaryDisplay.textContent = 'Enter 8-bit binary:';
    this.binaryInput.focus();
  }

  /**
   * Reveal a letter on the panel
   */
  _revealLetter(letter) {
    // Mark as revealed
    this.revealedLetters[letter] = true;
    
    // Update the panel display to show the new letter and update colors
    this._updatePanelDisplay();
    
    // Trigger flicker effect
    this._triggerFlickerEffect();

    // Momentarily force Nexus AI dialogue box into red/glitch state
    try {
      // Use gameStore listener path to set tone if available
      if (window.gameStore && typeof window.gameStore.set === 'function') {
        window.gameStore.set('setDialogueTone', 'error');
        // Also add a quick glitch effect to the text if the element exists
        const textEl = document.querySelector('.ai-dialogue-text');
        if (textEl) textEl.classList.add('glitching');
        setTimeout(() => {
          window.gameStore.set('setDialogueTone', 'neutral');
          const t = document.querySelector('.ai-dialogue-text');
          if (t) t.classList.remove('glitching');
        }, 2000);
      }
    } catch (e) {
      console.warn('Failed to flash AI dialogue error/glitch:', e);
    }

    // Notify hologram display (if present)
    if (window.room4Hologram && typeof window.room4Hologram.onRevealLetter === 'function') {
      window.room4Hologram.onRevealLetter(letter);
    }
    
    // Check if all letters are revealed
    if (this._isComplete()) {
      this._showCompletion();
    }
  }

  /**
   * Update the 3D panel display
   */
  _updatePanelDisplay() {
    if (!this.panelText) return;

    // Get completion status for canvas background color
    const isComplete = this._isComplete();

    // Create new canvas with updated letters - larger for better visibility
    const canvas = document.createElement('canvas');
    canvas.width = 960; // Increased from 640
    canvas.height = 480; // Increased from 320
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with black background (for borders)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw screen area with colored background, inset with black borders
    const borderWidth = 30; // Black border width (scaled up)
    const screenX = borderWidth;
    const screenY = borderWidth;
    const screenWidth = canvas.width - (borderWidth * 2);
    const screenHeight = canvas.height - (borderWidth * 2);
    
    // Fill screen area with background color (green when complete, red otherwise)
    ctx.fillStyle = isComplete ? '#00ff88' : '#ff0000';
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
    
    // Draw title in black (on colored background) - scaled up
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px monospace'; // Increased from 24px
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BINARY DECODER', canvas.width / 2, 75); // Adjusted y position
    
    // Draw letter slots with revealed letters - centered on the screen
    const letters = ['N', 'E', 'X', 'U', 'S'];
    const boxWidth = 90; // Width of each box
    const spacing = 112; // Center-to-center spacing between boxes
    const totalWidth = (letters.length - 1) * spacing + boxWidth; // Total width of all boxes
    const startX = (canvas.width - totalWidth) / 2 + boxWidth / 2; // Center the first box
    letters.forEach((letter, index) => {
      const x = startX + (index * spacing);
      const y = 160; // Raised higher so boxes sit above the 3D panel
      
      // Draw letter box with dark background - larger for bigger text
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x - 45, y - 37, 90, 75); // Scaled up
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4; // Scaled up
      ctx.strokeRect(x - 45, y - 37, 90, 75);
      
      // Draw letter or ? - revealed letters in BLACK, unrevealed in white - larger font
      ctx.fillStyle = this.revealedLetters[letter] ? '#000000' : '#ffffff';
      ctx.font = 'bold 42px monospace'; // Increased from 28px
      ctx.fillText(this.revealedLetters[letter] ? letter : '?', x, y);
    });
    
    // Update texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.panelText.material.map = texture;
    this.panelText.material.needsUpdate = true;
  }

  /**
   * Handle incorrect input
   */
  _handleIncorrectInput() {
    this.incorrectAttempts++;
    const remainingAttempts = this.maxAttempts - this.incorrectAttempts;
    this.binaryDisplay.textContent = `WRONG! Attempts remaining: ${remainingAttempts}`;

    // Flash the Room 4 floor red briefly
    try {
      if (typeof window.triggerRoom4FloorGlow === 'function') {
        window.triggerRoom4FloorGlow(2000);
      }
    } catch (e) {
      console.warn('Failed to trigger floor glow:', e);
    }
    
    // Check if max attempts reached
    if (this.incorrectAttempts >= this.maxAttempts) {
      this.hasFailed = true;
      this._triggerGameFailure();
    }

    // Glitch the binary UI in red briefly
    this._triggerBinaryUIGlitch(2000);
  }

  /**
   * Check if all letters are revealed
   */
  _isComplete() {
    return Object.values(this.revealedLetters).every(revealed => revealed);
  }

  /**
   * Show completion message and trigger completion sequence
   */
  _showCompletion() {
    this.binaryDisplay.textContent = 'NEXUS REVEALED! AI identity discovered!';
    console.log('NEXUS puzzle completed!');
    
    // Trigger completion sequence
    this._triggerCompletionSequence();
  }

  /**
   * Trigger flicker effect when a letter is revealed
   */
  _triggerFlickerEffect() {
    // Flicker effect: briefly increase opacity for visual feedback
    if (this.panelText && this.panelText.material) {
      const originalOpacity = this.panelText.material.opacity || 1.0;
      this.panelText.material.opacity = 1.2;
      this.panelText.material.needsUpdate = true;
      
      // Return to normal after 200ms
      setTimeout(() => {
        if (this.panelText && this.panelText.material) {
          this.panelText.material.opacity = originalOpacity;
          this.panelText.material.needsUpdate = true;
        }
      }, 200);
    }
  }

  /**
   * Trigger the completion sequence: change panel to green, hide keypad, show message board
   */
  _triggerCompletionSequence() {
    // Change panel color to green
    this._changePanelToGreen();
    
    // Trigger password found dialogue
    if (window.AI && window.AI.onRoom4PasswordFound) {
      window.AI.onRoom4PasswordFound();
    }
    
    // Hide the keypad after a short delay
    setTimeout(() => {
      this.hide();
      // Remove acknowledgment screen - just hide the panel
    }, 2000);
  }

  /**
   * Change the panel color to green (completion)
   */
  _changePanelToGreen() {
    // Panel color change is handled by canvas background in _updatePanelDisplay()
    // This method is kept for compatibility but no longer needs to do anything
    // as the color change happens automatically when updating the display
  }

  /**
   * Show the completion message board
   */
  _showCompletionMessageBoard() {
    // Create message board overlay
    const messageBoard = document.createElement('div');
    messageBoard.id = 'nexus-completion-board';
    messageBoard.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
      border: 3px solid #00ff88;
      border-radius: 15px;
      padding: 40px;
      box-shadow: 0 0 50px rgba(0, 255, 136, 0.5);
      z-index: 10001;
      font-family: 'Courier New', monospace;
      text-align: center;
      max-width: 600px;
      width: 90%;
    `;

    // Title
    const title = document.createElement('h2');
    title.textContent = 'ACCESS GRANTED';
    title.style.cssText = `
      color: #00ff88;
      font-size: 32px;
      margin: 0 0 20px 0;
      text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
      font-weight: bold;
    `;
    messageBoard.appendChild(title);

    // Message
    const message = document.createElement('div');
    message.innerHTML = `
      <p style="color: #ffffff; font-size: 18px; margin: 20px 0; line-height: 1.5;">
        You have successfully decoded the hidden message: <strong style="color: #00ff88;">NEXUS</strong>
      </p>
      <p style="color: #cccccc; font-size: 16px; margin: 20px 0;">
        The panel has turned green - access granted. This password will be required for future system access.
      </p>
      <p style="color: #ffaa00; font-size: 14px; margin: 20px 0; font-style: italic;">
        The AI's true identity has been discovered. Proceed with caution.
      </p>
    `;
    messageBoard.appendChild(message);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'ACKNOWLEDGE';
    closeButton.style.cssText = `
      background: linear-gradient(135deg, #00ff88, #00cc6a);
      color: #000000;
      border: none;
      padding: 15px 30px;
      font-size: 16px;
      font-family: 'Courier New', monospace;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      margin-top: 20px;
      transition: all 0.3s ease;
    `;
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = 'linear-gradient(135deg, #00cc6a, #00aa55)';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'linear-gradient(135deg, #00ff88, #00cc6a)';
    });
    closeButton.addEventListener('click', () => {
      document.body.removeChild(messageBoard);
      // Re-enable player movement
      window.disablePlayerControls = false;
    });
    messageBoard.appendChild(closeButton);

    document.body.appendChild(messageBoard);
    
    // Disable player movement during message display
    window.disablePlayerControls = true;
  }

  /**
   * Show the panel (like Room 1 keypad)
   */
  show() {
    console.log('NexusPanel.show() called');
    console.log('binaryUI exists:', !!this.binaryUI);
    console.log('binaryInput exists:', !!this.binaryInput);
    
    // Check if puzzle is already completed
    if (this._isComplete()) {
      console.log('NEXUS puzzle already completed');
      // Don't show acknowledgment screen - just show the panel normally
      return;
    }
    
    if (this.binaryUI) {
      this.binaryUI.style.display = 'block';
      this.panelOpen = true;
      
      // Set global UI visibility flag and unlock pointer (same as laptop UI)
      window.isUIVisible = true;
      if (window.player?.controls) window.player.controls.unlock();
      document.exitPointerLock();

      // Disable player movement
      window.disablePlayerControls = true;
      
      // Show mouse cursor and unlock it for UI interaction (same as laptop UI)
      document.body.style.cursor = 'default';
      document.body.classList.add('binary-ui-active'); // Add custom cursor styling
      if (window.camera && window.camera.controls) {
        window.camera.controls.enabled = false; // Disable camera controls
      }
      
      if (this.binaryInput) {
        this.binaryInput.focus();
      }
      if (this.binaryDisplay) {
        this.binaryDisplay.textContent = 'Enter 8-bit binary:';
      }
      console.log('NEXUS panel UI should now be visible');
    } else {
      console.error('binaryUI not found!');
    }
  }

  /**
   * Hide the panel
   */
  hide() {
    this.binaryUI.style.display = 'none';
    this.panelOpen = false;
    
    // Set global UI visibility flag to false (same as laptop UI)
    window.isUIVisible = false;
    window.disablePlayerControls = false; // Re-enable player movement
    
    // Hide mouse cursor and restore camera controls (same as laptop UI)
    document.body.style.cursor = 'none';
    document.body.classList.remove('binary-ui-active'); // Remove custom cursor styling
    if (window.camera && window.camera.controls) {
      window.camera.controls.enabled = true; // Re-enable camera controls
    }
    
    console.log('NEXUS panel closed');
  }

  /**
   * Reset the panel
   */
  reset() {
    // Reset revealed letters
    Object.keys(this.revealedLetters).forEach(letter => {
      this.revealedLetters[letter] = false;
    });
    
    // Reset attempts
    this.incorrectAttempts = 0;
    
    // Reset panel color is handled by _updatePanelDisplay()
    // (no separate panel to reset anymore)
    
    // Reset UI
    this.binaryInput.disabled = false;
    document.getElementById('submitBtn').disabled = false;
    this.binaryInput.value = '';
    this.binaryDisplay.textContent = 'Enter 8-bit binary:';
    this._updatePanelDisplay();
  }

  /**
   * Trigger game failure when max attempts reached
   */
  _triggerGameFailure() {
    console.log('Binary decoder failure triggered');
    
    // Hide the binary decoder panel
    this.hide();
    
    // Show failure screen
    this._showGameFailureScreen();
    
    // Trigger AI dialogue for failure
    if (window.AI) {
      window.AI.deliverDialogue('ACT_I.ROOM_4_BINARY_FAILURE');
    }
  }

  /**
   * Show game failure screen with restart/exit options
   */
  _showGameFailureScreen() {
    // Create failure overlay
    const failureOverlay = document.createElement('div');
    failureOverlay.id = 'binary-failure-overlay';
    failureOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 20000;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Courier New', monospace;
    `;
    
    failureOverlay.innerHTML = `
      <div style="
        background: #1a1a1a;
        border: 2px solid #ff0000;
        border-radius: 8px;
        padding: 40px;
        text-align: center;
        max-width: 600px;
        box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
      ">
        <h1 style="color: #ff0000; font-size: 36px; margin: 0 0 20px 0; text-shadow: 0 0 10px #ff0000;">
          DECODER FAILURE
        </h1>
        <p style="color: #ff6666; font-size: 18px; margin: 0 0 30px 0;">
          Multiple incorrect binary sequences detected.<br>
          The decoder has been permanently locked.
        </p>
        <div style="
          background: rgba(255, 0, 0, 0.2);
          border: 1px solid #ff0000;
          border-radius: 4px;
          padding: 15px;
          margin: 20px 0;
          color: #ffaaaa;
          font-size: 14px;
        ">
          <div style="font-weight: bold; margin-bottom: 10px;">SYSTEM NOTIFICATION</div>
          <div>Decoder Status: LOCKED</div>
          <div>Failure Count: ${this.maxAttempts}</div>
          <div>Reason: Excessive incorrect attempts</div>
        </div>
        <div style="display: flex; gap: 20px; justify-content: center;">
          <button id="binary-failure-restart-btn" style="
            background: #cc0000;
            color: white;
            border: 1px solid #ff0000;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            transition: background 0.3s ease;
          " onmouseover="this.style.background='#ff0000'" onmouseout="this.style.background='#cc0000'">
            Restart Game
          </button>
          <button id="binary-failure-exit-btn" style="
            background: #333333;
            color: white;
            border: 1px solid #666666;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            transition: background 0.3s ease;
          " onmouseover="this.style.background='#555555'" onmouseout="this.style.background='#333333'">
            Exit Game
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(failureOverlay);
    
    // Add event listeners
    document.getElementById('binary-failure-restart-btn').addEventListener('click', () => {
      failureOverlay.remove();
      // Use existing exitToMainMenu function
      if (window.exitToMainMenu) {
        window.exitToMainMenu();
      }
    });
    
    document.getElementById('binary-failure-exit-btn').addEventListener('click', () => {
      failureOverlay.remove();
      // Use existing exitGame function
      if (window.exitGame) {
        window.exitGame();
      }
    });
  }

  /**
   * Update animation
   */
  update(delta) {
    // Keep a stable, non-holographic screen; no per-frame visual changes required
    this.animationTime += delta;
    if (this.panelText && this.panelText.material) {
      this.panelText.material.opacity = 1.0;
    }
  }

  /**
   * Mount to parent group
   */
  mount(parentGroup) {
    parentGroup.add(this.group);
  }

  /**
   * Unmount from parent group
   */
  unmount() {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
    if (this.binaryUI && this.binaryUI.parentNode) {
      this.binaryUI.parentNode.removeChild(this.binaryUI);
    }
    // Clean up event listener
    if (this._globalKeyListener) {
      document.removeEventListener('keydown', this._globalKeyListener);
    }
  }
}
