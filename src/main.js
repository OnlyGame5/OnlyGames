import * as THREE from 'three';
import { setupPlayer, updatePlayer, attachCamera, toggleViewMode, isInFirstPerson, loadLeonard, addFirstPersonItemToScene, leonardModel, getPlayerInventory, toggleLookMode, handleDroppedItemInteraction, handleDropItem, ensureDroppedItemsInScene, loadGlobalPickableModels, addToInventory } from './player.js';
import { AI } from './ai.js';
import { WallCollisionManager } from './collision/WallCollisionManager.js';
import { roomWallDefinitions } from './collision/roomWalls.js';
import { createRoom0 } from './room0.js';
import { createRoom1 } from './room1.js';
import { createRoom2 } from './room2.js';
import { createRoom4 } from './room4.js';
import { createServerRoom } from './rooms/serverRoom.js';
import { handleMouseClick, handleStage0Click } from './utils.js';
import { initInput, isDown as inputIsDown, getBindings } from './systems/input.js';
import { initMenu, toggleMenu, updateHUDInstructions } from './ui/menu.js';
import { loadingScreen } from './loading.js';
import { createLoadingScreen, dispatchLoadingProgress, dispatchLoadingComplete } from './ui/LoadingScreen.js';
import './audio/GlobalMusicManager.js';
import { createMainMenu } from './ui/MainMenu.js';
import { uiRoot } from './ui/UIRoot.js';
import { cursorManager } from './ui/CursorManager.js';

// Initialize global cursor manager
window.cursorManager = cursorManager;
import { createReusableHallway, HallwayPresets } from './components/ReusableHallway.js';
import { Minimap } from './minimap.js';
import { FPSCounter } from './ui/FPSCounter.js';
import { LevelManager } from './game/levels/LevelManager.js';
import { gameStore } from './state/gameStore.js';
import { createFuturisticDoor } from './game/props/FuturisticDoor.js';
import { MatrixSky } from './scene/MatrixSky.js';
import { SecurityMonitor } from './ui/SecurityMonitor.js';
import { performanceSettings } from './systems/PerformanceSettings.js';
import { ShadowSystem } from './postprocessing/ShadowSystem.js';

