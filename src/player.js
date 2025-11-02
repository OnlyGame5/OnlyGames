// player.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as Input from './systems/input.js';

/* ================================
   INPUT & CAMERA STATE
=================================== */
const keys = {};
let isFirstPerson = true;
let mouseX = 0, mouseY = 0;
let isMouseLocked = false;

// ADDED: Re-usable raycaster for camera collision
const cameraRaycaster = new THREE.Raycaster();

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
    case 'room4-nexus-key':
      return '🔑';
    case 'room1-note':
      return '📝';
    case 'statue':
      return '🗽';
    case 'bowling-pin':
      return '♙'; // legacy id (room2 now uses bowling_pin)
    case 'bowling-ball':
      return '🎱'; // legacy id (room2 now uses bowling_ball)
    case 'book':
      return '📖';
    // New standardized ids for Room 2 puzzle
    case 'liberty':
      return '🗽';
    case 'bowling_pin':
      return '📍';
    case 'bowling_ball':
      return '🎳';
    case 'candle':
      return '🕯️';
    case 'glasses':
      return '👓';
    // AI-themed Room 2 items
    case 'robot_eye':
      return '👁️';
    case 'circuit_board':
      return '🪟';
    case 'robot_hand':
      return '✋';
    case 'ai_book':
      return '📖';
    case 'key_card':
      return '💳';
    default:
      return '📦';
  }
}

// Simple procedural "matrix" texture for fallback when a GLB has no embedded texture
function createMatrixCanvasTexture() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // columns of digits
    const cols = 24; const rows = 24;
    ctx.font = 'bold 12px monospace';
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const ch = Math.random() < 0.5 ? '0' : '1';
        const x = (c + 0.5) * (canvas.width / cols);
        const y = (r + 0.5) * (canvas.height / rows);
        const a = 0.4 + Math.random() * 0.6;
        ctx.fillStyle = `rgba(0,255,140,${a.toFixed(2)})`;
        ctx.fillText(ch, x, y);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    tex.needsUpdate = true;
    return tex;
  } catch (e) {
    return null;
  }
}

function showCrosshair() {
  const crosshair = document.getElementById('crosshair');
  if (crosshair) {
    const settings = Input.getSettings();
    crosshair.style.display = settings.crosshair ? 'block' : 'none';
  }
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
              child.material.emissiveIntensity = 0.5; // Increased intensity for visibility
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
    
    case 'room4-nexus-key':
      // Copy exact implementation from stage0-key, just change color to green
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
            
            // Enhance the material if it's a standard material (green for Room 4)
            if (child.material) {
              child.material.emissive = new THREE.Color(0x00ff88);
              child.material.emissiveIntensity = 0.5; // Same intensity as stage0-key
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
            color: 0x88ff88,
            emissive: 0x00ff88,
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
            color: 0x88ff88,
            emissive: 0x00ff88,
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
              color: 0x88ff88,
              emissive: 0x00ff88,
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
    
    case 'key_card':
      // Use loaded GLB for held card; fallback to simple geometry
      if (window.globalModelRegistry && window.globalModelRegistry['key_card']) {
        // If someone exposed registry globally
        try {
          const clone = window.globalModelRegistry['key_card'].clone();
          mesh = clone;
        } catch {}
      }
      if (!mesh && typeof global !== 'undefined') {
        // no-op for SSR
      }
      if (!mesh && typeof globalModelRegistry !== 'undefined' && globalModelRegistry['key_card']) {
        mesh = globalModelRegistry['key_card'].clone();
      }
      if (mesh) {
        try {
          const box = new THREE.Box3().setFromObject(mesh);
          const size = new THREE.Vector3();
          box.getSize(size);
          const currentMax = Math.max(size.x, size.y, size.z) || 1;
          const targetMax = 0.18;
          const s = targetMax / currentMax;
          mesh.scale.multiplyScalar(s);
        } catch {}
        mesh.rotation.x = -Math.PI / 6;
        mesh.rotation.y = Math.PI / 12;
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              // Show artwork on both sides if the card is a single plane
              child.material.side = THREE.DoubleSide;
              // If the model has no diffuse map, apply a small matrix-like fallback
              if (!child.material.map) {
                const mt = createMatrixCanvasTexture();
                if (mt) {
                  child.material.map = mt;
                  // Make sure the base color doesn't tint too much
                  child.material.color = new THREE.Color(0xffffff);
                }
              }
              child.material.needsUpdate = true;
            }
          }
        });
      } else {
        const card = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.005, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x113355, metalness: 0.2, roughness: 0.8 })
        );
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.002, 0.02),
          new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7, roughness: 0.3 })
        );
        stripe.position.set(0, 0.004, 0.02);
        card.add(body, stripe);
        card.rotation.x = -Math.PI / 6;
        card.rotation.y = Math.PI / 12;
        mesh = card;
      }
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

