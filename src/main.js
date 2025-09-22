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
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
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
    
    // Initialize all rooms (no scene param now)
    gameState.room0 = createRoom0();
    gameState.room1 = createRoom1();
    gameState.room2 = createRoom2();
    gameState.room3 = createRoom3();
    
    // Add groups to scene
    scene.add(gameState.room0.group, gameState.room1.group, gameState.room2.group, gameState.room3.group);
    
    // Line them up along -Z with proper spacing
    const ROOM_SPACING = 25; // tweak to your room length
    gameState.room0.group.position.set(0, 0, 0 * -ROOM_SPACING); // 0
    gameState.room1.group.position.set(0, 0, 1 * -ROOM_SPACING); // -25
    gameState.room2.group.position.set(0, 0, 2 * -ROOM_SPACING); // -50
    gameState.room3.group.position.set(0, 0, 3 * -ROOM_SPACING); // -75
    
    // Initially hide rooms 1, 2, 3 until unlocked
    gameState.room1.group.visible = false;
    gameState.room2.group.visible = false;
    gameState.room3.group.visible = false;
    
    // AI greeting for Stage 0
    AI.say("Hello. Don't be afraid. I'll help you escape this place. Trust me.");
    
    // Make AI globally accessible for room0 interactions
    window.AI = AI;
    
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
    
    // Line them up along -Z with proper spacing
    const ROOM_SPACING = 25;
    gameState.room0.group.position.set(0, 0, 0 * -ROOM_SPACING);
    gameState.room1.group.position.set(0, 0, 1 * -ROOM_SPACING);
    gameState.room2.group.position.set(0, 0, 2 * -ROOM_SPACING);
    gameState.room3.group.position.set(0, 0, 3 * -ROOM_SPACING);
    
    // Initially hide rooms 1, 2, 3
    gameState.room1.group.visible = false;
    gameState.room2.group.visible = false;
    gameState.room3.group.visible = false;
    
    AI.say("Hello. Don't be afraid. I'll help you escape this place. Trust me.");
    window.AI = AI;
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

// Unlock room 1 (reveal room, hallway is always visible)
function unlockRoom1() {
  if (!gameState.room1.group.visible) {
    gameState.room1.group.visible = true;
    // Hallway is always visible, door just controls access
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
  
  // Stage 0: Update player movement with deltaTime for animations
  updatePlayer(player, camera, deltaTime);
  
  // Check collisions for all active rooms
  if (gameState.room0) {
    // Check room0 wall collisions (including hallway)
    gameState.room0.checkWallCollisions(player);
    
    // Check door collision
    if (gameState.room0.checkDoorCollision(player)) {
      // Prevent player from passing through closed door
      const doorZ = -7.5 + 0.15; // Updated for new room size
      if (player.position.z < doorZ + 0.3) {
        player.position.z = doorZ + 0.3;
      }
    }
  }
  
  if (gameState.room1 && gameState.room1.group.visible) {
    // Check room1 wall collisions when room1 is visible
    gameState.room1.checkWallCollisions(player);
  }
  
  // Stage 0: Update Stage 0 if active
  if (gameState.stage === 0 && gameState.room0) {
    gameState.room0.updateRoom0(deltaTime, { playerObject: player, ai: AI });
    
    // Stage 0: Check for doorway trigger
    if (gameState.room0.state.doorOpen && gameState.room0.checkDoorwayTrigger(player)) {
      unlockRoom1();
    }
  }
  
  // Stage 0: Update camera
  attachCamera(camera, player);
  
  // Stage 0: Render scene
  renderer.render(scene, camera);
}
animate(0);
