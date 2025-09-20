import * as THREE from 'three';
import { setupPlayer, updatePlayer, attachCamera, toggleViewMode, isInFirstPerson, loadLeonard } from './player.js';
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

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);
scene.add(new THREE.HemisphereLight(0x8888aa, 0x222222, 0.6));

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
    
    // Initialize Stage 0 (Lobby/Entry Room)
    gameState.room0 = createRoom0(scene);
    
    // AI greeting for Stage 0
    AI.say("Hello. Don't be afraid. I'll help you escape this place. Trust me.");
    
    // Make AI globally accessible for room0 interactions
    window.AI = AI;
    
    console.log('Game initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    console.log('Using fallback player box instead of Leonard');
    
    // Fallback: still create room0 even if Leonard fails to load
    gameState.room0 = createRoom0(scene);
    AI.say("Hello. Don't be afraid. I'll help you escape this place. Trust me.");
    window.AI = AI;
  }
}

// Initialize the game
initGame();

// Stage 0: Input handling for different stages
window.addEventListener('click', (e) => {
  // Only handle mouse clicks for interactions if not in first-person mode or if pointer is not locked
  if (!isInFirstPerson() || document.pointerLockElement !== document.body) {
    if (gameState.stage === 0) {
      // Stage 0: Handle Stage 0 interactions (key, door)
      handleStage0Click(e, camera, scene, gameState.room0);
    } else {
      // Stage 1+: Handle existing room interactions
      const rooms = [gameState.room1, gameState.room2, gameState.room3].filter(room => room !== null);
      handleMouseClick(e, camera, rooms);
    }
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
      gameState.room0.handleEKeyInteraction(player);
    }
  }
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Stage 0: Stage transition function
function transitionToStage1() {
  // Stage 0: Hide Stage 0 room
  if (gameState.room0) {
    gameState.room0.group.visible = false;
  }
  
  // Stage 0: Load Stage 1 (existing room1.js)
  gameState.room1 = createRoom1(scene);
  gameState.room2 = createRoom2(scene, 20, 0);
  gameState.room3 = createRoom3(scene, -20, 0);
  
  // Stage 0: Reposition player to Room 1 entrance
  player.position.set(0, 0.9, 8);
  
  // Stage 0: Update game state
  gameState.stage = 1;
  
  // Stage 0: AI message for Stage 1
  AI.say("Welcome to the first challenge. You'll need to solve the keypad puzzle to proceed.");
}

// Stage 0: Animation loop with stage management
let lastTime = 0;
function animate(currentTime) {
  requestAnimationFrame(animate);
  
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;
  
  // Stage 0: Update player movement with deltaTime for animations
  updatePlayer(player, camera, deltaTime);
  
  // Stage 0: Check collisions if in Stage 0
  if (gameState.stage === 0 && gameState.room0) {
    // Check wall collisions first
    gameState.room0.checkWallCollisions(player);
    
    // Then check door collision
    if (gameState.room0.checkDoorCollision(player)) {
      // Prevent player from passing through closed door
      const doorZ = -7.5 + 0.15; // Updated for new room size
      if (player.position.z < doorZ + 0.3) {
        player.position.z = doorZ + 0.3;
      }
    }
  }
  
  // Stage 0: Update Stage 0 if active
  if (gameState.stage === 0 && gameState.room0) {
    gameState.room0.updateRoom0(deltaTime, { playerObject: player, ai: AI });
    
    // Stage 0: Check for doorway trigger
    if (gameState.room0.state.doorOpen && gameState.room0.checkDoorwayTrigger(player)) {
      transitionToStage1();
    }
  }
  
  // Stage 0: Update camera
  attachCamera(camera, player);
  
  // Stage 0: Render scene
  renderer.render(scene, camera);
}
animate(0);
