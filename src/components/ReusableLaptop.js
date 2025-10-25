import * as THREE from 'three';

export function createReusableLaptop(options = {}) {
  const {
    position = new THREE.Vector3(0, 0, 0),
    rotation = 0,
    screenTexture = '/textures/laptop_preview.png',
    screenContent = null,
    interactionId = 'laptop',
    onInteract = null,
    pedestal = true,
    htmlInterface = null, // Custom HTML interface function
    roomId = 'default' // Room identifier for unique HTML IDs
  } = options;

  const laptopGroup = new THREE.Group();
  laptopGroup.name = 'reusable-laptop';
  laptopGroup.position.copy(position);
  laptopGroup.rotation.y = rotation;

  // Store room-specific data
  laptopGroup.userData.roomId = roomId;
  laptopGroup.userData.htmlInterface = htmlInterface;
  laptopGroup.userData.screenActive = false;
  laptopGroup.userData.activationDistance = 4.0; // Distance to activate screen

  // Create pedestal if requested
  if (pedestal) {
    createPedestal(laptopGroup);
  }

  // Create laptop workstation
  createLaptopWorkstation(laptopGroup, screenTexture, screenContent);

  // Add interaction data
  laptopGroup.userData = {
    ...laptopGroup.userData,
    type: 'interactable',
    category: 'laptop',
    id: interactionId,
    onInteract: onInteract || (() => openLaptopInterface(laptopGroup))
  };

  // Add update function for screen activation
  laptopGroup.userData.update = function(delta, player) {
    if (player && player.position) {
      const distance = laptopGroup.position.distanceTo(player.position);
      const shouldBeActive = distance <= laptopGroup.userData.activationDistance;
      
      // Debug logging
      if (Math.random() < 0.01) { // Log occasionally to avoid spam
        console.log(`Laptop update: distance=${distance.toFixed(2)}, activationDistance=${laptopGroup.userData.activationDistance}, shouldBeActive=${shouldBeActive}, screenActive=${laptopGroup.userData.screenActive}`);
      }
      
      if (shouldBeActive && !laptopGroup.userData.screenActive) {
        // Activate screen
        laptopGroup.userData.screenActive = true;
        activateLaptopScreen(laptopGroup);
      } else if (!shouldBeActive && laptopGroup.userData.screenActive) {
        // Deactivate screen
        laptopGroup.userData.screenActive = false;
        deactivateLaptopScreen(laptopGroup);
      }
    }
  };

  return laptopGroup;
}

// Function to open laptop interface
function openLaptopInterface(laptopGroup) {
  const roomId = laptopGroup.userData.roomId;
  const htmlInterface = laptopGroup.userData.htmlInterface;
  
  if (htmlInterface && typeof htmlInterface === 'function') {
    // Create room-specific HTML interface
    htmlInterface(roomId);
  } else {
    // Default laptop interface
    createDefaultLaptopInterface(roomId);
  }
}

