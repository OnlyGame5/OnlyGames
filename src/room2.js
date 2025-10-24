import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setupModel } from './utils.js';
import { addToInventory, getPlayerInventory, registerOriginalModel } from './player.js'; // Inventory functions
import { AI } from './ai.js'; // AI for feedback
import { ScaleOfBalance } from './puzzles/ScaleOfBalance.js';
import { CandleBeamPuzzle } from './puzzles/CandleBeamPuzzle.js';
import { gameStore } from './state/gameStore.js'; // Game state tracking

export function createRoom2() {
  const group = new THREE.Group();
  group.name = 'room2';

  const pickableObjects = []; // Array to hold objects that can be picked up
  const roomObjects = {}; // To store references to the models for cloning
  let scalePuzzle = null; // Puzzle controller
  let candleBeamPuzzle = null; // Candle + Mirrors puzzle
  let noteInkMesh = null; // Hidden ink plane (opacity 0 initially)
  let noteBaseMesh = null; // Base paper plane
  let noteRevealProgress = 0; // 0..1 fade
  let lastPromptText = '';
  const hiddenClues = []; // planes that show only with glasses selected

  // Room 2 completion tracking
  let room2Puzzles = {
    scalePuzzleComplete: false,
    candleBeamPuzzleComplete: false,
    noteRevealed: false,
    allCluesViewed: false
  };

  // Function to check if all Room 2 puzzles are completed
  function checkRoom2Completion() {
    const allComplete = room2Puzzles.scalePuzzleComplete && 
                       room2Puzzles.candleBeamPuzzleComplete && 
                       room2Puzzles.noteRevealed;
    
    if (allComplete && !gameStore.rooms.room2.isComplete) {
      gameStore.rooms.room2.isComplete = true;
      gameStore.rooms.room2.puzzles.scalePuzzleComplete = true;
      gameStore.rooms.room2.puzzles.candleBeamPuzzleComplete = true;
      gameStore.rooms.room2.puzzles.seventhObjectRevealed = true;
      
      console.log('Room 2 completed! All puzzles solved.');
      if (window.AI) {
        window.AI.say('Room 2 is complete. The path to Room 3 is now accessible.');
      }
      
      // Notify game state listeners
      gameStore.notify('room2Complete', true);
      gameStore.notify('room3AccessGranted', true);
    }
  }

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x333344, 
    roughness: 0.35,
    metalness: 0.5
  });

  // Floor
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.2, 12),
    wallMaterial
  );
  floor.receiveShadow = true;
  group.add(floor);

  // --- EXPLICIT WALL CREATION FOR ROOM 2 ---

  const wallHeight = 4;
  const wallThickness = 0.2;
  const roomWidthHalf = 6;  // Room is 12x12
  const roomDepthHalf = 6;

  // Back wall (South, z=-6) - WITH OPENING
  const backWall_LeftSegment = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, wallHeight, wallThickness),
    wallMaterial
  );
  backWall_LeftSegment.position.set(-3.75, wallHeight / 2, -roomDepthHalf ); // Adjusted z position by -1.5
  backWall_LeftSegment.castShadow = true;
  backWall_LeftSegment.receiveShadow = true;
  group.add(backWall_LeftSegment);

  const backWall_RightSegment = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, wallHeight, wallThickness),
    wallMaterial
  );
  backWall_RightSegment.position.set(3.75, wallHeight / 2, -roomDepthHalf ); // Adjusted z position by -1.5
  backWall_RightSegment.castShadow = true;
  backWall_RightSegment.receiveShadow = true;
  group.add(backWall_RightSegment);
  
  // Front wall (North, z=6) - SOLID
  const frontWall = new THREE.Mesh(
    new THREE.BoxGeometry(12, wallHeight, wallThickness),
    wallMaterial
  );
  frontWall.position.set(0, wallHeight / 2, roomDepthHalf);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  group.add(frontWall);

  // Left wall (West, x=-6) - SOLID
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, 12),
    wallMaterial
  );
  leftWall.position.set(-roomWidthHalf, wallHeight / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  // Right wall (East, x=6) - SOLID
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, 12),
    wallMaterial
  );
  rightWall.position.set(roomWidthHalf, wallHeight / 2, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // Header above the new South opening
  const headerSouth = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.5, wallThickness), 
    wallMaterial
  );
  headerSouth.position.set(0, 4.25, -roomDepthHalf - 1.5); // Adjusted z position by -1.5
  headerSouth.castShadow = true;
  headerSouth.receiveShadow = true;
  group.add(headerSouth);

  // Ceiling removed - now using global skybox
  // Light bulb removed - now using global lighting

  const loader = new GLTFLoader();

  // Candle + Mirrors Beam Puzzle: place stand, mirrors, target, and case
  candleBeamPuzzle = new CandleBeamPuzzle({
    roomGroup: group,
    // Position candle stand somewhere on the west side; target on east wall defined in class
    onSolved: () => {
      console.log('Candle beam puzzle solved!');
      if (window.AI) window.AI.say('The case slides open with a click.');
      
      // Update game state
      room2Puzzles.candleBeamPuzzleComplete = true;
      checkRoom2Completion();
    }
  });
  candleBeamPuzzle.attach();

  // Add scales model
  loader.load('/models/scales.glb', (gltf) => {
      const scales = setupModel(gltf);
      scales.position.set(0, 0.2, 4.5);
      scales.scale.set(0.05, 0.05, 0.05);
      scales.name = 'room2-scale';
      group.add(scales);

      // Secret compartment (hidden panel) near scale base
      const comp = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.1, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x22252f, metalness: 0.2, roughness: 0.8 })
      );
      comp.position.set(0, 0.05, -4.1); // In front of scale
      comp.name = 'scale-secret-compartment';
      comp.userData.openY = 0.25; // target open height
      group.add(comp);

      // Instantiate puzzle controller
      scalePuzzle = new ScaleOfBalance({
        scene: (typeof window !== 'undefined' ? window.scene : undefined),
        roomGroup: group,
        scaleObject3D: scales,
        onSolved: () => {
          console.log('Scale puzzle solved!');
          if (window.AI) window.AI.say('Perfect equilibrium. A hidden latch releases...');
          
          // Update game state
          room2Puzzles.scalePuzzleComplete = true;
          checkRoom2Completion();
        }
      });
      scalePuzzle.attach();
  });
  
  // Statue of Liberty
  loader.load('/models/statue_of_liberty.glb', (gltf) => {
      const statue = setupModel(gltf);
      statue.position.set(-3.5, 0.5, 0);
      statue.scale.set(0.015, 0.015, 0.015);
      // Make it pickable
      statue.userData.pickupId = 'liberty';
      statue.userData.displayName = 'Statue of Liberty';
      statue.userData.isPickable = true;
      group.add(statue);
      pickableObjects.push(statue);
      roomObjects.liberty = statue;
      
      // Register the liberty model for dropped items
      registerOriginalModel('liberty', statue);
  });

  // Bowling Pin
  loader.load('/models/bowling_pin.glb', (gltf) => {
      const pin = setupModel(gltf);
      pin.position.set(4, 0.2, -5);
      pin.scale.set(1, 1, 1);
      // Make it pickable
      pin.userData.pickupId = 'bowling_pin';
      pin.userData.displayName = 'Bowling Pin';
      pin.userData.isPickable = true;
      group.add(pin);
      pickableObjects.push(pin);
      roomObjects['bowling_pin'] = pin;
      
      // Register the bowling pin model for dropped items
      registerOriginalModel('bowling_pin', pin);
  });

  // Bowling Ball
  loader.load('/models/bowling_ball.glb', (gltf) => {
      const ball = setupModel(gltf);
      ball.position.set(5, 0.5, -4);
      ball.scale.set(0.2, 0.2, 0.2);
       // Make it pickable
      ball.userData.pickupId = 'bowling_ball';
      ball.userData.displayName = 'Bowling Ball';
      ball.userData.isPickable = true;
      group.add(ball);
      pickableObjects.push(ball);
      roomObjects['bowling_ball'] = ball;
      
      // Register the bowling ball model for dropped items
      registerOriginalModel('bowling_ball', ball);
  });

  // Book
  loader.load('/models/book.glb', (gltf) => {
      const book = setupModel(gltf);
      book.position.set(-5, 0.15, 3.5);
      book.scale.set(0.3, 0.3, 0.3);
      book.rotation.y = Math.PI / 8;
      // Make it pickable
      book.userData.pickupId = 'book';
      book.userData.displayName = 'Book';
      book.userData.isPickable = true;
      group.add(book);
      pickableObjects.push(book);
      roomObjects.book = book;
      
      // Register the book model for dropped items
      registerOriginalModel('book', book);
  });

  // Hidden note: base + invisible ink
  const noteMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f2dc, roughness: 0.9, metalness: 0.0 });
  const inkMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.0, transparent: true, opacity: 0.0 });
  const planeGeo = new THREE.PlaneGeometry(0.8, 0.5);
  noteBaseMesh = new THREE.Mesh(planeGeo, noteMaterial);
  noteBaseMesh.rotation.x = -Math.PI / 2;
  noteBaseMesh.position.set(-2.2, 0.205, -1.8);
  noteBaseMesh.userData.isNote = true;
  noteBaseMesh.receiveShadow = true;
  group.add(noteBaseMesh);
  noteInkMesh = new THREE.Mesh(planeGeo.clone(), inkMaterial);
  noteInkMesh.rotation.copy(noteBaseMesh.rotation);
  noteInkMesh.position.copy(noteBaseMesh.position).add(new THREE.Vector3(0, 0.001, 0));
  noteInkMesh.name = 'room2-note-ink';
  group.add(noteInkMesh);

  // Candle pickup (simple mesh)
  const candle = new THREE.Group();
  candle.name = 'candle-prop';
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0xffcc55, emissive: 0xffaa33, emissiveIntensity: 0.8 }));
  body.position.y = 0.125;
  flame.position.y = 0.25;
  candle.add(body);
  candle.add(flame);
  candle.position.set(-1.5, 0.2, -1.6);
  candle.userData.pickupId = 'candle';
  candle.userData.displayName = 'Candle';
  candle.userData.itemMeta = { lightSource: true };
  candle.userData.isPickable = true;
  group.add(candle);
  pickableObjects.push(candle);
  
  // Register the candle model for dropped items
  registerOriginalModel('candle', candle);

  // Glasses pickup (simple mesh)
  const glasses = new THREE.Group();
  glasses.name = 'glasses-prop';
  // Frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6, roughness: 0.4 });
  const lensMat = new THREE.MeshStandardMaterial({ 
    color: 0x00ff00, 
    opacity: 0.8, 
    transparent: true, 
    metalness: 0.2, 
    roughness: 0.05,
    emissive: 0x00ff00,
    emissiveIntensity: 0.8
  });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), frameMat);
  const leftRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.01, 8, 16), frameMat);
  const rightRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.01, 8, 16), frameMat);
  leftRing.rotation.x = Math.PI / 2;
  rightRing.rotation.x = Math.PI / 2;
  leftRing.position.set(-0.1, 0, 0);
  rightRing.position.set(0.1, 0, 0);
  bridge.position.set(0, 0, 0);
  const leftLens = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), lensMat);
  const rightLens = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), lensMat);
  leftLens.position.set(-0.1, 0, 0.005);
  rightLens.position.set(0.1, 0, 0.005);
  glasses.add(leftRing, rightRing, bridge, leftLens, rightLens);
  glasses.position.set(-1.0, 0.22, -2.2);
  glasses.userData.pickupId = 'glasses';
  glasses.userData.displayName = 'Glasses';
  glasses.userData.isPickable = true;
  group.add(glasses);
  pickableObjects.push(glasses);
  
  // Register the glasses model for dropped items
  registerOriginalModel('glasses', glasses);

  // Hidden wall clues that show only with glasses selected
  // Create simple quads with emissive text-like look
  const clueMat = new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.0 });
  const clueGeo = new THREE.PlaneGeometry(1.0, 0.25);
  const wallZ = -5.9; // near the south wall
  const cluesData = [
    { text: 'Bowling Ball = 12', pos: new THREE.Vector3(-3.5, 1.4, wallZ) },
    { text: 'Liberty = 5', pos: new THREE.Vector3(-1.2, 1.1, wallZ) },
    { text: 'Pin = 4', pos: new THREE.Vector3(1.2, 0.9, wallZ) },
    { text: 'Book = 3', pos: new THREE.Vector3(3.2, 0.8, wallZ) }
  ];
  cluesData.forEach(({ text, pos }) => {
    const m = clueMat.clone();
    // Add label using a CanvasTexture for the text
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#66ccff';
    ctx.font = '28px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#1a3d5c';
    ctx.shadowBlur = 8;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    m.map = tex;
    m.opacity = 0.0; // hidden by default
    const mesh = new THREE.Mesh(clueGeo, m);
    mesh.position.copy(pos);
    mesh.rotation.y = 0; // facing the room
    mesh.name = `room2-clue-${text.replace(/\s+/g, '-')}`;
    group.add(mesh);
    hiddenClues.push(mesh);
  });

  // UI prompt helper
  function ensurePrompt() {
    let prompt = document.getElementById('interactPrompt');
    if (!prompt) {
      prompt = document.createElement('div');
      prompt.id = 'interactPrompt';
      prompt.style.cssText = 'position:fixed;left:50%;bottom:10%;transform:translateX(-50%);color:#fff;background:rgba(0,0,0,0.55);padding:6px 10px;border-radius:6px;z-index:9999;font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px;pointer-events:none;';
      document.body.appendChild(prompt);
    }
    return prompt;
  }

  const raycaster = new THREE.Raycaster();
  const tmpVec = new THREE.Vector3();

  function getPickupAncestor(obj) {
    let cur = obj;
    while (cur) {
      if (cur.userData && cur.userData.isPickable && cur.userData.pickupId) return cur;
      cur = cur.parent;
    }
    return null;
  }

  function showPrompt(text) {
    const prompt = ensurePrompt();
    if (text !== lastPromptText) {
      prompt.textContent = text || '';
      lastPromptText = text || '';
    }
    prompt.style.display = text ? 'block' : 'none';
  }

  function playerNearScale(player) {
    const scaleObj = group.getObjectByName('room2-scale');
    if (!scaleObj) return false;
    const world = new THREE.Vector3();
    scaleObj.getWorldPosition(world);
    return player.position.distanceTo(world) <= 1.6;
  }

  function playerNearCandlePuzzle(player) {
    if (!candleBeamPuzzle || !player) return false;
    const pts = [];
    if (candleBeamPuzzle.objects.stand) pts.push(candleBeamPuzzle.objects.stand.getWorldPosition(new THREE.Vector3()));
    if (candleBeamPuzzle.objects.aimer) pts.push(candleBeamPuzzle.objects.aimer.getWorldPosition(new THREE.Vector3()));
    return pts.some(p => player.position.distanceTo(p) <= 1.8);
  }

  function handleEKeyInteraction(player) {
    if (window.disablePlayerControls) return false;

    // 1) Raycast for pickups
    const cam = window.camera;
    if (cam) {
      const mouse = new THREE.Vector2(0, 0); // center of screen
      raycaster.setFromCamera(mouse, cam);
      const intersects = raycaster.intersectObjects(pickableObjects, true);
      if (intersects && intersects.length > 0) {
        // Find nearest pickable ancestor within distance threshold
        for (const hit of intersects) {
          const root = getPickupAncestor(hit.object);
          if (!root) continue;
          const dist = cam.position.distanceTo(hit.point);
          if (dist <= 2.0) {
            const pickupId = root.userData.pickupId;
            const displayName = root.userData.displayName || pickupId;
            const meta = root.userData.itemMeta || {};
            const item = { name: pickupId, description: displayName, ...meta };
            if (addToInventory(item)) {
              AI.say(`Picked up: ${displayName}`);
              if (root.parent) root.parent.remove(root);
              const idx = pickableObjects.indexOf(root);
              if (idx >= 0) pickableObjects.splice(idx, 1);
            } else {
              AI.say('My inventory is full.');
            }
            return true;
          }
        }
      }
    }

    // 2) If near the scale, open the Scale UI
    if (scalePuzzle && playerNearScale(player)) {
      const opened = scalePuzzle.tryOpenUI(player);
      if (opened) return true;
    }

    // 3) If near candle beam puzzle, open its UI
    if (candleBeamPuzzle && playerNearCandlePuzzle(player)) {
      const opened = candleBeamPuzzle.tryOpenUI(player);
      if (opened) return true;
    }

    return false;
  }

  function handleFKeyInteraction(player) {
    if (window.disablePlayerControls) return false;
    if (!noteBaseMesh || !noteInkMesh) return false;

    // Proximity to note
    const notePos = noteBaseMesh.getWorldPosition(tmpVec.set(0, 0, 0));
    const dist = player.position.distanceTo(notePos);
    if (dist > 1.1) return false;

    // Check inventory for a light source
    const inv = getPlayerInventory();
    const hasLight = inv.slots.some((it) => it && (it.lightSource === true || it.name === 'candle' || it.name === 'flashlight'));
    if (!hasLight) {
      AI.say('I need a light source to read this.');
      return true; // handled
    }

    // Begin reveal
    noteRevealProgress = Math.max(noteRevealProgress, 0.01);
    if (window.AI) {
      window.AI.say('Balance the four objects upon the scale. Equilibrium reveals the secret.');
    }
    
    // Track note revelation
    if (!room2Puzzles.noteRevealed) {
      room2Puzzles.noteRevealed = true;
      checkRoom2Completion();
    }
    
    return true;
  }

  function update(deltaTime) {
    // Animate note ink fade if in progress
    if (noteInkMesh && noteRevealProgress < 1) {
      if (noteRevealProgress > 0) {
        noteRevealProgress = Math.min(1, noteRevealProgress + deltaTime / 0.8);
        noteInkMesh.material.opacity = noteRevealProgress;
        noteInkMesh.material.needsUpdate = true;
      }
    }

    // Update scale puzzle animations
    if (scalePuzzle) scalePuzzle.update(deltaTime);
  if (candleBeamPuzzle) candleBeamPuzzle.update(deltaTime);

    // Toggle hidden clues based on glasses selection
    const inv = getPlayerInventory();
    const selected = inv.getSelectedItem ? inv.getSelectedItem() : inv.slots?.[inv.selectedSlot];
    const showClues = !!(selected && selected.name === 'glasses');
    hiddenClues.forEach((mesh) => {
      const target = showClues ? 1.0 : 0.0;
      const cur = mesh.material.opacity;
      const t = Math.min(1, deltaTime * 6);
      mesh.material.opacity = cur + (target - cur) * t;
      mesh.material.needsUpdate = true;
      mesh.visible = mesh.material.opacity > 0.02;
    });

    // Interaction prompts
    const cam = window.camera;
    const activePlayer = (typeof window !== 'undefined' && (window.leonardModel || window.player)) || null;
    if (!cam || !activePlayer) return;
    if (window.disablePlayerControls) {
      showPrompt('');
      return;
    }

    // Check scale prompt
    if (playerNearScale(activePlayer)) {
      showPrompt('[E] Use Scale');
      return;
    }

    // Check candle aimer prompt
    if (playerNearCandlePuzzle(activePlayer)) {
      showPrompt('[E] Aim Beam');
      return;
    }

    // Raycast for pickup prompt
    raycaster.setFromCamera(new THREE.Vector2(0, 0), cam);
    const hits = raycaster.intersectObjects(pickableObjects, true);
    if (hits && hits.length) {
      const root = getPickupAncestor(hits[0].object);
      if (root) {
        // Distance check
        const dist = cam.position.distanceTo(hits[0].point);
        if (dist <= 2.0) {
          const name = root.userData.displayName || root.userData.pickupId;
          showPrompt(`[E] Pick up ${name}`);
          return;
        }
      }
    }

    // Note prompt
    if (noteBaseMesh) {
      const pos = noteBaseMesh.getWorldPosition(tmpVec.set(0, 0, 0));
      const d = activePlayer.position.distanceTo(pos);
      if (d <= 1.1) {
        const inv = getPlayerInventory();
        const hasLight = inv.slots.some((it) => it && (it.lightSource === true || it.name === 'candle' || it.name === 'flashlight'));
        if (hasLight) {
          showPrompt('[F] Shine Light');
          return;
        }
      }
    }

    showPrompt('');
  }

  // Dispose method for cleanup
  function dispose() {
    // Import dispose helper
    import('./utils/DisposeHelper.js').then(({ disposeGroup, removeElement }) => {
      disposeGroup(group);
      
      // Remove prompt element if it exists
      removeElement('interactPrompt');
    });
    
    // Dispose of puzzles
    if (scalePuzzle && typeof scalePuzzle.dispose === 'function') {
      scalePuzzle.dispose();
    }
    
    if (candleBeamPuzzle && typeof candleBeamPuzzle.dispose === 'function') {
      candleBeamPuzzle.dispose();
    }
    
    // Clear arrays
    pickableObjects.length = 0;
    hiddenClues.length = 0;
    
    // Clear room2Puzzles
    Object.keys(room2Puzzles).forEach(key => {
      room2Puzzles[key] = null;
    });
  }

  return {
    group,
    roomObjects,
    handleEKeyInteraction,
    handleFKeyInteraction,
    update,
    dispose,
    checkWallCollisions: (player) => {
      // Add collision detection similar to Room 1
      if (!player || !player.position) return;
      const playerRadius = 0.5;
      const roomHalf = 6;
      const wallThickness = 0.1;
      let clamped = false;

      const playerLocal = group.worldToLocal(player.position.clone());

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
      // Back wall with opening for hub hallway (South)
      if (playerLocal.z - playerRadius < -roomHalf + wallThickness - 1.5) { // Adjusted z for collision as well
        const inOpeningX = (playerLocal.x >= -1.5 && playerLocal.x <= 1.5); // 3-unit opening
        if (!inOpeningX) {
          playerLocal.z = -roomHalf + wallThickness + playerRadius - 1.5; // Adjusted z for collision as well
          clamped = true;
        }
      }
      // Front wall (now solid)
      if (playerLocal.z + playerRadius > roomHalf - wallThickness) {
        playerLocal.z = roomHalf - wallThickness - playerRadius;
        clamped = true;
      }

      if (clamped) {
        const newWorld = group.localToWorld(playerLocal);
        player.position.copy(newWorld);
      }
    }
  };
}
