import * as THREE from 'three';
import { setupPlayer, updatePlayer, attachCamera, toggleViewMode, isInFirstPerson, loadLeonard, addFirstPersonItemToScene, leonardModel } from './player.js';
import { AI } from './ai.js';
import { createRoom0 } from './room0.js';
import { createRoom1 } from './room1.js';
import { createRoom2 } from './room2.js';
import { createRoom3 } from './room3.js';
import { handleMouseClick, handleStage0Click } from './utils.js';
import { initInput, isDown as inputIsDown, getBindings } from './systems/input.js';
import { initMenu, toggleMenu, updateHUDInstructions } from './ui/menu.js';
import { loadingScreen } from './loading.js';
import { createLoadingScreen, dispatchLoadingProgress, dispatchLoadingComplete } from './ui/LoadingScreen.js';
import { uiRoot } from './ui/UIRoot.js';
import { createReusableHallway, HallwayPresets } from './components/ReusableHallway.js';
import { Minimap } from './minimap.js';
import { FPSCounter } from './ui/FPSCounter.js';

// --- Scene, Camera, Renderer ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b12);

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
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Better shadow quality with less performance cost
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
document.body.appendChild(renderer.domElement);

// Lighting - Only for Room 0 (global lights removed to let Room 1 control its own lighting)
// Global lights moved to Room 0 only

// Player setup
const player = setupPlayer(scene);

// Minimap setup
let minimap = null;

