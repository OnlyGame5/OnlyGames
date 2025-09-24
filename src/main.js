import * as THREE from 'three';
import { setupPlayer, updatePlayer, attachCamera, toggleViewMode, isInFirstPerson, loadLeonard, addFirstPersonItemToScene, leonardModel } from './player.js';
import { AI } from './ai.js';
import { createRoom0 } from './room0.js';
import { createRoom1 } from './room1.js';
import { createRoom2 } from './room2.js';
import { createRoom3 } from './room3.js';
import { handleMouseClick, handleStage0Click } from './utils.js';

// --- Scene, Camera, Renderer ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b12);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 10);

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

// Stage 0: Game state management
let gameState = {
  stage: 0,
  room0: null,
  room1: null,
  room2: null,
  room3: null
};

// Initialize game with Leonard
async function initGame() {
  try {
    // Load Leonard model
    await loadLeonard(scene);
    console.log('Leonard loaded successfully!');
    
    // Initialize all rooms (no scene param now)
    gameState.room0 = createRoom0();
    gameState.room1 = createRoom1();
    gameState.room2 = createRoom2();
    gameState.room3 = createRoom3();
    
    // Add groups to scene
    scene.add(gameState.room0.group, gameState.room1.group, gameState.room2.group, gameState.room3.group);
    
    // Add first-person item display to scene
    addFirstPersonItemToScene(scene);
    
    // Line them up along -Z with proper spacing
    const ROOM_SPACING = 30; // Increased spacing to accommodate larger room 1
    gameState.room0.group.position.set(0, 0, 0 * -ROOM_SPACING); // 0
    gameState.room1.group.position.set(0, 0, 1 * -ROOM_SPACING); // -30
    gameState.room2.group.position.set(0, 0, 2 * -ROOM_SPACING); // -60
    gameState.room3.group.position.set(0, 0, 3 * -ROOM_SPACING); // -90
    
    // All rooms visible from start to prevent loading freezes
    gameState.room1.group.visible = true;
    gameState.room2.group.visible = true;
    gameState.room3.group.visible = true;
    
    // AI greeting for Stage 0
    AI.say("Hello. Don't be afraid. I'll help you escape this place. Trust me.");
    
    // Make AI globally accessible for room0 interactions
    window.AI = AI;
    
    // Make gameState globally accessible for first-person item display
    window.gameState = gameState;
    
    console.log('Game initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    console.log('Using fallback player box instead of Leonard');
    
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
    
    AI.say("Hello. Don't be afraid. I'll help you escape this place. Trust me.");
    window.AI = AI;
    
    // Make gameState globally accessible for first-person item display
    window.gameState = gameState;
  }
}

// Initialize the game
initGame();

// Stage 0: Input handling for different stages
window.addEventListener('click', (e) => {
  // Handle mouse clicks for interactions in both first-person (with locked pointer) and third-person modes
  if (gameState.stage === 0) {
    // Stage 0: Handle Stage 0 interactions (key, door)
    handleStage0Click(e, camera, scene, gameState.room0);
  } else {
    // Stage 1+: Handle existing room interactions
    const rooms = [gameState.room1, gameState.room2, gameState.room3].filter(room => room !== null);
    handleMouseClick(e, camera, rooms);
  }
});

// View toggle key handler (V key) and E key interaction
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyV') {
    toggleViewMode();
    // Update AI dialogue to inform player about view change
    const viewMode = isInFirstPerson() ? 'First-Person' : 'Third-Person';
    AI.say(`Switched to ${viewMode} view. Use mouse to look around in first-person.`);
  }
  
  // E key interaction handler
  if (e.code === 'KeyE') {
    if (gameState.stage === 0 && gameState.room0) {
      // Use the active player object (Leonard model or fallback box)
      const activePlayer = leonardModel || player;
      gameState.room0.handleEKeyInteraction(activePlayer);
    } else if (gameState.room1 && gameState.room1.handleEKeyInteraction) {
      const activePlayer = leonardModel || player;
      gameState.room1.handleEKeyInteraction(activePlayer);
    }
  }
  
  // L key interaction handler for Room 1 light switch
  if (e.code === 'KeyL') {
    console.log('L key pressed in main.js');
    // Check if player is in Room 1
    if (gameState.room1) {
      const activePlayer = leonardModel || player;
      const playerWorld = activePlayer.position.clone();
      const localToRoom1 = gameState.room1.group.worldToLocal(playerWorld.clone());
      const half = 9; // Room 1 is 18x18, so half is 9
      const insideRoom1 = (
        localToRoom1.x >= -half && localToRoom1.x <= half &&
        localToRoom1.z >= -half && localToRoom1.z <= half
      );
      
      if (insideRoom1 && gameState.room1.toggleLights) {
        console.log('Player is in Room 1, toggling lights');
        gameState.room1.toggleLights();
      } else {
        console.log('Player not in Room 1 or toggleLights not available');
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
function unlockRoom1() {
  if (gameState.stage === 0) {
    gameState.stage = 1;
    AI.say("The door opens, granting you access to the hallway. Walk through to reach the first challenge room.");
  }
}

// Stage 0: Animation loop with stage management
let lastTime = 0;
function animate(currentTime) {
  requestAnimationFrame(animate);
  
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;
  
  // Get the active player object (Leonard model or fallback box)
  const activePlayer = leonardModel || player;
  
  // Stage 0: Update player movement with deltaTime for animations
  updatePlayer(activePlayer, camera, deltaTime);
  
  // Collision: choose which area's walls to apply based on player position
  if (gameState.room0) {
    let useRoom1 = false;

    if (gameState.room1 && typeof gameState.room1.checkWallCollisions === 'function') {
      // Convert player world position to room1 local space and check bounds (18x18 room → half 9)
      const playerWorld = activePlayer.position.clone();
      const localToRoom1 = gameState.room1.group.worldToLocal(playerWorld.clone());
      const half = 9;
      const insideRoom1 = (
        localToRoom1.x >= -half && localToRoom1.x <= half &&
        localToRoom1.z >= -half && localToRoom1.z <= half
      );
      useRoom1 = insideRoom1;
    }

    if (useRoom1) {
      gameState.room1.checkWallCollisions(activePlayer);
    } else {
      // Default to room0/hallway constraints
      gameState.room0.checkWallCollisions(activePlayer);
    }
  }
  
  // Stage 0: Update Stage 0 if active
  if (gameState.stage === 0 && gameState.room0) {
    const activePlayer = leonardModel || player;
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
  
  // Stage 0: Update camera
  attachCamera(camera, player);
  
  // Stage 0: Render scene
  renderer.render(scene, camera);
}
animate(0);
