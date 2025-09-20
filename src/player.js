import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const keys = {};
let isFirstPerson = true;
let mouseX = 0, mouseY = 0;
let isMouseLocked = false;

// Leonard model and animation system
export let leonardModel = null;
export let animationMixer = null;
export const animations = {};

// Input state for animations
const inputState = { forward: false, back: false, left: false, right: false };

// Inventory system
let playerInventory = {
  slots: [null, null, null, null, null], // 5 slots
  selectedSlot: 0,
  
  addItem: function(item) {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] === null) {
        this.slots[i] = item;
        console.log(`Added ${item.name} to inventory slot ${i + 1}`);
        updateInventoryUI();
        return true;
      }
    }
    console.log("Inventory is full!");
    return false;
  },
  
  hasItem: function(itemName) {
    return this.slots.some(item => item && item.name === itemName);
  },
  
  removeItem: function(itemName) {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] && this.slots[i].name === itemName) {
        this.slots[i] = null;
        console.log(`Removed ${itemName} from inventory`);
        updateInventoryUI();
        return true;
      }
    }
    return false;
  },
  
  getSelectedItem: function() {
    return this.slots[this.selectedSlot];
  }
};

// Helper function to load animation from separate file
async function loadAnimationClip(url) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      if (gltf.animations && gltf.animations.length > 0) {
        console.log(`Loaded animation from ${url}:`, gltf.animations[0].name);
        resolve(gltf.animations[0]);
      } else {
        reject(new Error(`No animations found in ${url}`));
      }
    }, undefined, reject);
  });
}

// Load Leonard model with animations
export async function loadLeonard(scene) {
  return new Promise(async (resolve, reject) => {
    const loader = new GLTFLoader();
    
    console.log('Attempting to load Leonard model from /models/leonard.glb');
    
    try {
      // Load Leonard model
      const gltf = await new Promise((resolve, reject) => {
        loader.load('/models/leonard.glb', resolve, (progress) => {
          console.log('Loading Leonard model...', (progress.loaded / progress.total * 100) + '%');
        }, reject);
      });
      
      console.log('Leonard GLTF loaded successfully!');
      console.log('Available animations in main file:', gltf.animations.map(a => a.name));
      
      leonardModel = gltf.scene;
      
      // Make sure Leonard is visible
      leonardModel.visible = true;
      
      // Scale Leonard to appropriate size
      leonardModel.scale.set(1, 1, 1);
      
      // Position Leonard at origin
      leonardModel.position.set(0, 0, 0);
      
      // Enable shadows
      leonardModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          console.log('Found mesh:', child.name, 'visible:', child.visible);
        }
      });
      
      // Set up animation mixer
      animationMixer = new THREE.AnimationMixer(leonardModel);
      
      // Try to find animations in the main file first
      let idleClip = gltf.animations.find(clip => 
        clip.name.toLowerCase().includes('idle')
      );
      let walkClip = gltf.animations.find(clip => 
        clip.name.toLowerCase().includes('walk')
      );
      
      // If animations not found in main file, try loading separate files
      if (!idleClip) {
        console.log('Idle animation not found in main file, trying to load separate file...');
        try {
          idleClip = await loadAnimationClip('/models/leonard_idle.glb');
        } catch (error) {
          console.log('Could not load separate idle animation:', error.message);
        }
      }
      
      if (!walkClip) {
        console.log('Walk animation not found in main file, trying to load separate file...');
        try {
          walkClip = await loadAnimationClip('/models/walking.glb');
        } catch (error) {
          console.log('Could not load separate walk animation:', error.message);
        }
      }
      
      console.log('Found idle animation:', !!idleClip);
      console.log('Found walk animation:', !!walkClip);
      
      // Create animation actions
      if (idleClip) {
        animations.idle = animationMixer.clipAction(idleClip);
        animations.idle.setLoop(THREE.LoopRepeat);
        console.log('Created idle animation action');
      }
      
      if (walkClip) {
        animations.walk = animationMixer.clipAction(walkClip);
        animations.walk.setLoop(THREE.LoopRepeat);
        console.log('Created walk animation action');
      }
      
      // Start with idle animation
      if (animations.idle) {
        animations.idle.reset();
        animations.idle.play();
        animations.idle.timeScale = 1.0;
        console.log('Leonard idle animation started');
      } else {
        console.warn('No idle animation available - Leonard will remain in T-pose');
      }
      
      // Add to scene
      scene.add(leonardModel);
      
      console.log('Leonard model added to scene at position:', leonardModel.position);
      console.log('Leonard model scale:', leonardModel.scale);
      console.log('Leonard model visible:', leonardModel.visible);
      
      resolve();
      
    } catch (error) {
      console.error('Error loading Leonard model:', error);
      console.log('Make sure leonard.glb exists in public/models/ folder');
      reject(error);
    }
  });
}