// MODIFIED: Removed exitPointerLock() for third-person
export function toggleViewMode() {
  isFirstPerson = !isFirstPerson;

  // REMOVED: The code that exited pointer lock when switching to third-person.
  // We now allow pointer lock in both modes.

  // Update crosshair visibility
  if (isFirstPerson && isMouseLocked) {
    showCrosshair();
  } else {
    hideCrosshair();
  }

  console.log(`Switched to ${isFirstPerson ? 'First-Person' : 'Third-Person'} view`);
  return isFirstPerson;
}

// Toggle look mode (pointer lock) with J key
export function toggleLookMode() {
  if (!isFirstPerson) {
    console.log('Cannot toggle look mode in third-person view');
    return;
  }

  // Check if UI is visible
  const isUIVisible = window.isUIVisible || (window.cursorManager && window.cursorManager.isUIVisible);
  const isMenuOpen = window.cursorManager && window.cursorManager.isMenuOpen;
  
  if (isUIVisible || isMenuOpen) {
    console.log('Cannot toggle look mode when UI is visible');
    return;
  }

  if (isMouseLocked) {
    // Exit look mode
    if (window.cursorManager) {
      window.cursorManager.setLookModeActive(false);
    }
    document.exitPointerLock();
    console.log('Exited look mode - cursor visible');
  } else {
    // Enter look mode
    if (window.cursorManager) {
      window.cursorManager.setLookModeActive(true);
    }
    document.body.requestPointerLock();
    console.log('Entered look mode - cursor hidden');
  }
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
  const base = await loader.loadAsync('./models/leonard.glb');

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
  try { idleClip = await loadAnimationClip('./models/idle.glb'); }
    catch (e) { console.warn('No idle.glb found:', e.message); }
  }
  if (!walkClip) {
  try { walkClip = await loadAnimationClip('./models/walking.glb'); }
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

  // MODIFIED: Mouse movement (first-person and third-person look)
  window.addEventListener('mousemove', (e) => {
    // UPDATED: Removed the '&& isFirstPerson' check to allow mouse-look in 3rd person
    if (isMouseLocked) {
      const sensitivity = Input.getSettings().sensitivity;
      mouseX -= e.movementX * 0.002 * sensitivity;
      mouseY -= e.movementY * 0.002 * sensitivity;
      
      // Clamp pitch (vertical look)
      mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseY));
    }
  });

  // Click to lock pointer in first-person
  window.addEventListener('click', () => {
    // Only lock the controls if no UI is currently visible
    // Check both the old isUIVisible flag and the new cursor manager
    const isUIVisible = window.isUIVisible || (window.cursorManager && window.cursorManager.isUIVisible);
    const isMenuOpen = window.cursorManager && window.cursorManager.isMenuOpen;
    
    // MODIFIED: Allow pointer lock in third person as well
    if (!isMouseLocked && !isUIVisible && !isMenuOpen) {
      document.body.requestPointerLock();
    }
  });

  // Pointer lock change
  document.addEventListener('pointerlockchange', () => {
    isMouseLocked = document.pointerLockElement === document.body;
    
    // Update cursor manager when pointer lock changes
    if (window.cursorManager) {
      window.cursorManager.setLookModeActive(isMouseLocked);
    }
    
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
// MODIFIED: Third-person logic completely replaced
export function updatePlayer(player, camera, deltaTime = 0.016) {
  const speed = 0.04; // Movement speed
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
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)); // Get right vector

    if (Input.isDown('moveForward')) { activePlayer.position.add(direction.clone().multiplyScalar(speed)); isMoving = true; }
    if (Input.isDown('moveBack')) { activePlayer.position.add(direction.clone().multiplyScalar(-speed)); isMoving = true; }
    if (Input.isDown('moveLeft')) { activePlayer.position.add(right.clone().multiplyScalar(-speed)); isMoving = true; }
    if (Input.isDown('moveRight')) { activePlayer.position.add(right.clone().multiplyScalar(speed)); isMoving = true; }
  
  } else {
    // ==========================================================
    // NEW: Third-person Fortnite-style camera-relative movement
    // ==========================================================
    
    // 1. Get camera's forward and right vectors, ignoring pitch
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize(); // right = forward x up

    // 2. Build movement direction based on camera
    const moveDirection = new THREE.Vector3(0, 0, 0);

    if (Input.isDown('moveForward')) { moveDirection.add(forward); }
    if (Input.isDown('moveBack')) { moveDirection.sub(forward); }
    if (Input.isDown('moveLeft')) { moveDirection.sub(right); }
    if (Input.isDown('moveRight')) { moveDirection.add(right); }
    
    isMoving = moveDirection.lengthSq() > 0;

    if (isMoving) {
      moveDirection.normalize();
      
      // 3. Apply movement
      activePlayer.position.add(moveDirection.clone().multiplyScalar(speed));

      // 4. Smoothly rotate Leonard to face the movement direction
      if (leonardModel) {
        // Calculate the angle to face
        const angle = Math.atan2(moveDirection.x, moveDirection.z);
        
        // Use a Quaternion to smoothly rotate
        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        
        // Slerp (spherical linear interpolation) for smooth rotation
        // Adjust the 10.0 to make rotation faster or slower
        leonardModel.quaternion.slerp(targetQuaternion, deltaTime * 10.0);
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

// MODIFIED: Replaced with OTS camera + Collision
export function attachCameraThirdPerson(camera, player, scene) {
  const activePlayer = leonardModel || player;
  
  // 1. Define Camera Target and Ideal Offset
  const targetPosition = new THREE.Vector3();
  targetPosition.copy(activePlayer.position).y += 1.7; // Target height (player's head)

  // --- Tweak these values to change the camera feel ---
  const horizontalOffset = 1.5; // How far to the right
  const verticalOffset = 1.0;   // How far above the target
  const distance = 4.0;         // How far behind the player
  // ----------------------------------------------------
  
  const offset = new THREE.Vector3(horizontalOffset, verticalOffset, distance);
  const idealDistance = offset.length(); // Get the total ideal distance

  // 2. Calculate Ideal Camera Position (based on mouse look)
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  euler.x = mouseY; // Pitch
  euler.y = mouseX; // Yaw
  const quaternion = new THREE.Quaternion().setFromEuler(euler);
  
  offset.applyQuaternion(quaternion);

  const idealCameraPosition = new THREE.Vector3().copy(targetPosition).add(offset);

  // 3. Camera Collision Logic
  
  // Get direction from player *to* the ideal camera position
  const rayDirection = new THREE.Vector3().subVectors(idealCameraPosition, targetPosition).normalize();
  
  // Set up the raycaster
  cameraRaycaster.set(targetPosition, rayDirection);
  cameraRaycaster.far = idealDistance; // Only check for hits *up to* the ideal distance

  // Build a list of objects to check against.
  // We MUST filter out the player, dropped items, etc.
  const collidableObjects = [];
  scene.children.forEach(child => {
    if (child !== leonardModel &&
        child.name !== 'player-box' &&
        child.name !== 'droppedItems' &&
        child.name !== 'firstPersonItem' &&
        child.type !== 'AmbientLight' &&
        child.type !== 'DirectionalLight' &&
        child.type !== 'HemisphereLight' &&
        child.type !== 'GridHelper' &&
        child.isLight) // Filter out any other lights
    {
      collidableObjects.push(child);
    }
  });

  // Perform the raycast
  const intersects = cameraRaycaster.intersectObjects(collidableObjects, true); // 'true' checks all descendants

  let finalCameraPosition = idealCameraPosition;
  
  if (intersects.length > 0) {
    // We hit a wall!
    // Move the camera to the hit point, minus a small padding
    const padding = 0.3;
    const hitDistance = intersects[0].distance;
    finalCameraPosition = targetPosition.clone().add(rayDirection.multiplyScalar(hitDistance - padding));
  }

  // 4. Set Camera Position and LookAt
  camera.position.copy(finalCameraPosition);
  camera.lookAt(targetPosition);

  // 5. Show/Hide Models
  if (leonardModel) {
    leonardModel.visible = true;
  }
  
  if (firstPersonItemGroup) {
    firstPersonItemGroup.visible = false;
  }
}

// MODIFIED: Now passes 'scene' to third-person function
export function attachCamera(camera, player, scene) {
  if (isFirstPerson) attachCameraFirstPerson(camera, player);
  else attachCameraThirdPerson(camera, player, scene);
}

/* ================================
   DROPPED ITEMS SYSTEM
   (No changes below this line)
=================================== */
let droppedItems = []; // Array to track dropped items in the world
let droppedItemsGroup = null; // THREE.Group to hold all dropped item meshes

// Global model registry for all pickable items
let globalModelRegistry = {
  'stage0-key': null,
  'key_card': null,
  'book': null,
  'liberty': null,
  'bowling_ball': null,
  'bowling_pin': null,
  'candle': null,
  'glasses': null,
  'robot_eye': null,
  'circuit_board': null,
  'robot_hand': null,
  'ai_book': null
};

// Function to register models globally
export function registerGlobalModel(itemName, model) {
  if (globalModelRegistry.hasOwnProperty(itemName)) {
    globalModelRegistry[itemName] = model;
    console.log(`Registered global model for ${itemName}`);
  } else {
    console.log(`Warning: ${itemName} is not in the global model registry`);
  }
}

// Legacy function for backward compatibility
export function registerOriginalModel(itemName, model) {
  registerGlobalModel(itemName, model);
}

// Global model loader - loads all pickable item models at game startup
export async function loadGlobalPickableModels() {
  console.log('Loading global pickable models...');
  
  // Use the imported GLTFLoader (examples/jsm), not THREE.GLTFLoader
  const loader = new GLTFLoader();
  const modelPromises = [];
  
  // Load all pickable item models with timeout
  const modelPaths = {
  'stage0-key': './models/key.glb',
  'key_card': './models/card.glb',
  'book': './models/book.glb',
  'liberty': './models/statue_of_liberty.glb',
  'bowling_ball': './models/bowling_ball.glb',
  'bowling_pin': './models/bowling_pin.glb',
  'candle': './models/candle.glb',
  'glasses': './models/glasses.glb'
  };
  
  for (const [itemName, path] of Object.entries(modelPaths)) {
    const promise = new Promise((resolve) => {
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.warn(`Timeout loading global model for ${itemName}`);
        resolve();
      }, 5000); // 5 second timeout
      
      loader.load(path, (gltf) => {
        clearTimeout(timeout);
        globalModelRegistry[itemName] = gltf.scene;
        console.log(`Loaded global model for ${itemName}`);
        resolve();
      }, undefined, (error) => {
        clearTimeout(timeout);
        console.warn(`Failed to load global model for ${itemName}:`, error);
        resolve(); // Continue even if one model fails
      });
    });
    modelPromises.push(promise);
  }
  
  // Use Promise.allSettled to ensure we don't fail if some models don't load
  const results = await Promise.allSettled(modelPromises);
  const loadedModels = Object.keys(globalModelRegistry).filter(key => globalModelRegistry[key] !== null);
  console.log('Global pickable models loaded:', loadedModels);
  console.log('Model loading results:', results.map((result, index) => ({ 
    model: Object.keys(modelPaths)[index], 
    status: result.status 
  })));
}

// Initialize dropped items group
function initDroppedItemsGroup() {
  if (!droppedItemsGroup) {
    droppedItemsGroup = new THREE.Group();
    droppedItemsGroup.name = 'droppedItems';
  }
  
  // Always ensure the group is in the scene
  if (window.scene && !window.scene.children.includes(droppedItemsGroup)) {
    window.scene.add(droppedItemsGroup);
    console.log('Dropped items group added to scene');
  }
  
  return droppedItemsGroup;
}

// Ensure dropped items group is always in the scene (call this during room transitions)
export function ensureDroppedItemsInScene() {
  if (droppedItemsGroup && window.scene) {
    if (!window.scene.children.includes(droppedItemsGroup)) {
      window.scene.add(droppedItemsGroup);
      console.log('Re-attached dropped items group to scene');
    }
    
    // Debug: Log dropped items status (only once per second to avoid spam)
    if (droppedItems.length > 0 && Math.random() < 0.01) { // 1% chance per frame
      console.log(`Dropped items status: ${droppedItems.length} items in group, ${droppedItemsGroup.children.length} children in scene`);
      console.log('Scene children count:', window.scene.children.length);
      console.log('Dropped items group in scene:', window.scene.children.includes(droppedItemsGroup));
    }
  }
}

// Drop item from inventory
function dropSelectedItem(player) {
  const selectedItem = playerInventory.getSelectedItem();
  if (!selectedItem) {
    AI.say("I don't have anything selected to drop.");
    return false;
  }

  // Remove from inventory
  if (playerInventory.removeItem(selectedItem.name)) {
    // Create dropped item in world
    const droppedItem = createDroppedItemMesh(selectedItem, player);
    if (droppedItem) {
      // Add to tracking arrays
      droppedItems.push({
        item: selectedItem,
        mesh: droppedItem,
        position: droppedItem.position.clone()
      });
      
      // Add to scene
      const group = initDroppedItemsGroup();
      group.add(droppedItem);
      
      console.log(`Dropped ${selectedItem.name} at position:`, droppedItem.position);
      console.log('Dropped items group children count:', group.children.length);
      console.log('Dropped item mesh details:', {
        visible: droppedItem.visible,
        position: droppedItem.position,
        userData: droppedItem.userData,
        parent: droppedItem.parent ? droppedItem.parent.name : 'none'
      });
      AI.say(`Dropped ${selectedItem.description || selectedItem.name}.`);
      updateInventoryUI();
      return true;
    }
  }
  return false;
}

// Create 3D mesh for dropped item
function createDroppedItemMesh(item, player) {
  console.log('createDroppedItemMesh called for:', item.name);
  let mesh = null;
  
  // Get the player's forward direction
  const forward = new THREE.Vector3(0, 0, -1);
  if (window.camera) {
    forward.applyQuaternion(window.camera.quaternion);
  }
  
  // Position item 1.5 units in front of player
  const dropPosition = player.position.clone().add(forward.multiplyScalar(1.5));
  dropPosition.y = 0.1; // Place slightly above floor level
  
  switch (item.name) {
    case 'stage0-key':
      // Try to get the original key model from our global registry
      console.log('Creating dropped key, global model available:', !!globalModelRegistry['stage0-key']);
      if (globalModelRegistry['stage0-key']) {
        // Clone the original key model
        mesh = globalModelRegistry['stage0-key'].clone();
        
        // Position the key
        mesh.position.copy(dropPosition);
        
        // Ensure it has proper materials and shadows
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Enhance the material if it's a standard material
            if (child.material) {
              child.material.emissive = new THREE.Color(0xffaa00);
              child.material.emissiveIntensity = 0.5; // Increased intensity for visibility
              child.material.metalness = 0.8;
              child.material.roughness = 0.2;
            }
          }
        });
        
        mesh.userData.itemName = item.name;
        mesh.userData.itemDescription = item.description;
        mesh.userData.isDroppedItem = true;
      } else {
        // Fallback to simple key if original model not available
        console.log('Using fallback key model - original model not available');
        const keyGroup = new THREE.Group();
        
        // Key blade
        const keyBlade = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.8, 0.4),
          new THREE.MeshStandardMaterial({ 
            color: 0xffff00,
            metalness: 0.8,
            roughness: 0.2
          })
        );
        keyBlade.position.set(0, 0.2, 0);
        keyGroup.add(keyBlade);
        
        // Key handle
        const keyHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0xffff00,
            metalness: 0.8,
            roughness: 0.2
          })
        );
        keyHandle.position.set(0, -0.2, 0);
        keyGroup.add(keyHandle);
        
        keyGroup.position.copy(dropPosition);
        keyGroup.userData.itemName = item.name;
        keyGroup.userData.itemDescription = item.description;
        keyGroup.userData.isDroppedItem = true;
        
        // Add subtle glow effect
        keyGroup.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        mesh = keyGroup;
      }
      break;

    case 'key_card': {
      // Prefer the GLB model if available
      if (globalModelRegistry['key_card']) {
        const cardModel = globalModelRegistry['key_card'].clone();
        
        // Scale the card to match inventory size (same as when held)
        try {
          const box = new THREE.Box3().setFromObject(cardModel);
          const size = new THREE.Vector3();
          box.getSize(size);
          const currentMax = Math.max(size.x, size.y, size.z) || 1;
          const targetMax = 0.18;
          const s = targetMax / currentMax;
          cardModel.scale.multiplyScalar(s);
        } catch {}
        
        cardModel.position.copy(dropPosition);
        // Lay it flat on the floor
        cardModel.rotation.x = -Math.PI / 2;
        cardModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.side = THREE.DoubleSide;
              if (!child.material.map) {
                const mt = createMatrixCanvasTexture();
                if (mt) {
                  child.material.map = mt;
                  child.material.color = new THREE.Color(0xffffff);
                }
              }
              child.material.needsUpdate = true;
            }
          }
        });
        cardModel.userData.isDroppedItem = true;
        cardModel.userData.itemName = item.name;
        cardModel.userData.itemDescription = item.description || item.name;
        mesh = cardModel;
      } else {
        // Fallback rectangular card with stripe
        const cardGroup = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.86, 0.02, 0.54),
          new THREE.MeshStandardMaterial({ color: 0x113355, metalness: 0.2, roughness: 0.8 })
        );
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(0.86, 0.005, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7, roughness: 0.3 })
        );
        stripe.position.set(0, 0.012, 0.15);
        // tiny LED dot
        const led = new THREE.Mesh(
          new THREE.SphereGeometry(0.015, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00aaff, emissiveIntensity: 0.6 })
        );
        led.position.set(0.3, 0.015, -0.1);
        cardGroup.add(body, stripe, led);
        cardGroup.position.copy(dropPosition);
        cardGroup.rotation.x = -Math.PI / 2; // lay flat on floor
        cardGroup.userData.isDroppedItem = true;
        cardGroup.userData.itemName = item.name;
        cardGroup.userData.itemDescription = item.description || item.name;
        mesh = cardGroup;
      }
      break;
    }
      
    case 'room4-nexus-key':
      // Try to get the original key model from global registry (same as Hub)
      if (globalModelRegistry['stage0-key']) {
        // Clone the original key model from global registry
        mesh = globalModelRegistry['stage0-key'].clone();
        
        // Position the key
        mesh.position.copy(dropPosition);
        
        // Ensure it has proper materials and shadows
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Keep the green glow for nexus key
            if (child.material) {
              child.material.emissive = new THREE.Color(0x00ff88);
              child.material.emissiveIntensity = 0.8;
              child.material.metalness = 0.9;
              child.material.roughness = 0.1;
            }
          }
        });
        
        mesh.userData.itemName = item.name;
        mesh.userData.itemDescription = item.description;
        mesh.userData.isDroppedItem = true;
      } else {
        // Fallback to simple key if floating key not available
        const keyGroup = new THREE.Group();
        
        // Key blade
        const keyBlade = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.8, 0.4),
          new THREE.MeshStandardMaterial({ 
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 0.8,
            metalness: 0.9,
            roughness: 0.1
          })
        );
        keyBlade.position.set(0, 0.2, 0);
        keyGroup.add(keyBlade);
        
        // Key handle
        const keyHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 0.8,
            metalness: 0.9,
            roughness: 0.1
          })
        );
        keyHandle.position.set(0, -0.2, 0);
        keyGroup.add(keyHandle);
        
        keyGroup.position.copy(dropPosition);
        keyGroup.userData.itemName = item.name;
        keyGroup.userData.itemDescription = item.description;
        keyGroup.userData.isDroppedItem = true;
        
        // Add subtle glow effect
        keyGroup.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        mesh = keyGroup;
      }
      break;
      
    case 'book':
      // Try to get the original book model from our global registry
      if (globalModelRegistry['book']) {
        // Clone the original book model
        mesh = globalModelRegistry['book'].clone();
        
        // Position the book
        mesh.position.copy(dropPosition);
        
        // Ensure it has proper materials and shadows
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        mesh.userData.itemName = item.name;
        mesh.userData.itemDescription = item.description;
        mesh.userData.isDroppedItem = true;
      } else {
        // Fallback to simple book if original model not available
        const bookGroup = new THREE.Group();
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.3, 0.05),
          new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            metalness: 0.1,
            roughness: 0.8
          })
        );
        book.castShadow = true;
        book.receiveShadow = true;
        bookGroup.add(book);
        
        bookGroup.position.copy(dropPosition);
        bookGroup.userData.itemName = item.name;
        bookGroup.userData.itemDescription = item.description;
        bookGroup.userData.isDroppedItem = true;
        
        mesh = bookGroup;
      }
      break;
      
    case 'liberty':
      // Try to get the original liberty model from our stored models
      if (globalModelRegistry['liberty']) {
        // Clone the original liberty model
        mesh = globalModelRegistry['liberty'].clone();
        
        // Position the liberty statue
        mesh.position.copy(dropPosition);
        
        // Ensure it has proper materials and shadows
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        mesh.userData.itemName = item.name;
        mesh.userData.itemDescription = item.description;
        mesh.userData.isDroppedItem = true;
      } else {
        // Fallback to simple liberty if original model not available
        const libertyGroup = new THREE.Group();
        const liberty = new THREE.Mesh(
          new THREE.ConeGeometry(0.2, 0.4, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            metalness: 0.3,
            roughness: 0.7
          })
        );
        liberty.castShadow = true;
        liberty.receiveShadow = true;
        libertyGroup.add(liberty);
        
        libertyGroup.position.copy(dropPosition);
        libertyGroup.userData.itemName = item.name;
        libertyGroup.userData.itemDescription = item.description;
        libertyGroup.userData.isDroppedItem = true;
        
        mesh = libertyGroup;
      }
      break;
      
    case 'bowling_ball':
      // Try to get the original bowling ball model from our stored models
      if (globalModelRegistry['bowling_ball']) {
        // Clone the original bowling ball model
        mesh = globalModelRegistry['bowling_ball'].clone();
        
        // Position the bowling ball
        mesh.position.copy(dropPosition);
        
        // Ensure it has proper materials and shadows
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        mesh.userData.itemName = item.name;
        mesh.userData.itemDescription = item.description;
        mesh.userData.isDroppedItem = true;
      } else {
        // Fallback to simple bowling ball if original model not available
        const ballGroup = new THREE.Group();
        const ball = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 16, 16),
          new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            metalness: 0.1,
            roughness: 0.3
          })
        );
        ball.castShadow = true;
        ball.receiveShadow = true;
        ballGroup.add(ball);
        
        ballGroup.position.copy(dropPosition);
        ballGroup.userData.itemName = item.name;
        ballGroup.userData.itemDescription = item.description;
        ballGroup.userData.isDroppedItem = true;
        
        mesh = ballGroup;
      }
      break;
      
    case 'bowling_pin':
      // Try to get the original bowling pin model from our stored models
      if (globalModelRegistry['bowling_pin']) {
        // Clone the original bowling pin model
        mesh = globalModelRegistry['bowling_pin'].clone();
        
        // Position the bowling pin
        mesh.position.copy(dropPosition);
        
        // Ensure it has proper materials and shadows
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        mesh.userData.itemName = item.name;
        mesh.userData.itemDescription = item.description;
        mesh.userData.isDroppedItem = true;
      } else {
        // Fallback to simple bowling pin if original model not available
        const pinGroup = new THREE.Group();
        const pin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.08, 0.3, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            metalness: 0.1,
            roughness: 0.4
          })
        );
        pin.castShadow = true;
        pin.receiveShadow = true;
        pinGroup.add(pin);
        
        pinGroup.position.copy(dropPosition);
        pinGroup.userData.itemName = item.name;
        pinGroup.userData.itemDescription = item.description;
        pinGroup.userData.isDroppedItem = true;
        
        mesh = pinGroup;
      }
      break;
      
    case 'candle':
      // Try to get the original candle model from our stored models
      if (globalModelRegistry['candle']) {
        // Clone the original candle model
        mesh = globalModelRegistry['candle'].clone();
        
        // Position the candle
        mesh.position.copy(dropPosition);
        
        // Ensure it has proper materials and shadows
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        mesh.userData.itemName = item.name;
        mesh.userData.itemDescription = item.description;
        mesh.userData.isDroppedItem = true;
      } else {
        // Fallback to simple candle if original model not available
        const candleGroup = new THREE.Group();
        const candle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            metalness: 0.1,
            roughness: 0.8
          })
        );
        candle.castShadow = true;
        candle.receiveShadow = true;
        candleGroup.add(candle);
        
        candleGroup.position.copy(dropPosition);
        candleGroup.userData.itemName = item.name;
        candleGroup.userData.itemDescription = item.description;
        candleGroup.userData.isDroppedItem = true;
        
        mesh = candleGroup;
      }
      break;
      
    case 'glasses':
      // Try to get the original glasses model from our stored models
      if (globalModelRegistry['glasses']) {
        // Clone the original glasses model
        mesh = globalModelRegistry['glasses'].clone();
        
        // Position the glasses
        mesh.position.copy(dropPosition);
        
        // Ensure it has proper materials and shadows
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        mesh.userData.itemName = item.name;
        mesh.userData.itemDescription = item.description;
        mesh.userData.isDroppedItem = true;
      } else {
        // Fallback to simple glasses if original model not available
        const glassesGroup = new THREE.Group();
        const glasses = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.1, 0.05),
          new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            metalness: 0.8,
            roughness: 0.2
          })
        );
        glasses.castShadow = true;
        glasses.receiveShadow = true;
        glassesGroup.add(glasses);
        
        glassesGroup.position.copy(dropPosition);
        glassesGroup.userData.itemName = item.name;
        glassesGroup.userData.itemDescription = item.description;
        glassesGroup.userData.isDroppedItem = true;
        
        mesh = glassesGroup;
      }
      break;
      
    case 'robot_eye':
      // Try to get the original robot eye model from our stored models
      if (globalModelRegistry['robot_eye']) {
        mesh = globalModelRegistry['robot_eye'].clone();
        mesh.position.copy(dropPosition);
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material = child.material.clone();
            }
          }
        });
        mesh.userData.itemName = item.name;
        mesh.userData.itemDescription = item.description;
        mesh.userData.isDroppedItem = true;
      } else {
        // Fallback to simple robot eye
        const eyeGroup = new THREE.Group();
        const eyeBall = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 16, 16),
          new THREE.MeshStandardMaterial({ 
            color: 0x00ffff, 
            emissive: 0x00ccff, 
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
          })
        );
        eyeBall.castShadow = true;
        eyeBall.receiveShadow = true;
        eyeGroup.add(eyeBall);
        eyeGroup.position.copy(dropPosition);
        eyeGroup.userData.itemName = item.name;
        eyeGroup.userData.itemDescription = item.description;
        eyeGroup.userData.isDroppedItem = true;
        mesh = eyeGroup;
      }
      break;
      
    case 'circuit_board':
      // Try to get the original circuit board model from our stored models
      if (globalModelRegistry['circuit_board']) {
        mesh = globalModelRegistry['circuit_board'].clone();
        mesh.position.copy(dropPosition);
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material = child.material.clone();
            }
          }
        });
        mesh.userData.itemName = item.name;
        mesh.userData.itemDescription = item.description;
        mesh.userData.isDroppedItem = true;
      } else {
        // Fallback to simple circuit board
        const boardGroup = new THREE.Group();
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.02, 0.3),
          new THREE.MeshStandardMaterial({ 
            color: 0x00aa00, 
            metalness: 0.3,
            roughness: 0.6
          })
        );
        board.castShadow = true;
        board.receiveShadow = true;
        boardGroup.add(board);
        boardGroup.position.copy(dropPosition);
        boardGroup.userData.itemName = item.name;
        boardGroup.userData.itemDescription = item.description;
        boardGroup.userData.isDroppedItem = true;
        mesh = boardGroup;
      }
      break;
      
    case 'robot_hand':
      // Try to get the original robot hand model from our stored models
      if (globalModelRegistry['robot_hand']) {
        mesh = globalModelRegistry['robot_hand'].clone();
        mesh.position.copy(dropPosition);
        mesh.position.y = 0.3; // Raise it above the floor to prevent clipping
        
        // Orient the hand horizontally (lying flat)
        mesh.rotation.x = Math.PI / 2; // Rotate 90 degrees to make it horizontal
        
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material = child.material.clone();
            }
          }
        });
        mesh.userData.itemName = item.name;
        mesh.userData.itemDescription = item.description;
        mesh.userData.isDroppedItem = true;
      } else {
        // Fallback to simple robot hand
        const handGroup = new THREE.Group();
        const palm = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.05, 0.25),
          new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            metalness: 0.9,
            roughness: 0.3
          })
        );
        palm.castShadow = true;
        palm.receiveShadow = true;
        handGroup.add(palm);
        handGroup.position.copy(dropPosition);
        handGroup.userData.itemName = item.name;
        handGroup.userData.itemDescription = item.description;
        handGroup.userData.isDroppedItem = true;
        mesh = handGroup;
      }
      break;
      
    case 'ai_book':
      // Try to get the original AI book model from our stored models
      if (globalModelRegistry['ai_book']) {
        mesh = globalModelRegistry['ai_book'].clone();
        mesh.position.copy(dropPosition);
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material = child.material.clone();
            }
          }
        });
        mesh.userData.itemName = item.name;
        mesh.userData.itemDescription = item.description;
        mesh.userData.isDroppedItem = true;
      } else {
        // Fallback to simple AI book
        const bookGroup = new THREE.Group();
        const bookCover = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.35, 0.04),
          new THREE.MeshStandardMaterial({ 
            color: 0x1a1a3e, 
            metalness: 0.2,
            roughness: 0.7
          })
        );
        bookCover.castShadow = true;
        bookCover.receiveShadow = true;
        bookGroup.add(bookCover);
        bookGroup.position.copy(dropPosition);
        bookGroup.userData.itemName = item.name;
        bookGroup.userData.itemDescription = item.description;
        bookGroup.userData.isDroppedItem = true;
        mesh = bookGroup;
      }
      break;
      
    // Add cases for other item types as needed
    default:
      // Generic dropped item
      const genericGroup = new THREE.Group();
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.3),
        new THREE.MeshStandardMaterial({ 
          color: 0x888888,
          metalness: 0.3,
          roughness: 0.7
        })
      );
      box.castShadow = true;
      box.receiveShadow = true;
      genericGroup.add(box);
      
      genericGroup.position.copy(dropPosition);
      genericGroup.userData.itemName = item.name;
      genericGroup.userData.itemDescription = item.description;
      genericGroup.userData.isDroppedItem = true;
      
      mesh = genericGroup;
      break;
  }
  
  console.log('Created dropped item mesh:', mesh ? 'success' : 'failed');
  if (mesh) {
    console.log('Mesh position:', mesh.position);
    console.log('Mesh visible:', mesh.visible);
    console.log('Mesh userData:', mesh.userData);
    console.log('Player position when dropping:', player.position);
    console.log('Drop position calculated:', dropPosition);
  }
  
  return mesh;
}

