import * as THREE from 'three';
import { setupPlayer, updatePlayer, attachCamera, toggleViewMode, isInFirstPerson, loadLeonard, addFirstPersonItemToScene, leonardModel, getPlayerInventory } from './player.js';
import { AI } from './ai.js';
import { createRoom0 } from './room0.js';
import { createRoom1 } from './room1.js';
import { createRoom2 } from './room2.js';
import { createRoom4 } from './room4.js';
import { createRoom3 } from './rooms/serverRoom.js';
import { handleMouseClick, handleStage0Click } from './utils.js';
import { initInput, isDown as inputIsDown, getBindings } from './systems/input.js';
import { initMenu, toggleMenu, updateHUDInstructions } from './ui/menu.js';
import { loadingScreen } from './loading.js';
import { createLoadingScreen, dispatchLoadingProgress, dispatchLoadingComplete } from './ui/LoadingScreen.js';
import { uiRoot } from './ui/UIRoot.js';
import { createReusableHallway, HallwayPresets } from './components/ReusableHallway.js';
import { Minimap } from './minimap.js';
import { FPSCounter } from './ui/FPSCounter.js';
import { LevelManager } from './game/levels/LevelManager.js';
import { gameStore } from './state/gameStore.js';


// --- Scene, Camera, Renderer ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b12);
// Disable scene environment map to prevent reflections
scene.environment = null;

const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 10);

// Fade-in effect for awakening chamber
let fadeOverlay = null;
let isFading = true;
let fadeStartTime = 0;
const fadeDuration = 2000; // 2 seconds