// Animation crossfade helper
function fadeToAnimation(nextAction, duration = 0.2) {
  if (!animationMixer || !nextAction) return;
  
  // Get currently playing action
  const currentAction = animationMixer._actions.find(action => action.isRunning());
  
  if (currentAction === nextAction) return;
  
  // Stop all actions
  animationMixer._actions.forEach(action => {
    if (action.isRunning()) {
      action.fadeOut(duration);
    }
  });
  
  // Start new action
  nextAction.reset();
  nextAction.fadeIn(duration);
  nextAction.play();
  
  console.log('Switched to animation:', nextAction.getClip().name);
}

// Update Leonard animations
export function updateLeonardAnimations(deltaTime) {
  if (!animationMixer) {
    return;
  }
  
  // Update input state
  inputState.forward = keys['KeyW'] || false;
  inputState.back = keys['KeyS'] || false;
  inputState.left = keys['KeyA'] || false;
  inputState.right = keys['KeyD'] || false;
  
  // Determine if moving
  const isMoving = inputState.forward || inputState.back || inputState.left || inputState.right;
  
  // Switch animations based on movement
  if (isMoving && animations.walk) {
    // Switch to walk animation
    if (!animations.walk.isRunning() || animations.idle?.isRunning()) {
      fadeToAnimation(animations.walk, 0.2);
    }
    
    // Set walk animation to normal speed (not slow motion)
    animations.walk.timeScale = 1.0;
    
  } else if (animations.idle) {
    // Switch to idle animation when not moving
    if (!animations.idle.isRunning() || animations.walk?.isRunning()) {
      fadeToAnimation(animations.idle, 0.2);
    }
    
    // Set idle animation to normal speed
    animations.idle.timeScale = 1.0;
  }
  
  // Update animation mixer
  animationMixer.update(deltaTime);
}

// Debug function to check animation state
export function debugAnimations() {
  if (!animationMixer) {
    console.log('No animation mixer');
    return;
  }
  
  console.log('=== Animation Debug ===');
  console.log('Input state:', inputState);
  console.log('Is moving:', inputState.forward || inputState.back || inputState.left || inputState.right);
  console.log('Has idle animation:', !!animations.idle);
  console.log('Has walk animation:', !!animations.walk);
  
  if (animations.idle) {
    console.log('Idle animation running:', animations.idle.isRunning());
    console.log('Idle animation time scale:', animations.idle.timeScale);
  }
  
  if (animations.walk) {
    console.log('Walk animation running:', animations.walk.isRunning());
    console.log('Walk animation time scale:', animations.walk.timeScale);
  }
  
  console.log('All running actions:', animationMixer._actions.filter(a => a.isRunning()).map(a => a.getClip().name));
}

// Crosshair control functions
function showCrosshair() {
  const crosshair = document.getElementById('crosshair');
  if (crosshair) {
    crosshair.style.display = 'block';
  }
}

function hideCrosshair() {
  const crosshair = document.getElementById('crosshair');
  if (crosshair) {
    crosshair.style.display = 'none';
  }
}