// Default laptop interface
function createDefaultLaptopInterface(roomId) {
  const interfaceId = `laptop-interface-${roomId}`;
  
  // Remove existing interface if it exists
  const existingInterface = document.getElementById(interfaceId);
  if (existingInterface) {
    existingInterface.remove();
  }

  const uiContainer = document.createElement('div');
  uiContainer.id = interfaceId;
  
  const style = document.createElement('style');
  style.textContent = `
    #${interfaceId} {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .laptop-window {
      background: #051018;
      border: 2px solid #00ff00;
      border-radius: 8px;
      padding: 20px;
      max-width: 600px;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .laptop-title {
      color: #00ff7f;
      text-align: center;
      margin-bottom: 20px;
      font-size: 18px;
    }
    
    .laptop-content {
      color: #8899aa;
      line-height: 1.6;
    }
    
    .laptop-btn {
      background: transparent;
      border: 1px solid #00ff7f;
      color: #00ff7f;
      padding: 10px 20px;
      cursor: pointer;
      margin: 10px 5px;
      transition: all 0.2s;
    }
    
    .laptop-btn:hover {
      background: #00ff7f;
      color: #051018;
    }
    
    /* Custom cursor styling for laptop UI */
    .laptop-ui-active {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%2300ff00" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%2300ff00"/></svg>'), auto !important;
    }
    .laptop-ui-active * {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%2300ff00" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%2300ff00"/></svg>'), auto !important;
    }
  `;
  
  uiContainer.innerHTML = `
    <div class="laptop-window">
      <div class="laptop-title">LAPTOP TERMINAL - ROOM ${roomId.toUpperCase()}</div>
      <div class="laptop-content">
        <p>Welcome to the laptop terminal.</p>
        <p>This is the default interface for Room ${roomId}.</p>
        <p>Customize this interface by providing a custom htmlInterface function.</p>
      </div>
      <button class="laptop-btn" onclick="closeLaptopInterface('${interfaceId}')">CLOSE</button>
    </div>
  `;
  
  document.body.appendChild(style);
  document.body.appendChild(uiContainer);
  
  // Disable camera controls
  if (window.camera && window.camera.controls) {
    window.camera.controls.enabled = false;
  }
  
  // Set global UI visibility flag and unlock pointer (same as binary decoder)
  window.isUIVisible = true;
  if (window.player?.controls) window.player.controls.unlock();
  document.exitPointerLock();

  // Disable player movement
  window.disablePlayerControls = true;
  
  // Show mouse cursor and unlock it for UI interaction (same as binary decoder)
  document.body.style.cursor = 'default';
  document.body.classList.add('laptop-ui-active'); // Add custom cursor styling
}

// Global function to close laptop interface
window.closeLaptopInterface = function(interfaceId) {
  const interfaceElement = document.getElementById(interfaceId);
  if (interfaceElement) {
    interfaceElement.remove();
  }
  
  // Re-enable camera controls
  if (window.camera && window.camera.controls) {
    window.camera.controls.enabled = true;
  }
  
  // Set global UI visibility flag to false (same as binary decoder)
  window.isUIVisible = false;
  window.disablePlayerControls = false; // Re-enable player movement
  
  // Hide mouse cursor and restore camera controls (same as binary decoder)
  document.body.style.cursor = 'none';
  document.body.classList.remove('laptop-ui-active'); // Remove custom cursor styling
};

// Preset configurations with custom HTML interfaces
export const LaptopPresets = {
  room1: {
    position: new THREE.Vector3(0, 0, 0),
    screenTexture: '/textures/room1_laptop_screen.png',
    interactionId: 'room1_laptop',
    roomId: 'room1',
    htmlInterface: (roomId) => createRoom1LaptopInterface(roomId)
  },
  
  room2: {
    position: new THREE.Vector3(0, 0, 0),
    screenTexture: '/textures/room2_laptop_screen.png',
    interactionId: 'room2_laptop',
    roomId: 'room2',
    htmlInterface: (roomId) => createRoom2LaptopInterface(roomId)
  },
  
  room3: {
    position: new THREE.Vector3(0, 0, 0),
    screenTexture: '/textures/laptop_preview.png',
    interactionId: 'room3_laptop',
    roomId: 'room3',
    htmlInterface: (roomId) => createRoom3LaptopInterface(roomId)
  },
  
  room4: {
    position: new THREE.Vector3(0, 0, 0),
    screenTexture: '/textures/room4_laptop_screen.png',
    interactionId: 'room4_laptop',
    roomId: 'room4',
    htmlInterface: (roomId) => createRoom4LaptopInterface(roomId)
  }
};

