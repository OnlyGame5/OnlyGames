// player.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* ================================
   INPUT & CAMERA STATE
=================================== */
const keys = {};
let isFirstPerson = true;
let mouseX = 0, mouseY = 0;
let isMouseLocked = false;

/* ================================
   LEONARD (MODEL & ANIMATION)
=================================== */
export let leonardModel = null;
export let animationMixer = null;
export const animations = {};

// Simple animation state machine
let currentAnimation = null;
function fadeTo(nextAction, duration = 0.25) {
  if (!nextAction || currentAnimation === nextAction) return;
  
  // Prepare the next action with correct loop settings
  nextAction.reset();
  if (nextAction === animations.idle) {
    nextAction.setLoop(THREE.LoopOnce, 1); // Idle: play once and stop
    nextAction.clampWhenFinished = true;
  } else if (nextAction === animations.walk) {
    nextAction.setLoop(THREE.LoopRepeat, Infinity); // Walk: loop continuously
  }
  
  if (currentAnimation) {
    currentAnimation.crossFadeTo(nextAction, duration, false);
  } else {
    nextAction.play();
  }
  currentAnimation = nextAction;
}

/* ================================
   INVENTORY
=================================== */
let playerInventory = {
  slots: [null, null, null, null, null], // 5 slots
  selectedSlot: 0,

  addItem(item) {
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

  hasItem(itemName) {
    return this.slots.some(item => item && item.name === itemName);
  },

  removeItem(itemName) {
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

  getSelectedItem() {
    return this.slots[this.selectedSlot];
  }
};

/* ================================
   HELPERS
=================================== */
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

function getItemIcon(itemName) {
  switch (itemName) {
    case 'stage0-key':
      return '🗝️';
    case 'room1-note':
      return '📝';
    default:
      return '📦';
  }
}

function showCrosshair() {
  const crosshair = document.getElementById('crosshair');
  if (crosshair) crosshair.style.display = 'block';
}

function hideCrosshair() {
  const crosshair = document.getElementById('crosshair');
  if (crosshair) crosshair.style.display = 'none';
}

/* ================================
   FIRST-PERSON ITEM DISPLAY
=================================== */
let firstPersonItem = null;
let firstPersonItemGroup = null;

// Create first-person item display
function createFirstPersonItemDisplay() {
  if (firstPersonItemGroup) return firstPersonItemGroup;
  
  firstPersonItemGroup = new THREE.Group();
  firstPersonItemGroup.name = 'firstPersonItem';
  firstPersonItemGroup.visible = false;
  
  return firstPersonItemGroup;
}

// Update first-person item display
function updateFirstPersonItemDisplay(camera) {
  if (!firstPersonItemGroup) {
    firstPersonItemGroup = createFirstPersonItemDisplay();
  }
  
  const selectedItem = playerInventory.getSelectedItem();
  
  if (selectedItem && isFirstPerson) {
    // Show the item
    firstPersonItemGroup.visible = true;
    
    // Remove existing item if different
    if (firstPersonItem && firstPersonItem.userData.itemName !== selectedItem.name) {
      firstPersonItemGroup.remove(firstPersonItem);
      firstPersonItem = null;
    }
    
    // Create new item if needed
    if (!firstPersonItem) {
      firstPersonItem = createItemMesh(selectedItem);
      if (firstPersonItem) {
        firstPersonItem.userData.itemName = selectedItem.name;
        firstPersonItemGroup.add(firstPersonItem);
      }
    }
    
    // Position the item in front of the camera
    const forward = new THREE.Vector3(0, 0, -0.8); // 0.8 units in front
    const right = new THREE.Vector3(0.3, 0, 0);    // 0.3 units to the right
    const down = new THREE.Vector3(0, -0.2, 0);    // 0.2 units down
    
    forward.applyQuaternion(camera.quaternion);
    right.applyQuaternion(camera.quaternion);
    down.applyQuaternion(camera.quaternion);
    
    firstPersonItemGroup.position.copy(camera.position)
      .add(forward)
      .add(right)
      .add(down);
    
    // Make item face the camera
    firstPersonItemGroup.lookAt(camera.position);
    
    // Add subtle floating animation
    const time = Date.now() * 0.001;
    firstPersonItemGroup.rotation.z = Math.sin(time * 2) * 0.1;
    firstPersonItemGroup.position.y += Math.sin(time * 3) * 0.02;
    
  } else {
    // Hide the item
    firstPersonItemGroup.visible = false;
  }
}

// Create 3D mesh for different item types
function createItemMesh(item) {
  let mesh = null;
  
  switch (item.name) {
    case 'stage0-key':
      // Try to get the original key model from room0
      if (window.gameState && window.gameState.room0 && window.gameState.room0.key) {
        // Clone the original key model
        mesh = window.gameState.room0.key.clone();
        
        // Scale it down for first-person view
        mesh.scale.set(0.5, 0.5, 0.5);
        
        // Rotate it to point upward
        mesh.rotation.x = Math.PI / 2;
        
        // Ensure it has proper materials and shadows
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Enhance the material if it's a standard material
            if (child.material) {
              child.material.emissive = new THREE.Color(0xffaa00);
              child.material.emissiveIntensity = 0.3;
              child.material.metalness = 0.8;
              child.material.roughness = 0.2;
            }
          }
        });
      } else {
        // Fallback to simple key if original model not available
        const keyGroup = new THREE.Group();
        
        // Key blade (rotated to point upward)
        const keyBlade = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.6, 0.3),
          new THREE.MeshStandardMaterial({ 
            color: 0xffff00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.2
          })
        );
        keyBlade.position.set(0, 0.15, 0);
        keyGroup.add(keyBlade);
        
        // Key handle (rotated to point upward)
        const keyHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.02, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0xffff00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.2
          })
        );
        keyHandle.position.set(0, -0.2, 0);
        keyGroup.add(keyHandle);
        
        // Key teeth (notches) - rotated to point upward
        for (let i = 0; i < 3; i++) {
          const tooth = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.1, 0.05),
            new THREE.MeshStandardMaterial({ 
              color: 0xffff00,
              emissive: 0xffaa00,
              emissiveIntensity: 0.3,
              metalness: 0.8,
              roughness: 0.2
            })
          );
          tooth.position.set(-0.1 + i * 0.1, 0.4, 0);
          keyGroup.add(tooth);
        }
        
        mesh = keyGroup;
      }
      break;
      
    default:
      // Generic item box
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshStandardMaterial({ 
          color: 0x888888,
          metalness: 0.3,
          roughness: 0.7
        })
      );
      break;
  }
  
  if (mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  
  return mesh;
}