// Camera view modes
export const VIEW_MODES = {
  FIRST_PERSON: 'firstPerson',
  THIRD_PERSON: 'thirdPerson'
};

export function setupPlayer(scene) {
  // Create a simple player box as fallback
  const player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1.8, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
  );
  player.position.set(0, 0.9, 0);
  player.castShadow = true;
  player.visible = true; // Make it visible as fallback
  player.name = 'player-box';
  scene.add(player);

  // Keyboard input handling
  window.addEventListener('keydown', (e)=> {
    keys[e.code] = true;
    
    // Inventory slot selection (1-5 keys)
    if (e.code >= 'Digit1' && e.code <= 'Digit5') {
      const slotIndex = parseInt(e.code.slice(-1)) - 1;
      playerInventory.selectedSlot = slotIndex;
      console.log(`Selected inventory slot ${slotIndex + 1}`);
      updateInventoryUI();
    }
    
    // Debug animations with F1 key
    if (e.code === 'F1') {
      debugAnimations();
    }
  });
  window.addEventListener('keyup', (e)=> keys[e.code] = false);

  // Mouse movement handling for first-person look
  window.addEventListener('mousemove', (e) => {
    if (isMouseLocked && isFirstPerson) {
      mouseX -= e.movementX * 0.002; // Fixed: inverted horizontal movement
      mouseY -= e.movementY * 0.002; // Fixed: inverted vertical movement
      mouseY = Math.max(-Math.PI/2, Math.min(Math.PI/2, mouseY)); // Clamp vertical look
    }
  });

  // Mouse click to lock cursor in first-person mode
  window.addEventListener('click', () => {
    if (isFirstPerson && !isMouseLocked) {
      document.body.requestPointerLock();
    }
  });

  // Pointer lock change events
  document.addEventListener('pointerlockchange', () => {
    isMouseLocked = document.pointerLockElement === document.body;
    
    // Show/hide crosshair based on mouse lock and view mode
    if (isMouseLocked && isFirstPerson) {
      showCrosshair();
    } else {
      hideCrosshair();
    }
  });

  // Initialize inventory UI
  updateInventoryUI();

  return player;
}

export function updatePlayer(player, camera, deltaTime = 0.016) {
  const speed = 0.15;
  let isMoving = false;
  
  // Use Leonard model if available, otherwise use the simple player box
  const activePlayer = leonardModel || player;
  
  if (isFirstPerson) {
    // First-person movement: move relative to camera direction
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0; // Keep movement on horizontal plane
    direction.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0));
    
    if (keys['KeyW']) {
      activePlayer.position.add(direction.clone().multiplyScalar(speed));
      isMoving = true;
    }
    if (keys['KeyS']) {
      activePlayer.position.add(direction.clone().multiplyScalar(-speed));
      isMoving = true;
    }
    if (keys['KeyA']) {
      activePlayer.position.add(right.clone().multiplyScalar(-speed));
      isMoving = true;
    }
    if (keys['KeyD']) {
      activePlayer.position.add(right.clone().multiplyScalar(speed));
      isMoving = true;
    }
  } else {
    // Third-person movement: move in world coordinates
    if (keys['KeyW']) {
      activePlayer.position.z -= speed;
      isMoving = true;
    }
    if (keys['KeyS']) {
      activePlayer.position.z += speed;
      isMoving = true;
    }
    if (keys['KeyA']) {
      activePlayer.position.x -= speed;
      isMoving = true;
    }
    if (keys['KeyD']) {
      activePlayer.position.x += speed;
      isMoving = true;
    }
  }
  
  // Update Leonard animations
  if (leonardModel) {
    updateLeonardAnimations(deltaTime);
    
    // Rotate Leonard to face movement direction
    if (isMoving && !isFirstPerson) {
      const movementDirection = new THREE.Vector3();
      if (keys['KeyW']) movementDirection.z -= 1;
      if (keys['KeyS']) movementDirection.z += 1;
      if (keys['KeyA']) movementDirection.x -= 1;
      if (keys['KeyD']) movementDirection.x += 1;
      
      if (movementDirection.length() > 0) {
        movementDirection.normalize();
        const angle = Math.atan2(movementDirection.x, movementDirection.z);
        leonardModel.rotation.y = angle;
      }
    }
  }
  
  // Sync player box position with Leonard for collision detection
  if (leonardModel) {
    player.position.copy(leonardModel.position);
    player.visible = false; // Hide player box when Leonard is loaded
  } else {
    player.visible = true; // Show player box if Leonard is not loaded
  }
}

