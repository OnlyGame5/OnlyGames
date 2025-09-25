import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export function handleMouseClick(event, camera, rooms, renderer) {
  // If pointer is locked (first-person mode), use center of screen (crosshair position)
  if (document.pointerLockElement === document.body) {
    mouse.x = 0; // Center of screen
    mouse.y = 0; // Center of screen
  } else {
    // If pointer is not locked (third-person mode), use actual mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  raycaster.setFromCamera(mouse, camera);

  // Check for room1 wire panel clicks first
  if (rooms.room1 && rooms.room1.onRoom1Click) {
    const intersects = raycaster.intersectObject(rooms.room1.group, true);
    if (intersects.length > 0) {
      // Compute NDC and world ray for wire panel
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = { 
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1, 
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1 
      };
      const worldRay = raycaster.ray.clone();
      
      const consumed = rooms.room1.onRoom1Click(intersects[0], { 
        ndc, 
        worldRay, 
        camera, 
        player: window.leonardModel || window.player 
      });
      if (consumed) return; // Stop if panel handled the click
    }
  }

  // Handle other room interactions
  if (Array.isArray(rooms)) {
    rooms.forEach(room => {
      if (room && room.userData && room.userData.keypadButtons) {
        const intersects = raycaster.intersectObjects(room.userData.keypadButtons);
        if (intersects.length > 0) {
          room.userData.pressButton(intersects[0].object);
        }
      }
    });
  }
}

// Stage 0: Helper function to get player AABB
export function getPlayerAABB(playerObject) {
  return new THREE.Box3().setFromObject(playerObject);
}

// Stage 0: Enhanced raycast function for interactable objects
export function raycastInteractables(pointer, camera, scene) {
  raycaster.setFromCamera(pointer, camera);
  
  // Get all objects with userData.type === 'interactable'
  const interactableObjects = [];
  scene.traverse((child) => {
    if (child.userData && child.userData.type === 'interactable') {
      interactableObjects.push(child);
    }
  });
  
  const intersects = raycaster.intersectObjects(interactableObjects);
  return intersects.length > 0 ? intersects[0].object : null;
}

// Stage 0: Enhanced mouse click handler for Stage 0 interactions
export function handleStage0Click(event, camera, scene, room0) {
  // If pointer is locked (first-person mode), use center of screen (crosshair position)
  if (document.pointerLockElement === document.body) {
    mouse.x = 0; // Center of screen
    mouse.y = 0; // Center of screen
  } else {
    // If pointer is not locked (third-person mode), use actual mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  const hitObject = raycastInteractables(mouse, camera, scene);
  if (hitObject && room0 && room0.handleInteraction) {
    return room0.handleInteraction(hitObject);
  }
  
  return false;
}