// Room-specific laptop interfaces
function createRoom1LaptopInterface(roomId) {
  const interfaceId = `laptop-interface-${roomId}`;
  
  // Remove existing interface
  const existingInterface = document.getElementById(interfaceId);
  if (existingInterface) {
    existingInterface.remove();
  }

  const uiContainer = document.createElement('div');
  uiContainer.id = interfaceId;
  
  const style = document.createElement('style');
  style.textContent = `
    #${interfaceId} {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .room1-laptop {
      background: linear-gradient(135deg, #051018, #0a2230);
      border: 2px solid #00ff7f;
      border-radius: 12px;
      padding: 30px;
      max-width: 700px;
      max-height: 500px;
      overflow-y: auto;
      box-shadow: 0 0 20px rgba(0, 255, 127, 0.3);
    }
    
    .room1-title {
      color: #00ff7f;
      text-align: center;
      margin-bottom: 20px;
      font-size: 24px;
      text-shadow: 0 0 10px #00ff7f;
    }
    
    .room1-content {
      color: #8899aa;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    
    .room1-puzzle {
      background: rgba(0, 255, 127, 0.1);
      border: 1px solid #00ff7f;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
    }
    
    .room1-input {
      background: #051018;
      border: 1px solid #00ff7f;
      color: #00ff7f;
      padding: 8px;
      width: 100%;
      margin: 5px 0;
    }
    
    .room1-btn {
      background: transparent;
      border: 1px solid #00ff7f;
      color: #00ff7f;
      padding: 12px 24px;
      cursor: pointer;
      margin: 10px 5px;
      transition: all 0.2s;
      border-radius: 4px;
    }
    
    .room1-btn:hover {
      background: #00ff7f;
      color: #051018;
    }
    
    /* Custom cursor styling for laptop UI */
    .laptop-ui-active {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%2300ff7f" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%2300ff7f"/></svg>'), auto !important;
    }
    .laptop-ui-active * {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%2300ff7f" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%2300ff7f"/></svg>'), auto !important;
    }
  `;
  
  uiContainer.innerHTML = `
    <div class="room1-laptop">
      <div class="room1-title">🔐 SECURITY TERMINAL - ROOM 1</div>
      <div class="room1-content">
        <p>Welcome to the Security Terminal. This system controls access to Room 1.</p>
        <div class="room1-puzzle">
          <h3>Access Control Panel</h3>
          <p>Enter the security code to proceed:</p>
          <input type="text" class="room1-input" id="security-code" placeholder="Enter 4-digit code">
          <button class="room1-btn" onclick="checkSecurityCode('${interfaceId}')">SUBMIT</button>
        </div>
        <p><strong>Hint:</strong> The code is related to the safe combination.</p>
      </div>
      <button class="room1-btn" onclick="closeLaptopInterface('${interfaceId}')">CLOSE TERMINAL</button>
    </div>
  `;
  
  document.body.appendChild(style);
  document.body.appendChild(uiContainer);
  
  // Disable camera controls
  if (window.camera && window.camera.controls) {
    window.camera.controls.enabled = false;
  }
  
  // Set global UI visibility flag and unlock pointer (same as binary decoder)
  window.isUIVisible = true;
  if (window.player?.controls) window.player.controls.unlock();
  document.exitPointerLock();

  // Disable player movement
  window.disablePlayerControls = true;
  
  // Show mouse cursor and unlock it for UI interaction (same as binary decoder)
  document.body.style.cursor = 'default';
  document.body.classList.add('laptop-ui-active'); // Add custom cursor styling
}

