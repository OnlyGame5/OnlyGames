import * as THREE from 'three';

const keys = {};
let isFirstPerson = false;
let mouseX = 0, mouseY = 0;
let isMouseLocked = false;

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

// Camera view modes
export const VIEW_MODES = {
  FIRST_PERSON: 'firstPerson',
  THIRD_PERSON: 'thirdPerson'
};

export function setupPlayer(scene) {
  const player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1.8, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
  );
  player.position.set(0, 0.9, 0);
  player.castShadow = true;
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
  });

  // Initialize inventory UI
  updateInventoryUI();

  return player;
}

export function updatePlayer(player, camera) {
  const speed = 0.15;
  
  if (isFirstPerson) {
    // First-person movement: move relative to camera direction
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0; // Keep movement on horizontal plane
    direction.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0));
    
    if (keys['KeyW']) {
      player.position.add(direction.clone().multiplyScalar(speed));
    }
    if (keys['KeyS']) {
      player.position.add(direction.clone().multiplyScalar(-speed));
    }
    if (keys['KeyA']) {
      player.position.add(right.clone().multiplyScalar(-speed));
    }
    if (keys['KeyD']) {
      player.position.add(right.clone().multiplyScalar(speed));
    }
  } else {
    // Third-person movement: move in world coordinates
    if (keys['KeyW']) player.position.z -= speed;
    if (keys['KeyS']) player.position.z += speed;
    if (keys['KeyA']) player.position.x -= speed;
    if (keys['KeyD']) player.position.x += speed;
  }
}

// First-person camera positioning and rotation
export function attachCameraFirstPerson(camera, player) {
  // Position camera at player's head level
  camera.position.set(
    player.position.x, 
    player.position.y + 1.6, // Head height
    player.position.z
  );
  
  // Apply mouse look rotation
  camera.rotation.order = 'YXZ';
  camera.rotation.y = mouseX;
  camera.rotation.x = mouseY;
}

// Third-person camera positioning (original chase camera)
export function attachCameraThirdPerson(camera, player) {
  camera.position.set(player.position.x, player.position.y+5, player.position.z+10);
  camera.lookAt(player.position);
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