const renderer = new THREE.WebGLRenderer({ 
  antialias: false, // Disabled for performance
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; // Changed from PCFSoftShadowMap for better performance
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Reduced from 2 to 1.5 for better performance
document.body.appendChild(renderer.domElement);
// We'll render an overlay after the main scene; disable automatic clearing between renders
renderer.autoClear = false;

// Install performance debugger


// Lighting - Only for Room 0 (global lights removed to let Room 1 control its own lighting)
// Global lights moved to Room 0 only

// Player setup
const player = setupPlayer(scene);

// Level Manager setup
const levelManager = new LevelManager(scene, player);

// Minimap setup
let minimap = null;

// FPS Counter setup
let fpsCounter = null;

// === Glasses vignette overlay (shader) ===
const overlayScene = new THREE.Scene();
const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const vignetteUniforms = {
  uStrength: { value: 0.0 },
  // Slightly more saturated cyan tint
  uColor: { value: new THREE.Color(0x4db5ff) }
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
      float inner = 0.35; // start earlier for more coverage
      float outer = 0.85; // reach strength sooner
      float v = smoothstep(inner, outer, r);
      // Slight ease to emphasize edges a bit more
      v = pow(v, 0.9);
      float alpha = v * 0.7 * uStrength; // stronger tint
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
    let totalItems = 7; // leonard(1) + rooms(5) + models(1) - security camera removed
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
    
    // Make leonardModel globally accessible for minimap and other systems
    window.leonardModel = leonardModel;
    window.player = player; // Also make player globally accessible
    window.camera = camera; // Make camera globally accessible for minimap
    window.isInFirstPerson = isInFirstPerson; // Make view mode function globally accessible
    
    // Create all rooms (Room 0 serves as the hub)
    gameState.room0 = createRoom0();
    updateProgress(1); // Room 0
    gameState.room1 = createRoom1();
    updateProgress(1); // Room 1
    gameState.room2 = createRoom2();
    updateProgress(1); // Room 2
    gameState.room3 = createRoom3();
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
    
    // Initialize input and menu systems (moved to onContinue)
    initMenu({ onPauseChange: (paused) => { gameState.paused = paused; } });
    
    // Initialize UI root for memory panel
    uiRoot;
    
     // Initialize minimap
     minimap = new Minimap(scene, player, renderer);
     
     // Initialize FPS counter
     fpsCounter = new FPSCounter();
    
    // Update HUD with current bindings
    updateHUDInstructions();
    
    // Complete loading
    updateProgress(2); // Models and final setup
    
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
    gameState.room3 = createRoom3();
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
    
    // Make gameState globally accessible for first-person item display
    window.gameState = gameState;
    
    // Complete loading even in fallback case
    updateProgress(7); // All items loaded
  }
}

// Initialize the game with new loading screen
initializeGameWithLoading();

async function initializeGameWithLoading() {
  // Create the new Matrix-style loading screen
  const loadingScreenInstance = createLoadingScreen({
    onContinue: () => {
      // Hide the old loading screen
      loadingScreen.hide();
      
      // Initialize input and start the game
      initInput();
      
      // Start the proper AI dialogue sequence
      if (window.AI) {
        window.AI.onSpawn();
      }
      
      // Start the animation loop
      animate(0);
      
      console.log('Game started with new loading screen!');
    }
  });
  
  // Start the game initialization
  await initGame();
}

// Stage 0: Input handling for different stages
window.addEventListener('click', (e) => {
  // Handle mouse clicks for interactions in both first-person (with locked pointer) and third-person modes
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
  
  // E key interaction handler
  if (e.code === getBindings().interact) {
    console.log('E-key pressed! Key code:', e.code, 'getBindings().interact:', getBindings().interact);
    
    // Check if paper examination is open first
    const paperExamination = document.getElementById('paperExamination');
    if (paperExamination) {
      console.log('Paper examination is open, skipping E-key handling');
      // Paper examination is open, let it handle the E-key to close
      return;
    }
    
    console.log('Game state check:', { 
      stage: gameState.stage, 
      room0Exists: !!gameState.room0,
      room1Exists: !!gameState.room1,
      room2Exists: !!gameState.room2,
      room3Exists: !!gameState.room3
    });
    
    const activePlayer = leonardModel || player;
    
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

    // Then try Room 0 if in stage 0
    if (gameState.stage === 0 && gameState.room0) {
      console.log('Handling E-key in Stage 0 (Room 0)');
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
      }
      
      // FORCE Room 1 interactions for debugging - try Room 1 handler regardless
      if (gameState.room1 && gameState.room1.handleEKeyInteraction) {
        console.log('FORCE: Trying Room 1 handler regardless of room detection');
        const handled = gameState.room1.handleEKeyInteraction(activePlayer);
        console.log('FORCE: Room 1 handler result:', handled);
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
  
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;
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
  
  // Get the active player object (Leonard model or fallback box)
  const activePlayer = leonardModel || player;
  
  // Stage 0: Update player movement with deltaTime for animations
  // Check if movement is restricted during awakening
  if (gameState.room0 && gameState.room0.state && gameState.room0.state.awakening && gameState.room0.state.awakening.movementRestricted) {
    // Only allow camera rotation during awakening, no movement
    // Player can look around but not move
  } else {
    updatePlayer(activePlayer, camera, deltaTime);
  }
  
  // --- NEW SIMPLIFIED COLLISION LOGIC ---
  const currentRoomId = gameStore.getCurrentRoom ? gameStore.getCurrentRoom() : 'room0';
  const room = gameState[currentRoomId];

  if (room && room.checkWallCollisions) {
      room.checkWallCollisions(activePlayer);
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
  
  // Stage 0: Update Stage 0 if active (but not if player is in Room 1)
  if (gameState.stage === 0 && gameState.room0) {
    const activePlayer = leonardModel || player;
    
    // Always run Room 0 updates to allow door message to play
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

  // Update Room 3 systems
  if (gameState.room3 && typeof gameState.room3.update === 'function') {
    gameState.room3.update(deltaTime);
  }

  // Update Room 4 systems (floating binary animation)
  if (gameState.room4 && typeof gameState.room4.update === 'function') {
    gameState.room4.update(deltaTime);
  // Update Room 2 systems
  if (gameState.room2 && typeof gameState.room2.update === 'function') {
    gameState.room2.update(deltaTime);
  }

  // Enter Room 3 logic and stage progression
  if (insideRoom3 && gameState.stage < 3 && gameState.room3 && typeof gameState.room3.enter === 'function') {
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
  if (gameState.room1 && gameState.room1.isWirePuzzleSolved && gameState.room1.isWirePuzzleSolved()) {
    // Wire puzzle solved - unlock door to next room
    if (gameState.stage === 1) {
      gameState.stage = 2;
      if (window.AI) {
        window.AI.onRoom1Complete();
      }
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
  
  // Update Level Manager
  levelManager.update(deltaTime);
  
  // Stage 0: Update camera
  attachCamera(camera, player);
  
  // Performance debugger removed
  
  // Stage 0: Render scene
  renderer.clear();
  renderer.render(scene, camera);
  // Glasses vignette: fade based on inventory selection each frame
  const inv = getPlayerInventory ? getPlayerInventory() : null;
  const selected = inv && (inv.getSelectedItem ? inv.getSelectedItem() : inv.slots?.[inv.selectedSlot]);
  const target = selected && selected.name === 'glasses' ? 1.0 : 0.0;
  const s = vignetteUniforms.uStrength.value;
  vignetteUniforms.uStrength.value = s + (target - s) * Math.min(1, deltaTime * 6);
  if (vignetteUniforms.uStrength.value > 0.01) {
    renderer.render(overlayScene, overlayCamera);
  }
}
animate(0);