// Add first-person item to scene
export function addFirstPersonItemToScene(scene) {
  if (!firstPersonItemGroup) {
    firstPersonItemGroup = createFirstPersonItemDisplay();
  }
  scene.add(firstPersonItemGroup);
}

/* ================================
   PUBLIC VIEW MODE API
=================================== */
export const VIEW_MODES = {
  FIRST_PERSON: 'firstPerson',
  THIRD_PERSON: 'thirdPerson'
};

export function getViewMode() {
  return isFirstPerson ? VIEW_MODES.FIRST_PERSON : VIEW_MODES.THIRD_PERSON;
}

export function isInFirstPerson() {
  return isFirstPerson;
}

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

/* ================================
   MODEL / ANIMATION LOADING
=================================== */
// Helper to load only an animation clip from a GLB (discard scene)
async function loadAnimationClip(url) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  if (gltf.animations && gltf.animations.length > 0) {
    console.log(`Loaded animation from ${url}:`, gltf.animations[0].name);
    return gltf.animations[0];
  }
  throw new Error(`No animations found in ${url}`);
}

export async function loadLeonard(scene) {
  const loader = new GLTFLoader();

  console.log('Attempting to load Leonard model from /models/leonard.glb');

  // 1) Load base model (armature + mesh)
  const base = await loader.loadAsync('/models/leonard.glb');

  leonardModel = base.scene;
  leonardModel.visible = true;

  // Scale Leonard to appropriate size (adjust as needed)
  // If your model is already human-sized, leave at 1; otherwise, try 0.015
  leonardModel.scale.set(1, 1, 1);

  // Position Leonard at origin (your movement system will move him)
  leonardModel.position.set(0, 0, 0);

  // Shadows
  leonardModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // 2) Mixer bound to the base model's armature
  animationMixer = new THREE.AnimationMixer(leonardModel);

  // 3) Find idle/walk clips in the base file, else load external clips
  let idleClip = base.animations?.find(c => /idle/i.test(c.name)) || null;
  let walkClip = base.animations?.find(c => /walk/i.test(c.name)) || null;

  if (!idleClip) {
    try { idleClip = await loadAnimationClip('/models/idle.glb'); }
    catch (e) { console.warn('No idle.glb found:', e.message); }
  }
  if (!walkClip) {
    try { walkClip = await loadAnimationClip('/models/walking.glb'); }
    catch (e) { console.warn('No walking.glb found:', e.message); }
  }

  // 4) Create actions - since both files are identical, we'll use one animation differently
  if (idleClip) {
    animations.idle = animationMixer.clipAction(idleClip, leonardModel);
    animations.idle.setLoop(THREE.LoopOnce, 1); // Play once and stop (idle pose)
    animations.idle.clampWhenFinished = true; // Stay at the end frame
    console.log('Created IDLE animation (single play) from:', idleClip.name);
  }
  if (walkClip) {
    animations.walk = animationMixer.clipAction(walkClip, leonardModel);
    animations.walk.setLoop(THREE.LoopRepeat, Infinity); // Loop continuously (walking)
    console.log('Created WALK animation (looping) from:', walkClip.name);
  }

  // 5) Start in IDLE exactly once
  if (animations.idle) {
    currentAnimation = animations.idle;
    currentAnimation.reset().play();
    console.log('Leonard idle animation started');
  } else {
    console.warn('No idle animation available - Leonard will remain in T-pose');
  }

  // 6) Add to scene
  scene.add(leonardModel);
  console.log('Leonard model added to scene at', leonardModel.position);
  
  // Hide the fallback player box now that Leonard is loaded
  const fallbackPlayer = scene.getObjectByName('player-box');
  if (fallbackPlayer) {
    fallbackPlayer.visible = false;
    console.log('Fallback player box hidden - Leonard model is now active');
  }
}