// --- CHEAT CONSOLE SYSTEM ---
function createCheatConsole() {
  let isVisible = false;
  let inputBuffer = '';
  let commandHistory = [];
  let historyIndex = -1;
  
  // Create console UI
  const consoleDiv = document.createElement('div');
  consoleDiv.id = 'cheat-console';
  consoleDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    z-index: 10000;
    display: none;
    flex-direction: column;
    padding: 20px;
    box-sizing: border-box;
  `;
  
  const outputDiv = document.createElement('div');
  outputDiv.style.cssText = `
    flex: 1;
    overflow-y: auto;
    border: 1px solid #00ff00;
    padding: 10px;
    margin-bottom: 10px;
    background: rgba(0, 20, 0, 0.9);
  `;
  
  const inputDiv = document.createElement('div');
  inputDiv.style.cssText = `
    display: flex;
    align-items: center;
    border: 1px solid #00ff00;
    background: rgba(0, 20, 0, 0.9);
    padding: 5px;
  `;
  
  const promptSpan = document.createElement('span');
  promptSpan.textContent = 'CHEAT> ';
  promptSpan.style.color = '#00ff00';
  
  const inputField = document.createElement('input');
  inputField.type = 'text';
  inputField.style.cssText = `
    flex: 1;
    background: transparent;
    border: none;
    color: #00ff00;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    outline: none;
  `;
  
  inputDiv.appendChild(promptSpan);
  inputDiv.appendChild(inputField);
  consoleDiv.appendChild(outputDiv);
  consoleDiv.appendChild(inputDiv);
  document.body.appendChild(consoleDiv);
  
  // Add welcome message
  addOutput('=== CHEAT CONSOLE ===');
  addOutput('Available commands:');
  addOutput('  opendoors - Open all doors and bypass collision');
  addOutput('  closedoors - Close all doors and restore collision');
  addOutput('  noclip - Toggle noclip mode (pass through walls)');
  addOutput('  godmode - Toggle god mode (invincible)');
  addOutput('  teleport <room> - Teleport to room (room0, room1, room2, room3, room4)');
  addOutput('  give <item> - Give item to player');
  addOutput('  accesscards - Add three access cards to inventory');
  addOutput('  clear - Clear console output');
  addOutput('  help - Show this help');
  addOutput('Press ~ to close console');
  addOutput('');
  
  function addOutput(text) {
    const line = document.createElement('div');
    line.textContent = text;
    line.style.marginBottom = '2px';
    outputDiv.appendChild(line);
    outputDiv.scrollTop = outputDiv.scrollHeight;
  }
  
  function executeCommand(command) {
    const parts = command.trim().toLowerCase().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    switch (cmd) {
      case 'opendoors':
        openAllDoors();
        addOutput('All doors opened and collision bypassed!');
        break;
        
      case 'closedoors':
        closeAllDoors();
        addOutput('All doors closed and collision restored!');
        break;
        
      case 'noclip':
        toggleNoclip();
        break;
        
      case 'godmode':
        toggleGodMode();
        break;
        
      case 'teleport':
        if (args.length > 0) {
          teleportToRoom(args[0]);
        } else {
          addOutput('Usage: teleport <room>');
        }
        break;
        
      case 'give':
        if (args.length > 0) {
          giveItem(args[0]);
        } else {
          addOutput('Usage: give <item>');
        }
        break;

      case 'accesscards':
        {
          let added = 0;
          for (let i = 0; i < 3; i++) {
            const ok = addToInventory({ name: 'key_card', description: 'Access Key Card', type: 'key' });
            if (ok) added++;
          }
          addOutput(`Added ${added} access card(s) to inventory`);
          if (window.AI && added > 0) {
            window.AI.showInteractionFeedback?.('Access cards granted.');
          }
        }
        break;
        
      case 'clear':
        outputDiv.innerHTML = '';
        addOutput('Console cleared.');
        break;
        
      case 'resetlighting':
        resetLighting();
        addOutput('Lighting reset to default values');
        break;
        
      case 'help':
        addOutput('Available commands:');
        addOutput('  opendoors - Open all doors and bypass collision');
        addOutput('  closedoors - Close all doors and restore collision');
        addOutput('  noclip - Toggle noclip mode (pass through walls)');
        addOutput('  godmode - Toggle god mode (invincible)');
        addOutput('  teleport <room> - Teleport to room (room0, room1, room2, room3, room4)');
        addOutput('  give <item> - Give item to player');
        addOutput('  accesscards - Add three access cards to inventory');
        addOutput('  resetlighting - Reset lighting to default values');
        addOutput('  clear - Clear console output');
        addOutput('  help - Show this help');
        break;
        
      default:
        addOutput(`Unknown command: ${cmd}. Type 'help' for available commands.`);
    }
  }
  
  function openAllDoors() {
    // Find all doors in the scene and open them
    scene.traverse((object) => {
      if (object.userData && object.userData.category === 'door') {
        // Unlock and open the door
        object.userData.setLocked(false);
        object.userData.openDoor();
      }
    });
    
    // Enable collision bypass
    if (window.wallCollisionManager) {
      window.wallCollisionManager.cheatMode = true;
    }
    
    // Set global cheat flags
    window.cheatMode = true;
    window.noclipMode = true;
  }
  
  function closeAllDoors() {
    // Find all doors in the scene and close them
    scene.traverse((object) => {
      if (object.userData && object.userData.category === 'door') {
        object.userData.closeDoor();
      }
    });
    
    // Disable collision bypass
    if (window.wallCollisionManager) {
      window.wallCollisionManager.cheatMode = false;
    }
    
    // Clear global cheat flags
    window.cheatMode = false;
    window.noclipMode = false;
  }
  
  function toggleNoclip() {
    if (window.noclipMode) {
      window.noclipMode = false;
      addOutput('Noclip mode disabled');
    } else {
      window.noclipMode = true;
      addOutput('Noclip mode enabled - you can pass through walls');
    }
  }
  
  function toggleGodMode() {
    if (window.godMode) {
      window.godMode = false;
      addOutput('God mode disabled');
    } else {
      window.godMode = true;
      addOutput('God mode enabled - you are invincible');
    }
  }
  
  function teleportToRoom(roomName) {
    const activePlayer = window.leonardModel || window.player;
    if (!activePlayer) {
      addOutput('Player not found!');
      return;
    }
    
    const positions = {
      'room0': { x: 0, y: 0, z: 0 },
      'room1': { x: 30, y: 0, z: 0 },
      'room2': { x: 0, y: 0, z: 20 },
      'room3': { x: -30, y: 0, z: 0 },
      'room4': { x: 0, y: 0, z: -20 }
    };
    
    if (positions[roomName]) {
      activePlayer.position.set(positions[roomName].x, positions[roomName].y, positions[roomName].z);
      addOutput(`Teleported to ${roomName}`);
    } else {
      addOutput(`Unknown room: ${roomName}. Available: room0, room1, room2, room3, room4`);
    }
  }
  
  function giveItem(itemName) {
    const items = {
      'key': { name: 'master-key', description: 'A master key that opens all doors', type: 'key' },
      'note': { name: 'cheat-note', description: 'A note from the cheat console', type: 'note' },
      'book': { name: 'cheat-book', description: 'A book of cheat codes', type: 'book' }
    };
    
    if (items[itemName]) {
      const ok = addToInventory(items[itemName]);
      if (ok) addOutput(`Added ${items[itemName].name} to inventory`);
      else addOutput('Inventory is full');
    } else {
      addOutput(`Unknown item: ${itemName}. Available: key, note, book`);
    }
  }
  
  function resetLighting() {
    // Reset player light
    if (window.playerLight) {
      window.playerLight.intensity = 1.2;
      window.playerLight.distance = 12;
      window.playerLight.decay = 1.5;
    }
    
    // Reset renderer tone mapping
    if (window.renderer) {
      window.renderer.toneMappingExposure = 0.9;
    }
    
    // Reset any room-specific lighting
    if (window.gameState && window.gameState.room1 && window.gameState.room1.setRoom1Lights) {
      window.gameState.room1.setRoom1Lights(true);
    }
  }
  
  // Event handlers
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const command = inputField.value.trim();
      if (command) {
        addOutput(`CHEAT> ${command}`);
        executeCommand(command);
        commandHistory.push(command);
        historyIndex = commandHistory.length;
        inputField.value = '';
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        inputField.value = commandHistory[historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        inputField.value = commandHistory[historyIndex] || '';
      } else {
        historyIndex = commandHistory.length;
        inputField.value = '';
      }
    } else if (e.key === 'Escape') {
      toggle();
    }
  });
  
  // Prevent console from closing when clicking inside
  consoleDiv.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Close console when clicking outside
  document.addEventListener('click', (e) => {
    if (isVisible && !consoleDiv.contains(e.target)) {
      toggle();
    }
  });
  
  function toggle() {
    isVisible = !isVisible;
    consoleDiv.style.display = isVisible ? 'flex' : 'none';
    if (isVisible) {
      inputField.focus();
    }
  }
  
  return {
    toggle,
    addOutput,
    executeCommand
  };
}

// --- Scene, Camera, Renderer ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x001100); // Very dark green to make Matrix effect pop
// Disable scene environment map to prevent reflections
scene.environment = null;

// --- Matrix Sky ---
let matrixSky = null;
try {
  matrixSky = new MatrixSky(scene);
  console.log('Matrix Sky initialized successfully');
} catch (error) {
  console.error('Failed to initialize Matrix Sky:', error);
}

// --- Enhanced Global Lighting for Matrix Sky ---
// HemisphereLight provides soft ambient fill without shadows (very cheap)
const globalHemi = new THREE.HemisphereLight(
  0x6a8a7a, // Sky color - brighter green-grey to match Matrix sky
  0x3f5f4f, // Ground color - brighter green
  1.2       // Much higher intensity for proper room illumination
);
globalHemi.name = 'global-hemisphere';
scene.add(globalHemi);

// Strong ambient light for proper room illumination
const globalAmbient = new THREE.AmbientLight(0x4a6a5a, 0.8); // Much brighter greenish ambient light
globalAmbient.name = 'global-ambient';
scene.add(globalAmbient);

// Add a strong directional light for realistic outdoor lighting
const globalDirectional = new THREE.DirectionalLight(0xccffcc, 0.6); // Brighter green tint
globalDirectional.position.set(10, 20, 5);
globalDirectional.castShadow = false; // No shadows for performance
globalDirectional.name = 'global-directional';
scene.add(globalDirectional);

// Add additional point lights for better room illumination
const globalPoint1 = new THREE.PointLight(0x88ff88, 0.4, 50); // Green point light
globalPoint1.position.set(0, 15, 0);
globalPoint1.castShadow = false;
globalPoint1.name = 'global-point-1';
scene.add(globalPoint1);

const globalPoint2 = new THREE.PointLight(0x88ff88, 0.3, 40); // Another green point light
globalPoint2.position.set(20, 10, 20);
globalPoint2.castShadow = false;
globalPoint2.name = 'global-point-2';
scene.add(globalPoint2);

// --- Initialize Dropped Items System ---
// Make scene globally available for dropped items system
window.scene = scene;

const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 10);

// Fade-in effect for awakening chamber
let fadeOverlay = null;
let isFading = true;
let fadeStartTime = 0;
const fadeDuration = 2000; // 2 seconds

const renderer = new THREE.WebGLRenderer({ 
  antialias: false, // Disabled for performance
  powerPreference: "high-performance",
  alpha: false, // Disable transparency for performance
  depth: true,
  stencil: false, // Disable stencil buffer if not needed
  premultipliedAlpha: false,
  preserveDrawingBuffer: false
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Apply performance settings
const appliedProfile = performanceSettings.applyToRenderer(renderer);
console.log('Applied performance profile:', appliedProfile);

// Matrix Sky renderer settings (some may be overridden by performance settings)
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);
// We'll render an overlay after the main scene; disable automatic clearing between renders
renderer.autoClear = false;

// Listen for performance settings changes from menu
window.addEventListener('performanceSettingsChanged', (e) => {
  if (e.detail.requiresRendererUpdate) {
    console.log('Updating renderer with new performance settings...');
    performanceSettings.applyToRenderer(renderer);
  }
  
  // Handle shadow toggling based on performance mode
  if (shadowSystem && e.detail.quality) {
    const shouldEnableShadows = e.detail.quality === 'high';
    shadowSystem.toggleShadows(shouldEnableShadows);
    
    if (shouldEnableShadows) {
      // Create shadow light if it doesn't exist
      if (shadowSystem.shadowLights.length === 0) {
        shadowSystem.createDirectionalShadowLight({
          color: 0xffffff,
          intensity: 1.2,
          position: new THREE.Vector3(10, 20, 10),
          shadowMapSize: 2048,
          shadowCameraSize: 30,
          shadowBias: -0.001
        });
      }
      console.log('Shadows enabled due to High performance mode');
    } else {
      console.log(`Shadows disabled due to ${e.detail.quality} performance mode`);
    }
  }
});

// Performance monitor for FPS-based quality adjustment
let frameCount = 0;
let lastFPSCheck = performance.now();
setInterval(() => {
  const now = performance.now();
  const fps = (frameCount * 1000) / (now - lastFPSCheck);
  
  // Only auto-adjust if FPS is consistently low AND user hasn't manually set quality
  if (fps < 25 && !performanceSettings.isManuallySet()) {
    const stats = performanceSettings.getPerformanceStats();
    console.log(`Low FPS detected (${fps.toFixed(1)}), current quality: ${stats.quality}`);
    
    // Auto-downgrade quality if possible
    const currentQuality = performanceSettings.getQuality();
    const qualities = ['high', 'medium', 'potato'];
    const currentIndex = qualities.indexOf(currentQuality);
    
    if (currentIndex >= 0 && currentIndex < qualities.length - 1) {
      const newQuality = qualities[currentIndex + 1];
      console.log(`Auto-downgrading quality from ${currentQuality} to ${newQuality}`);
      performanceSettings.setQuality(newQuality, false); // false = automatic, not manual
      performanceSettings.applyToRenderer(renderer);
    }
  }
  
  frameCount = 0;
  lastFPSCheck = now;
}, 5000); // Check every 5 seconds

// Install performance debugger


// Lighting - Only for Room 0 (global lights removed to let Room 1 control its own lighting)
// Global lights moved to Room 0 only

// Player setup
const player = setupPlayer(scene);

// --- Player Personal Light (follows player) ---
// Performance-friendly: No shadows, limited range
const playerLight = new THREE.PointLight(
  0xccffcc, // Green tint to match Matrix theme
  1.2,      // Higher intensity for better illumination
  12,       // Larger range (12 units radius)
  1.5       // Decay (light falloff rate)
);
playerLight.name = 'player-light';
playerLight.castShadow = false; // CRITICAL: No shadows for performance
playerLight.position.set(0, 2, 0); // Slightly above player center
scene.add(playerLight);

// Wall Collision Manager setup
const wallCollisionManager = new WallCollisionManager();
// Pass scene reference to collision manager
wallCollisionManager.setScene(scene);
console.log('[Main] Wall collision system initialized');

// Make collision manager globally accessible for debugging
window.wallCollisionManager = wallCollisionManager;

// Additional per-room object collisions registered dynamically when the room is active
const extraRoomObjectCollisions = {
  room1: [
    {
      id: 'room1-laptop',
      type: 'laptop',
      position: new THREE.Vector3(29, 0.75, 0),
      size: new THREE.Vector3(1.4, 1.4, 1.4),
      dynamic: false
    }
  ],
  room4: [
    {
      id: 'room4-laptop',
      type: 'laptop',
      position: new THREE.Vector3(0, 0.75, -26.5),
      size: new THREE.Vector3(1.4, 1.4, 1.4),
      dynamic: false
    }
  ]
};

// Simple interaction UI system
function createInteractionUI() {
  const interactionDiv = document.createElement('div');
  interactionDiv.id = 'interaction-ui';
  interactionDiv.style.cssText = `
    position: fixed;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    padding: 10px 20px;
    border: 2px solid #00ff00;
    border-radius: 5px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    z-index: 1000;
    display: none;
    text-align: center;
    max-width: 400px;
  `;
  document.body.appendChild(interactionDiv);
  return interactionDiv;
}

// Initialize interaction UI
const interactionUI = createInteractionUI();

// Global function for updating interaction UI
window.updateInteractionUI = function(text, type = '') {
  if (text && text.trim()) {
    interactionUI.textContent = text;
    interactionUI.style.display = 'block';
    
    // Add type-specific styling
    if (type === 'door') {
      interactionUI.style.borderColor = '#00ff7f';
      interactionUI.style.color = '#00ff7f';
    } else {
      interactionUI.style.borderColor = '#00ff00';
      interactionUI.style.color = '#00ff00';
    }
  } else {
    interactionUI.style.display = 'none';
  }
};

/**
 * Setup wall collisions for current room
 */
function setupRoomCollisions(roomId = null) {
  // Clear existing walls
  wallCollisionManager.clear();
  
  // Get current room
  let currentRoomId = roomId || (gameStore.getCurrentRoom ? gameStore.getCurrentRoom() : 'room0');
  
  // Fix: Convert 'hub' to 'room0' for wall definitions
  if (currentRoomId === 'hub') {
    currentRoomId = 'room0';
  }
  
  const roomData = roomWallDefinitions[currentRoomId];
  
  if (roomData) {
    // Add walls
    for (let i = 0; i < roomData.walls.length; i++) {
      const wall = roomData.walls[i];
      wallCollisionManager.addWall(wall.position, wall.size, `${currentRoomId}-wall-${i}`);
    }
    
    // Add hallways
    for (let i = 0; i < roomData.hallways.length; i++) {
      const hallway = roomData.hallways[i];
      wallCollisionManager.addHallway(hallway.position, hallway.size, `${currentRoomId}-hallway-${i}`);
    }
    
    // Add objects (chairs, pedestals, doors, etc.)
    if (roomData.objects) {
      console.log(`[Collision] Adding ${roomData.objects.length} objects for room ${currentRoomId}`);
      for (let i = 0; i < roomData.objects.length; i++) {
        const obj = roomData.objects[i];
        const dynamic = obj.dynamic || false;
        // Use the object's own ID if it has one, otherwise use generic ID
        const objectId = obj.id || `${currentRoomId}-object-${i}`;
        wallCollisionManager.addObject(obj.position, obj.size, objectId, obj.type, dynamic);
        
        if (obj.type === 'door') {
          console.log(`[Collision] Added DOOR: ${objectId}, type: ${obj.type}, dynamic: ${dynamic}, position:`, obj.position);
        }
      }
    }

    // Add any extra per-room object collisions (e.g., laptops) managed outside the static definitions
    const extraObjects = extraRoomObjectCollisions[currentRoomId];
    if (extraObjects) {
      extraObjects.forEach((obj, index) => {
        const objectId = obj.id || `${currentRoomId}-extra-${index}`;
        wallCollisionManager.addObject(obj.position, obj.size, objectId, obj.type, !!obj.dynamic);
      });
    }
    
    // Add hallway walls (thick walls around hallways)
    if (roomData.hallwayWalls) {
      for (let i = 0; i < roomData.hallwayWalls.length; i++) {
        const hallwayWall = roomData.hallwayWalls[i];
        wallCollisionManager.addHallwayWall(hallwayWall.position, hallwayWall.size, `${currentRoomId}-hallway-wall-${i}`);
      }
    }
  }
}

// Level Manager setup
const levelManager = new LevelManager(scene, player);

// Minimap setup
let minimap = null;

// FPS Counter setup
let fpsCounter = null;

// Security Monitor setup
let securityMonitor = null;

// Shadow System setup
let shadowSystem = null;

// Function to update security monitor reference after recreation
window.updateSecurityMonitorReference = (newMonitor) => {
  securityMonitor = newMonitor;
};

// === Glasses vignette overlay (shader) ===
const overlayScene = new THREE.Scene();
const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const vignetteUniforms = {
  uStrength: { value: 0.0 },
  // Bright green to match the glasses
  uColor: { value: new THREE.Color(0x00ff00) }
};
const vignetteMaterial = new THREE.ShaderMaterial({
  uniforms: vignetteUniforms,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uStrength;
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      // Radial vignette from center
      vec2 p = vUv - 0.5;
      float r = length(p);
      float inner = 0.25; // start even earlier for more coverage
      float outer = 0.75; // reach strength sooner
      float v = smoothstep(inner, outer, r);
      // More dramatic falloff
      v = pow(v, 0.7);
      float alpha = v * 1.0 * uStrength; // full intensity
      gl_FragColor = vec4(uColor, alpha);
    }
  `,
  transparent: true,
  depthTest: false,
  depthWrite: false,
  blending: THREE.NormalBlending
});
const overlayQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), vignetteMaterial);
overlayQuad.position.z = 0;
overlayScene.add(overlayQuad);

