import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addToInventory } from './player.js';

export function createRoom1() {
  const group = new THREE.Group();
  group.name = 'room1';

  // Room state for interactions (declare early so loaders can assign)
  const state = {
    safeOpened: false,
    safeObject: null,
    keypadOpen: false,
    inputCode: ''
  };

  // Floor + walls (room 0 style: darker, metallic, slightly glossy)
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x222244,
    roughness: 0.35,
    metalness: 0.5
  });
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.2, 12),
    floorMat
  );
  floor.receiveShadow = true;
  group.add(floor);

  // Room 0 style wall material
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x333344,
    roughness: 0.35,
    metalness: 0.5
  });

  // Back wall
  const wall1 = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 0.2), wallMat);
  wall1.position.set(0, 2, -6);
  wall1.userData = { type: 'wall', side: 'back' };
  wall1.castShadow = true;
  wall1.receiveShadow = true;
  group.add(wall1);

  // Front wall with doorway (split into two parts)
  const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.2), wallMat);
  frontWallLeft.position.set(-4, 2, 6);
  frontWallLeft.userData = { type: 'wall', side: 'front-left' };
  frontWallLeft.castShadow = true;
  frontWallLeft.receiveShadow = true;
  group.add(frontWallLeft);

  const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.2), wallMat);
  frontWallRight.position.set(4, 2, 6);
  frontWallRight.userData = { type: 'wall', side: 'front-right' };
  frontWallRight.castShadow = true;
  frontWallRight.receiveShadow = true;
  group.add(frontWallRight);

  // Side walls
  const wall3 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 12), wallMat);
  wall3.position.set(-6, 2, 0);
  wall3.userData = { type: 'wall', side: 'left' };
  wall3.castShadow = true;
  wall3.receiveShadow = true;
  group.add(wall3);

  const wall4 = wall3.clone();
  wall4.position.set(6, 2, 0);
  wall4.userData = { type: 'wall', side: 'right' };
  wall4.castShadow = true;
  wall4.receiveShadow = true;
  group.add(wall4);

  // Pillars in each corner (room 0 style)
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x444466,
    roughness: 0.3,
    metalness: 0.7
  });
  const pillarGeometry = new THREE.CylinderGeometry(0.25, 0.25, 4.2, 16);

  const pillarPositions = [
    [-5.7, 2.1, -5.7],
    [5.7, 2.1, -5.7],
    [-5.7, 2.1, 5.7],
    [5.7, 2.1, 5.7]
  ];

  pillarPositions.forEach(pos => {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMat);
    pillar.position.set(...pos);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
  });

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
  
  

  // Load the safe model very small and place it next to the sci-fi table
  gltfLoader.load('/models/safe.glb', (gltf) => {
    const safeModel = gltf.scene;
    safeModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Make the safe really small and shorter (squash Y axis)
    safeModel.scale.set(0.03, 0.03, 0.01); // Y axis is shorter
    // Place it right at the back wall, next to the table (right side)
    safeModel.position.set(1.8, 0.1, -5); // z = -5.8 is almost flush with back wall
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

  // (state declared earlier)

  // E-key interaction for room1
  function handleEKeyInteraction(playerObject) {
    if (!state.safeObject) return false;
    // Compare in world space because room1 group is offset in the scene
    const safeWorldPos = new THREE.Vector3();
    state.safeObject.getWorldPosition(safeWorldPos);
    const distance = playerObject.position.distanceTo(safeWorldPos);
    if (distance > 2.2) return false;

    // Toggle keypad on/off
    toggleKeypad(!state.keypadOpen);
    return true;
  }

  // Keyboard input handler for keypad
  function handleKeypadInput(e) {
    if (!state.keypadOpen) return;
    const display = document.getElementById('keypadDisplay');
    // Only allow number keys
    if (/^[0-9]$/.test(e.key) && state.inputCode.length < 4) {
      state.inputCode += e.key;
      if (display) display.textContent = state.inputCode.padEnd(4, '_');
    }
    // Backspace to clear last digit
    if (e.key === 'Backspace' && state.inputCode.length > 0) {
      state.inputCode = state.inputCode.slice(0, -1);
      if (display) display.textContent = state.inputCode.padEnd(4, '_');
      e.preventDefault();
    }
    // Enter to submit
    if (e.key === 'Enter') {
      if (state.inputCode === '1886') {
        toggleKeypad(false);
        if (!state.safeOpened) {
          state.safeOpened = true;
          const noteItem = {
            name: 'room1-note',
            description: 'A note recovered from the safe. It looks important.',
            type: 'note'
          };
          addToInventory(noteItem);
          if (window.AI) window.AI.say('Correct. The safe yields a note.');
        }
      } else {
        if (display) display.textContent = 'WRONG';
        if (window.AI) window.AI.say('Incorrect password.');
      }
    }
    // Escape to close keypad
    if (e.key === 'Escape') {
      toggleKeypad(false);
    }
  }

  // Show/hide keypad UI
  function toggleKeypad(show) {
    const keypadUI = document.getElementById('keypadUI');
    if (!keypadUI) return;

    if (show) {
      keypadUI.style.display = 'block';
      state.keypadOpen = true;
      state.inputCode = '';
      const disp = document.getElementById('keypadDisplay');
      if (disp) disp.textContent = '____';
      // Disable player movement
      window.disablePlayerControls = true;
      // Enable keyboard input for keypad
      window.addEventListener('keydown', handleKeypadInput);
    } else {
      keypadUI.style.display = 'none';
      state.keypadOpen = false;
      // Enable movement again
      window.disablePlayerControls = false;
      // Remove keyboard input for keypad
      window.removeEventListener('keydown', handleKeypadInput);
    }
  }

  // Keypad input wiring (run once per page)
  (function setupKeypad() {
    const keypadUI = document.getElementById('keypadUI');
    if (!keypadUI || keypadUI.dataset.bound === '1') return;

    keypadUI.dataset.bound = '1';
    const display = document.getElementById('keypadDisplay');

    keypadUI.querySelectorAll('.keyBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.inputCode.length < 4) {
          state.inputCode += btn.textContent;
          if (display) display.textContent = state.inputCode.padEnd(4, '_');
        }
      });
    });

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      state.inputCode = '';
      if (display) display.textContent = '____';
    });

    const enterBtn = document.getElementById('enterBtn');
    if (enterBtn) enterBtn.addEventListener('click', () => {
      if (state.inputCode === '1886') {
        toggleKeypad(false);
        if (!state.safeOpened) {
          state.safeOpened = true;
          const noteItem = {
            name: 'room1-note',
            description: 'A note recovered from the safe. It looks important.',
            type: 'note'
          };
          addToInventory(noteItem);
          if (window.AI) window.AI.say('Correct. The safe yields a note.');
        }
      } else {
        if (display) display.textContent = 'WRONG';
        if (window.AI) window.AI.say('Incorrect password.');
      }
    });
  })();

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
    let clamped = false;

    // Convert player world position to room-local space
    const playerWorldPos = playerObject.position.clone();
    const playerLocal = group.worldToLocal(playerWorldPos.clone());

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
    // Back wall
    if (playerLocal.z - playerRadius < -roomHalf + wallThickness) {
      playerLocal.z = -roomHalf + wallThickness + playerRadius;
      clamped = true;
    }
    // Front wall
    if (playerLocal.z + playerRadius > roomHalf - wallThickness) {
      playerLocal.z = roomHalf - wallThickness - playerRadius;
      clamped = true;
    }

    if (clamped) {
      const newWorld = group.localToWorld(playerLocal);
      playerObject.position.copy(newWorld);
    }
  }

  // Main ceiling light (toggleable)
  const ceilingLight = new THREE.PointLight(0xFFFFFF, 1.2, 16);
  ceilingLight.position.set(0, 3.8, 0);
  ceilingLight.castShadow = true;
  group.add(ceilingLight);

  // Light switch on the front wall
  const switchGeometry = new THREE.BoxGeometry(0.25, 0.5, 0.05);
  const switchMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.3,
    roughness: 0.6
  });
  const lightSwitch = new THREE.Mesh(switchGeometry, switchMaterial);
  lightSwitch.position.set(-5.5, 1.2, 6.13); // left side of front wall, slightly out
  lightSwitch.userData = { type: 'lightSwitch' };
  lightSwitch.castShadow = false;
  lightSwitch.receiveShadow = true;
  group.add(lightSwitch);

  // Switch state
  let lightOn = true;
  let nearSwitch = false;

  // Helper: show/hide popup
  function showSwitchPopup(show) {
    let popup = document.getElementById('switchPopup');
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'switchPopup';
      popup.textContent = 'L';
      popup.style.position = 'absolute';
      popup.style.top = '50%';
      popup.style.left = '50%';
      popup.style.transform = 'translate(-50%, -120px)';
      popup.style.padding = '16px 32px';
      popup.style.fontSize = '2rem';
      popup.style.background = 'rgba(30,30,30,0.85)';
      popup.style.color = '#fff';
      popup.style.borderRadius = '12px';
      popup.style.zIndex = '1000';
      popup.style.pointerEvents = 'none';
      document.body.appendChild(popup);
    }
    popup.style.display = show ? 'block' : 'none';
  }

  // Check if player is near the switch (call in your update loop)
  function checkSwitchProximity(playerObject) {
    if (!playerObject || !playerObject.position) return;
    const switchWorldPos = new THREE.Vector3();
    lightSwitch.getWorldPosition(switchWorldPos);
    const distance = playerObject.position.distanceTo(switchWorldPos);
    nearSwitch = distance < 2.0;
    showSwitchPopup(nearSwitch);
  }

  // Keyboard interaction for switch
  function handleSwitchKey(e) {
    if (nearSwitch && e.key.toLowerCase() === 'l') {
      lightOn = !lightOn;
      ceilingLight.visible = lightOn;
      switchMaterial.color.set(lightOn ? 0xcccccc : 0x222222);
      if (window.AI) window.AI.say(lightOn ? 'Light on.' : 'Light off.');
    }
  }
  window.addEventListener('keydown', handleSwitchKey);

  // Raycast interaction for switch (call this from your main click handler)
  function handleSwitchInteraction(raycaster) {
    const intersects = raycaster.intersectObject(lightSwitch, false);
    if (intersects.length > 0) {
      lightOn = !lightOn;
      ceilingLight.visible = lightOn;
      // Optional: change switch color to indicate state
      switchMaterial.color.set(lightOn ? 0xcccccc : 0x222222);
      if (window.AI) window.AI.say(lightOn ? 'Light on.' : 'Light off.');
      return true;
    }
    return false;
  }

  return {
    group,
    anchors: { entry: entryAnchor, exit: exitAnchor },
    checkWallCollisions,
    updateRoom1,
    handleEKeyInteraction,
    handleSwitchInteraction,
    checkSwitchProximity // <-- call this in your game loop with player object
  };
}