/* ================================
   ANIMATION UPDATE (CALLED EACH FRAME)
=================================== */
export function updateLeonardAnimations(deltaTime) {
  if (!animationMixer) return;

  // Movement state (from WASD)
  const moving = !!(keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']);


  if (moving) {
    // Start walking animation if not already running
    if (animations.walk && !animations.walk.isRunning()) {
      animations.walk.reset();
      animations.walk.setLoop(THREE.LoopRepeat, Infinity);
      animations.walk.play();
      currentAnimation = animations.walk;
    }
    
    // Optional: reduce foot sliding by matching clip speed to game speed
    if (animations.walk) {
      const baseWalkSpeed = 1.8; // m/s that looks natural for your Walk clip
      const gameSpeed = 2.2;     // your actual movement speed (tune)
      animations.walk.timeScale = gameSpeed / baseWalkSpeed;
    }
  } else {
    // Stop walking animation when not moving
    if (animations.walk && animations.walk.isRunning()) {
      animations.walk.stop();
      currentAnimation = null;
    }
  }

  animationMixer.update(deltaTime);
}


/* ================================
   PLAYER (FALLBACK BOX) & INPUT
=================================== */
export function setupPlayer(scene) {
  // Fallback player box (used for collisions & until Leonard loads)
  const player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1.8, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
  );
  player.position.set(0, 0.9, 0);
  player.castShadow = true;
  player.visible = true; // visible until Leonard is loaded
  player.name = 'player-box';
  scene.add(player);

  // Keyboard input handling
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    // Inventory slot selection (1-5)
    if (e.code >= 'Digit1' && e.code <= 'Digit5') {
      const slotIndex = parseInt(e.code.slice(-1)) - 1;
      playerInventory.selectedSlot = slotIndex;
      console.log(`Selected inventory slot ${slotIndex + 1}`);
      updateInventoryUI();
    }

    // Debug (optional)
    if (e.code === 'F1') debugAnimations();
    if (e.code === 'F4') debugLeonardMeshNames();

    // Manual forces (optional testers)
    if (e.code === 'F2' && animations.idle) {
      fadeTo(animations.idle, 0.15);
      console.log('MANUAL: cross-fade to idle');
    }
    if (e.code === 'F3' && animations.walk) {
      fadeTo(animations.walk, 0.15);
      console.log('MANUAL: cross-fade to walk');
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Mouse movement (first-person look)
  window.addEventListener('mousemove', (e) => {
    if (isMouseLocked && isFirstPerson) {
      mouseX -= e.movementX * 0.002;
      mouseY -= e.movementY * 0.002;
      mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseY));
    }
  });

  // Click to lock pointer in first-person
  window.addEventListener('click', () => {
    if (isFirstPerson && !isMouseLocked) {
      document.body.requestPointerLock();
    }
  });

  // Pointer lock change
  document.addEventListener('pointerlockchange', () => {
    isMouseLocked = document.pointerLockElement === document.body;
    if (isMouseLocked && isFirstPerson) showCrosshair();
    else hideCrosshair();
  });

  // Inventory UI init
  updateInventoryUI();

  return player;
}