// Truth filter text indicator
const truthFilterText = document.createElement('div');
truthFilterText.id = 'truth-filter-indicator';
truthFilterText.style.cssText = `
  position: fixed;
  top: 20px;
  left: 20px;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 12px;
  border: 1px solid #00ff00;
  border-radius: 4px;
  z-index: 10000;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
`;
truthFilterText.innerHTML = 'TRUTH FILTER ACTIVE<br><span style="font-size: 11px; color: #88ff88;">Gamma Protocol Engaged</span>';
document.body.appendChild(truthFilterText);

// Game countdown display
const gameCountdownDisplay = document.createElement('div');
gameCountdownDisplay.id = 'game-countdown-display';
gameCountdownDisplay.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 16px;
  border: 2px solid #00ff00;
  border-radius: 6px;
  z-index: 10000;
  font-weight: bold;
  text-shadow: 0 0 5px #00ff00;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
`;
gameCountdownDisplay.innerHTML = 'TIME REMAINING<br><span id="countdown-timer">20:00</span>';
document.body.appendChild(gameCountdownDisplay);

// Truth filter timer system
let truthFilterTimer = null;
let truthFilterStartTime = null;
const TRUTH_FILTER_DURATION = 6; // 6 seconds

// Decrypting message UI
const decryptingMessage = document.createElement('div');
decryptingMessage.id = 'decrypting-message';
decryptingMessage.style.cssText = `
  position: fixed;
  top: calc(50% + 320px);
  left: 40px;
  width: 400px;
  max-width: 210px;
  background: rgba(10, 15, 25, 0.85);
  backdrop-filter: blur(10px);
  border: 2px solid #ff0000;
  border-radius: 8px;
  padding: 16px;
  color: #ff0000;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  text-align: center;
  z-index: 10001;
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
  box-shadow: 
    0 0 20px rgba(255, 0, 0, 0.4),
    inset 0 0 30px rgba(0, 0, 0, 0.3);
`;
decryptingMessage.innerHTML = `
  <div style="margin-bottom: 15px; font-weight: bold; text-shadow: 0 0 10px #ff0000;">AI DECRYPTING...</div>
  <div style="margin-bottom: 10px; font-size: 12px; color: #ff6666;">Signal interference detected - attempting to regain control</div>
  <div style="background: rgba(255, 0, 0, 0.2); border: 1px solid #ff0000; border-radius: 4px; height: 20px; overflow: hidden; box-shadow: inset 0 0 10px rgba(255, 0, 0, 0.3);">
    <div id="decrypting-progress" style="background: linear-gradient(90deg, #ff0000, #ff6666, #ff0000); background-size: 200% 100%; height: 100%; width: 0%; transition: width 0.1s ease; animation: decrypting-shimmer 2s linear infinite;"></div>
  </div>
  <div id="decrypting-countdown" style="margin-top: 10px; font-size: 14px; color: #ffaaaa; text-shadow: 0 0 5px #ff0000;"></div>
`;

// Add CSS animation for the progress bar
const style = document.createElement('style');
style.textContent = `
  @keyframes decrypting-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
document.head.appendChild(style);
document.body.appendChild(decryptingMessage);