function createRoom2LaptopInterface(roomId) {
  const interfaceId = `laptop-interface-${roomId}`;
  
  const existingInterface = document.getElementById(interfaceId);
  if (existingInterface) {
    existingInterface.remove();
  }

  const uiContainer = document.createElement('div');
  uiContainer.id = interfaceId;
  
  const style = document.createElement('style');
  style.textContent = `
    #${interfaceId} {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      color: #ff6b35;
      font-family: 'Courier New', monospace;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .room2-laptop {
      background: linear-gradient(135deg, #1a0a0a, #2d1b1b);
      border: 2px solid #ff6b35;
      border-radius: 12px;
      padding: 30px;
      max-width: 700px;
      max-height: 500px;
      overflow-y: auto;
      box-shadow: 0 0 20px rgba(255, 107, 53, 0.3);
    }
    
    .room2-title {
      color: #ff6b35;
      text-align: center;
      margin-bottom: 20px;
      font-size: 24px;
      text-shadow: 0 0 10px #ff6b35;
    }
    
    .room2-content {
      color: #ffb366;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    
    .room2-puzzle {
      background: rgba(255, 107, 53, 0.1);
      border: 1px solid #ff6b35;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
    }
    
    .room2-btn {
      background: transparent;
      border: 1px solid #ff6b35;
      color: #ff6b35;
      padding: 12px 24px;
      cursor: pointer;
      margin: 10px 5px;
      transition: all 0.2s;
      border-radius: 4px;
    }
    
    .room2-btn:hover {
      background: #ff6b35;
      color: #1a0a0a;
    }
    
    /* Custom cursor styling for laptop UI */
    .laptop-ui-active {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%23ff6b35" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%23ff6b35"/></svg>'), auto !important;
    }
    .laptop-ui-active * {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%23ff6b35" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%23ff6b35"/></svg>'), auto !important;
    }
  `;
  
  uiContainer.innerHTML = `
    <div class="room2-laptop">
      <div class="room2-title">⚖️ BALANCE TERMINAL - ROOM 2</div>
      <div class="room2-content">
        <p>Welcome to the Balance Terminal. This system monitors the equilibrium of Room 2.</p>
        <div class="room2-puzzle">
          <h3>Balance Control System</h3>
          <p>Current Status: <span id="balance-status">UNKNOWN</span></p>
          <p>Calibrate the scales to proceed:</p>
          <button class="room2-btn" onclick="calibrateScales('${interfaceId}')">CALIBRATE</button>
          <button class="room2-btn" onclick="checkBalance('${interfaceId}')">CHECK BALANCE</button>
        </div>
        <p><strong>Note:</strong> Perfect balance is required for system access.</p>
      </div>
      <button class="room2-btn" onclick="closeLaptopInterface('${interfaceId}')">CLOSE TERMINAL</button>
    </div>
  `;
  
  document.body.appendChild(style);
  document.body.appendChild(uiContainer);
  
  // Disable camera controls
  if (window.camera && window.camera.controls) {
    window.camera.controls.enabled = false;
  }
  
  // Set global UI visibility flag and unlock pointer (same as binary decoder)
  window.isUIVisible = true;
  if (window.player?.controls) window.player.controls.unlock();
  document.exitPointerLock();

  // Disable player movement
  window.disablePlayerControls = true;
  
  // Show mouse cursor and unlock it for UI interaction (same as binary decoder)
  document.body.style.cursor = 'default';
  document.body.classList.add('laptop-ui-active'); // Add custom cursor styling
}

function createRoom3LaptopInterface(roomId) {
  const interfaceId = `laptop-interface-${roomId}`;
  
  const existingInterface = document.getElementById(interfaceId);
  if (existingInterface) {
    existingInterface.remove();
  }

  const uiContainer = document.createElement('div');
  uiContainer.id = interfaceId;
  
  const style = document.createElement('style');
  style.textContent = `
    #${interfaceId} {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      color: #00ffff;
      font-family: 'Courier New', monospace;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .room3-laptop {
      background: linear-gradient(135deg, #0a0a2e, #1a1a4a);
      border: 2px solid #00ffff;
      border-radius: 12px;
      padding: 30px;
      max-width: 700px;
      max-height: 500px;
      overflow-y: auto;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
    }
    
    .room3-title {
      color: #00ffff;
      text-align: center;
      margin-bottom: 20px;
      font-size: 24px;
      text-shadow: 0 0 10px #00ffff;
    }
    
    .room3-content {
      color: #66ccff;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    
    .room3-puzzle {
      background: rgba(0, 255, 255, 0.1);
      border: 1px solid #00ffff;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
    }
    
    .room3-btn {
      background: transparent;
      border: 1px solid #00ffff;
      color: #00ffff;
      padding: 12px 24px;
      cursor: pointer;
      margin: 10px 5px;
      transition: all 0.2s;
      border-radius: 4px;
    }
    
    .room3-btn:hover {
      background: #00ffff;
      color: #0a0a2e;
    }
    
    /* Custom cursor styling for laptop UI */
    .laptop-ui-active {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%2300ffff" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%2300ffff"/></svg>'), auto !important;
    }
    .laptop-ui-active * {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%2300ffff" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%2300ffff"/></svg>'), auto !important;
    }
  `;
  
  uiContainer.innerHTML = `
    <div class="room3-laptop">
      <div class="room3-title">🌊 DATA STORM TERMINAL - ROOM 3</div>
      <div class="room3-content">
        <p>Welcome to the Data Storm Terminal. This system processes encrypted data streams.</p>
        <div class="room3-puzzle">
          <h3>Data Decryption System</h3>
          <p>System Status: <span style="color: #00ff7f;">ONLINE</span></p>
          <p>Available Operations:</p>
          <ul>
            <li>Data Stream Analysis</li>
            <li>Encryption Decoder</li>
            <li>Purge Protocol</li>
          </ul>
          <button class="room3-btn" onclick="startDataStorm('${interfaceId}')">START DATA STORM</button>
          <button class="room3-btn" onclick="runPurgeProtocol('${interfaceId}')">RUN PURGE PROTOCOL</button>
        </div>
        <p><strong>Warning:</strong> Data operations may affect system stability.</p>
      </div>
      <button class="room3-btn" onclick="closeLaptopInterface('${interfaceId}')">CLOSE TERMINAL</button>
    </div>
  `;
  
  document.body.appendChild(style);
  document.body.appendChild(uiContainer);
  
  // Disable camera controls
  if (window.camera && window.camera.controls) {
    window.camera.controls.enabled = false;
  }
  
  // Set global UI visibility flag and unlock pointer (same as binary decoder)
  window.isUIVisible = true;
  if (window.player?.controls) window.player.controls.unlock();
  document.exitPointerLock();

  // Disable player movement
  window.disablePlayerControls = true;
  
  // Show mouse cursor and unlock it for UI interaction (same as binary decoder)
  document.body.style.cursor = 'default';
  document.body.classList.add('laptop-ui-active'); // Add custom cursor styling
}

