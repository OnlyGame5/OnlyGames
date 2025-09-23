import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addToInventory } from './player.js';

export function createRoom1() {
  const group = new THREE.Group();
  group.name = 'room1';

  // Floor + walls
  const floor = new THREE.Mesh(new THREE.BoxGeometry(12,0.2,12), new THREE.MeshStandardMaterial({color:0x222244}));
  floor.receiveShadow = true;
  group.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({color:0x666666});
  
  // Back wall
  const wall1 = new THREE.Mesh(new THREE.BoxGeometry(12,4,0.2), wallMat); 
  wall1.position.set(0,2,-6);
  wall1.userData = { type: 'wall', side: 'back' };
  group.add(wall1);
  
  // Front wall with doorway (split into two parts)
  const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(4,4,0.2), wallMat);
  frontWallLeft.position.set(-4,2,6);
  frontWallLeft.userData = { type: 'wall', side: 'front-left' };
  group.add(frontWallLeft);
  
  const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(4,4,0.2), wallMat);
  frontWallRight.position.set(4,2,6);
  frontWallRight.userData = { type: 'wall', side: 'front-right' };
  group.add(frontWallRight);
  
  // Side walls
  const wall3 = new THREE.Mesh(new THREE.BoxGeometry(0.2,4,12), wallMat); 
  wall3.position.set(-6,2,0);
  wall3.userData = { type: 'wall', side: 'left' };
  group.add(wall3);
  
  const wall4 = wall3.clone(); 
  wall4.position.set(6,2,0);
  wall4.userData = { type: 'wall', side: 'right' };
  group.add(wall4);

  // Flickering light (3s flicker every 5s cycle)
  const flickerLight = new THREE.PointLight(0xE6F3FF, 0.7, 18);
  flickerLight.position.set(0, 3.5, 0);
  flickerLight.castShadow = true;
  group.add(flickerLight);

  let flickerTimer = 0; // seconds
  function updateRoom1(dt) {
    flickerTimer = (flickerTimer + dt) % 5.0; // 5s cycle
    const isFlickerPhase = flickerTimer < 3.0; // first 3s flicker
    if (isFlickerPhase) {
      // combine a couple of sines for irregular flicker feel
      const t = flickerTimer;
      const base = 0.55;
      const flick = 0.15 * Math.sin(t * 12) + 0.1 * Math.sin(t * 23) + 0.05 * Math.sin(t * 37);
      const intensity = Math.max(0.3, Math.min(1.0, base + flick));
      flickerLight.intensity = intensity;
    } else {
      // steady dim for 2 seconds
      flickerLight.intensity = 0.5;
    }
  }

  // Removed pedestal, panel, and keypad to keep only table and safe in this room

  // Load sci-fi table (independent of safe placement)
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('/models/sci_fi_table.glb', (gltf) => {
    const sciFiTable = gltf.scene;
    sciFiTable.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Move the table closer to the back wall (centered)
    sciFiTable.position.set(0, 0, -4.5);
    group.add(sciFiTable);
  }, undefined, (err) => {
    console.error('Failed to load sci_fi_table.glb', err);
  });
  
  

  // Load the safe model very small and place it anywhere in the room
  gltfLoader.load('/models/safe.glb', (gltf) => {
    const safeModel = gltf.scene;
    safeModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Make the safe really small
    safeModel.scale.set(0.03, 0.03, 0.03);
    // Place it freely somewhere on the floor in the room
    safeModel.position.set(-3.0, 0.1, 1.5);
    group.add(safeModel);

    // Store reference for interaction
    state.safeObject = safeModel;
  }, undefined, (err) => {
    console.error('Failed to load safe.glb', err);
  });

  // Add a wall panel with the Statue of Liberty coordinates + riddle
  const panelGeometry = new THREE.PlaneGeometry(4, 2);
  const panelCanvas = document.createElement('canvas');
  panelCanvas.width = 512;
  panelCanvas.height = 256;
  const ctx = panelCanvas.getContext('2d');

  // Black background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, panelCanvas.width, panelCanvas.height);

  // Lime-green text for coordinates + riddle
  ctx.fillStyle = 'lime';
  ctx.font = '28px monospace';
  ctx.fillText('STATUE COORDINATES:', 20, 50);
  ctx.fillText('Lat: 40.6892° N', 20, 100);
  ctx.fillText('Lon: 74.0445° W', 20, 140);
  ctx.fillText('Find the year she was dedicated', 20, 200);

  const panelTexture = new THREE.CanvasTexture(panelCanvas);
  panelTexture.colorSpace = THREE.SRGBColorSpace;
  panelTexture.generateMipmaps = true;
  panelTexture.minFilter = THREE.LinearMipmapLinearFilter;
  panelTexture.magFilter = THREE.LinearFilter;
  panelTexture.needsUpdate = true;

  const panelMaterial = new THREE.MeshBasicMaterial({
    map: panelTexture,
    side: THREE.FrontSide,
    toneMapped: false,
    depthWrite: false
  });

  const panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);

  // Position panel on the back wall, slightly above table
  panelMesh.position.set(0, 2.5, -5.85); // pull slightly forward to avoid z-fighting
  panelMesh.rotation.x = -0.05; // slight tilt for realism
  panelMesh.renderOrder = 1;

  group.add(panelMesh);

  // Room state for interactions
  const state = {
    safeOpened: false,
    safeObject: null
  };

  // E-key interaction for room1
  function handleEKeyInteraction(playerObject) {
    if (state.safeOpened || !state.safeObject) return false;
    const distance = playerObject.position.distanceTo(state.safeObject.position);
    if (distance > 2.2) return false;

    const input = window.prompt('Enter 4-digit passcode:');
    if (input == null) return false;
    const code = ('' + input).trim();
    if (code === '1886') {
      state.safeOpened = true;

      // Give player a note item
      const noteItem = {
        name: 'room1-note',
        description: 'A note recovered from the safe. It looks important.',
        type: 'note'
      };
      addToInventory(noteItem);
      if (window.AI) {
        window.AI.say('Good. The safe yields a note. Keep it—you will need it.');
      }
      return true;
    } else {
      if (window.AI) {
        window.AI.say('That code is wrong. Look around—clues are on the wall.');
      }
      return false;
    }
  }

  // Create entry/exit anchors for future hallway/minimap work
  const entryAnchor = new THREE.Object3D();
  entryAnchor.name = 'entryAnchor';
  entryAnchor.position.set(0, 0, 6); // Front of room (entry point)
  group.add(entryAnchor);

  const exitAnchor = new THREE.Object3D();
  exitAnchor.name = 'exitAnchor';
  exitAnchor.position.set(0, 0, -6); // Back of room (exit point)
  group.add(exitAnchor);

  // Collision detection function for room1 walls (account for room's world position)
  function checkWallCollisions(playerObject) {
    if (!playerObject || !playerObject.position) return;

    const playerRadius = 0.5;
    const roomHalf = 6; // Half of 12
    const wallThickness = 0.1;

    // Convert player world position to room-local space
    const playerWorldPos = playerObject.position.clone();
    const playerLocal = group.worldToLocal(playerWorldPos.clone());

    let clamped = false;

    // Left wall
    if (playerLocal.x - playerRadius < -roomHalf + wallThickness) {
      playerLocal.x = -roomHalf + wallThickness + playerRadius;
      clamped = true;
    }

    // Right wall
    if (playerLocal.x + playerRadius > roomHalf - wallThickness) {
      playerLocal.x = roomHalf - wallThickness - playerRadius;
      clamped = true;
    }

    // Front wall (z = +roomHalf) with doorway at center (x in [-2, 2])
    if (playerLocal.z + playerRadius > roomHalf - wallThickness) {
      if (Math.abs(playerLocal.x) > 2) {
        playerLocal.z = roomHalf - wallThickness - playerRadius;
        clamped = true;
      }
    }

    // Back wall (z = -roomHalf)
    if (playerLocal.z - playerRadius < -roomHalf + wallThickness) {
      playerLocal.z = -roomHalf + wallThickness + playerRadius;
      clamped = true;
    }

    if (clamped) {
      const newWorld = group.localToWorld(playerLocal);
      playerObject.position.copy(newWorld);
    }
  }

  return {
    group,
    anchors: { entry: entryAnchor, exit: exitAnchor },
    checkWallCollisions,
    updateRoom1,
    handleEKeyInteraction
  };
}