// Truth filter timer functions
function startTruthFilterTimer() {
  if (truthFilterTimer) {
    clearInterval(truthFilterTimer);
  }
  
  truthFilterStartTime = Date.now();
  
  // Show decrypting message
  const decryptingEl = document.getElementById('decrypting-message');
  if (decryptingEl) {
    decryptingEl.style.opacity = '1';
    decryptingEl.style.transform = 'translateX(0)';
  }
  
  // Start timer
  truthFilterTimer = setInterval(() => {
    const elapsed = (Date.now() - truthFilterStartTime) / 1000;
    const remaining = Math.max(0, TRUTH_FILTER_DURATION - elapsed);
    const progress = (elapsed / TRUTH_FILTER_DURATION) * 100;
    
    // Update progress bar
    const progressBar = document.getElementById('decrypting-progress');
    const countdown = document.getElementById('decrypting-countdown');
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, progress)}%`;
    }
    if (countdown) {
      countdown.textContent = `Time remaining: ${remaining.toFixed(1)}s`;
    }
    
    // Update truth filter indicator with countdown
    const truthFilterIndicator = document.getElementById('truth-filter-indicator');
    if (truthFilterIndicator) {
      truthFilterIndicator.innerHTML = `TRUTH FILTER ACTIVE<br><span style="font-size: 11px; color: #88ff88;">Gamma Protocol Engaged - ${remaining.toFixed(1)}s</span>`;
    }
    
    // Timer expired
    if (remaining <= 0) {
      clearInterval(truthFilterTimer);
      truthFilterTimer = null;
      
      // Hide decrypting message
      if (decryptingEl) {
        decryptingEl.style.opacity = '0';
        decryptingEl.style.transform = 'translateX(-20px)';
      }
      
      // Switch to a different inventory slot
      switchToNonTruthFilterSlot();
      
      // Show AI regaining control message after a brief delay to ensure inventory switch is complete
      setTimeout(() => {
        AI.sayUrgent('Unknown interference neutralized. Signal restored.', {
          effect: 'glitch',
          tone: 'neutral'
        });
      }, 100);
    }
  }, 100); // Update every 100ms for smooth progress
}

function stopTruthFilterTimer() {
  if (truthFilterTimer) {
    clearInterval(truthFilterTimer);
    truthFilterTimer = null;
  }
  
  // Hide decrypting message
  const decryptingEl = document.getElementById('decrypting-message');
  if (decryptingEl) {
    decryptingEl.style.opacity = '0';
    decryptingEl.style.transform = 'translateX(-20px)';
  }
  
  // Reset progress bar
  const progressBar = document.getElementById('decrypting-progress');
  if (progressBar) {
    progressBar.style.width = '0%';
  }
}

function switchToNonTruthFilterSlot() {
  // Get player inventory - use the global function that should be available
  if (typeof getPlayerInventory === 'function') {
    const inventory = getPlayerInventory();
    
    if (!inventory) return;
    
    // Find a slot that doesn't contain the truth filter (glasses)
    for (let i = 0; i < inventory.slots.length; i++) {
      const item = inventory.slots[i];
      if (!item || item.name !== 'glasses') {
        inventory.selectedSlot = i;
        // Update UI
        const inventoryElement = document.getElementById('inventory');
        if (inventoryElement) {
          const slots = inventoryElement.querySelectorAll('.inventory-slot');
          slots.forEach((slot, index) => {
            slot.classList.toggle('selected', index === inventory.selectedSlot);
          });
        }
        console.log(`Switched to inventory slot ${i + 1}`);
        break;
      }
    }
  }
}

// Stage 0: Game state management
let gameState = {
  stage: 0,
  room0: null,
  room1: null,
  room2: null,
  room3: null,
  paused: false
};

// Create fade-in overlay for awakening effect
function createFadeOverlay() {
  fadeOverlay = document.createElement('div');
  fadeOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000000;
    z-index: 9999;
    pointer-events: none;
    transition: opacity 2s ease-out;
  `;
  document.body.appendChild(fadeOverlay);
  fadeStartTime = Date.now();
}

// Update fade-in effect
function updateFadeEffect() {
  if (!isFading || !fadeOverlay) return;
  
  const elapsed = Date.now() - fadeStartTime;
  const progress = Math.min(elapsed / fadeDuration, 1);
  
  // Fade out the black overlay
  fadeOverlay.style.opacity = 1 - progress;
  
  if (progress >= 1) {
    isFading = false;
    // Remove overlay after fade completes
    setTimeout(() => {
      if (fadeOverlay && fadeOverlay.parentNode) {
        fadeOverlay.parentNode.removeChild(fadeOverlay);
        fadeOverlay = null;
      }
    }, 100);
  }
}

