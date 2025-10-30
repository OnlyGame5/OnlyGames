import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setupModel } from './utils.js';
import { addToInventory, getPlayerInventory, registerOriginalModel } from './player.js'; // Inventory functions
import { AI } from './ai.js'; // AI for feedback
import { ScaleOfBalance } from './puzzles/ScaleOfBalance.js';
import { gameStore } from './state/gameStore.js'; // Game state tracking
import { makeConcrete031MaterialFlexible } from './materials/room0Materials.js';
import { createReusableLaptop, LaptopPresets } from './components/ReusableLaptop.js';
import { LogicGatePuzzle } from './puzzles/LogicGatePuzzle.js';

export function createRoom2() {
  const group = new THREE.Group();
  group.name = 'room2';

  const pickableObjects = []; // Array to hold objects that can be picked up
  const roomObjects = {}; // To store references to the models for cloning
  let scalePuzzle = null; // Puzzle controller
  let logicGatePuzzle = null; // Room 2 logic UI puzzle
  let logicKeyAwarded = false; // Prevent duplicate key card grants
  let noteInkMesh = null; // Hidden ink plane (opacity 0 initially)
  let noteBaseMesh = null; // Base paper plane
  let noteRevealProgress = 0; // 0..1 fade
  let lastPromptText = '';
  const hiddenClues = []; // planes that show only with glasses selected
  // Laptop modal element for Room 2 brief
  let r2LaptopEl = null;


  // Room 2 completion tracking
  let room2Puzzles = {
    scalePuzzleComplete: false,
    noteRevealed: false,
    allCluesViewed: false,
    logicPuzzleComplete: false
  };

  // Function to check if all Room 2 puzzles are completed
  function checkRoom2Completion() {
    // Award completion (and key card) when the two core puzzles are done.
    // Note reveal is helpful lore but no longer required for completion.
    const allComplete = room2Puzzles.scalePuzzleComplete && 
                       room2Puzzles.logicPuzzleComplete;
    
    if (allComplete && !gameStore.rooms.room2.isComplete) {
      gameStore.rooms.room2.isComplete = true;
      gameStore.rooms.room2.puzzles.scalePuzzleComplete = true;
      gameStore.rooms.room2.puzzles.seventhObjectRevealed = true;
      
      console.log('Room 2 completed! All puzzles solved.');
      if (window.AI) {
        window.AI.say('Room 2 is complete. The path to Room 3 is now accessible.');
      }
      
      // Grant the player the access key card once all puzzles are complete
      try {
        if (!logicKeyAwarded) {
          const granted = addToInventory({ name: 'key_card', description: 'Access Key Card', type: 'key' });
          if (granted) {
            logicKeyAwarded = true;
            if (window.AI) window.AI.say('Access Key Card issued. You may need this later.');
            if (window.gameStore) window.gameStore.notify('room2.keyCardAwarded', true);
          }
        }
      } catch (e) { console.warn('Failed to grant key card at completion:', e); }

      // Notify game state listeners
      gameStore.notify('room2Complete', true);
      gameStore.notify('room3AccessGranted', true);
    }
  }

  // Concrete031 texture files for Room 2
  const concrete031Files = {
    color: "/textures/concrete031/Concrete031_2K-JPG_Color.jpg",
    normal: "/textures/concrete031/Concrete031_2K-JPG_NormalGL.jpg",
    rough: "/textures/concrete031/Concrete031_2K-JPG_Roughness.jpg",
    ao: "/textures/concrete031/Concrete031_2K-JPG_AmbientOcclusion.jpg"
  };

  // Create concrete material for walls
  const wallMaterial = makeConcrete031MaterialFlexible(12, 4, concrete031Files, {
    uScale: 0.8,
    vScale: 0.8,
    metalness: 0.1,
    roughness: 0.8,
    anisotropy: 4
  });

  // Create concrete material for floor
  const floorMaterial = makeConcrete031MaterialFlexible(12, 12, concrete031Files, {
    uScale: 1.0,
    vScale: 1.0,
    metalness: 0.0,
    roughness: 0.9,
    anisotropy: 4
  });

  // Floor
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.2, 12),
    floorMaterial
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
      
      // Add laptop to Room 2 (for future use)
      const laptop = createReusableLaptop({
        ...LaptopPresets.room2,
        position: new THREE.Vector3(3, 0, 2), // Position near the front wall, right side
        rotation: Math.PI // Face towards the center of the room
      });
      // Bind laptop interaction to open the Room 2 brief
      laptop.userData = laptop.userData || {};
      laptop.userData.onInteract = () => openRoom2LaptopBrief();
      group.add(laptop);
  });
  
  // Create logic gate puzzle screen on left wall
  const screenGroup = new THREE.Group();
  screenGroup.name = 'logic-screen';
  
  // Screen frame
  const screenFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.8, 0.1),
    new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a, 
      metalness: 0.8,
      roughness: 0.3
    })
  );
  screenFrame.position.set(-5.9, 2, 0);
  screenFrame.rotation.y = Math.PI / 2; // Rotate to face into the room
  screenFrame.castShadow = true;
  screenFrame.receiveShadow = true;
  
  // Screen display with a logic-themed canvas texture
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 768; screenCanvas.height = 512; // 3:2 aspect to match 2.2x1.5
  const sctx = screenCanvas.getContext('2d');
  // background gradient
  const bgGrad = sctx.createLinearGradient(0, 0, 0, screenCanvas.height);
  bgGrad.addColorStop(0, '#07131f');
  bgGrad.addColorStop(1, '#0e2438');
  sctx.fillStyle = bgGrad;
  sctx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
  // grid
  sctx.strokeStyle = 'rgba(180,200,230,0.08)';
  sctx.lineWidth = 1;
  for (let x = 0; x < screenCanvas.width; x += 24) { sctx.beginPath(); sctx.moveTo(x, 0); sctx.lineTo(x, screenCanvas.height); sctx.stroke(); }
  for (let y = 0; y < screenCanvas.height; y += 24) { sctx.beginPath(); sctx.moveTo(0, y); sctx.lineTo(screenCanvas.width, y); sctx.stroke(); }
  // draw stylized gates and wires
  const drawPort = (x,y,color='#cfeeff') => { sctx.fillStyle=color; sctx.beginPath(); sctx.arc(x,y,6,0,Math.PI*2); sctx.fill(); sctx.strokeStyle='rgba(255,255,255,0.25)'; sctx.stroke(); };
  const wire = (x1,y1,x2,y2,color='#00e0ff') => { const dx = Math.max(50, Math.abs(x2-x1)*0.5); sctx.strokeStyle=color; sctx.lineWidth=3; sctx.beginPath(); sctx.moveTo(x1,y1); sctx.bezierCurveTo(x1+dx,y1, x2-dx,y2, x2,y2); sctx.stroke(); };
  // XOR gate glyph
  const drawXOR = (cx,cy,w=100,h=70) => {
    sctx.strokeStyle = '#e6f7ff'; sctx.lineWidth = 3; sctx.fillStyle='rgba(255,255,255,0.06)';
    sctx.beginPath();
    sctx.moveTo(cx-w*0.2, cy-h*0.5);
    sctx.bezierCurveTo(cx+w*0.3, cy-h*0.5, cx+w*0.5, cy+h*0.5, cx-w*0.2, cy+h*0.5);
    sctx.bezierCurveTo(cx-w*0.35, cy+h*0.5, cx-w*0.35, cy-h*0.5, cx-w*0.2, cy-h*0.5);
    sctx.closePath(); sctx.fill(); sctx.stroke();
    // XOR extra curve
    sctx.beginPath();
    sctx.moveTo(cx-w*0.25, cy-h*0.5);
    sctx.bezierCurveTo(cx+w*0.25, cy-h*0.45, cx+w*0.25, cy+h*0.45, cx-w*0.25, cy+h*0.5);
    sctx.stroke();
  };
  // OR gate glyph
  const drawOR = (cx,cy,w=110,h=80) => {
    sctx.strokeStyle = '#e6f7ff'; sctx.lineWidth = 3; sctx.fillStyle='rgba(255,255,255,0.06)';
    sctx.beginPath();
    sctx.moveTo(cx-w*0.25, cy-h*0.5);
    sctx.bezierCurveTo(cx+w*0.35, cy-h*0.5, cx+w*0.45, cy+h*0.5, cx-w*0.25, cy+h*0.5);
    sctx.bezierCurveTo(cx-w*0.4, cy+h*0.5, cx-w*0.4, cy-h*0.5, cx-w*0.25, cy-h*0.5);
    sctx.closePath(); sctx.fill(); sctx.stroke();
    // mouth curve
    sctx.beginPath();
    sctx.moveTo(cx-w*0.1, cy-h*0.5);
    sctx.bezierCurveTo(cx+w*0.55, cy-h*0.2, cx+w*0.55, cy+h*0.2, cx-w*0.1, cy+h*0.5);
    sctx.stroke();
  };
  // draw scene
  drawXOR(280, 220);
  drawOR(500, 220);
  // wires and ports
  drawPort(170, 200); drawPort(170, 240);
  wire(170,200, 230,210, '#ff3b3b');
  wire(170,240, 230,230, '#00e0ff');
  drawPort(230,210); drawPort(230,230);
  drawPort(340, 220);
  wire(340,220, 445,220, '#ff3b3b');
  drawPort(445,220);
  drawPort(610, 220);
  wire(555,220, 610,220, '#00e0ff');
  // PASS badge
  const badgeX=580, badgeY=80, badgeW=140, badgeH=36; sctx.lineWidth=2;
  sctx.fillStyle='rgba(0,255,120,0.15)'; sctx.strokeStyle='#3bff9a';
  sctx.beginPath(); sctx.moveTo(badgeX, badgeY); sctx.lineTo(badgeX+badgeW, badgeY); sctx.lineTo(badgeX+badgeW, badgeY+badgeH); sctx.lineTo(badgeX, badgeY+badgeH); sctx.closePath(); sctx.fill(); sctx.stroke();
  sctx.fillStyle='#cffff1'; sctx.font='bold 18px Segoe UI, Arial'; sctx.textAlign='center'; sctx.textBaseline='middle'; sctx.fillText('PASS LAMP', badgeX+badgeW/2, badgeY+badgeH/2);
  // subtle vignette
  const vignette = sctx.createRadialGradient(screenCanvas.width/2, screenCanvas.height/2, 50, screenCanvas.width/2, screenCanvas.height/2, screenCanvas.width/1.1);
  vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,0.25)');
  sctx.fillStyle = vignette; sctx.fillRect(0,0,screenCanvas.width,screenCanvas.height);
  const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.needsUpdate = true;
  const screenMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    map: screenTex,
    emissive: 0x0a1622,
    emissiveMap: screenTex,
    emissiveIntensity: 0.65,
    metalness: 0.0,
    roughness: 0.6
  });
  const screenDisplay = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.5, 0.05),
    screenMat
  );
  screenDisplay.name = 'logic-screen-display';
  screenDisplay.position.set(-5.85, 2, 0);
  screenDisplay.rotation.y = Math.PI / 2; // Rotate to face into the room
  
  screenGroup.add(screenFrame, screenDisplay);
  screenGroup.userData.isLogicScreen = true;
  group.add(screenGroup);
  
  // (Removed) neon strip and AI poster

  // Initialize logic gate puzzle and bind to screen interaction
  logicGatePuzzle = new LogicGatePuzzle({
    onSolved: () => {
      console.log('Logic Gate Puzzle solved!');
      if (window.AI) window.AI.say('Elegant logic. The circuit passes every case.');
      // Mark logic puzzle complete and re-check room completion
      room2Puzzles.logicPuzzleComplete = true;
      checkRoom2Completion();
      // Notify listeners that the room2 logic puzzle is done
      try { if (window.gameStore) window.gameStore.notify('room2.logicPuzzleComplete', true); } catch(e) {}
    }
  });
  logicGatePuzzle.attach();
  
  // Robot Eye - Create a simple glowing eye mesh
  const robotEye = new THREE.Group();
  robotEye.name = 'robot-eye-prop';
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
  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 12),
    new THREE.MeshStandardMaterial({ 
      color: 0x0066ff, 
      emissive: 0x0044ff, 
      emissiveIntensity: 0.8
    })
  );
  pupil.position.z = 0.08;
  robotEye.add(eyeBall, pupil);
  robotEye.position.set(-3.5, 0.2, 0);
  robotEye.userData.pickupId = 'robot_eye';
  robotEye.userData.displayName = 'Robot Eye';
  robotEye.userData.isPickable = true;
  group.add(robotEye);
  pickableObjects.push(robotEye);
  roomObjects.robot_eye = robotEye;
  registerOriginalModel('robot_eye', robotEye);
  
  // Store a clone for dropped items
  const robotEyeClone = robotEye.clone();
  robotEyeClone.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material = child.material.clone();
    }
  });

  // Circuit Board Fragment - Create a circuit board mesh
  const circuitBoard = new THREE.Group();
  circuitBoard.name = 'circuit-board-prop';
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.02, 0.3),
    new THREE.MeshStandardMaterial({ 
      color: 0x00aa00, 
      metalness: 0.3,
      roughness: 0.6
    })
  );
  // Add some circuit traces
  for (let i = 0; i < 3; i++) {
    const trace = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.03, 0.02),
      new THREE.MeshStandardMaterial({ 
        color: 0xffaa00, 
        emissive: 0xff8800, 
        emissiveIntensity: 0.3,
        metalness: 0.9
      })
    );
    trace.position.y = 0.02;
    trace.position.z = (i - 1) * 0.1;
    circuitBoard.add(trace);
  }
  circuitBoard.add(board);
  circuitBoard.position.set(4, 0.2, -5);
  circuitBoard.rotation.y = Math.PI / 6;
  circuitBoard.userData.pickupId = 'circuit_board';
  circuitBoard.userData.displayName = 'Circuit Board Fragment';
  circuitBoard.userData.isPickable = true;
  group.add(circuitBoard);
  pickableObjects.push(circuitBoard);
  roomObjects.circuit_board = circuitBoard;
  registerOriginalModel('circuit_board', circuitBoard);
  
  // Store a clone for dropped items
  const circuitBoardClone = circuitBoard.clone();
  circuitBoardClone.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material = child.material.clone();
    }
  });

  // Robot Hand - Load from model
  loader.load('/models/hand_sculpt.glb', (gltf) => {
      const robotHand = setupModel(gltf);
      robotHand.position.set(5, 0.3, -4);
      robotHand.scale.set(1, 1, 1);
      robotHand.rotation.x = Math.PI / 2; // Make it horizontal (lying flat)
      robotHand.rotation.y = Math.PI / 4; // Slight angle for presentation
      robotHand.name = 'robot-hand-prop';
      robotHand.userData.pickupId = 'robot_hand';
      robotHand.userData.displayName = 'Robot Hand';
      robotHand.userData.isPickable = true;
      group.add(robotHand);
      pickableObjects.push(robotHand);
      roomObjects.robot_hand = robotHand;
      registerOriginalModel('robot_hand', robotHand);
  });

  // AI Manual - Load real book model
  loader.load('/models/book.glb', (gltf) => {
      const aiBook = setupModel(gltf);
      aiBook.name = 'ai-book-prop';
    // Start at desired X/Z; Y will be set after we compute the base
    aiBook.position.set(-5, 0.0, 3.5);
    // Reset rotation; we'll orient to lay flat, then apply a small yaw
    aiBook.rotation.set(0, 0, 0);
      // Auto-scale: make the longest side ~0.3m so it fits hand-sized
      try {
        // Auto-scale: target 30cm longest side
        aiBook.updateMatrixWorld(true);
        let box = new THREE.Box3().setFromObject(aiBook);
        const size = new THREE.Vector3();
        box.getSize(size);
        const currentMax = Math.max(size.x, size.y, size.z);
        const targetMax = 0.3;
        if (currentMax > 0) {
          const s = targetMax / currentMax;
          aiBook.scale.setScalar(s);
        }

        // Orient to lay flat on the ground: make the thinnest dimension vertical (Y)
        box = new THREE.Box3().setFromObject(aiBook);
        box.getSize(size);
        const dims = [ {axis:'x', v:size.x}, {axis:'y', v:size.y}, {axis:'z', v:size.z} ];
        dims.sort((a,b)=>a.v-b.v);
        const thinnest = dims[0].axis;
        if (thinnest === 'x') {
          // Rotate so X (thickness) becomes up (Y)
          aiBook.rotation.z = Math.PI / 2;
        } else if (thinnest === 'z') {
          // Rotate so Z (thickness) becomes up (Y)
          aiBook.rotation.x = -Math.PI / 2;
        } // if 'y', already vertical

        // Apply a small yaw to angle it slightly
        aiBook.rotation.y += Math.PI / 8;

        // Now place it so the bottom sits exactly on the floor top
        aiBook.updateMatrixWorld(true);
        box = new THREE.Box3().setFromObject(aiBook);
        const min = box.min;
        const targetY = (floor?.position?.y || 0) + 0.1; // floor is 0.2 thick, centered at y=0 -> top at 0.1
        const dy = targetY - min.y;
        aiBook.position.y += dy + 0.001; // small epsilon to avoid z-fighting
      } catch (e) {
        // Fallback orientation & scale
        aiBook.rotation.x = Math.PI / 2;
        aiBook.rotation.y = Math.PI / 8;
        aiBook.scale.set(0.06, 0.06, 0.06);
        aiBook.position.y = ((floor?.position?.y || 0) + 0.101);
      }

      // Pickup metadata
      aiBook.userData.pickupId = 'ai_book';
      aiBook.userData.displayName = 'AI Manual';
      aiBook.userData.isPickable = true;

      group.add(aiBook);
      pickableObjects.push(aiBook);
      roomObjects.ai_book = aiBook;
      registerOriginalModel('ai_book', aiBook);
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
    { text: 'Robot Hand = 12', pos: new THREE.Vector3(-3.5, 1.4, wallZ) },
    { text: 'Circuit Board = 5', pos: new THREE.Vector3(-1.2, 1.1, wallZ) },
    { text: 'AI Manual = 4', pos: new THREE.Vector3(1.2, 0.9, wallZ) },
    { text: 'Robot Eye = 3', pos: new THREE.Vector3(3.2, 0.8, wallZ) }
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

  // Additional cryptic hidden messages (visible with glasses)
  const addHiddenMessage = (text, position, scale = new THREE.Vector2(0.9, 0.22)) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = '#0aefff'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#8fe9ff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 38px Segoe UI';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.0, color: 0xffffff });
    const geo = new THREE.PlaneGeometry(scale.x, scale.y);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.rotation.y = 0;
    mesh.name = `room2-hidden-${text.replace(/\W+/g, '-')}`;
    group.add(mesh);
    hiddenClues.push(mesh);
  };

  addHiddenMessage("DON'T TRUST ITS VOICE", new THREE.Vector3(2.2, 1.2, -5.85));
  addHiddenMessage('HELP', new THREE.Vector3(-0.2, 0.7, -5.85), new THREE.Vector2(0.5, 0.2));
  addHiddenMessage('I AM IN THE WIRES', new THREE.Vector3(-3.2, 1.5, -5.85));
  // (Removed) overturned chair, restraint loops, caution tape, and hologram projector


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

  // ================================
  // Room 2 Laptop Brief UI
  // ================================
  function openRoom2LaptopBrief() {
    if (window.disablePlayerControls) return;
    if (!r2LaptopEl) {
      r2LaptopEl = document.createElement('div');
      r2LaptopEl.id = 'room2-laptop-brief';
      r2LaptopEl.style.cssText = 'position:fixed; inset:0; z-index:9998; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.6); font-family:Segoe UI,system-ui,Arial; color:#eaf2ff;';
      r2LaptopEl.innerHTML = `
        <div style="width:720px; background:#0d1219; border:1px solid #1d2734; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,.5);">
          <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #1d2734;">
            <div>Terminal: Room 2 — Equilibrium Node</div>
            <div>
              <button id="r2lb-check" style="margin-right:8px;padding:6px 10px;background:#162132;border:1px solid #29354a;color:#cfe3ff;border-radius:6px;cursor:pointer;">Refresh</button>
              <button id="r2lb-close" style="padding:6px 10px;background:#1e2a3d;border:1px solid #2c3a52;color:#eaf2ff;border-radius:6px;cursor:pointer;">Close</button>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 260px; gap:12px; padding:14px;">
            <div>
              <div id="r2lb-status" style="background:#0b1017;border:1px solid #1a2330;border-radius:8px;padding:10px;margin-bottom:10px;"></div>
              <div style="background:#0b1017;border:1px solid #1a2330;border-radius:8px;padding:10px;">
                <div style="opacity:.85;margin-bottom:6px;">Riddle</div>
                <div style="font-style:italic;color:#cddcff">
                  “When numbers wear shapes and truth rides the wire,<br/>
                  the wall will listen only once the scales stop to breathe.”
                </div>
              </div>
            </div>
            <div style="background:#0b1017;border:1px solid #1a2330;border-radius:8px;padding:10px;">
              <div style="opacity:.85;margin-bottom:6px;">Schematic Doodle</div>
              <canvas id="r2lb-canvas" width="240" height="160" style="width:240px;height:160px;background:#0a0f16;border-radius:6px;border:1px solid #1a2330;"></canvas>
              <div style="opacity:.65;font-size:12px;margin-top:6px;">A whisper: pair differs, then invite the third.</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(r2LaptopEl);

      // Draw tiny XOR→OR doodle (no spoilers, just theme)
      const c = r2LaptopEl.querySelector('#r2lb-canvas');
      const ctx = c.getContext('2d');
      const grid = () => {
        ctx.strokeStyle = 'rgba(180,200,230,0.08)'; ctx.lineWidth = 1;
        for (let x=0;x<c.width;x+=16){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,c.height);ctx.stroke();}
        for (let y=0;y<c.height;y+=16){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(c.width,y);ctx.stroke();}
      };
      const port = (x,y)=>{ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();ctx.stroke();};
      const wire = (x1,y1,x2,y2,color='#cfe3ff')=>{
        const dx=Math.max(20,Math.abs(x2-x1)*.5);
        ctx.strokeStyle=color; ctx.lineWidth=3; ctx.beginPath();
        ctx.moveTo(x1,y1); ctx.bezierCurveTo(x1+dx,y1, x2-dx,y2, x2,y2); ctx.stroke();
      };
      const orGate=(x,y)=>{ctx.strokeStyle='#000';ctx.fillStyle='#fff';ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(x-18,y-12);ctx.bezierCurveTo(x+13,y-12,x+18,y+12,x-18,y+12);ctx.bezierCurveTo(x-26,y+12,x-26,y-12,x-18,y-12);ctx.fill();ctx.stroke();
        ctx.beginPath();ctx.moveTo(x-8,y-12);ctx.bezierCurveTo(x+26,y-5,x+26,y+5,x-8,y+12);ctx.stroke();
        port(x-22,y-8);port(x-22,y+8);port(x+20,y);
      };
      const xorGate=(x,y)=>{ctx.strokeStyle='#000';ctx.fillStyle='#fff';ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(x-16,y-12);ctx.bezierCurveTo(x+10,y-12,x+16,y+12,x-16,y+12);ctx.bezierCurveTo(x-24,y+12,x-24,y-12,x-16,y-12);ctx.fill();ctx.stroke();
        ctx.beginPath();ctx.moveTo(x-20,y-12);ctx.bezierCurveTo(x+2,y-11,x+2,y+11,x-20,y+12);ctx.stroke();
        port(x-20,y-8);port(x-20,y+8);port(x+18,y);
      };
      grid(); xorGate(90,80); orGate(170,80);
      port(40,64); port(40,96); wire(40,64,70,68,'#ff6262'); wire(40,96,70,92,'#cfe3ff');
      wire(108,80,140,80,'#ff6262'); wire(188,80,220,80,'#cfe3ff');

      // Close/Refresh
      const closeBtn = r2LaptopEl.querySelector('#r2lb-close');
      const refreshBtn = r2LaptopEl.querySelector('#r2lb-check');
      closeBtn.addEventListener('click', () => closeRoom2LaptopBrief());
      refreshBtn.addEventListener('click', () => renderLaptopStatus());
    }

    renderLaptopStatus();
    r2LaptopEl.style.display = 'flex';
    window.disablePlayerControls = true;
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    document.body.style.cursor = 'default';
  }

  function closeRoom2LaptopBrief() {
    if (!r2LaptopEl) return;
    r2LaptopEl.style.display = 'none';
    window.disablePlayerControls = false;
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = '';
  }

  function renderLaptopStatus() {
    if (!r2LaptopEl) return;
    const s = room2Puzzles.scalePuzzleComplete ? 'Still' : 'Wanders';
    const wall = room2Puzzles.scalePuzzleComplete ? 'Awakened' : 'Asleep';
    const pass = room2Puzzles.logicPuzzleComplete ? 'Open' : 'Awaiting';
    const html = `
      <div style="display:grid;grid-template-columns:140px 1fr;row-gap:6px;column-gap:10px;">
        <div style="opacity:.75">Equilibrium</div><div>${s}</div>
        <div style="opacity:.75">Wall Screen</div><div>${wall}</div>
        <div style="opacity:.75">Pass Latch</div><div>${pass}</div>
      </div>
      <div style="opacity:.7;font-size:12px;margin-top:8px">
        “The wall sleeps until the scales fall still.”
      </div>
    `;
    r2LaptopEl.querySelector('#r2lb-status').innerHTML = html;
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

  function handleEKeyInteraction(player) {
    if (window.disablePlayerControls) return false;

    // Check logic screen interaction first (use actual display mesh world position)
    const screenMesh = group.getObjectByName('logic-screen-display') || group.getObjectByName('logic-screen');
    if (screenMesh) {
      const screenWorldPos = new THREE.Vector3();
      screenMesh.getWorldPosition(screenWorldPos);
      const distanceToScreen = player.position.distanceTo(screenWorldPos);
      
      if (distanceToScreen < 3.0) {
        if (!room2Puzzles.scalePuzzleComplete) {
          if (window.AI) window.AI.say('When the scales hold their breath, the wall will find its voice.');
          return true; // consume interaction
        }
        if (logicGatePuzzle) {
          logicGatePuzzle.open();
        }
        return true;
      }
    }

    // Check laptop interaction (for future use)
    const laptop = group.getObjectByName('reusable-laptop');
    if (laptop) {
      const laptopWorldPos = new THREE.Vector3();
      laptop.getWorldPosition(laptopWorldPos);
      const distanceToLaptop = player.position.distanceTo(laptopWorldPos);
      
      if (distanceToLaptop < 3.0) {
        if (laptop.userData && laptop.userData.onInteract) {
          laptop.userData.onInteract();
        }
        return true;
      }
    }

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
              AI.showInteractionFeedback(`Picked up: ${displayName}`);
              if (root.parent) root.parent.remove(root);
              const idx = pickableObjects.indexOf(root);
              if (idx >= 0) pickableObjects.splice(idx, 1);
            } else {
              AI.showInteractionFeedback('My inventory is full.');
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

    return false;
  }

  function handleFKeyInteraction(player) {
    if (window.disablePlayerControls) return false;
    if (!noteBaseMesh || !noteInkMesh) return false;

    // Proximity to note
    const notePos = noteBaseMesh.getWorldPosition(tmpVec.set(0, 0, 0));
    const dist = player.position.distanceTo(notePos);
    if (dist > 1.1) return false;

    // Simply reveal the note when F is pressed near it
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
    // Safety: if both core puzzles are complete but completion flow hasn't run (e.g., after a reload), trigger it.
    try {
      if (!gameStore.rooms.room2.isComplete && room2Puzzles.scalePuzzleComplete && room2Puzzles.logicPuzzleComplete && !logicKeyAwarded) {
        checkRoom2Completion();
      }
    } catch(e) {}

    // Animate note ink fade if in progress
    if (noteInkMesh && noteRevealProgress < 1) {
      if (noteRevealProgress > 0) {
        noteRevealProgress = Math.min(1, noteRevealProgress + deltaTime / 0.8);
        noteInkMesh.material.opacity = noteRevealProgress;
        noteInkMesh.material.needsUpdate = true;
      }
    }

    // (Removed) flicker and hologram pulse animations

    // Update scale puzzle animations
    if (scalePuzzle) scalePuzzle.update(deltaTime);

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

    // Logic screen prompt (use display mesh position)
    const screenMesh2 = group.getObjectByName('logic-screen-display') || group.getObjectByName('logic-screen');
    if (screenMesh2) {
      const sp = new THREE.Vector3();
      screenMesh2.getWorldPosition(sp);
      const dScreen = activePlayer.position.distanceTo(sp);
      if (dScreen < 3.0) {
        if (room2Puzzles.scalePuzzleComplete) {
          showPrompt('[E] Open Logic Puzzle');
        } else {
          showPrompt('The wall sleeps until the scales fall still');
        }
        return;
      }
    }

    // Laptop prompt (for future use)
    const laptop = group.getObjectByName('reusable-laptop');
    if (laptop) {
      const lp = new THREE.Vector3();
      laptop.getWorldPosition(lp);
      const dLaptop = activePlayer.position.distanceTo(lp);
      if (dLaptop < 3.0) {
        showPrompt('[E] Use Laptop');
        return;
      }
    }

    // Check scale prompt
    if (playerNearScale(activePlayer)) {
      showPrompt('[E] Use Scale');
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
        showPrompt('[F] Read Note');
        return;
      }
    }

    showPrompt('');
  }

  // Dispose method for cleanup
  function dispose() {
    // Remove laptop brief if present
    if (r2LaptopEl && r2LaptopEl.parentNode) {
      r2LaptopEl.parentNode.removeChild(r2LaptopEl);
      r2LaptopEl = null;
    }
    // Import dispose helper
    import('./utils/DisposeHelper.js').then(({ disposeGroup, removeElement }) => {
      disposeGroup(group);
      
      // Remove prompt element if it exists
      removeElement('interactPrompt');
      removeElement('room2-laptop-brief');
    });
    
    // Dispose of puzzles
    if (scalePuzzle && typeof scalePuzzle.dispose === 'function') {
      scalePuzzle.dispose();
    }
    if (logicGatePuzzle && typeof logicGatePuzzle.dispose === 'function') {
      logicGatePuzzle.dispose();
    }
    
    // Clear arrays
    pickableObjects.length = 0;
    hiddenClues.length = 0;
  // (Removed) flicker/hologram state cleanup
    
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