function createRoom4LaptopInterface(roomId) {
  const interfaceId = `laptop-interface-${roomId}`;
  
  const existingInterface = document.getElementById(interfaceId);
  if (existingInterface) {
    existingInterface.remove();
  }

  const uiContainer = document.createElement('div');
  uiContainer.id = interfaceId;
  
  // Check if binary decoder is completed
  const isDecoderComplete = checkBinaryDecoderCompletion();
  
  const style = document.createElement('style');
  style.textContent = `
    #${interfaceId} {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      color: #9d4edd;
      font-family: 'Courier New', monospace;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .room4-laptop {
      background: linear-gradient(135deg, #1a0a2e, #2d1b69);
      border: 2px solid #9d4edd;
      border-radius: 12px;
      padding: 30px;
      max-width: 700px;
      max-height: 500px;
      overflow-y: auto;
      box-shadow: 0 0 20px rgba(157, 78, 221, 0.3);
    }
    
    .room4-title {
      color: #9d4edd;
      text-align: center;
      margin-bottom: 20px;
      font-size: 24px;
      text-shadow: 0 0 10px #9d4edd;
    }
    
    .room4-content {
      color: #c77dff;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    
    .room4-instruction {
      background: rgba(157, 78, 221, 0.1);
      border: 1px solid #9d4edd;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
    }
    
    .room4-password-section {
      background: rgba(0, 255, 127, 0.1);
      border: 1px solid #00ff7f;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
    }
    
    .room4-input {
      background: #1a0a2e;
      border: 1px solid #9d4edd;
      color: #9d4edd;
      padding: 10px;
      width: 200px;
      font-family: 'Courier New', monospace;
      text-align: center;
      margin: 10px 5px;
    }
    
    .room4-btn {
      background: transparent;
      border: 1px solid #9d4edd;
      color: #9d4edd;
      padding: 12px 24px;
      cursor: pointer;
      margin: 10px 5px;
      transition: all 0.2s;
      border-radius: 4px;
    }
    
    .room4-btn:hover {
      background: #9d4edd;
      color: #1a0a2e;
    }
    
    .room4-btn.success {
      border-color: #00ff7f;
      color: #00ff7f;
    }
    
    .room4-btn.success:hover {
      background: #00ff7f;
      color: #1a0a2e;
    }
  `;
  
  // Generate content based on decoder completion status
  let content = '';
  if (isDecoderComplete) {
    content = `
      <div class="room4-password-section">
        <h3 style="color: #00ff7f; margin-top: 0;">🔓 PASSWORD REQUIRED</h3>
        <p>You have successfully decoded the hidden message from the Binary Decoder!</p>
        <p>Enter the 5-letter password to access the NEXUS system:</p>
        <input type="text" class="room4-input" id="nexus-password" placeholder="Enter password" maxlength="5">
        <br>
        <button class="room4-btn success" onclick="submitNexusPassword('${interfaceId}')">SUBMIT PASSWORD</button>
      </div>
    `;
  } else {
    content = `
      <div class="room4-instruction">
        <h3 style="color: #9d4edd; margin-top: 0;">🔍 MISSION BRIEFING</h3>
        <p><strong>Objective:</strong> Access the NEXUS system to complete the final test.</p>
        <p><strong>Step 1:</strong> You'll notice the binary streams floating throughout the room. The password you need is encoded within these streams, they contain the key to accessing the decoder panel.</p>
        <p><strong>Step 2:</strong> Locate the Binary Decoder panel on the north wall of this room. Interact with the Decoder to solve the puzzle and reveal the hidden password.</p>
        <p><strong>Step 3:</strong> Return to this laptop and enter the password to access the NEXUS system.</p>
        <p style="color: #ffaa00;"><strong>Hint:</strong> The password is a 5-letter word that appears when you complete the binary decoder puzzle.</p>
      </div>
    `;
  }
  
  uiContainer.innerHTML = `
    <div class="room4-laptop">
      <div class="room4-title">🌌 NEXUS TERMINAL</div>
      <div class="room4-content">
        <p>Welcome to the Terminal. This system controls the core of the facility.</p>
        <p>Access Level: <span style="color: #9d4edd;">ADMINISTRATOR</span></p>
        <p>System Status: <span style="color: #00ff7f;">ONLINE</span></p>
        ${content}
      </div>
      <button class="room4-btn" onclick="closeLaptopInterface('${interfaceId}')">CLOSE TERMINAL</button>
    </div>
  `;
  
  document.body.appendChild(style);
  document.body.appendChild(uiContainer);
  
  // Disable camera controls
  if (window.camera && window.camera.controls) {
    window.camera.controls.enabled = false;
  }
  
  // Set global UI visibility flag and unlock pointer (same as binary decoder)
  window.isUIVisible = true;
  if (window.player?.controls) window.player.controls.unlock();
  document.exitPointerLock();

  // Disable player movement
  window.disablePlayerControls = true;
  
  // Show mouse cursor and unlock it for UI interaction (same as binary decoder)
  document.body.style.cursor = 'default';
  document.body.classList.add('laptop-ui-active'); // Add custom cursor styling
}

