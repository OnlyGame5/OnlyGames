import * as THREE from 'three';
import { addToInventory } from '../player.js';
import { createCelShadingMaterial } from '../shaders/CelShader.js';

let oldEnglishFontPromise = null;

async function ensureOldEnglishFont() {
  if (oldEnglishFontPromise) {
    return oldEnglishFontPromise;
  }

  oldEnglishFontPromise = (async () => {
    try {
      if (!document.getElementById('unifraktur-font-link')) {
        const link = document.createElement('link');
        link.id = 'unifraktur-font-link';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&display=swap';
        document.head.appendChild(link);
      }
      await document.fonts.load('64px "UnifrakturMaguntia"');
    } catch (err) {
      console.warn('Failed to load Old English font for laptop screen:', err);
    }
  })();

  return oldEnglishFontPromise;
}

export async function applyGammaLaptopWallpaper(display, material) {
  await ensureOldEnglishFont();

  const width = 1024;
  const height = 768;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.1,
    width / 2,
    height / 2,
    Math.min(width, height) * 0.75
  );
  gradient.addColorStop(0, '#cfe2d6');
  gradient.addColorStop(1, '#0a192f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const fontFamily = '"Old English Text MT","Cloister Black","UnifrakturMaguntia",serif';
  ctx.fillStyle = 'rgba(20,30,25,0.95)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(height * 0.85)}px ${fontFamily}`;
  ctx.fillText('G', width / 2, height / 2);

  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.25,
    width / 2,
    height / 2,
    Math.min(width, height) * 0.95
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  material.map = texture;
  material.emissiveMap = texture;
  material.needsUpdate = true;
}

