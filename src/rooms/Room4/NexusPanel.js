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
    
    // Track incorrect attempts
    this.incorrectAttempts = 0;
    this.maxAttempts = 10;
    
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
    // Main panel frame - larger, more prominent display
    const frameGeometry = new THREE.PlaneGeometry(8, 5);
    // Panel starts red, changes to green when complete
    const isComplete = this._isComplete();
    const frameMaterial = new THREE.MeshBasicMaterial({
      color: isComplete ? 0x00ff88 : 0xff0000,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide // Make it visible from both sides
    });
    this.panel = new THREE.Mesh(frameGeometry, frameMaterial);
    this.panel.position.set(0, 0, 0); // Centered in the group
    this.group.add(this.panel);

    // Add some simple text on the panel
    this._createPanelText();
  }

  /**
   * Create text display on the panel
   */
  _createPanelText() {
    // Create canvas for text - larger for better visibility
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with background color (green when complete, red otherwise)
    const isComplete = this._isComplete();
    ctx.fillStyle = isComplete ? '#00ff88' : '#ff0000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw title in black
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BINARY DECODER', canvas.width / 2, 50);
    
    // Draw letter slots - centered better for larger canvas
    const letters = ['N', 'E', 'X', 'U', 'S'];
    const startX = 132; // Centered better for 5 letters on larger canvas
    const spacing = 75; // Adjusted spacing for larger canvas
    letters.forEach((letter, index) => {
      const x = startX + (index * spacing);
      const y = 150;
      
      // Draw letter box with dark background - larger for bigger text
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x - 30, y - 25, 60, 50);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 30, y - 25, 60, 50);
      
      // Draw letter or ? in white initially - larger font
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('?', x, y);
    });
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create static text display using a plane mesh (no rotation) - larger size
    const textGeometry = new THREE.PlaneGeometry(6, 3);
    const textMaterial = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 0, 0.01); // Slightly in front of panel
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
    
    // Trigger flicker effect
    this._triggerFlickerEffect();
    
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

    // Create new canvas with updated letters - larger for better visibility
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with background color (green when complete, red otherwise)
    const isComplete = this._isComplete();
    ctx.fillStyle = isComplete ? '#00ff88' : '#ff0000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw title in black
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BINARY DECODER', canvas.width / 2, 50);
    
    // Draw letter slots with revealed letters - centered better for larger canvas
    const letters = ['N', 'E', 'X', 'U', 'S'];
    const startX = 132; // Centered better for 5 letters on larger canvas
    const spacing = 75; // Adjusted spacing for larger canvas
    letters.forEach((letter, index) => {
      const x = startX + (index * spacing);
      const y = 150;
      
      // Draw letter box with dark background - larger for bigger text
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x - 30, y - 25, 60, 50);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 30, y - 25, 60, 50);
      
      // Draw letter or ? - revealed letters in BLACK, unrevealed in white - larger font
      ctx.fillStyle = this.revealedLetters[letter] ? '#000000' : '#ffffff';
      ctx.font = 'bold 28px monospace';
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
    this.binaryDisplay.textContent = `WRONG! Attempts: ${this.incorrectAttempts}/${this.maxAttempts}`;
    
    // Check if max attempts reached
    if (this.incorrectAttempts >= this.maxAttempts) {
      this.binaryDisplay.textContent = 'MAX ATTEMPTS REACHED! Panel locked.';
      this.binaryInput.disabled = true;
      document.getElementById('submitBtn').disabled = true;
    }
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
    if (!this.panel || !this.panel.material) return;
    
    // Store original color
    const originalColor = this.panel.material.color.getHex();
    
    // Flicker to green for a moment
    this.panel.material.color.setHex(0x00ff88);
    this.panel.material.needsUpdate = true;
    
    // Return to red after 200ms
    setTimeout(() => {
      if (this.panel && this.panel.material) {
        this.panel.material.color.setHex(originalColor);
        this.panel.material.needsUpdate = true;
      }
    }, 200);
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
      this._showCompletionMessageBoard();
    }, 2000);
  }

  /**
   * Change the panel color to green (completion)
   */
  _changePanelToGreen() {
    if (this.panel && this.panel.material) {
      this.panel.material.color.setHex(0x00ff88); // Change to green
      this.panel.material.needsUpdate = true;
    }
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
      console.log('NEXUS puzzle already completed - showing completion message');
      this._showCompletionMessageBoard();
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
    
    // Reset panel color to red (initial state)
    if (this.panel && this.panel.material) {
      this.panel.material.color.setHex(0xff0000);
      this.panel.material.needsUpdate = true;
    }
    
    // Reset UI
    this.binaryInput.disabled = false;
    document.getElementById('submitBtn').disabled = false;
    this.binaryInput.value = '';
    this.binaryDisplay.textContent = 'Enter 8-bit binary:';
    this._updatePanelDisplay();
  }

  /**
   * Update animation
   */
  update(delta) {
    this.animationTime += delta;
    
    // Simple pulsing glow for the flat panel
    if (this.panel && this.panel.material) {
      const glowIntensity = 0.5 + 0.3 * Math.sin(this.animationTime * 2);
      this.panel.material.opacity = 0.7 + 0.2 * glowIntensity;
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