// First-person camera positioning and rotation
export function attachCameraFirstPerson(camera, player) {
  // Use Leonard model if available, otherwise use player box
  const activePlayer = leonardModel || player;
  
  // Position camera at player's head level
  camera.position.set(
    activePlayer.position.x, 
    activePlayer.position.y + 1.8, // Head height for Leonard
    activePlayer.position.z
  );
  
  // Apply mouse look rotation
  camera.rotation.order = 'YXZ';
  camera.rotation.y = mouseX;
  camera.rotation.x = mouseY;
}

// Third-person camera positioning (adjusted for Leonard)
export function attachCameraThirdPerson(camera, player) {
  // Use Leonard model if available, otherwise use player box
  const activePlayer = leonardModel || player;
  
  camera.position.set(activePlayer.position.x, activePlayer.position.y+3, activePlayer.position.z+8);
  camera.lookAt(activePlayer.position.x, activePlayer.position.y+1, activePlayer.position.z);
}

// Main camera attachment function that switches between modes
export function attachCamera(camera, player) {
  if (isFirstPerson) {
    attachCameraFirstPerson(camera, player);
  } else {
    attachCameraThirdPerson(camera, player);
  }
}

// Toggle between first-person and third-person view
export function toggleViewMode() {
  isFirstPerson = !isFirstPerson;
  
  // Exit pointer lock when switching to third-person
  if (!isFirstPerson && isMouseLocked) {
    document.exitPointerLock();
  }
  
  // Update crosshair visibility
  if (isFirstPerson && isMouseLocked) {
    showCrosshair();
  } else {
    hideCrosshair();
  }
  
  console.log(`Switched to ${isFirstPerson ? 'First-Person' : 'Third-Person'} view`);
  return isFirstPerson;
}

// Get current view mode
export function getViewMode() {
  return isFirstPerson ? VIEW_MODES.FIRST_PERSON : VIEW_MODES.THIRD_PERSON;
}

// Check if currently in first-person mode
export function isInFirstPerson() {
  return isFirstPerson;
}

// Export inventory functions
export function getPlayerInventory() {
  return playerInventory;
}

export function addToInventory(item) {
  return playerInventory.addItem(item);
}

export function hasInInventory(itemName) {
  return playerInventory.hasItem(itemName);
}

export function removeFromInventory(itemName) {
  return playerInventory.removeItem(itemName);
}

// Inventory UI update function
function updateInventoryUI() {
  const inventoryElement = document.getElementById('inventory');
  if (!inventoryElement) return;
  
  const slots = inventoryElement.querySelectorAll('.inventory-slot');
  
  slots.forEach((slot, index) => {
    const item = playerInventory.slots[index];
    const iconElement = slot.querySelector('.item-icon');
    
    // Update selection highlight
    slot.classList.toggle('selected', index === playerInventory.selectedSlot);
    
    // Update item display
    if (item) {
      slot.classList.add('filled');
      iconElement.textContent = getItemIcon(item.name);
      iconElement.title = item.description || item.name;
    } else {
      slot.classList.remove('filled');
      iconElement.textContent = '';
      iconElement.title = '';
    }
  });
}

// Get icon for different item types
function getItemIcon(itemName) {
  switch (itemName) {
    case 'stage0-key':
      return '🗝️';
    default:
      return '📦';
  }
}
