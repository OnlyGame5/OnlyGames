import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addToInventory, hasInInventory, removeFromInventory } from './player.js';

// Stage 0: Lobby/Entry Room
export function createRoom0() {
  const group = new THREE.Group();
  group.name = 'stage0-room';

  // Stage 0: Room geometry - much bigger floor (20x15)
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.2, 15),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  floor.position.set(0, -0.1, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // Stage 0: Four walls with collision detection
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const wallHeight = 4;
  const wallThickness = 0.5;
  const roomWidth = 10;  // Half width (total 20)
  const roomDepth = 7.5; // Half depth (total 15)

  // Back wall (with door opening)
  const backWallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(8, wallHeight, wallThickness),
    wallMaterial
  );
  backWallLeft.position.set(-6, wallHeight/2, -roomDepth);
  backWallLeft.castShadow = true;
  backWallLeft.userData = { type: 'wall', side: 'back-left' };
  group.add(backWallLeft);

  const backWallRight = new THREE.Mesh(
    new THREE.BoxGeometry(8, wallHeight, wallThickness),
    wallMaterial
  );
  backWallRight.position.set(6, wallHeight/2, -roomDepth);
  backWallRight.castShadow = true;
  backWallRight.userData = { type: 'wall', side: 'back-right' };
  group.add(backWallRight);

  // Left wall
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, 15),
    wallMaterial
  );
  leftWall.position.set(-roomWidth, wallHeight/2, 0);
  leftWall.castShadow = true;
  leftWall.userData = { type: 'wall', side: 'left' };
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, 15),
    wallMaterial
  );
  rightWall.position.set(roomWidth, wallHeight/2, 0);
  rightWall.castShadow = true;
  rightWall.userData = { type: 'wall', side: 'right' };
  group.add(rightWall);

  // Front wall (entrance)
  const frontWall = new THREE.Mesh(
    new THREE.BoxGeometry(20, wallHeight, wallThickness),
    wallMaterial
  );
  frontWall.position.set(0, wallHeight/2, roomDepth);
  frontWall.castShadow = true;
  frontWall.userData = { type: 'wall', side: 'front' };
  group.add(frontWall);

  // Stage 0: Roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.3, 15),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
  );
  roof.position.set(0, wallHeight + 0.15, 0);
  roof.receiveShadow = true;
  group.add(roof);

  // Stage 0: Ceiling light fixture
  const lightFixture = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16),
    new THREE.MeshStandardMaterial({ 
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.2
    })
  );
  lightFixture.position.set(0, wallHeight - 0.1, 0);
  lightFixture.castShadow = true;
  group.add(lightFixture);

  // Stage 0: Room-specific lighting (won't conflict with main scene lighting)
  const roomAmbientLight = new THREE.AmbientLight(0x404040, 0.3); // Soft ambient
  group.add(roomAmbientLight);

  // Stage 0: Ceiling light (positioned to not interfere with third-person camera)
  const ceilingLight = new THREE.PointLight(0xffffff, 0.8, 25);
  ceilingLight.position.set(0, wallHeight - 1, 0); // Below roof, above player
  ceilingLight.castShadow = true;
  ceilingLight.shadow.mapSize.width = 1024;
  ceilingLight.shadow.mapSize.height = 1024;
  ceilingLight.shadow.camera.near = 0.1;
  ceilingLight.shadow.camera.far = 25;
  group.add(ceilingLight);

  // Stage 0: Additional fill lights for better illumination
  const fillLight1 = new THREE.DirectionalLight(0x8888aa, 0.2);
  fillLight1.position.set(-5, 3, 5);
  fillLight1.target.position.set(0, 0, 0);
  group.add(fillLight1);
  group.add(fillLight1.target);

  const fillLight2 = new THREE.DirectionalLight(0xaa8888, 0.2);
  fillLight2.position.set(5, 3, -5);
  fillLight2.target.position.set(0, 0, 0);
  group.add(fillLight2);
  group.add(fillLight2.target);

  // Stage 0: Pedestal with key
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8),
    new THREE.MeshStandardMaterial({ 
      color: 0x666666,
      metalness: 0.3,
      roughness: 0.7
    })
  );
  pedestal.position.set(0, 0.4, -2);
  pedestal.castShadow = true;
  group.add(pedestal);

  // Stage 0: Custom Blender key model
  let key = null; // Will be set after loading
  const loader = new GLTFLoader();
  
  loader.load('/models/key.glb', (gltf) => {
    key = gltf.scene;
    
    // Position the key on the pedestal
    key.position.set(0, 0.9, -2);
    
    // Scale the key to make it much bigger
    key.scale.set(2.0, 2.0, 2.0);
    
    // Add interaction data
    key.userData = { type: 'interactable', id: 'stage0-key' };
    
    // Enable shadows
    key.traverse((child) => {
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
    
    // Add to the room group
    group.add(key);
    
    console.log('Custom key model loaded successfully!');
  }, (progress) => {
    console.log('Loading key model...', (progress.loaded / progress.total * 100) + '%');
  }, (error) => {
    console.error('Error loading key model:', error);
    
    // Fallback to simple key if loading fails
    const fallbackKey = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.1, 0.6),
      new THREE.MeshStandardMaterial({ 
        color: 0xffff00, 
        emissive: 0xffaa00,
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.2
      })
    );
    fallbackKey.position.set(0, 0.9, -2);
    fallbackKey.userData = { type: 'interactable', id: 'stage0-key' };
    fallbackKey.castShadow = true;
    group.add(fallbackKey);
    key = fallbackKey;
  });

  // Stage 0: Add some decorative elements
  const cornerPillar1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, wallHeight, 8),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
  );
  cornerPillar1.position.set(-8, wallHeight/2, -6);
  cornerPillar1.castShadow = true;
  group.add(cornerPillar1);

  const cornerPillar2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, wallHeight, 8),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
  );
  cornerPillar2.position.set(8, wallHeight/2, -6);
  cornerPillar2.castShadow = true;
  group.add(cornerPillar2);

  // Stage 0: Locked door (positioned in the doorway opening)
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3.5, 0.3),
    new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.3
    })
  );
  door.position.set(0, 1.75, -roomDepth + 0.15); // Positioned in doorway
  door.userData = { type: 'interactable', id: 'stage0-door' };
  door.castShadow = true;
  group.add(door);

  // Stage 0: Doorway trigger volume (Box3 for transition check)
  const doorwayBox = new THREE.Box3();
  doorwayBox.setFromCenterAndSize(
    new THREE.Vector3(0, 1, -roomDepth - 0.5), // Center position beyond door
    new THREE.Vector3(3, 2, 1)                  // Size
  );

  // Stage 0: Room state
  const state = {
    hasKey: false,
    doorOpen: false,
    doorAnim: {
      active: false,
      startY: door.position.y,
      targetY: door.position.y + 2.0,
      t: 0,
      dur: 0.8
    },
    hintTimer: null,
    hintShown: false
  };

  // Stage 0: Helper function to open door
  function openDoor(state, door) {
    if (!state.doorOpen && !state.doorAnim.active) {
      state.doorAnim.active = true;
      state.doorAnim.startY = door.position.y;
      state.doorAnim.targetY = door.position.y + 2.5; // Updated for bigger door
      state.doorAnim.t = 0;
    }
  }

  // Stage 0: Update function for animations and state
  function updateRoom0(dt, ctx) {
    const { playerObject, ai } = ctx;

    // Stage 0: Door animation
    if (state.doorAnim.active) {
      state.doorAnim.t += dt;
      const progress = Math.min(state.doorAnim.t / state.doorAnim.dur, 1);
      
      // Smooth easing function
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      door.position.y = THREE.MathUtils.lerp(
        state.doorAnim.startY, 
        state.doorAnim.targetY, 
        easedProgress
      );

      if (progress >= 1) {
        state.doorAnim.active = false;
        state.doorOpen = true;
        // AI says door is open
        if (ai) {
          ai.say("Perfect. Beyond this door… more challenges await. I'll guide you.");
        }
      }
    }

    // Stage 0: Hint timer (5 seconds after room load)
    if (!state.hintShown && !state.hasKey) {
      if (!state.hintTimer) {
        state.hintTimer = setTimeout(() => {
          if (!state.hasKey && ai) {
            ai.say("Do you see it? On the pedestal. Pick up the key… it's your way forward.");
            state.hintShown = true;
          }
        }, 5000);
      }
    }
  }

  // Stage 0: E key interaction handler
  function handleEKeyInteraction(playerObject) {
    // Check if player is near the key
    if (key && !state.hasKey) {
      const distance = playerObject.position.distanceTo(key.position);
      if (distance < 2.0) { // Within 2 units of the key
        // Add key to inventory
        const keyItem = {
          name: 'stage0-key',
          description: 'A mysterious key that might unlock something important',
          type: 'key'
        };
        
        if (addToInventory(keyItem)) {
          // Remove key from scene
          group.remove(key);
          state.hasKey = true;
          
          // AI says key picked up
          if (window.AI) {
            window.AI.say("Well done. You learn quickly. The key is now in your inventory. Now, unlock the door.");
          }
          return true;
        }
      }
    }
    
    // Check if player is near the door
    const doorDistance = playerObject.position.distanceTo(door.position);
    if (doorDistance < 3.0) { // Within 3 units of the door
      if (!hasInInventory('stage0-key')) {
        // Door is locked, no key
        if (window.AI) {
          window.AI.say("The door is locked. You need a key to open it.");
        }
        return false;
      } else if (!state.doorOpen && !state.doorAnim.active) {
        // Use key to open door
        removeFromInventory('stage0-key');
        openDoor(state, door);
        if (window.AI) {
          window.AI.say("You used the key to unlock the door. It slides open smoothly.");
        }
        return true;
      }
    }
    
    return false;
  }

  // Stage 0: Legacy interaction handler (for mouse clicks)
  function handleInteraction(hitObject) {
    if (hitObject.userData.id === 'stage0-key' && !state.hasKey) {
      // Remove key from scene (works for both loaded model and fallback)
      if (key) {
        group.remove(key);
      }
      state.hasKey = true;
      // AI says key picked up
      if (window.AI) {
        window.AI.say("Well done. You learn quickly. Now, unlock the door.");
      }
      return true;
    }
    
    if (hitObject.userData.id === 'stage0-door') {
      if (!state.hasKey) {
        // Door is locked, no interaction
        return false;
      } else if (state.hasKey && !state.doorOpen && !state.doorAnim.active) {
        openDoor(state, door);
        return true;
      }
    }
    
    return false;
  }

  // Stage 0: Check if player is in doorway trigger
  function checkDoorwayTrigger(playerObject) {
    const playerBox = new THREE.Box3().setFromObject(playerObject);
    return doorwayBox.intersectsBox(playerBox);
  }

  // Stage 0: Check wall collisions (prevent passing through walls)
  function checkWallCollisions(playerObject) {
    const playerPos = playerObject.position;
    const playerRadius = 0.5; // Player collision radius
    
    // Left wall collision
    if (playerPos.x - playerRadius < -roomWidth + wallThickness/2) {
      playerObject.position.x = -roomWidth + wallThickness/2 + playerRadius;
    }
    
    // Right wall collision
    if (playerPos.x + playerRadius > roomWidth - wallThickness/2) {
      playerObject.position.x = roomWidth - wallThickness/2 - playerRadius;
    }
    
    // Front wall collision
    if (playerPos.z + playerRadius > roomDepth - wallThickness/2) {
      playerObject.position.z = roomDepth - wallThickness/2 - playerRadius;
    }
    
    // Back wall collision (except doorway area)
    if (playerPos.z - playerRadius < -roomDepth + wallThickness/2) {
      // Check if player is in doorway area (between -1.5 and 1.5 on X axis)
      if (Math.abs(playerPos.x) > 1.5) {
        playerObject.position.z = -roomDepth + wallThickness/2 + playerRadius;
      }
    }
    
    // Hallway wall collisions
    checkHallwayCollisions(playerObject);
  }

  // Stage 0: Check hallway wall collisions
  function checkHallwayCollisions(playerObject) {
    const playerPos = playerObject.position;
    const playerRadius = 0.5;
    
    // Check if player is in hallway area (between -7.5 and -19 on Z axis, between -2 and 2 on X axis)
    if (playerPos.z < -7.5 && playerPos.z > -19 && Math.abs(playerPos.x) < 2.2) {
      // Left hallway wall collision
      if (playerPos.x - playerRadius < -2 + 0.1) {
        playerObject.position.x = -2 + 0.1 + playerRadius;
      }
      
      // Right hallway wall collision
      if (playerPos.x + playerRadius > 2 - 0.1) {
        playerObject.position.x = 2 - 0.1 - playerRadius;
      }
    }
  }

  // Stage 0: Check door collision (prevent passing through closed door)
  function checkDoorCollision(playerObject) {
    if (state.doorOpen) return false; // Door is open, no collision
    
    const playerPos = playerObject.position;
    const doorZ = -roomDepth + 0.15;
    const doorX = 0;
    const doorWidth = 1.5;
    
    // Check if player is trying to pass through door area
    if (playerPos.z < doorZ + 0.3 && Math.abs(playerPos.x - doorX) < doorWidth) {
      return true; // Collision detected
    }
    return false;
  }

  // Stage 0: Create hallway to room 1 (always visible)
  const hallway = new THREE.Group();
  hallway.name = 'hallway-to-room1';
  hallway.visible = true; // Always visible, door just controls access
  
  // Hallway floor
  const hallwayFloor = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.2, 11.5),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
  );
  hallwayFloor.position.set(0, -0.1, -13.25); // Position between room 0 and room 1
  hallwayFloor.receiveShadow = true;
  hallway.add(hallwayFloor);
  
  // Hallway walls
  const hallwayWallMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const hallwayWall1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 4, 11.5),
    hallwayWallMaterial
  );
  hallwayWall1.position.set(-2, 2, -13.25);
  hallwayWall1.castShadow = true;
  hallwayWall1.userData = { type: 'wall', side: 'hallway-left' };
  hallway.add(hallwayWall1);
  
  const hallwayWall2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 4, 11.5),
    hallwayWallMaterial
  );
  hallwayWall2.position.set(2, 2, -13.25);
  hallwayWall2.castShadow = true;
  hallwayWall2.userData = { type: 'wall', side: 'hallway-right' };
  hallway.add(hallwayWall2);
  
  // Hallway ceiling
  const hallwayCeiling = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.3, 11.5),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );
  hallwayCeiling.position.set(0, 4.15, -13.25);
  hallwayCeiling.receiveShadow = true;
  hallway.add(hallwayCeiling);
  
  // Add hallway to group (not scene)
  group.add(hallway);

  // Create entry/exit anchors for future hallway/minimap work
  const entryAnchor = new THREE.Object3D();
  entryAnchor.name = 'entryAnchor';
  entryAnchor.position.set(0, 0, 7.5); // Front of room (entry point)
  group.add(entryAnchor);

  const exitAnchor = new THREE.Object3D();
  exitAnchor.name = 'exitAnchor';
  exitAnchor.position.set(0, 0, -7.5); // Back of room (exit point)
  group.add(exitAnchor);

  // Stage 0: Return room object with all necessary properties
  return {
    group,
    anchors: { entry: entryAnchor, exit: exitAnchor },
    door,
    key,
    hallway,
    triggers: { doorwayBox },
    state,
    updateRoom0,
    handleInteraction,
    handleEKeyInteraction,
    checkDoorwayTrigger,
    checkDoorCollision,
    checkWallCollisions,
    checkHallwayCollisions
  };
}

// Stage 0: Export update function for main loop
export function updateRoom0(dt, ctx) {
  // This will be called from main.js
  // The actual update logic is in the room object returned by createRoom0
}
