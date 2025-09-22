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
}

/* ================================
   ANIMATION UPDATE (CALLED EACH FRAME)
=================================== */
export function updateLeonardAnimations(deltaTime) {
  if (!animationMixer) return;

  // Movement state (from WASD)
  const moving = !!(keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']);

  // Debug: Log what's happening
  if (Math.random() < 0.01) { // Log 1% of the time
    console.log('Animation Debug:', {
      moving: moving,
      current: currentAnimation ? currentAnimation.getClip().name : 'none',
      walkRunning: animations.walk ? animations.walk.isRunning() : false
    });
  }

  if (moving) {
    // Start walking animation if not already running
    if (animations.walk && !animations.walk.isRunning()) {
      console.log('Starting walking animation');
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
      console.log('Stopping walking animation');
      animations.walk.stop();
      currentAnimation = null;
    }
  }

  animationMixer.update(deltaTime);
}

/* ================================
   DEBUG
=================================== */
export function debugAnimations() {
  if (!animationMixer) {
    console.log('No animation mixer');
    return;
  }
  console.log('=== Animation Debug ===');
  console.log('Current animation:', currentAnimation ? currentAnimation.getClip().name : 'none');
  console.log('Keys pressed:', {
    W: !!keys['KeyW'],
    S: !!keys['KeyS'],
    A: !!keys['KeyA'],
    D: !!keys['KeyD']
  });
  console.log('Has idle animation:', !!animations.idle);
  console.log('Has walk animation:', !!animations.walk);
  if (animations.idle) {
    console.log('Idle running:', animations.idle.isRunning(), 'time:', animations.idle.time, 'weight:', animations.idle.getEffectiveWeight());
  }
  if (animations.walk) {
    console.log('Walk running:', animations.walk.isRunning(), 'time:', animations.walk.time, 'weight:', animations.walk.getEffectiveWeight());
  }
  console.log('Mixer time:', animationMixer.time);
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
  const speed = 0.15;
  let isMoving = false;

  // Use Leonard if available, else player box
  const activePlayer = leonardModel || player;

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
  } else {
    player.visible = true;
  }
}

/* ================================
   CAMERA ATTACH
=================================== */
export function attachCameraFirstPerson(camera, player) {
  const activePlayer = leonardModel || player;
  camera.position.set(
    activePlayer.position.x,
    activePlayer.position.y + 1.8,
    activePlayer.position.z
  );
  camera.rotation.order = 'YXZ';
  camera.rotation.y = mouseX;
  camera.rotation.x = mouseY;
}

export function attachCameraThirdPerson(camera, player) {
  const activePlayer = leonardModel || player;
  camera.position.set(activePlayer.position.x, activePlayer.position.y + 3, activePlayer.position.z + 8);
  camera.lookAt(activePlayer.position.x, activePlayer.position.y + 1, activePlayer.position.z);
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