/* ================================
   PLAYER UPDATE (MOVEMENT + ANIMS)
=================================== */
export function updatePlayer(player, camera, deltaTime = 0.016) {
  const speed = 0.08; // Reduced movement speed for better control
  let isMoving = false;

  // Use Leonard if available, else player box
  const activePlayer = leonardModel || player;

  // Block movement when UI requests it (e.g., keypad open)
  if (window.disablePlayerControls) {
    // Still update animations mixer for idle/walk blending timing
    if (leonardModel) {
      updateLeonardAnimations(deltaTime);
      player.position.copy(leonardModel.position);
      player.visible = false;
      leonardModel.visible = !isFirstPerson;
    }
    return;
  }

  if (isFirstPerson) {
    // Move relative to camera direction
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0; // stay on horizontal plane
    direction.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0));

    if (keys['KeyW']) { activePlayer.position.add(direction.clone().multiplyScalar(speed)); isMoving = true; }
    if (keys['KeyS']) { activePlayer.position.add(direction.clone().multiplyScalar(-speed)); isMoving = true; }
    if (keys['KeyA']) { activePlayer.position.add(right.clone().multiplyScalar(-speed)); isMoving = true; }
    if (keys['KeyD']) { activePlayer.position.add(right.clone().multiplyScalar(speed)); isMoving = true; }
  } else {
    // Third-person: world-aligned movement
    if (keys['KeyW']) { activePlayer.position.z -= speed; isMoving = true; }
    if (keys['KeyS']) { activePlayer.position.z += speed; isMoving = true; }
    if (keys['KeyA']) { activePlayer.position.x -= speed; isMoving = true; }
    if (keys['KeyD']) { activePlayer.position.x += speed; isMoving = true; }

    // Face movement direction (3rd person only)
    if (isMoving && leonardModel) {
      const movementDirection = new THREE.Vector3(
        (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0),
        0,
        (keys['KeyS'] ? 1 : 0) - (keys['KeyW'] ? 1 : 0)
      );
      if (movementDirection.lengthSq() > 0) {
        movementDirection.normalize();
        const angle = Math.atan2(movementDirection.x, movementDirection.z);
        leonardModel.rotation.y = angle;
      }
    }
  }

  // Update Leonard animations
  if (leonardModel) {
    updateLeonardAnimations(deltaTime);
    // Keep the hidden player-box in sync for collisions
    player.position.copy(leonardModel.position);
    player.visible = false;
    
    // Set Leonard visibility based on view mode
    leonardModel.visible = !isFirstPerson;
  } else {
    player.visible = true;
  }
}