// FPS Counter setup
let fpsCounter = null;

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
    let totalItems = 7; // leonard(1) + rooms(4) + models(2)
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
    
    // Initialize all rooms (no scene param now)
    gameState.room0 = createRoom0();
    updateProgress(1); // Room 0
    gameState.room1 = createRoom1();
    updateProgress(1); // Room 1
    gameState.room2 = createRoom2();
    updateProgress(1); // Room 2
    gameState.room3 = createRoom3();
    updateProgress(1); // Room 3
    
    // Add groups to scene
    scene.add(gameState.room0.group, gameState.room1.group, gameState.room2.group, gameState.room3.group);
    
    // Position player in the awakening chair
    if (gameState.room0.awakeningChair) {
      player.position.set(0, 1, 2); // Position player in chair
    } else {
      player.position.set(0, 1, 2); // Fallback position
    }
    
    // Create hallway between Room 0 and Room 1
    const hallway0to1 = HallwayPresets.standard({
      length: 13.5,
      width: 2,
      height: 4,
      positionX: 0,
      positionY: 0,
      positionZ: -14.25, // Halfway between Room 0 (z=0) and Room 1 (z=-30)
      name: 'hallway-0-to-1',
      addLighting: true,
      lightIntensity: 0.4,
      ambientIntensity: 0.15,
      textureSet: 'concrete031'
    });
    
    // Add hallway to scene
    scene.add(hallway0to1.group);

    // Create hallway between Room 2 and Room 3
    const hallway2to3 = HallwayPresets.standard({
      length: 13.5,
      width: 2,
      height: 4,
      positionX: -8, // align with Room 2 center (x=-8) to connect to the new opening
      positionY: 0,
      positionZ: -75, // halfway between z=-60 and z=-90
      name: 'hallway-2-to-3',
      addLighting: true,
      lightIntensity: 0.45,
      ambientIntensity: 0.15,
      textureSet: 'concrete031'
    });
    scene.add(hallway2to3.group);
    
    // Add first-person item display to scene
    addFirstPersonItemToScene(scene);
    
    // Line them up along -Z with proper spacing
    const ROOM_SPACING = 30; // Increased spacing to accommodate larger room 1
    gameState.room0.group.position.set(0, 0, 0 * -ROOM_SPACING); // 0
    gameState.room1.group.position.set(0, 0, 1 * -ROOM_SPACING); // -30
    // Shift Room 2 left to align with Room 1 hallway (which exits near x ≈ -8)
    gameState.room2.group.position.set(-8, 0, 2 * -ROOM_SPACING); // -60
    gameState.room3.group.position.set(0, 0, 3 * -ROOM_SPACING); // -90
    
    // All rooms visible from start to prevent loading freezes
    gameState.room1.group.visible = true;
    gameState.room2.group.visible = true;
    gameState.room3.group.visible = true;
    
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
    
    // Add groups to scene
    scene.add(gameState.room0.group, gameState.room1.group, gameState.room2.group, gameState.room3.group);
    
    // Add first-person item display to scene
    addFirstPersonItemToScene(scene);
    
    // Line them up along -Z with proper spacing
    const ROOM_SPACING = 30;
    gameState.room0.group.position.set(0, 0, 0 * -ROOM_SPACING);
    gameState.room1.group.position.set(0, 0, 1 * -ROOM_SPACING);
    gameState.room2.group.position.set(0, 0, 2 * -ROOM_SPACING);
    gameState.room3.group.position.set(0, 0, 3 * -ROOM_SPACING);
    
    // All rooms visible from start to prevent loading freezes
    gameState.room1.group.visible = true;
    gameState.room2.group.visible = true;
    gameState.room3.group.visible = true;
    
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
   
   // F key for FPS counter toggle
   if (e.code === 'KeyF') {
     if (fpsCounter) {
       fpsCounter.toggle();
     }
   }
  
  // E key interaction handler
  if (e.code === getBindings().interact) {
    // Check if paper examination is open first
    const paperExamination = document.getElementById('paperExamination');
    if (paperExamination) {
      // Paper examination is open, let it handle the E-key to close
      return;
    }
    
  if (gameState.stage === 0 && gameState.room0) {
      // Use the active player object (Leonard model or fallback box)
      const activePlayer = leonardModel || player;
      gameState.room0.handleEKeyInteraction(activePlayer);
    } else {
      const activePlayer = leonardModel || player;
      // Determine which room the player is in (1 or 3 priority)
      const isInside = (roomGroup, halfX, halfZ) => {
        if (!roomGroup) return false;
        const local = roomGroup.worldToLocal(activePlayer.position.clone());
        return local.x >= -halfX && local.x <= halfX && local.z >= -halfZ && local.z <= halfZ;
      };
      const insideR3 = gameState.room3 && isInside(gameState.room3.group, 10, 10);
      const insideR1 = gameState.room1 && isInside(gameState.room1.group, 9, 9);

      if (insideR3 && gameState.room3 && gameState.room3.handleEKeyInteraction) {
        gameState.room3.handleEKeyInteraction(activePlayer);
      } else if (insideR1 && gameState.room1 && gameState.room1.handleEKeyInteraction) {
        gameState.room1.handleEKeyInteraction(activePlayer);
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
  
  // Collision: choose which area's walls to apply based on player position
  {
    const playerWorld = activePlayer.position.clone();

    // Helper: inside bounds check for a rectangular room
    const isInsideRoom = (roomGroup, halfX, halfZ) => {
      if (!roomGroup) return false;
      const local = roomGroup.worldToLocal(playerWorld.clone());
      return (
        local.x >= -halfX && local.x <= halfX &&
        local.z >= -halfZ && local.z <= halfZ
      );
    };

  const insideRoom1 = gameState.room1 && isInsideRoom(gameState.room1.group, 9, 9);
  const insideRoom2 = gameState.room2 && isInsideRoom(gameState.room2.group, 6, 6);
  insideRoom3 = gameState.room3 && isInsideRoom(gameState.room3.group, 10, 10);
  const insideRoom0 = gameState.room0 && isInsideRoom(gameState.room0.group, 6, 6); // room0 approx bounds

    if (insideRoom1 && gameState.room1 && gameState.room1.checkWallCollisions) {
      gameState.room1.checkWallCollisions(activePlayer);
    } else if (insideRoom2 && gameState.room2 && gameState.room2.checkWallCollisions) {
      gameState.room2.checkWallCollisions(activePlayer);
    } else if (insideRoom3 && gameState.room3 && gameState.room3.checkWallCollisions) {
      gameState.room3.checkWallCollisions(activePlayer);
    } else if (insideRoom0 && gameState.room0 && gameState.room0.checkWallCollisions) {
      // Only apply Room 0 collisions when actually inside Room 0
      gameState.room0.checkWallCollisions(activePlayer);
    } else {
      // Transitional spaces: light clamping along Room 1 → Room 2 hallway (aligned at x ≈ -8)
      const hallwayCenterX = -8;
      const hallwayHalfWidth = 1.0; // match Room 1 hallway width
      const playerPos = activePlayer.position;
      // Constrain X gently while between Room 1 back and Room 2 front
      // World Z between approx -39 and -54 (Room1 hallway to Room2 front)
      if (playerPos.z < -35 && playerPos.z > -58) {
        if (playerPos.x < hallwayCenterX - hallwayHalfWidth) playerPos.x = hallwayCenterX - hallwayHalfWidth;
        if (playerPos.x > hallwayCenterX + hallwayHalfWidth) playerPos.x = hallwayCenterX + hallwayHalfWidth;
      }
      
      // Transitional spaces: light clamping along Room 2 → Room 3 hallway (aligned at x ≈ -8)
      // World Z between approx -68 and -82 (Room2 back to Room3 front)
      if (playerPos.z < -68 && playerPos.z > -82) {
        if (playerPos.x < hallwayCenterX - hallwayHalfWidth) playerPos.x = hallwayCenterX - hallwayHalfWidth;
        if (playerPos.x > hallwayCenterX + hallwayHalfWidth) playerPos.x = hallwayCenterX + hallwayHalfWidth;
      }
    }
  }
  
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
  
  // Stage 0: Update camera
  attachCamera(camera, player);
  
  // Stage 0: Render scene
  renderer.render(scene, camera);
}
animate(0);