export function createReusableLaptop(options = {}) {
  const {
    position = new THREE.Vector3(0, 0, 0),
    rotation = 0,
    screenTexture = './textures/laptop_preview.png',
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
      
      // removed debug logs
      
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
  // room1 preset intentionally removed; Room 1 uses a custom implementation
  
  room2: {
    position: new THREE.Vector3(0, 0, 0),
    screenTexture: './textures/room2_laptop_screen.png',
    screenContent: (display, material) => applyGammaLaptopWallpaper(display, material),
    interactionId: 'room2_laptop',
    roomId: 'room2',
    htmlInterface: (roomId) => createRoom2LaptopInterface(roomId)
  },
  
  room3: {
    position: new THREE.Vector3(0, 0, 0),
    screenTexture: './textures/laptop_preview.png',
    interactionId: 'room3_laptop',
    roomId: 'room3',
    htmlInterface: (roomId) => createRoom3LaptopInterface(roomId)
  },
  
  room4: {
    position: new THREE.Vector3(0, 0, 0),
    screenTexture: './textures/room2_laptop_screen.png',
    screenContent: (display, material) => applyGammaLaptopWallpaper(display, material),
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
  
  const decoderComplete = checkBinaryDecoderCompletion();

  if (!decoderComplete && window.AI && window.AI.deliverDialogue && !window.room4LaptopDialogueShown) {
    window.AI.deliverDialogue('ACT_I.ROOM_4_BINARY_DECODER');
    window.room4LaptopDialogueShown = true;
  }

  const style = document.createElement('style');
  style.dataset.owner = interfaceId;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&display=swap');
    #${interfaceId} {
      position: fixed;
      inset: 0;
      background: #0a192f;
      z-index: 10000;
      font-family: 'Courier New', 'Consolas', monospace;
      overflow: hidden;
    }
    #${interfaceId} .desktop-bg {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, rgba(207,226,214,0.92) 0%, rgba(10,25,47,1) 72%);
      z-index: 0;
    }
    #${interfaceId} .desktop-bg .g-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Old English Text MT','Cloister Black','UnifrakturMaguntia',serif;
      font-size: 32vw;
      line-height: 0.8;
      color: rgba(20,30,25,0.92);
      text-shadow: 0 0 30px rgba(0,0,0,0.35), 0 0 80px rgba(0,0,0,0.25);
      pointer-events: none;
      user-select: none;
    }
    #${interfaceId} .desktop-icons {
      position: absolute;
      top: 40px;
      left: 40px;
      display: grid;
      gap: 20px;
      z-index: 2;
    }
    #${interfaceId} .desktop-icons .icon {
      width: 110px;
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 12px;
      text-align: center;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      transition: background 0.2s ease;
    }
    #${interfaceId} .desktop-icons .icon:hover {
      background: rgba(0, 255, 127, 0.12);
    }
    #${interfaceId} .desktop-icons .icon:focus-visible {
      outline: 2px solid #00ff7f;
    }
    #${interfaceId} .icon-sprite {
      width: 56px;
      height: 56px;
      margin: 0 auto 6px;
      border-radius: 12px;
      opacity: 0.88;
    }
    #${interfaceId} .icon-sprite.nexus {
      background: linear-gradient(180deg, #12fff2, #0b8cb8);
      border: 1px solid rgba(10, 180, 210, 0.6);
      box-shadow: 0 0 12px rgba(18, 255, 242, 0.35);
    }
    #${interfaceId} .icon-sprite.decoder {
      background: linear-gradient(180deg, #f4d35e, #ee964b);
      border: 1px solid rgba(238, 150, 75, 0.6);
      box-shadow: 0 0 12px rgba(244, 211, 94, 0.35);
    }
    #${interfaceId} .room4-window-layer {
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
    }
    #${interfaceId} .room4-window {
      position: absolute;
      top: 90px;
      left: 140px;
      width: 520px;
      min-height: 320px;
      background: #0b1524;
      border: 1px solid #203756;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
      color: #cfe3ff;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
    }
    #${interfaceId} .room4-window .titlebar {
      height: 38px;
      background: linear-gradient(180deg, #10263d, #0b1829);
      display: flex;
      align-items: center;
      padding: 0 12px;
      border-bottom: 1px solid #1c2f46;
      color: #86b6ff;
      font-weight: bold;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    #${interfaceId} .room4-window .titlebar button {
      margin-left: auto;
      background: transparent;
      border: 1px solid #304d73;
      color: #86b6ff;
      padding: 4px 10px;
      cursor: pointer;
      border-radius: 4px;
    }
    #${interfaceId} .room4-window .titlebar button:hover {
      background: #304d73;
    }
    #${interfaceId} .room4-window .body {
      flex: 1;
      padding: 18px;
      background: linear-gradient(180deg, rgba(11,21,36,0.96), rgba(7,14,24,0.92));
      overflow: auto;
      line-height: 1.6;
    }
    #${interfaceId} .room4-window .body h3 {
      margin-top: 0;
      margin-bottom: 12px;
      color: #9d4edd;
    }
    #${interfaceId} .room4-window .body input[type="text"] {
      width: 220px;
      padding: 10px;
      border: 1px solid #9d4edd;
      background: #140d24;
      color: #cfe3ff;
      font-size: 14px;
      text-transform: uppercase;
      text-align: center;
      letter-spacing: 0.4em;
      margin-right: 10px;
    }
    #${interfaceId} .room4-window .body button.primary {
      background: transparent;
      border: 1px solid #00ff7f;
      color: #00ff7f;
      padding: 10px 20px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.2s ease;
    }
    #${interfaceId} .room4-window .body button.primary:hover {
      background: #00ff7f;
      color: #051018;
    }
    #${interfaceId} .room4-window .body .status {
      margin-top: 14px;
      min-height: 24px;
    }
    #${interfaceId} .room4-window .body .status.success { color: #00ff7f; }
    #${interfaceId} .room4-window .body .status.error { color: #ff4d4d; }
    #${interfaceId} .room4-window .body .status.info { color: #c77dff; }
    #${interfaceId} .laptop-taskbar {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 42px;
      background: rgba(5, 15, 30, 0.92);
      border-top: 1px solid #00ff7f;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 20px;
      z-index: 4;
    }
    #${interfaceId} .laptop-taskbar .taskbar-close-btn {
      background: transparent;
      border: 1px solid #00ff7f;
      color: #00ff7f;
      padding: 8px 18px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.2s ease;
    }
    #${interfaceId} .laptop-taskbar .taskbar-close-btn:hover {
      background: #00ff7f;
      color: #051018;
    }
  `;

  uiContainer.innerHTML = `
    <div class="desktop-bg"><div class="g-logo">G</div></div>
    <div class="desktop-icons">
      <button class="icon" data-app="nexus">
        <div class="icon-sprite nexus"></div>
        <span>NEXUS.exe</span>
      </button>
      <button class="icon" data-app="decoder">
        <div class="icon-sprite decoder"></div>
        <span>decoder_logs</span>
      </button>
    </div>
    <div class="room4-window-layer"></div>
    <div class="laptop-taskbar">
      <button class="taskbar-close-btn">CLOSE</button>
    </div>
  `;

  document.body.appendChild(style);
  document.body.appendChild(uiContainer);

  if (window.camera && window.camera.controls) {
    window.camera.controls.enabled = false;
  }
  window.isUIVisible = true;
  if (window.player?.controls) window.player.controls.unlock();
  document.exitPointerLock();
  window.disablePlayerControls = true;
  document.body.style.cursor = 'default';
  document.body.classList.add('laptop-ui-active');

  const windowsLayer = uiContainer.querySelector('.room4-window-layer');
  const closeButton = uiContainer.querySelector('.taskbar-close-btn');
  const iconButtons = uiContainer.querySelectorAll('.desktop-icons .icon');
  let cardGranted = window.room4KeyCardGranted === true;

  const cleanup = () => {
    if (uiContainer.parentNode) uiContainer.parentNode.removeChild(uiContainer);
    const styleNode = document.querySelector(`style[data-owner="${interfaceId}"]`);
    if (styleNode && styleNode.parentNode) styleNode.parentNode.removeChild(styleNode);
    if (window.camera && window.camera.controls) {
      window.camera.controls.enabled = true;
    }
    window.isUIVisible = false;
    window.disablePlayerControls = false;
    document.body.style.cursor = 'none';
    document.body.classList.remove('laptop-ui-active');
    delete window.closeRoom4DesktopUI;
  };

  function createWindow(id, title, bodyHTML) {
    let win = windowsLayer.querySelector(`#${id}`);
    if (win) {
      win.style.display = 'block';
      windowsLayer.appendChild(win);
      return win;
    }

    win = document.createElement('div');
    win.className = 'room4-window';
    win.id = id;
    win.innerHTML = `
      <div class="titlebar">
        <span>${title}</span>
        <button type="button" aria-label="Close window">✕</button>
      </div>
      <div class="body">${bodyHTML}</div>
    `;
    windowsLayer.appendChild(win);

    const closeBtn = win.querySelector('.titlebar button');
    closeBtn.addEventListener('click', () => {
      win.style.display = 'none';
    });

    return win;
  }

  function showDecoderHintWindow() {
    const win = createWindow(
      'room4-decoder-window',
      'Decoder Instructions',
      `
        <h3>Complete the Binary Decoder</h3>
        <p>The floating binary streams in this room contain hidden encryption. Use the decoder panel on the north wall to translate them.</p>
        <p>Once decoded, you will receive a <strong>five-letter password</strong> required to access the terminal.</p>
        <p>Return to this laptop to submit the password and gain access to your card.</p>
        <div class="status info">Tip: DON'T TRUST IT! REVEAL THE TRUTH!</div>
      `
    );
    windowsLayer.appendChild(win);
  }

  function grantAccess(statusEl) {
    if (!cardGranted) {
      const added = addToInventory({
        name: 'key_card',
        description: 'Access Key Card'
      });
      if (added) {
        cardGranted = true;
        window.room4KeyCardGranted = true;
        if (window.AI) {
          window.AI.say('NEXUS override accepted. Final access card issued.');
          if (window.AI.onRoom4Complete) {
            window.AI.onRoom4Complete();
          }
        }
      } else if (statusEl) {
        statusEl.textContent = 'Inventory full. Clear a slot and try again.';
        statusEl.className = 'status error';
        return;
      }
    }

    if (statusEl) {
      statusEl.textContent = 'ACCESS GRANTED • Room 4 complete. Override channel unlocked.';
      statusEl.className = 'status success';
    }

    if (window.gameStore?.setRoom4Complete) {
      window.gameStore.setRoom4Complete(true);
    } else if (window.gameStore) {
      window.gameStore.rooms.room4.isComplete = true;
    }
  }

  function openNexusApp() {
    if (!checkBinaryDecoderCompletion()) {
      showDecoderHintWindow();
      return;
    }

    const win = createWindow(
      'room4-nexus-window',
      'NEXUS Terminal',
      `
        <h3>Administrator Override</h3>
        <p>Enter the five-letter override code retrieved from the decoder.</p>
        <div style="display:flex; align-items:center; margin-bottom:12px;">
          <input type="text" id="room4-nexus-input" maxlength="5" autocomplete="off" aria-label="NEXUS override password">
          <button type="button" class="primary" id="room4-nexus-submit">SUBMIT</button>
        </div>
        <div class="status info" id="room4-nexus-status">Awaiting override credentials…</div>
      `
    );

    const input = win.querySelector('#room4-nexus-input');
    const submitBtn = win.querySelector('#room4-nexus-submit');
    const statusEl = win.querySelector('#room4-nexus-status');

    if (cardGranted) {
      input.disabled = true;
      submitBtn.disabled = true;
      grantAccess(statusEl);
      return;
    }

    const submit = () => {
      const value = (input.value || '').trim().toUpperCase();
      if (!value) {
        statusEl.textContent = 'Enter the override password revealed by the decoder.';
        statusEl.className = 'status error';
        input.focus();
        return;
      }

      if (value === 'NEXUS') {
        input.disabled = true;
        submitBtn.disabled = true;
        grantAccess(statusEl);
      } else {
        statusEl.textContent = 'Incorrect password. Re-analyse the binary output.';
        statusEl.className = 'status error';
        input.value = '';
        input.focus();
      }
    };

    submitBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submit();
      }
    });

    windowsLayer.appendChild(win);
    input.focus();
  }

  closeButton.addEventListener('click', cleanup);
  iconButtons.forEach((btn) => {
    if (btn.dataset.app === 'nexus') {
      btn.addEventListener('click', openNexusApp);
    } else if (btn.dataset.app === 'decoder') {
      btn.addEventListener('click', showDecoderHintWindow);
    }
  });

  window.closeRoom4DesktopUI = cleanup;
}