// Check if player is looking at a dropped item
function getDroppedItemUnderCrosshair(camera) {
  if (!droppedItemsGroup || droppedItems.length === 0) {
    console.log('No dropped items to check');
    return null;
  }
  
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(0, 0); // Center of screen (crosshair)
  raycaster.setFromCamera(mouse, camera);
  
  const droppedMeshes = droppedItems.map(dropped => dropped.mesh);
  const intersects = raycaster.intersectObjects(droppedMeshes, true);
  
  console.log(`Raycasting dropped items: ${droppedMeshes.length} items, ${intersects.length} intersections`);
  
  // Only show detailed raycasting info occasionally to avoid spam
  if (Math.random() < 0.1) { // 10% chance
    console.log('Raycaster origin:', raycaster.ray.origin);
    console.log('Raycaster direction:', raycaster.ray.direction);
    console.log('Dropped meshes positions:', droppedMeshes.map(mesh => mesh.position));
  }
  
  if (intersects.length > 0) {
    // Find the root dropped item
    let hitObject = intersects[0].object;
    while (hitObject.parent && !hitObject.userData.isDroppedItem) {
      hitObject = hitObject.parent;
    }
    
    if (hitObject.userData.isDroppedItem) {
      console.log('Found dropped item:', hitObject.userData.itemName);
      return hitObject;
    }
  }
  
  return null;
}