// Initialize game with Leonard
async function initGame() {
  try {
    // Create fade-in overlay for awakening effect
    createFadeOverlay();
    
    // Track loading progress for new loading screen
    let totalItems = 9; // leonard(1) + rooms(5) + models(2) + global models(1) - security camera removed
    let loadedItems = 0;
    
    function updateProgress(itemCount = 1) {
      loadedItems += itemCount;
      const percent = Math.round((loadedItems / totalItems) * 100);
      dispatchLoadingProgress(percent);
      
      if (loadedItems >= totalItems) {
        dispatchLoadingComplete();
      }
    }
    
    // Load Leonard model
    await loadLeonard(scene);
    updateProgress(1); // Leonard loaded
    console.log('Leonard loaded successfully!');
    
    // Load global pickable models in background (completely non-blocking)
    setTimeout(() => {
      loadGlobalPickableModels().then(() => {
        console.log('Global pickable models loaded successfully!');
      }).catch((error) => {
        console.warn('Some global models failed to load, continuing with fallbacks:', error);
      });
    }, 1000); // Start loading after 1 second delay
    updateProgress(1); // Global models loading started
    
    // Make leonardModel globally accessible for minimap and other systems
    window.leonardModel = leonardModel;
    window.player = player; // Also make player globally accessible
    window.camera = camera; // Make camera globally accessible for minimap
    window.isInFirstPerson = isInFirstPerson; // Make view mode function globally accessible
    window.toggleLookMode = toggleLookMode; // Make look mode function globally accessible
    window.ensureDroppedItemsInScene = ensureDroppedItemsInScene; // Make dropped items function globally accessible
    window.levelManager = levelManager; // Make LevelManager globally accessible for room transitions
    
    // Create all rooms (Room 0 serves as the hub)
    gameState.room0 = createRoom0();
    updateProgress(1); // Room 0
    gameState.room1 = createRoom1();
    updateProgress(1); // Room 1
    gameState.room2 = createRoom2();
    updateProgress(1); // Room 2
    gameState.room3 = createServerRoom({ renderer });
    updateProgress(1); // Room 3
    gameState.room4 = createRoom4();
    console.log('Room 4 created and added to gameState');
    updateProgress(1); // Room 4
    
    // Register them with the Level Manager (Room 0 serves as hub)
    levelManager.registerRoom('room0', gameState.room0);
    levelManager.registerRoom('room1', gameState.room1);
    levelManager.registerRoom('room2', gameState.room2);
    levelManager.registerRoom('room3', gameState.room3);
    levelManager.registerRoom('room4', gameState.room4);
    levelManager.setHub(gameState.room0); // Use Room 0 as the hub
    
    console.log('Room 4 registered with LevelManager');
    console.log('Scene children count:', scene.children.length);
    
    // Position player in the awakening chair
    if (gameState.room0.awakeningChair) {
      player.position.set(0, 1, 0); // Center of room, safe spawn position
    } else {
      player.position.set(0, 1, 0); // Center of room, safe spawn position
    }
    
    // --- NEW, CORRECTED HUB-AND-SPOKE HALLWAYS ---
    const hallwayConfig = {
      length: 10,
      width: 2,
      height: 4,
      addLighting: true,
      lightIntensity: 0.4
    };

    // Hallway to Room 1 (East)
    const hallwayToRoom1 = createReusableHallway({
      ...hallwayConfig,
      name: 'hallway-hub-to-room1'
    });
    // Hallway to Room 1 (Position = HubWall + HallwayLength/2 = 10 + 5 = 15)
    hallwayToRoom1.group.position.set(15, 0, 0);
    hallwayToRoom1.group.rotation.y = Math.PI / 2; // Rotate to align with X-axis
    scene.add(hallwayToRoom1.group);

    // Hallway to Room 2 (South)
    const hallwayToRoom2 = createReusableHallway({
      ...hallwayConfig,
      name: 'hallway-hub-to-room2'
    });
    // Hallway to Room 2 (Position = HubWall + HallwayLength/2 = 7.5 + 5 = 12.5)
    hallwayToRoom2.group.position.set(0, 0, 12.5);
    scene.add(hallwayToRoom2.group);

    // Hallway to Room 3 (West)
    const hallwayToRoom3 = createReusableHallway({
      ...hallwayConfig,
      name: 'hallway-hub-to-room3'
    });
    // Hallway to Room 3 (Position = -(HubWall + HallwayLength/2) = -(10 + 5) = -15)
    hallwayToRoom3.group.position.set(-15, 0, 0);
    hallwayToRoom3.group.rotation.y = Math.PI / 2; // Rotate to align with X-axis
    scene.add(hallwayToRoom3.group);

    // Hallway to Room 4 (North) - Width 3 to match door opening
    const hallwayToRoom4 = createReusableHallway({
      ...hallwayConfig,
      width: 3, // Match the door opening width
      name: 'hallway-hub-to-room4'
    });
    // Hallway to Room 4 (Position = -(HubWall + HallwayLength/2) = -(7.5 + 5) = -12.5)
    hallwayToRoom4.group.position.set(0, 0, -12.5);
    scene.add(hallwayToRoom4.group);
    
    // Store hallways in gameState for collision detection
    gameState.hallwayToRoom1 = hallwayToRoom1;
    gameState.hallwayToRoom2 = hallwayToRoom2;
    gameState.hallwayToRoom3 = hallwayToRoom3;
    gameState.hallwayToRoom4 = hallwayToRoom4;

    // Room 3 access is controlled by the existing westDoor in room0.js
    // Subscribe to Room 2 completion to unlock the north door only
    gameStore.subscribe('room2Complete', (completed) => {
      if (completed) {
        console.log('Room 2 completed - unlocking north door to Room 4');
        
        // Find the main door (north door to Room 4) and unlock it
        const room0NorthDoor = gameState.room0?.door; // The main door is the north door
        if (room0NorthDoor) {
          room0NorthDoor.userData.setLocked(false);
          // Don't auto-open, just unlock (turn from red to green)
          console.log('North door to Room 4 unlocked');
        }
                
        // Force minimap redraw to show Room 4 and hallway as accessible (green)
        if (minimap) {
          minimap.forceRedraw();
          console.log('Minimap marked for redraw after Room 2 completion');
        }
      }
    });
    
    // Subscribe to Room 4 completion to unlock the west door (Server Room)
    gameStore.subscribe('room4Complete', (completed) => {
      if (completed) {
        console.log('Room 4 completed - unlocking west door to Room 3 (Server Room)');
        
        // Find the west door in room0 and unlock it
        const room0WestDoor = gameState.room0?.westDoor;
        if (room0WestDoor) {
          room0WestDoor.userData.setLocked(false);
          room0WestDoor.userData.openDoor();
          console.log('West door to Room 3 (Server Room) unlocked and opened');
        }
                
        // Force minimap redraw to show Room 3 and hallway as accessible (green)
        if (minimap) {
          minimap.forceRedraw();
          console.log('Minimap marked for redraw after Room 4 completion');
        }
      }
    });
    
    // Add first-person item display to scene
    addFirstPersonItemToScene(scene);
    
    // --- CORRECTED Room and Hallway Positions ---
    
    // Position the rooms according to the new layout
    // Hub (Room 0) is at center (0, 0, 0). Its radii are X:10, Z:7.5
    gameState.room0.group.position.set(0, 0, 0); 
    
    // Room 1 (Radius 9) is East. Position = 10 + 10 + 9 = 29
    gameState.room1.group.position.set(29, 0, 0);
    
    // Room 2 (Radius 6) is South. Position = 7.5 + 10 + 6 = 23.5
    gameState.room2.group.position.set(0, 0, 23.5);
    
    // Room 3 (Radius 10) is West. Position = 10 + 10 + 10 = 30
    gameState.room3.group.position.set(-30, 0, 0);
    
    // Room 4 (Radius 9) is North. Position = 7.5 + 10 + 9 = 26.5
    gameState.room4.group.position.set(0, 0, -26.5);
    
    // All rooms visible from start to prevent loading freezes
    gameState.room1.group.visible = true;
    gameState.room2.group.visible = true;
    gameState.room3.group.visible = true;
    gameState.room4.group.visible = true;
    
    // Make AI globally accessible for room0 interactions
    window.AI = AI;
    
    // Make gameState globally accessible for first-person item display
    window.gameState = gameState;
    
    // Make gameStore globally accessible for puzzle completion checks
    window.gameStore = gameStore;
    
    // Initialize input and menu systems (moved to onContinue)
    initMenu({ onPauseChange: (paused) => { gameState.paused = paused; } });
    
    // Initialize UI root for memory panel
    uiRoot;
    
     // Initialize minimap
     minimap = new Minimap(scene, player, renderer);
     
     // Initialize FPS counter
     fpsCounter = new FPSCounter();
    
    // Initialize Security Monitor
    securityMonitor = new SecurityMonitor(scene, renderer, gameState);
    window.securityMonitor = securityMonitor; // Make globally accessible
    
    // Initialize Shadow System
    shadowSystem = new ShadowSystem(renderer, scene);
    window.shadowSystem = shadowSystem; // Make globally accessible
    
    // Setup enhanced shadows for the scene
    shadowSystem.setupShadowsForScene();
    
    // Create main directional light with shadows (only if high performance mode)
    const currentQuality = performanceSettings.getQuality();
    const shouldEnableShadows = currentQuality === 'high';
    
    if (shouldEnableShadows) {
      shadowSystem.createDirectionalShadowLight({
        color: 0xffffff,
        intensity: 1.2,
        position: new THREE.Vector3(10, 20, 10),
        shadowMapSize: 2048,
        shadowCameraSize: 30,
        shadowBias: -0.001
      });
      console.log('Shadows enabled (High performance mode)');
    } else {
      // Disable shadows for medium and potato modes
      shadowSystem.toggleShadows(false);
      console.log(`Shadows disabled (${currentQuality} performance mode)`);
    }
    
    console.log('Enhanced shadow system initialized');
    
    // Update HUD with current bindings
    updateHUDInstructions();
    
    // Complete loading
    updateProgress(2); // Models and final setup
    
    // Setup wall collisions for the hub
    setupRoomCollisions();
    
    console.log('Game initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    console.log('Using fallback player box instead of Leonard');
    
    // Make player globally accessible in fallback case
    window.player = player;
    window.leonardModel = null; // Explicitly set to null in fallback case
    window.camera = camera; // Make camera globally accessible for minimap
    window.isInFirstPerson = isInFirstPerson; // Make view mode function globally accessible
    
    // Fallback: still create all rooms even if Leonard fails to load
    gameState.room0 = createRoom0();
    gameState.room1 = createRoom1();
    gameState.room2 = createRoom2();
    gameState.room3 = createServerRoom({ renderer });
    gameState.room4 = createRoom4();
    console.log('Fallback: Room 4 created and added to gameState');
    
    // Register them with the Level Manager (Room 0 serves as hub)
    levelManager.registerRoom('room0', gameState.room0);
    levelManager.registerRoom('room1', gameState.room1);
    levelManager.registerRoom('room2', gameState.room2);
    levelManager.registerRoom('room3', gameState.room3);
    levelManager.registerRoom('room4', gameState.room4);
    levelManager.setHub(gameState.room0); // Use Room 0 as the hub
    
    // Add first-person item display to scene
    addFirstPersonItemToScene(scene);
    
    // Position the rooms according to the new layout (fallback case)
    gameState.room0.group.position.set(0, 0, 0); 
    gameState.room1.group.position.set(29, 0, 0); // East of Room 0 (10 + 10 + 9 = 29)
    gameState.room2.group.position.set(0, 0, 23.5); // South of Room 0 (7.5 + 10 + 6 = 23.5)
    gameState.room3.group.position.set(-30, 0, 0); // West of Room 0 (10 + 10 + 10 = 30)
    gameState.room4.group.position.set(0, 0, -26.5); // North of Room 0 (7.5 + 10 + 9 = 26.5)
    console.log('Room 4 positioned at:', gameState.room4.group.position);
    
    // All rooms visible from start to prevent loading freezes
    gameState.room1.group.visible = true;
    gameState.room2.group.visible = true;
    gameState.room3.group.visible = true;
    gameState.room4.group.visible = true;
    
    window.AI = AI;
    
     // Initialize minimap in fallback case
     minimap = new Minimap(scene, player, renderer);
     
     // Initialize FPS counter in fallback case
     fpsCounter = new FPSCounter();
     
     // Initialize Shadow System in fallback case
     shadowSystem = new ShadowSystem(renderer, scene);
     window.shadowSystem = shadowSystem;
     
     // Setup enhanced shadows for the scene (fallback)
     shadowSystem.setupShadowsForScene();
     
     // Create main directional light with shadows (fallback - only if high performance mode)
     const currentQuality = performanceSettings.getQuality();
     const shouldEnableShadows = currentQuality === 'high';
     
     if (shouldEnableShadows) {
       shadowSystem.createDirectionalShadowLight({
         color: 0xffffff,
         intensity: 1.2,
         position: new THREE.Vector3(10, 20, 10),
         shadowMapSize: 2048,
         shadowCameraSize: 30,
         shadowBias: -0.001
       });
       console.log('Shadows enabled (High performance mode - fallback)');
     } else {
       // Disable shadows for medium and potato modes
       shadowSystem.toggleShadows(false);
       console.log(`Shadows disabled (${currentQuality} performance mode - fallback)`);
     }
     
     console.log('Enhanced shadow system initialized (fallback)');
    
    // Make gameState globally accessible for first-person item display
    window.gameState = gameState;
    
    // Complete loading even in fallback case
    updateProgress(7); // All items loaded
  }
}

// Initialize the game with main menu first
initializeMainMenu();

function initializeMainMenu() {
  // Create the main menu
  const mainMenuInstance = createMainMenu({
    onStartGame: () => {
      console.log('Starting game from main menu...');
      loadSettingsFromMainMenu();
      // Properly destroy the main menu before starting loading screen
      if (mainMenuInstance && mainMenuInstance.destroy) {
        mainMenuInstance.destroy();
      }
      initializeGameWithLoading();
    },
    onSettings: () => {
      console.log('Settings clicked - handled by main menu');
    },
    onCredits: () => {
      console.log('Credits clicked - handled by main menu');
    },
    onExit: () => {
      console.log('Exit game clicked');
      // Close the browser tab/window
      window.close();
    }
  });
}

// Load settings from main menu when starting game
function loadSettingsFromMainMenu() {
  try {
    // Ensure input system has loaded saved bindings/settings
    initInput();

    // Ensure matrix sky defaults are synced with the game store
    const matrixDefaults = {
      enableMatrixSky: true,
      matrixSkySpeed: 0.01,
      matrixSkyIntensity: 1.0
    };

    if (window.gameStore && window.gameStore.settings) {
      Object.assign(window.gameStore.settings, matrixDefaults);
    }
  } catch (error) {
    console.error('Failed to load settings from main menu:', error);
  }
}

// Clean up 2D Matrix rain effects from main menu/loading screen (keep music playing)
function stopBackgroundMusic() {
  console.log('Cleaning up 2D Matrix effects for game start (music continues playing)...');
  
  // Do NOT stop the global background music here; it should play through the game
  // Only clear any 2D Matrix rain animations that might still be running
  try {
    // Find and remove any remaining Matrix rain canvases
    const matrixCanvases = document.querySelectorAll('#matrix-rain, #main-menu-matrix-rain');
    matrixCanvases.forEach(canvas => {
      console.log('Removing remaining Matrix rain canvas:', canvas.id);
      canvas.remove();
    });
    
    // Also remove any remaining main menu or loading screen elements
    const menuElements = document.querySelectorAll('.main-menu, .loading-screen');
    menuElements.forEach(element => {
      console.log('Removing remaining menu element:', element.className);
      element.remove();
    });
  } catch (error) {
    console.log('Error cleaning up 2D Matrix effects:', error);
  }
  
  console.log('2D Matrix effects cleaned - background music left playing');
}

async function initializeGameWithLoading() {
  // Create the new Matrix-style loading screen
  const loadingScreenInstance = createLoadingScreen({
    onContinue: () => {
      // Hide the old loading screen
      loadingScreen.hide();
      
      // Properly destroy the loading screen before starting game
      if (loadingScreenInstance && loadingScreenInstance.destroy) {
        loadingScreenInstance.destroy();
      }
      
      // Clean up 2D visual effects; keep music and switch to in-game track
      stopBackgroundMusic();
      if (window.GlobalMusicManager) {
        if (typeof window.GlobalMusicManager.playGameTrack === 'function') {
          window.GlobalMusicManager.playGameTrack();
        } else if (typeof window.GlobalMusicManager.ensureStarted === 'function') {
          window.GlobalMusicManager.ensureStarted();
        }
      }
      
      // Initialize input and start the game
      initInput();
      
      // Start the proper AI dialogue sequence
      if (window.AI) {
        window.AI.onSpawn();
      }
      
      // Auto-enter look mode when game starts
      setTimeout(() => {
        if (window.toggleLookMode && isInFirstPerson()) {
          console.log('Auto-entering look mode on game start...');
          window.toggleLookMode();
        }
      }, 1000); // Small delay to ensure everything is initialized
      
      // Start the animation loop
      animate(0);
      
  console.log('Game started - switched to in-game background music');
    }
  });
  
  // Start the game initialization
  await initGame();
}


// Stage 0: Input handling for different stages
window.addEventListener('click', (e) => {
  // Handle mouse clicks for interactions in both first-person (with locked pointer) and third-person modes
  
  // First, check for dropped item interactions (highest priority)
  if (handleDroppedItemInteraction(camera)) {
    console.log('Dropped item clicked and picked up');
    return;
  }
  
  if (gameState.stage === 0) {
    // Stage 0: Handle Stage 0 interactions (key, door)
    handleStage0Click(e, camera, scene, gameState.room0);
  } else {
    // Stage 1+: Handle existing room interactions
    const rooms = {
      room1: gameState.room1,
      room2: gameState.room2,
      room3: gameState.room3
    };
    handleMouseClick(e, camera, rooms, renderer);
  }
});

// View toggle key handler and other interactions
window.addEventListener('keydown', (e) => {
  // Handle menu toggle first
  if (e.code === getBindings().openMenu) {
    toggleMenu();
    return;
  }
  
  if (e.code === getBindings().toggleView) {
    toggleViewMode();
    // Update AI dialogue to inform player about view change
    const viewMode = isInFirstPerson() ? 'First-Person' : 'Third-Person';
    AI.say(`Switched to ${viewMode} view. Use mouse to look around in first-person.`);
  }
  
  // J key for look mode toggle
  if (e.code === 'KeyJ') {
    toggleLookMode();
  }
  
  // I key interaction handler for inventory inspection
  if (e.code === 'KeyI') {
    // Check if paper examination is open first
    const paperExamination = document.getElementById('paperExamination');
    if (paperExamination) {
      // Paper examination is open, don't handle the I-key here
      // Let the paper examination's event listener handle it
      return;
    }
    
    // Only handle inventory inspection if paper examination is not open
    if (gameState.room1 && gameState.room1.handleIKeyInteraction) {
      const activePlayer = leonardModel || player;
      gameState.room1.handleIKeyInteraction(activePlayer);
    }
  }
  
  // M key for minimap toggle
  if (e.code === 'KeyM') {
    if (minimap) {
      minimap.toggle();
    }
  }
  
  // T key for minimap enlarge toggle
  if (e.code === 'KeyT') {
    if (minimap) {
      minimap.toggleEnlarge();
    }
  }
  
   // Z key for minimap zoom toggle (optional feature)
   if (e.code === 'KeyZ') {
     if (minimap) {
       minimap.toggleZoom();
     }
   }
   
  // K key for wall collision debug toggle
  if (e.code === 'KeyK') {
    if (wallCollisionManager.debugMode) {
      wallCollisionManager.clearDebug();
      // Also hide security monitor debug box
      if (window.securityMonitorCollisionDebug) {
        window.securityMonitorCollisionDebug.visible = false;
      }
      console.log('[Main] Wall collision debug disabled');
      AI.say('Wall collision debug disabled');
    } else {
      // Force collision setup before enabling debug
      console.log('[Main] Forcing collision setup...');
      
      // Get current room and force setup
      const playerX = (leonardModel || player).position.x;
      const playerZ = (leonardModel || player).position.z;
      let forceRoom = 'room0';
      if (playerX > 20) forceRoom = 'room1';
      else if (playerZ > 15) forceRoom = 'room2';
      else if (playerX < -20) forceRoom = 'room3';
      else if (playerZ < -20) forceRoom = 'room4';
      
      console.log(`[Main] Forcing collision setup for room: ${forceRoom}`);
      setupRoomCollisions(forceRoom);
      wallCollisionManager.enableDebug(scene);
      
      // Also show security monitor debug box
      if (window.securityMonitorCollisionDebug) {
        window.securityMonitorCollisionDebug.visible = true;
      }
      
      console.log('[Main] Wall collision debug enabled (press K to toggle)');
      AI.say('Wall collision debug enabled - Red = walls, Green = hallways, Yellow = hallway walls, Blue = objects, Purple = doors, Green wireframe = security monitor');
    }
  }
   
  // F key for FPS counter toggle and Room 2 note interaction
  if (e.code === 'KeyF') {
    let handled = false;
    // If Room 2 has a special F interaction (shine light), try it first
    const activePlayer = leonardModel || player;
    if (gameState.room2 && typeof gameState.room2.handleFKeyInteraction === 'function') {
      handled = gameState.room2.handleFKeyInteraction(activePlayer) || false;
    }
    if (!handled && fpsCounter) {
      fpsCounter.toggle();
    }
  }
  
  // R key for dropping items
  if (e.code === getBindings().dropItem) {
    if (window.disablePlayerControls) return;
    
    const activePlayer = leonardModel || player;
    if (handleDropItem(activePlayer)) {
      console.log('Item dropped');
    }
  }
  
  // CHEAT CODE SYSTEM
  // Tilde key (~) for cheat console
  if (e.code === 'Backquote' || e.code === 'Quote') {
    e.preventDefault();
    if (!window.cheatConsole) {
      window.cheatConsole = createCheatConsole();
    }
    window.cheatConsole.toggle();
    return;
  }
  
  // E key interaction handler
  if (e.code === getBindings().interact) {
    
    // Check if minigame is active - if so, don't process E-key interactions
    if (window.disablePlayerControls) {
      return;
    }
    
    // Check if paper examination is open first
    const paperExamination = document.getElementById('paperExamination');
    if (paperExamination) {
      // Paper examination is open, let it handle the E-key to close
      return;
    }
    
    // Check for dropped items first (highest priority)
    const activePlayer = leonardModel || player;
    if (handleDroppedItemInteraction(camera)) {
      console.log('Dropped item interaction handled');
      return;
    }
    
    // Check for door interactions second
    if (window.currentDoorInteraction) {
      const doorInfo = window.currentDoorInteraction;
      
      if (doorInfo.isLocked) {
        AI.say('This door is locked. Complete the required tasks to unlock it.');
        return;
      }
      
      // Toggle door state using the door's built-in methods
      if (doorInfo.door && doorInfo.door.userData) {
        const door = doorInfo.door;
        const doorState = door.userData.state;
        
        if (doorState.openAmount > 0.9) {
          // Door is open, close it
          door.userData.closeDoor();
          AI.say('Door closed.');
        } else {
          // Door is closed, open it
          door.userData.openDoor();
          AI.say('Door opened.');
        }
      }
      return;
    }
    
    // Always try Room 1 first if it exists (regardless of stage)
    if (gameState.room1 && gameState.room1.handleEKeyInteraction) {
      console.log('Trying Room 1 E-key handler first (regardless of stage)');
      const handled = gameState.room1.handleEKeyInteraction(activePlayer);
      if (handled) {
        console.log('Room 1 E-key handler succeeded');
        return;
      }
    }
    
    // Then, try Room 2 for pickable objects
    if (gameState.room2 && gameState.room2.handleEKeyInteraction) {
      console.log('Trying Room 2 E-key handler');
      const handled = gameState.room2.handleEKeyInteraction(activePlayer);
      if (handled) {
          console.log('Room 2 E-key handler succeeded');
          return; // If an item was picked up, stop processing
      }
    }

    // Try Room 4 for NEXUS panel
    if (gameState.room4 && gameState.room4.handleEKeyInteraction) {
      console.log('Trying Room 4 E-key handler');
      const handled = gameState.room4.handleEKeyInteraction(activePlayer);
      if (handled) {
        console.log('Room 4 E-key handler succeeded');
        return;
      }
    }

    // Check if player is in Room 0 (hub room)
    const isInRoom0 = activePlayer.position.x >= -10 && activePlayer.position.x <= 10 && 
                     activePlayer.position.z >= -7.5 && activePlayer.position.z <= 7.5;
    
    if (isInRoom0 && gameState.room0) {
      console.log('Handling E-key in Room 0 (Hub)');
      gameState.room0.handleEKeyInteraction(activePlayer);
    } else {
      // More robust room detection with debugging
      const isInsideRoom = (roomGroup, halfX, halfZ) => {
        if (!roomGroup || !activePlayer?.position) return false;
        
        // Get room world position
        const roomWorldPos = new THREE.Vector3();
        roomGroup.getWorldPosition(roomWorldPos);
        
        // Calculate player position relative to room
        const playerPos = activePlayer.position;
        const relativeX = playerPos.x - roomWorldPos.x;
        const relativeZ = playerPos.z - roomWorldPos.z;
        
        const isInside = (
          relativeX >= -halfX && relativeX <= halfX && 
          relativeZ >= -halfZ && relativeZ <= halfZ
        );
        
        // Debug logging for Room 1
        if (roomGroup.name === 'room1') {
          console.log('Room 1 Detection Debug:', {
            playerPos: playerPos.clone(),
            roomPos: roomWorldPos.clone(),
            relativePos: { x: relativeX, z: relativeZ },
            bounds: { halfX, halfZ },
            isInside
          });
        }
        
        return isInside;
      };

      const insideR3 = gameState.room3 && isInsideRoom(gameState.room3.group, 10, 10);
      const insideR1 = gameState.room1 && isInsideRoom(gameState.room1.group, 9, 9);

      console.log('E-key room detection:', { 
        insideR3, 
        insideR1, 
        playerPos: activePlayer.position.clone(),
        room1Pos: gameState.room1?.group?.position?.clone(),
        room3Pos: gameState.room3?.group?.position?.clone()
      });

      if (insideR3 && gameState.room3 && gameState.room3.handleEKeyInteraction) {
        console.log('Handling E-key in Room 3');
        gameState.room3.handleEKeyInteraction(activePlayer);
      } else if (insideR1 && gameState.room1 && gameState.room1.handleEKeyInteraction) {
        console.log('Handling E-key in Room 1');
        gameState.room1.handleEKeyInteraction(activePlayer);
      } else {
        // Fallback: Try all room handlers regardless of detection
        console.log('Room detection failed, trying fallback handlers');
        
        if (gameState.room1 && gameState.room1.handleEKeyInteraction) {
          console.log('Trying Room 1 fallback handler');
          const handled = gameState.room1.handleEKeyInteraction(activePlayer);
          if (handled) return;
        }
        
        if (gameState.room3 && gameState.room3.handleEKeyInteraction) {
          console.log('Trying Room 3 fallback handler');
          gameState.room3.handleEKeyInteraction(activePlayer);
        }
        
        if (gameState.room4 && gameState.room4.handleEKeyInteraction) {
          console.log('Trying Room 4 fallback handler');
          gameState.room4.handleEKeyInteraction(activePlayer);
        }
      }
      
      // FORCE Room 1 interactions for debugging - try Room 1 handler regardless
      if (gameState.room1 && gameState.room1.handleEKeyInteraction) {
        console.log('FORCE: Trying Room 1 handler regardless of room detection');
        const handled = gameState.room1.handleEKeyInteraction(activePlayer);
        console.log('FORCE: Room 1 handler result:', handled);
        if (handled) return;
      }
      
      // FORCE Room 4 interactions for debugging
      if (gameState.room4 && gameState.room4.handleEKeyInteraction) {
        console.log('FORCE: Trying Room 4 handler regardless of room detection');
        const handled = gameState.room4.handleEKeyInteraction(activePlayer);
        console.log('FORCE: Room 4 handler result:', handled);
        if (handled) return;
      }
    }
  }
  
  // L key interaction handler for Room 1 light switch
  if (e.code === getBindings().toggleLight) {
    console.log('L key pressed in main.js');
    // Check if player is in Room 1 using the new bounds checking function
    if (gameState.room1 && gameState.room1.isPlayerInRoom1) {
      const activePlayer = leonardModel || player;
      const playerPos = activePlayer.position.clone();
      
      if (gameState.room1.isPlayerInRoom1(playerPos)) {
        console.log('Player is in Room 1, toggling lights');
        // Use the unified lighting controller
        if (gameState.room1.setRoom1Lights) {
          // Toggle the current state using the getter
          const currentState = gameState.room1.getLightsOn ? gameState.room1.getLightsOn() : true;
          console.log('Current light state:', currentState, 'Toggling to:', !currentState);
          gameState.room1.setRoom1Lights(!currentState);
        } else if (gameState.room1.toggleLights) {
          // Fallback to legacy toggle
          gameState.room1.toggleLights();
        }
      } else {
        console.log('Player not in Room 1');
      }
    }
  }
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Unlock room 1 (door opens, room is already visible)
let room1Unlocked = false;
let hallwayDialogueShown = false;
function unlockRoom1() {
  if (gameState.stage === 0 && !room1Unlocked) {
    gameState.stage = 1;
    room1Unlocked = true;
    hallwayDialogueShown = true;
    AI.say("The door opens, granting you access to the hallway. Walk through to reach the first challenge room.");
  }
}

// Stage 0: Animation loop with stage management
let lastTime = 0;
function animate(currentTime) {
  requestAnimationFrame(animate);
  
  // Count frames for performance monitoring
  frameCount++;
  
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;
  
  // Update Matrix Sky animation
  if (matrixSky) {
    matrixSky.update(deltaTime);
    
    // Apply settings
    matrixSky.setEnabled(gameStore.settings.enableMatrixSky);
    
    
    matrixSky.setSpeed(gameStore.settings.matrixSkySpeed);
    matrixSky.setIntensity(gameStore.settings.matrixSkyIntensity);
    
  }
  
  // Track whether the player is inside Room 3 across this frame (used later for stage progression)
  let insideRoom3 = false;
  
  // Check if game is paused
  if (gameState.paused) {
    // Skip gameplay updates but still render the current frame
    renderer.render(scene, camera);
    return;
  }
  
  // Update fade-in effect
  updateFadeEffect();
  
  // Ensure dropped items are always in the scene
  ensureDroppedItemsInScene();
  
  // Get the active player object (Leonard model or fallback box)
  const activePlayer = leonardModel || player;
  
  // Update player light to follow the active player
  if (playerLight && activePlayer) {
    playerLight.position.copy(activePlayer.position);
    playerLight.position.y += 2; // Keep light slightly above player's head
  }
  
  // Stage 0: Update player movement with deltaTime for animations
  // Check if movement is restricted during awakening or minigame
  if (gameState.room0 && gameState.room0.state && gameState.room0.state.awakening && gameState.room0.state.awakening.movementRestricted) {
    // Only allow camera rotation during awakening, no movement
    // Player can look around but not move
  } else if (window.disablePlayerControls) {
    // Player controls disabled for minigame
    // Player can look around but not move
  } else {
    updatePlayer(activePlayer, camera, deltaTime);
  }
  
  // --- SAFE WALL COLLISION SYSTEM ---
  // Only run collision for current room, no room transitions
  const currentRoomId = gameStore.getCurrentRoom ? gameStore.getCurrentRoom() : 'room0';
  
  // Enhanced room detection based on player position
  let detectedRoom = 'room0'; // Default to hub
  
  // Check player position to determine current room
  const playerX = activePlayer.position.x;
  const playerZ = activePlayer.position.z;
  
  if (playerX > 20) {
    detectedRoom = 'room1'; // East
  } else if (playerZ > 15) {
    detectedRoom = 'room2'; // South  
  } else if (playerX < -20) {
    detectedRoom = 'room3'; // West
  } else if (playerZ < -20) {
    detectedRoom = 'room4'; // North
  } else {
    detectedRoom = 'room0'; // Hub
  }
  
  // Check if we need to update collision setup (room changed)
  if (window.lastCollisionRoom !== detectedRoom) {
    setupRoomCollisions(detectedRoom);
    window.lastCollisionRoom = detectedRoom;
  }
  
  // Run wall collision detection
  const collision = wallCollisionManager.checkCollision(activePlayer.position, 0.5);
  if (collision) {
    // Simple collision response - push player back to last valid position
    const lastValidPosition = activePlayer.userData.lastValidPosition || activePlayer.position.clone();
    activePlayer.position.copy(lastValidPosition);
  } else {
    // Update last valid position
    activePlayer.userData.lastValidPosition = activePlayer.position.clone();
  }
  
  // Update only doors in the current room group
  const currentRoomObj = gameState[currentRoomId];
  if (currentRoomObj && currentRoomObj.group) {
    currentRoomObj.group.traverse((object) => {
      if (object.userData && object.userData.category === 'door' && object.userData.update) {
        object.userData.update(deltaTime);
      }
    });
  }
  
  // Check door interactions
  const doorInteraction = wallCollisionManager.checkDoorInteraction(activePlayer.position, 2.0);
  if (doorInteraction) {
    // Store current door interaction for UI
    window.currentDoorInteraction = doorInteraction;
    
    // Show interaction prompt
    const interactionText = wallCollisionManager.getDoorInteractionText(doorInteraction);
    if (interactionText) {
      // Update UI with door interaction text
      if (window.updateInteractionUI) {
        window.updateInteractionUI(interactionText, 'door');
      }
    }
  } else {
    // Clear door interaction
    window.currentDoorInteraction = null;
    if (window.updateInteractionUI) {
      window.updateInteractionUI('', 'door');
    }
  }
  
  // Check hallway collisions
  if (gameState.hallwayToRoom1 && gameState.hallwayToRoom1.checkCollisions) {
    gameState.hallwayToRoom1.checkCollisions(activePlayer);
  }
  if (gameState.hallwayToRoom2 && gameState.hallwayToRoom2.checkCollisions) {
    gameState.hallwayToRoom2.checkCollisions(activePlayer);
  }
  if (gameState.hallwayToRoom3 && gameState.hallwayToRoom3.checkCollisions) {
    gameState.hallwayToRoom3.checkCollisions(activePlayer);
  }

  // Simple check for Room 3 for stage progression
  const playerWorld = activePlayer.position.clone();
  const isInsideRoom = (roomGroup, halfX, halfZ) => {
    if (!roomGroup) return false;
    const local = roomGroup.worldToLocal(playerWorld.clone());
    return (
      local.x >= -halfX && local.x <= halfX &&
      local.z >= -halfZ && local.z <= halfZ
    );
  };
  insideRoom3 = gameState.room3 && isInsideRoom(gameState.room3.group, 10, 10);
  
  // Update Room 0 when player is in Room 0 (hub room)
  const isInRoom0 = activePlayer.position.x >= -10 && activePlayer.position.x <= 10 && 
                   activePlayer.position.z >= -7.5 && activePlayer.position.z <= 7.5;
  
  if (isInRoom0 && gameState.room0) {
    // Always run Room 0 updates to allow door animations and interactions
    gameState.room0.updateRoom0(deltaTime, { playerObject: activePlayer, ai: AI });
    
    // Stage 0: Check for doorway trigger
    if (gameState.room0.state.doorOpen && gameState.room0.checkDoorwayTrigger(activePlayer)) {
      unlockRoom1();
    }
  }
  
  // Update Room 1 light flicker and light switch (room is always visible now)
  if (gameState.room1 && typeof gameState.room1.updateRoom1 === 'function') {
    gameState.room1.updateRoom1(deltaTime);
  }
  
  // Update Room 1 light switch proximity
  if (gameState.room1 && typeof gameState.room1.checkLightSwitchProximity === 'function') {
    gameState.room1.checkLightSwitchProximity();
  }
  
  // Update Room 1 contextual dialogue
  if (gameState.room1 && typeof gameState.room1.updateRoom1Dialogue === 'function') {
    gameState.room1.updateRoom1Dialogue();
  }

  // Update Room 2 systems (truth filter for hidden clues)
  if (gameState.room2 && typeof gameState.room2.update === 'function') {
    gameState.room2.update(deltaTime);
  }

  // Update Room 3 systems
  if (gameState.room3 && typeof gameState.room3.update === 'function') {
    gameState.room3.update(deltaTime);
  }

  // Update Room 4 systems (floating binary truth filter)
  if (gameState.room4 && typeof gameState.room4.update === 'function') {
    gameState.room4.update(deltaTime);
  }

  // Update only the active room systems (for doors)
  if (currentRoomObj && typeof currentRoomObj.update === 'function') {
    // Don't call update again if we already called it above
    if (currentRoomObj !== gameState.room2 && currentRoomObj !== gameState.room3 && currentRoomObj !== gameState.room4) {
      currentRoomObj.update(deltaTime);
    }
  }

  // Room 3 access door is handled by room0.js westDoor

  // Enter Room 3 logic and stage progression
  if (insideRoom3 && gameState.stage <  3 && gameState.room3 && typeof gameState.room3.enter === 'function') {
    gameState.room3.enter(2);
  }
  
  // HALLWAY REVAMP: Clear hallway dialogue when player moves away from Room 0
  if (hallwayDialogueShown && gameState.stage >= 1) {
    const activePlayer = leonardModel || player;
    const playerPos = activePlayer.position;
    
    // If player has moved away from Room 0 area (z < -10), clear hallway dialogue
    if (playerPos.z < -10) {
      console.log('HALLWAY REVAMP: Player moved away from Room 0, clearing hallway dialogue');
      hallwayDialogueShown = false;
      
      // Only trigger Room 1 dialogue if no dialogue is currently playing
      if (window.AI && !window.AI.isSpeaking()) {
        console.log('BACKUP: Triggering Room 1 entry dialogue');
        window.AI.onRoom1Entry();
      } else if (window.AI) {
        console.log('Dialogue currently playing, queuing Room 1 entry');
        window.AI.onRoom1Entry();
      }
    }
  }
  
  // Check if wire puzzle is solved and unlock door
  const wirePuzzleSolved = (gameState.room1 && gameState.room1.isWirePuzzleSolved && gameState.room1.isWirePuzzleSolved()) || 
                          (window.gameStore && window.gameStore.getWireComplete && window.gameStore.getWireComplete());
  
  if (wirePuzzleSolved) {
    // Wire puzzle solved - unlock door to next room
    if (gameState.stage < 2) {
      gameState.stage = 2;
      if (window.AI) {
        window.AI.onRoom1Complete();
      }
    }
    // Always unlock the south door when puzzle is solved (regardless of stage)
    if (gameState.room0 && gameState.room0.unlockSouthDoor) {
      gameState.room0.unlockSouthDoor();
    }
  }
  
   // Update minimap
   if (minimap) {
     minimap.update();
   }
   
   // Update FPS counter
   if (fpsCounter) {
     fpsCounter.update();
   }
  
  // Update Security Monitor
  if (securityMonitor) {
    securityMonitor.update(deltaTime);
  } else if (window.securityMonitor) {
    // Update the global security monitor if local reference is null (after recreation)
    window.securityMonitor.update(deltaTime);
  }
  
  // Update Level Manager
  levelManager.update(deltaTime);
  
  // Stage 0: Update camera
  attachCamera(camera, player, scene);
  
  // Performance debugger removed
  
  // Stage 0: Render scene
  renderer.clear();
  renderer.render(scene, camera);
  
  // Performance monitoring
  frameCount++;
  
  // Glasses vignette: fade based on inventory selection each frame
  const inv = getPlayerInventory ? getPlayerInventory() : null;
  const selected = inv && (inv.getSelectedItem ? inv.getSelectedItem() : inv.slots?.[inv.selectedSlot]);
  const target = selected && selected.name === 'glasses' ? 1.0 : 0.0;
  const s = vignetteUniforms.uStrength.value;
  vignetteUniforms.uStrength.value = s + (target - s) * Math.min(1, deltaTime * 6);
  
  // Update truth filter text indicator and timer
  const truthFilterIndicator = document.getElementById('truth-filter-indicator');
  if (truthFilterIndicator) {
    const isActive = target > 0.5;
    truthFilterIndicator.style.opacity = isActive ? '1' : '0';
    
    // Check if truth filter just became active
    if (isActive && !truthFilterTimer) {
      startTruthFilterTimer();
    } else if (!isActive && truthFilterTimer) {
      stopTruthFilterTimer();
      // Reset truth filter indicator text when manually deactivated
      truthFilterIndicator.innerHTML = 'TRUTH FILTER ACTIVE<br><span style="font-size: 11px; color: #88ff88;">Gamma Protocol Engaged</span>';
    }
  }
  
  // Track truth filter state changes
  if (!window.lastTruthFilterState) {
    window.lastTruthFilterState = target > 0.5;
  }
  
  const currentTruthFilterState = target > 0.5;
  const truthFilterJustDeactivated = window.lastTruthFilterState && !currentTruthFilterState;
  
  // Show AI error messages when truth filter is active
  if (currentTruthFilterState) {
    // Only show error messages occasionally to avoid spam
    if (!window.lastTruthFilterError || currentTime - window.lastTruthFilterError > 3000) {
      window.lastTruthFilterError = currentTime;
      AI.showTruthFilterError();
    }
  }
  
  // Show recovery message when truth filter is deactivated
  if (truthFilterJustDeactivated) {
    AI.showTruthFilterRecovery();
  }
  
  // Update the last state
  window.lastTruthFilterState = currentTruthFilterState;
  
  if (vignetteUniforms.uStrength.value > 0.01) {
    renderer.render(overlayScene, overlayCamera);
  }
}
animate(0);