// Helper function to check if binary decoder is completed
function checkBinaryDecoderCompletion() {
  console.log('Checking binary decoder completion...');
  console.log('room4NexusPanel exists:', !!window.room4NexusPanel);
  
  // Check if the global nexus panel exists and is completed
  if (window.room4NexusPanel && typeof window.room4NexusPanel._isComplete === 'function') {
    const isComplete = window.room4NexusPanel._isComplete();
    console.log('Nexus panel completion status:', isComplete);
    return isComplete;
  }
  
  // Fallback: check if the binary UI exists and is visible
  const binaryUI = document.querySelector('#binaryUI');
  console.log('Binary UI found:', !!binaryUI);
  if (binaryUI && binaryUI.style.display === 'block') {
    console.log('Binary UI is visible, assuming not completed');
    // If the UI is visible, assume it's not completed yet
    return false;
  }
  
  console.log('Defaulting to false - cannot determine completion state');
  // Default to false if we can't determine the state
  return false;
}

// Global function to submit NEXUS password
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

  // Laptop base (keyboard) - WITH CEL SHADING
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.05, 0.4), 
    createCelShadingMaterial(0x4a4a4a, 3) // Use cel shading for cartoon effect
  );
  laptopGroup.add(base);

  // Hinge mechanism
  const hingeGroup = new THREE.Group();
  hingeGroup.position.z = -0.2;
  laptopGroup.add(hingeGroup);

  // Screen - WITH CEL SHADING
  const screenHeight = 0.4;
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, screenHeight, 0.05), 
    createCelShadingMaterial(0x3a3a3a, 3) // Use cel shading for cartoon effect
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
  if (display && display.userData.originalMaterial) {
    // Increase emissive intensity to make screen glow
    display.userData.originalMaterial.emissiveIntensity = 1.2;
    display.userData.originalMaterial.needsUpdate = true;
    
    // Add a subtle glow effect
    display.userData.originalMaterial.emissive.setHex(0x404040);
    
  } else {
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
      if (child.userData.originalMaterial) {
        display = child;
      }
    }
  });
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