// Pick up a dropped item
function pickupDroppedItem(droppedMesh) {
  if (!droppedMesh.userData.isDroppedItem) return false;
  
  const itemName = droppedMesh.userData.itemName;
  const itemDescription = droppedMesh.userData.itemDescription;
  
  // Try to add to inventory
  if (addToInventory({ name: itemName, description: itemDescription })) {
    // Remove from dropped items tracking
    const index = droppedItems.findIndex(dropped => dropped.mesh === droppedMesh);
    if (index !== -1) {
      droppedItems.splice(index, 1);
    }
    
    // Remove from scene
    if (droppedMesh.parent) {
      droppedMesh.parent.remove(droppedMesh);
    }
    
    AI.showInteractionFeedback(`Picked up ${itemDescription || itemName}.`);
    updateInventoryUI();
    return true;
  } else {
    AI.showInteractionFeedback("My inventory is full.");
    return false;
  }
}

// Enhanced E-key interaction handler for dropped items
export function handleDroppedItemInteraction(camera) {
  if (window.disablePlayerControls) return false;
  
  const droppedItem = getDroppedItemUnderCrosshair(camera);
  if (droppedItem) {
    console.log('Dropped item detected under crosshair:', droppedItem.userData.itemName);
    return pickupDroppedItem(droppedItem);
  }
  
  return false;
}

// R key handler for dropping items
export function handleDropItem(player) {
  if (window.disablePlayerControls) return false;
  
  return dropSelectedItem(player);
}

// Clean up dropped items (call when changing rooms/scenes)
export function clearDroppedItems() {
  if (droppedItemsGroup) {
    droppedItems.forEach(dropped => {
      if (dropped.mesh.parent) {
        dropped.mesh.parent.remove(dropped.mesh);
      }
    });
    droppedItems = [];
  }
}

/* ================================
   INVENTORY EXPORTS
=================================== */
export function getPlayerInventory() { return playerInventory; }
export function addToInventory(item) { return playerInventory.addItem(item); }
export function hasInInventory(itemName) { return playerInventory.hasItem(itemName); }
export function removeFromInventory(itemName) { return playerInventory.removeItem(itemName); }

// Snapshot helper for external UIs (e.g., ScaleOfBalance)
export function getInventorySnapshot() {
  // return shallow copy of slots; normalize objects shape
  return playerInventory.slots.map((it) => it ? { ...it } : null);
}