// Helper function to check if binary decoder is completed
function checkBinaryDecoderCompletion() {
  // Check if the global nexus panel exists and is completed
  if (window.room4NexusPanel && typeof window.room4NexusPanel._isComplete === 'function') {
    return window.room4NexusPanel._isComplete();
  }
  
  // Fallback: check if the binary UI exists and is visible
  const binaryUI = document.querySelector('#binaryUI');
  if (binaryUI && binaryUI.style.display === 'block') {
    // If the UI is visible, assume it's not completed yet
    return false;
  }
  
  // Default to false if we can't determine the state
  return false;
}

// Global function to submit NEXUS password
window.submitNexusPassword = function(interfaceId) {
  const passwordInput = document.getElementById('nexus-password');
  const password = passwordInput.value.trim().toUpperCase();
  
  if (password === 'NEXUS') {
    // Password correct - show success message
    const content = document.querySelector('.room4-content');
    content.innerHTML = `
      <p>Welcome to the Nexus Terminal. This system controls the core of the facility.</p>
      <p>Access Level: <span style="color: #9d4edd;">ADMINISTRATOR</span></p>
      <p>System Status: <span style="color: #00ff7f;">ONLINE</span></p>
      <div class="room4-password-section">
        <h3 style="color: #00ff7f; margin-top: 0;">🎉 ACCESS GRANTED!</h3>
        <p>Password accepted! You have successfully accessed the NEXUS system.</p>
        <p style="color: #00ff7f;"><strong>Room 4 Complete!</strong></p>
        <p>You have discovered the AI's true identity and gained access to the core system.</p>
        <p style="color: #ffaa00;">The facility is now under your control.</p>
      </div>
    `;
    
    // Hide the password input section
    const passwordSection = document.querySelector('.room4-password-section');
    if (passwordSection) {
      passwordSection.style.display = 'none';
    }
    
    // Trigger room completion if AI system is available
    if (window.AI && window.AI.onRoom4Complete) {
      window.AI.onRoom4Complete();
    }
    
  } else {
    // Password incorrect
    alert('Incorrect password. Please try again.');
    passwordInput.value = '';
    passwordInput.focus();
  }
};