/* ================================
   CAMERA ATTACH
=================================== */
// Function to hide/show specific body parts for first-person view
function setFirstPersonBodyVisibility(leonardModel, isFirstPerson) {
  if (!leonardModel) return;
  
  // Store original visibility state if not already stored
  if (!leonardModel.userData.originalVisibility) {
    leonardModel.userData.originalVisibility = new Map();
    leonardModel.traverse((child) => {
      if (child.isMesh) {
        leonardModel.userData.originalVisibility.set(child, child.visible);
      }
    });
  }
  
  leonardModel.traverse((child) => {
    if (child.isMesh) {
      const name = child.name.toLowerCase();
      
      if (isFirstPerson) {
        // In first-person mode, hide the entire model initially
        // We'll show only specific parts that should be visible
        child.visible = false;
        
        // Show only body parts that should be visible in first-person
        // (arms, torso, legs - but not head/neck)
        if (name.includes('arm') || name.includes('hand') || name.includes('finger') ||
            name.includes('torso') || name.includes('chest') || name.includes('body') ||
            name.includes('leg') || name.includes('foot') || name.includes('thigh') ||
            name.includes('calf') || name.includes('shin') || name.includes('knee') ||
            name.includes('hip') || name.includes('waist') || name.includes('belt') ||
            name.includes('shirt') || name.includes('pants') || name.includes('clothing')) {
          child.visible = true;
        }
      } else {
        // In third-person mode, restore original visibility
        const originalVisible = leonardModel.userData.originalVisibility.get(child);
        child.visible = originalVisible !== undefined ? originalVisible : true;
      }
    }
  });
}

// Debug function to log all mesh names in the Leonard model
export function debugLeonardMeshNames() {
  if (!leonardModel) {
    console.log('Leonard model not loaded yet');
    return;
  }
  
  console.log('=== Leonard Model Mesh Names ===');
  leonardModel.traverse((child) => {
    if (child.isMesh) {
      console.log(`Mesh: "${child.name}"`);
    }
  });
  console.log('=== End Mesh Names ===');
}

export function attachCameraFirstPerson(camera, player) {
  const activePlayer = leonardModel || player;
  
  // Position camera at eye level, slightly forward to avoid seeing the model
  camera.position.set(
    activePlayer.position.x,
    activePlayer.position.y + 1.7, // Eye level
    activePlayer.position.z
  );
  camera.rotation.order = 'YXZ';
  camera.rotation.y = mouseX;
  camera.rotation.x = mouseY;
  
  // Move camera forward slightly to get past the player model
  const forward = new THREE.Vector3(0, 0, -0.5);
  forward.applyQuaternion(camera.quaternion);
  camera.position.add(forward);
  
  // Hide the entire Leonard model in first-person mode
  if (leonardModel) {
    leonardModel.visible = false;
  }
  
  // Update first-person item display
  updateFirstPersonItemDisplay(camera);
}

export function attachCameraThirdPerson(camera, player) {
  const activePlayer = leonardModel || player;
  camera.position.set(activePlayer.position.x, activePlayer.position.y + 3, activePlayer.position.z + 8);
  camera.lookAt(activePlayer.position.x, activePlayer.position.y + 1, activePlayer.position.z);
  
  // Show the Leonard model in third-person mode
  if (leonardModel) {
    leonardModel.visible = true;
  }
  
  // Hide first-person item display in third-person mode
  if (firstPersonItemGroup) {
    firstPersonItemGroup.visible = false;
  }
}

export function attachCamera(camera, player) {
  if (isFirstPerson) attachCameraFirstPerson(camera, player);
  else attachCameraThirdPerson(camera, player);
}

/* ================================
   INVENTORY EXPORTS
=================================== */
export function getPlayerInventory() { return playerInventory; }
export function addToInventory(item) { return playerInventory.addItem(item); }
export function hasInInventory(itemName) { return playerInventory.hasItem(itemName); }
export function removeFromInventory(itemName) { return playerInventory.removeItem(itemName); }