// Global functions for room-specific interactions
window.checkSecurityCode = function(interfaceId) {
  const code = document.getElementById('security-code').value;
  if (code === '1886') {
    alert('Access Granted! Security code accepted.');
    // Add your room 1 specific logic here
  } else {
    alert('Access Denied. Incorrect security code.');
  }
};

window.calibrateScales = function(interfaceId) {
  document.getElementById('balance-status').textContent = 'CALIBRATING...';
  setTimeout(() => {
    document.getElementById('balance-status').textContent = 'CALIBRATED';
  }, 2000);
};

window.checkBalance = function(interfaceId) {
  const status = document.getElementById('balance-status').textContent;
  if (status === 'CALIBRATED') {
    alert('Balance verified. Access granted to Room 2 systems.');
  } else {
    alert('Balance not calibrated. Please calibrate first.');
  }
};

window.startDataStorm = function(interfaceId) {
  alert('Data Storm initiated. Processing encrypted streams...');
  // Add your room 3 specific logic here
};

window.runPurgeProtocol = function(interfaceId) {
  alert('Purge Protocol activated. System cleanup in progress...');
  // Add your room 3 specific logic here
};

function createPedestal(parentGroup) {
  // Pedestal base with holographic glow
  const pedestalBaseMat = new THREE.MeshStandardMaterial({ 
    color: 0xaaaaaa, // Very bright base color
    metalness: 0.9, // Very high metalness for holographic reflection
    roughness: 0.02, // Extremely low roughness for mirror-like surface
    emissive: 0x00ff88, // Green glow to match the theme
    emissiveIntensity: 0.8, // Very strong glow
    transparent: true,
    opacity: 0.95 // Slightly transparent for holographic effect
  });
  const pedestalBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32),
    pedestalBaseMat
  );
  pedestalBase.position.y = 0.05;
  pedestalBase.castShadow = true;
  pedestalBase.receiveShadow = true;
  parentGroup.add(pedestalBase);

  // Pedestal column with holographic glow
  const pedestalMat = new THREE.MeshStandardMaterial({ 
    color: 0x999999, // Very bright column color
    metalness: 0.95, // Maximum metalness for holographic reflection
    roughness: 0.01, // Minimum roughness for maximum reflection
    emissive: 0x00ff88, // Green glow to match the theme
    emissiveIntensity: 0.9, // Maximum glow intensity
    transparent: true,
    opacity: 0.9 // More transparent for holographic effect
  });
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.8, 32),
    pedestalMat
  );
  pedestal.position.y = 0.4;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  parentGroup.add(pedestal);
}

function createLaptopWorkstation(parentGroup, screenTexture, screenContent) {
  // Table/Platform
  const tableMat = new THREE.MeshStandardMaterial({ 
    color: 0x6a6a6a, // Much brighter table
    metalness: 0.3, // Good metalness for reflection
    roughness: 0.2, // Low roughness for more reflection
    emissive: 0x333333, // Bright emissive glow
    emissiveIntensity: 0.2
  });
  const table = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.8, 1.2), 
    tableMat
  );
  table.position.y = 0.4;
  table.castShadow = true;
  table.receiveShadow = true;
  parentGroup.add(table);

  // Laptop group
  const laptopGroup = new THREE.Group();
  laptopGroup.position.y = 0.8;
  parentGroup.add(laptopGroup);

  // Laptop base (keyboard)
  const baseMat = new THREE.MeshStandardMaterial({ 
    color: 0x4a4a4a, // Much brighter
    metalness: 0.7, // Good metalness for reflection
    roughness: 0.1, // Very low roughness for more reflection
    emissive: 0x555555, // Bright emissive glow
    emissiveIntensity: 0.3
  });
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.05, 0.4), 
    baseMat
  );
  laptopGroup.add(base);

  // Hinge mechanism
  const hingeGroup = new THREE.Group();
  hingeGroup.position.z = -0.2;
  laptopGroup.add(hingeGroup);

  // Screen
  const screenMat = new THREE.MeshStandardMaterial({ 
    color: 0x3a3a3a, // Much brighter
    metalness: 0.8, // High metalness for good reflection
    roughness: 0.05, // Very low roughness for maximum reflection
    emissive: 0x666666, // Very bright emissive glow
    emissiveIntensity: 0.4
  });
  const screenHeight = 0.4;
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, screenHeight, 0.05), 
    screenMat
  );
  screen.position.y = screenHeight / 2;
  hingeGroup.add(screen);

  // Display screen
  createDisplayScreen(screen, screenTexture, screenContent);

  // Set screen angle
  hingeGroup.rotation.x = Math.PI * -0.15;

  // Make laptop interactable
  laptopGroup.userData.isInteractable = true;
  laptopGroup.userData.interactionId = parentGroup.userData.id;
}

function createDisplayScreen(screen, screenTexture, screenContent) {
  const textureLoader = new THREE.TextureLoader();
  
  // Default screen texture
  const displayTexture = textureLoader.load(screenTexture);
  displayTexture.colorSpace = THREE.SRGBColorSpace;
  
  const displayMat = new THREE.MeshStandardMaterial({
    map: displayTexture,
    emissive: 0x808080, // Much brighter base emissive color
    emissiveMap: displayTexture,
    emissiveIntensity: 1.0, // Maximum for best visibility
    toneMapped: false, // Keep false for emissive materials
    transparent: false,
    side: THREE.FrontSide
  });
  
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.35), 
    displayMat
  );
  display.position.z = 0.026;
  screen.add(display);

  // Store reference for potential content updates
  display.userData.originalMaterial = displayMat;
  display.userData.originalTexture = displayTexture;
  
  // If custom screen content is provided, apply it
  if (screenContent && typeof screenContent === 'function') {
    screenContent(display, displayMat);
  }
}

// Function to activate laptop screen
function activateLaptopScreen(laptopGroup) {
  const display = findLaptopDisplay(laptopGroup);
  console.log('activateLaptopScreen called, display found:', !!display);
  if (display && display.userData.originalMaterial) {
    // Increase emissive intensity to make screen glow
    display.userData.originalMaterial.emissiveIntensity = 1.2;
    display.userData.originalMaterial.needsUpdate = true;
    
    // Add a subtle glow effect
    display.userData.originalMaterial.emissive.setHex(0x404040);
    
    console.log('Laptop screen activated - player is nearby');
  } else {
    console.log('activateLaptopScreen: display or material not found');
  }
}

// Function to deactivate laptop screen
function deactivateLaptopScreen(laptopGroup) {
  const display = findLaptopDisplay(laptopGroup);
  if (display && display.userData.originalMaterial) {
    // Reduce emissive intensity to dim the screen
    display.userData.originalMaterial.emissiveIntensity = 0.1;
    display.userData.originalMaterial.needsUpdate = true;
    
    // Reduce glow effect
    display.userData.originalMaterial.emissive.setHex(0x111111);
    
    console.log('Laptop screen deactivated - player moved away');
  }
}

// Helper function to find the laptop display
function findLaptopDisplay(laptopGroup) {
  // Look for the display mesh in the laptop hierarchy
  let display = null;
  let meshCount = 0;
  laptopGroup.traverse((child) => {
    if (child.isMesh) {
      meshCount++;
      console.log(`Found mesh: ${child.name || 'unnamed'}, has originalMaterial: ${!!child.userData.originalMaterial}`);
      if (child.userData.originalMaterial) {
        display = child;
      }
    }
  });
  console.log(`findLaptopDisplay: found ${meshCount} meshes, display:`, !!display);
  return display;
}

// Utility function to update screen content
export function updateLaptopScreen(laptopGroup, newTexture, newContent) {
  const display = findLaptopDisplay(laptopGroup);
  
  if (display && display.userData.originalMaterial) {
    if (newTexture) {
      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load(newTexture);
      texture.colorSpace = THREE.SRGBColorSpace;
      display.userData.originalMaterial.map = texture;
      display.userData.originalMaterial.emissiveMap = texture;
    }
    
    if (newContent && typeof newContent === 'function') {
      newContent(display, display.userData.originalMaterial);
    }
  }
}
