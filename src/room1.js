import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addToInventory, hasInInventory, getPlayerInventory } from './player.js';
import { createWirePanel } from './puzzles/wirePanel.js';
import { createSimonStand } from './rooms/Room1/SimonStand.js';
import { createBookshelfDoor } from './rooms/Room1/BookshelfDoor.js';
import { gameStore } from './state/gameStore.js';
import { memoryPanel } from './ui/MemoryPanel.js';
import {
  buildStandardLightRig,
  removeExistingLights,
} from './lighting/standardLighting.js';
import { makeTiles136cFloor, makeTiles136cWall, makeTiles136cCeiling, makeSolarPanelWall, makeTiles002Floor } from './materials/room1Materials.js';
import { makeConcrete031MaterialFlexible } from './materials/room0Materials.js';
import { createReusableHallway, HallwayPresets } from './components/ReusableHallway.js';
import { DrawerManager } from './components/DrawerManager.js';


export function createRoom1() {
  const group = new THREE.Group();
  group.name = 'room1';
  
  // Create shared GLTFLoader instance for better performance
  const gltfLoader = new GLTFLoader();

  // Room state for interactions (declare early so loaders can assign)
  const state = {
    safeOpened: false,
    safeObject: null,
    keypadOpen: false,
    inputCode: '',
    laptopPowered: false,  // Track if laptop has power
    chargerFound: false,   // Track if charger has been found
    laptopInspected: false, // Track if laptop has been inspected while unpowered
    gammaMessageShown: false, // Track if Gamma's first message has been shown
    tableDrawer: null // Drawer animation state: { mixer, actions, topOpened, bottomOpened, topDrawerObj, bottomDrawerObj }
  };

  // Solar Panel texture files for Room 1 walls
  const solarPanelFiles = {
    color: "/textures/solar-panel/SolarPanel003_2K-JPG_Color.jpg",
    normal: "/textures/solar-panel/SolarPanel003_2K-JPG_NormalGL.jpg",
    rough: "/textures/solar-panel/SolarPanel003_2K-JPG_Roughness.jpg",
    metalness: "/textures/solar-panel/SolarPanel003_2K-JPG_Metalness.jpg",
    displacement: "/textures/solar-panel/SolarPanel003_2K-JPG_Displacement.jpg"
  };

  // Tiles002 texture files for Room 1 floor
  const tiles002Files = {
    color: "/textures/tiles002/Tiles002_1K-JPG_Color.jpg",
    normal: "/textures/tiles002/Tiles002_1K-JPG_NormalGL.jpg",
    rough: "/textures/tiles002/Tiles002_1K-JPG_Roughness.jpg",
    displacement: "/textures/tiles002/Tiles002_1K-JPG_Displacement.jpg"
  };

  // Tiles136C texture files for Room 1 (keeping for reference)
  const tiles136cFiles = {
    color: "/textures/tiles136C/Tiles136C_2K-JPG_Color.jpg",
    normal: "/textures/tiles136C/Tiles136C_2K-JPG_NormalGL.jpg",
    rough: "/textures/tiles136C/Tiles136C_2K-JPG_Roughness.jpg",
    ao: "/textures/tiles136C/Tiles136C_2K-JPG_AmbientOcclusion.jpg"
  };

  // Concrete031 texture files for hallway
  const concrete031Files = {
    color: "/textures/concrete031/Concrete031_2K-JPG_Color.jpg",
    normal: "/textures/concrete031/Concrete031_2K-JPG_NormalGL.jpg",
    rough: "/textures/concrete031/Concrete031_2K-JPG_Roughness.jpg",
    ao: "/textures/concrete031/Concrete031_2K-JPG_AmbientOcclusion.jpg",
    disp: "/textures/concrete031/Concrete031_2K-JPG_Displacement.jpg"
  };

  // Tiles002 floor for Room 1
  function createTiles002Floor() {
    const floorGeometry = new THREE.BoxGeometry(18, 0.2, 18);
    const floorMaterial = makeTiles002Floor(18, 18, tiles002Files, {
      tileSizeMeters: 1.0,
      anisotropy: 16,
      metalness: 0.0,
      roughness: 0.8,
      normalScale: new THREE.Vector2(0.6, 0.6)
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, 0, 0); // Position slightly below center to align with hallway
    floor.receiveShadow = true;
    floor.name = 'room1-floor';
    group.add(floor);
  }
  createTiles002Floor();

  // Solar panel wall material for Room 1
  const wallMat = makeSolarPanelWall(18, 4, solarPanelFiles, {
    tileSizeMeters: 1.0,
    anisotropy: 16,
    metalness: 0.8,
    roughness: 0.3,
    normalScale: new THREE.Vector2(0.5, 0.5)
  });

  // Back wall - Solid wall spanning full width
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 0.2), wallMat);
  backWall.position.set(0, 2, -9); // Centered
  backWall.userData = { type: 'wall', side: 'back' };
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);



  // Front wall - single continuous wall
  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 0.2), wallMat);
  frontWall.position.set(0, 2, 9);
  frontWall.userData = { type: 'wall', side: 'front' };
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  group.add(frontWall);

  // Side walls - Left wall with opening for hub hallway
  const wall3_part1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 8), wallMat);
  wall3_part1.position.set(-9, 2, 5); // From z=1 to z=9
  wall3_part1.userData = { type: 'wall', side: 'left-part1' };
  wall3_part1.castShadow = true;
  wall3_part1.receiveShadow = true;
  group.add(wall3_part1);

  const wall3_part2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 8), wallMat);
  wall3_part2.position.set(-9, 2, -5); // From z=-1 to z=-9
  wall3_part2.userData = { type: 'wall', side: 'left-part2' };
  wall3_part2.castShadow = true;
  wall3_part2.receiveShadow = true;
  group.add(wall3_part2);

  const wall4 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 18), wallMat);
  wall4.position.set(9, 2, 0);
  wall4.userData = { type: 'wall', side: 'right' };
  wall4.castShadow = true;
  wall4.receiveShadow = true;
  group.add(wall4);

  // Header panel above the opening in the left wall (West wall)
  const headerWest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 2), wallMat);
  headerWest.position.set(-9, 4.25, 0);
  headerWest.castShadow = true;
  headerWest.receiveShadow = true;
  group.add(headerWest);

  // Detailed industrial pillars with unique color scheme
  function createDetailedPillarMaterial() {
    const pillarCanvas = document.createElement('canvas');
    pillarCanvas.width = 256;
    pillarCanvas.height = 256;
    const ctx = pillarCanvas.getContext('2d');
    
    // Base pillar color (greenish-gray, different from walls)
    ctx.fillStyle = '#3a4a3a'; // Slightly lighter greenish-gray
    ctx.fillRect(0, 0, pillarCanvas.width, pillarCanvas.height);
    
    // Add vertical concrete texture
    ctx.strokeStyle = '#2a3a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 32, 0);
      ctx.lineTo(i * 32, pillarCanvas.height);
      ctx.stroke();
    }
    
    // Add horizontal bands (reinforcement)
    ctx.strokeStyle = '#1a2a1a';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 64);
      ctx.lineTo(pillarCanvas.width, i * 64);
      ctx.stroke();
    }
    
    // Add weathering spots
    ctx.fillStyle = '#2a3a2a';
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * pillarCanvas.width;
      const y = Math.random() * pillarCanvas.height;
      const size = Math.random() * 4 + 1;
      ctx.fillRect(x, y, size, size);
    }
    
    const pillarTexture = new THREE.CanvasTexture(pillarCanvas);
    pillarTexture.wrapS = THREE.RepeatWrapping;
    pillarTexture.wrapT = THREE.RepeatWrapping;
    pillarTexture.repeat.set(1, 4);
    
    return new THREE.MeshStandardMaterial({
      map: pillarTexture,
      color: 0x3a4a3a,
      roughness: 0.8,
      metalness: 0.1,
      normalScale: new THREE.Vector2(0.4, 0.4)
    });
  }
  
  const pillarMat = createDetailedPillarMaterial();
  const pillarGeometry = new THREE.CylinderGeometry(0.25, 0.25, 4.2, 16);

  const pillarPositions = [
    [-8.7, 2.1, -8.7],
    [8.7, 2.1, -8.7],
    [-8.7, 2.1, 8.7],
    [8.7, 2.1, 8.7]
  ];

  pillarPositions.forEach(pos => {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMat);
    pillar.position.set(...pos);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
  });

  // Add graffiti to walls
  function addGraffiti() {
    // "DON'T TRUST IT" scratched near exit (back wall)
    const graffitiGeometry = new THREE.PlaneGeometry(3, 0.5);
    const graffitiCanvas = document.createElement('canvas');
    graffitiCanvas.width = 512;
    graffitiCanvas.height = 128;
    const ctx = graffitiCanvas.getContext('2d');
    
    // Dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, graffitiCanvas.width, graffitiCanvas.height);
    
    // Scratched text
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 24px monospace';
    ctx.fillText("DON'T TRUST IT", 20, 80);
    
    const graffitiTexture = new THREE.CanvasTexture(graffitiCanvas);
    graffitiTexture.colorSpace = THREE.SRGBColorSpace;
    const graffitiMaterial = new THREE.MeshBasicMaterial({
      map: graffitiTexture,
      transparent: true,
      opacity: 0.7
    });
    
    const graffiti = new THREE.Mesh(graffitiGeometry, graffitiMaterial);
    graffiti.position.set(-2, 1.5, -8.9); // Back wall, slightly hidden
    graffiti.rotation.x = -0.1; // Slight tilt
    group.add(graffiti);
  }
  addGraffiti();

  // Add tally marks in corner
  function addTallyMarks() {
    const tallyGeometry = new THREE.PlaneGeometry(1, 1);
    const tallyCanvas = document.createElement('canvas');
    tallyCanvas.width = 256;
    tallyCanvas.height = 256;
    const ctx = tallyCanvas.getContext('2d');
    
    // Dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, tallyCanvas.width, tallyCanvas.height);
    
    // Tally marks (scratched)
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.moveTo(20 + i * 15, 30);
      ctx.lineTo(20 + i * 15, 80);
    }
    ctx.stroke();
    
    const tallyTexture = new THREE.CanvasTexture(tallyCanvas);
    tallyTexture.colorSpace = THREE.SRGBColorSpace;
    const tallyMaterial = new THREE.MeshBasicMaterial({
      map: tallyTexture,
      transparent: true,
      opacity: 0.6
    });
    
    const tally = new THREE.Mesh(tallyGeometry, tallyMaterial);
    tally.position.set(-8.8, 0.8, -8.8); // Corner
    tally.rotation.y = Math.PI / 4; // Angled
    group.add(tally);
  }
  addTallyMarks();

  // Add burnt schematics on floor
  function addBurntSchematics() {
    const schematicGeometry = new THREE.PlaneGeometry(2, 1.5);
    const schematicCanvas = document.createElement('canvas');
    schematicCanvas.width = 256;
    schematicCanvas.height = 192;
    const ctx = schematicCanvas.getContext('2d');
    
    // Burnt paper background
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(0, 0, schematicCanvas.width, schematicCanvas.height);
    
    // Burnt edges
    ctx.fillStyle = '#0a0000';
    ctx.fillRect(0, 0, 20, schematicCanvas.height);
    ctx.fillRect(schematicCanvas.width - 20, 0, 20, schematicCanvas.height);
    
    // Faint schematic lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 50);
    ctx.lineTo(200, 50);
    ctx.moveTo(30, 100);
    ctx.lineTo(180, 100);
    ctx.stroke();
    
    const schematicTexture = new THREE.CanvasTexture(schematicCanvas);
    schematicTexture.colorSpace = THREE.SRGBColorSpace;
    const schematicMaterial = new THREE.MeshBasicMaterial({
      map: schematicTexture,
      transparent: true,
      opacity: 0.8
    });
    
    const schematic = new THREE.Mesh(schematicGeometry, schematicMaterial);
    schematic.position.set(3, 0.15, 2); // Slightly higher on floor
    schematic.rotation.x = -Math.PI / 2;
    schematic.rotation.z = 0.2; // Slightly rotated
    group.add(schematic);
  }
  addBurntSchematics();

  // Add broken consoles
  function addBrokenConsoles() {
    // Console 1 (broken)
    const console1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.8, 0.6),
      new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.9,
        metalness: 0.1
      })
    );
    console1.position.set(-6, 0.4, 6);
    console1.castShadow = true;
    console1.receiveShadow = true;
    group.add(console1);
    
    // Broken screen
    const brokenScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.6),
      new THREE.MeshStandardMaterial({
        color: 0x001100,
        emissive: 0x001100,
        emissiveIntensity: 0.1
      })
    );
    brokenScreen.position.set(-6, 0.8, 6.31);
    group.add(brokenScreen);
    
    // Console 2 (more broken)
    const console2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.6, 0.5),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.9,
        metalness: 0.05
      })
    );
    console2.position.set(6, 0.3, -6);
    console2.rotation.y = Math.PI / 4; // Angled
    console2.castShadow = true;
    console2.receiveShadow = true;
    group.add(console2);
  }
  addBrokenConsoles();

  // Add paper clutter to Room 1 (optimized - reduced count and delayed loading)
  function addPaperClutter() {
    // Use the shared GLTFLoader instance
    
    // Reduced paper count for better performance
    const paperPositions = [
      { pos: [-2, 0.15, -3], rot: [0, Math.PI / 4, 0], scale: 1.6 },
      { pos: [1, 0.15, 1], rot: [0, -Math.PI / 3, 0], scale: 1.2 },
      { pos: [-5, 0.15, 2], rot: [0, Math.PI / 6, 0], scale: 1.4 },
      { pos: [3, 0.15, -1], rot: [0, -Math.PI / 4, 0], scale: 1.8 },
      { pos: [-1, 0.15, 4], rot: [0, Math.PI / 2, 0], scale: 1.0 }
    ];
    
    // Load paper model once, then clone for performance
    gltfLoader.load('/models/paper.glb', (gltf) => {
      const basePaperModel = gltf.scene;
      
      // Set up base model shadows
      basePaperModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Clone and position papers
      paperPositions.forEach((paperData, index) => {
        const paperModel = basePaperModel.clone();
        
        // Apply transformations
        paperModel.position.set(...paperData.pos);
        paperModel.rotation.set(...paperData.rot);
        paperModel.scale.setScalar(paperData.scale);
        
        // Add slight random variation to make each paper unique
        paperModel.position.x += (Math.random() - 0.5) * 0.3;
        paperModel.position.z += (Math.random() - 0.5) * 0.3;
        paperModel.rotation.y += (Math.random() - 0.5) * 0.2;
        
        paperModel.name = `paper-clutter-${index}`;
        group.add(paperModel);
      });
    }, undefined, (err) => {
      console.error('Failed to load paper model:', err);
    });
  }
  
  // Delay paper clutter loading to improve initial performance
  setTimeout(() => {
    addPaperClutter();
  }, 2000);

  // Room 1: Ceiling removed - now using global skybox
  // Ceiling light fixture removed - now using global lighting

  // --- Room 1 original lighting system ---
  {
    // Remove any leftover lights under this room group (if any slipped through)
    removeExistingLights(group);

    // Add original Room 1 lighting system
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    ambientLight.name = 'ambient-light';
    group.add(ambientLight);

    const ceilingLight = new THREE.PointLight(0xffffff, 1.5, 25);
    ceilingLight.position.set(0, 4, 0);
    ceilingLight.name = 'ceiling-light';
    ceilingLight.castShadow = true;
    ceilingLight.shadow.mapSize.width = 512;
    ceilingLight.shadow.mapSize.height = 512;
    ceilingLight.shadow.camera.near = 0.1;
    ceilingLight.shadow.camera.far = 25;
    group.add(ceilingLight);

    // Add optimized fill lights for better illumination (reduced for performance)
    const fillLight1 = new THREE.PointLight(0xffffff, 0.4, 15);
    fillLight1.position.set(-6, 3, -6);
    fillLight1.castShadow = false; // No shadows for fill lights
    group.add(fillLight1);

    const fillLight2 = new THREE.PointLight(0xffffff, 0.4, 15);
    fillLight2.position.set(6, 3, 6);
    fillLight2.castShadow = false; // No shadows for fill lights
    group.add(fillLight2);
  }

  // Room 1: Lighting controller setup
  const lights = {
    ambient: group.getObjectByName('ambient-light'),
    ceiling: group.getObjectByName('ceiling-light'),
    spot: null, // Not used in Room 1
    fillLights: [] // Store fill lights for toggling
  };

  // Store fill lights for toggling
  group.traverse((child) => {
    if (child.isPointLight && child !== lights.ceiling) {
      lights.fillLights.push(child);
    }
  });
  
  // Legacy light properties (kept for compatibility but not used)
  // lights.spot.distance = 12;
  // lights.spot.position.set(0, 3.8, 0);
  // lights.spot.target.position.set(0, 0, 0);
  // lights.spot.castShadow = true;
  // lights.spot.shadow.mapSize.width = 256;
  // lights.spot.shadow.mapSize.height = 256;
  // lights.spot.shadow.camera.near = 0.1;
  // lights.spot.shadow.camera.far = 15;

  // Legacy light additions (commented out - using standard rig instead)
  // group.add(lights.ambient);
  // group.add(lights.ceiling);
  // group.add(lights.spot);
  // group.add(lights.spot.target);

  // Swivel cameras removed - they were floating black cylinder objects

  // Wire Panel System
  const wirePanel = createWirePanel({ order: ['R','G','B','Y'], useGLBModel: true });
  wirePanel.group.name = 'wirePanel';
  wirePanel.group.position.set(0, 0.8, 8.2); // Position on the front wall (opposite to back wall)
  wirePanel.group.rotation.y = Math.PI; // Face into the room (from the front wall)
  group.add(wirePanel.group);
  
  // Add a visible marker for debugging
  const markerGeometry = new THREE.SphereGeometry(0.2, 8, 6);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const wirePanelMarker = new THREE.Mesh(markerGeometry, markerMaterial);
  wirePanelMarker.position.set(0, 0.8, 8.2);
  wirePanelMarker.name = 'wirePanelMarker';
  group.add(wirePanelMarker);
  
  console.log('Wire Panel initialized:', {
    exists: !!wirePanel,
    groupExists: !!wirePanel.group,
    position: wirePanel.group.position.clone(),
    name: wirePanel.group.name,
    markerAdded: true
  });

  // Simon Stand System - positioned on right wall, below wire panel
  const simonStand = createSimonStand([8.2, 0, 0]); // Right wall, aligned with green grid line
  simonStand.name = 'simonStand';
  simonStand.visible = false; // Start invisible until wire puzzle is completed
  group.add(simonStand);
  
  // Add a visible marker for debugging (hidden initially)
  const simonMarkerGeometry = new THREE.SphereGeometry(0.15, 8, 6);
  const simonMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const simonStandMarker = new THREE.Mesh(simonMarkerGeometry, simonMarkerMaterial);
  simonStandMarker.position.set(8.2, 0, 0);
  simonStandMarker.name = 'simonStandMarker';
  simonStandMarker.visible = false; // Hide marker initially
  group.add(simonStandMarker);
  
  console.log('Simon Stand initialized:', {
    exists: !!simonStand,
    position: simonStand.position.clone(),
    name: simonStand.name,
    markerAdded: true
  });
  
  // Bookshelf Door - positioned on left wall, away from light switch
  const bookshelfDoor = createBookshelfDoor();
  bookshelfDoor.position.set(-8.2, 0, -4.5); // Nudge into room slightly to avoid wall clipping
  bookshelfDoor.rotation.y = Math.PI / 2; // Rotate to face into the room
  bookshelfDoor.name = 'bookshelfDoor';
  group.add(bookshelfDoor);

  // Add an office chair in front of the sci-fi desk (Room 1)
  gltfLoader.load('/models/office_chair.glb', (gltf) => {
    const chair = gltf.scene;
    chair.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Position in front of desk on the room side; match desk z
    chair.position.set(-7.4, 0.9, -4.5);
    chair.rotation.y = -Math.PI / 2; 
    chair.scale.set(1.1, 1.1, 1.1);
    chair.name = 'desk-chair';
    group.add(chair);
  }, undefined, (err) => {
    console.error('Failed to load office_chair.glb', err);
  });
  
  
  // Add floating tooltip for locked Simon Stand
  function createSimonStandTooltip() {
    const tooltip = document.createElement('div');
    tooltip.id = 'simonStandTooltip';
    tooltip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(11, 18, 32, 0.8);
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #cbd5e1;
      font-size: 12px;
      z-index: 1000;
      display: none;
      pointer-events: none;
      font-family: sans-serif;
    `;
    tooltip.textContent = 'Complete the wire puzzle first.';
    document.body.appendChild(tooltip);
    return tooltip;
  }
  
  const simonStandTooltip = createSimonStandTooltip();

  // Wire panel interaction functions
  function onRoom1Click(intersection, opts) {
    if (!intersection || !intersection.object) return false;
    
    // Check if the clicked object is the wire panel trigger
    if (intersection.object.userData.type === 'wire-panel-trigger') {
      console.log('Wire panel trigger clicked - opening popup');
      wirePanel.openPanel();
      return true;
    }
    
    // Check if the clicked object is the Simon Stand
    if (intersection.object.userData.type === 'simonStand') {
      console.log('Simon Stand clicked');
      const { wirePuzzleComplete, memoryPuzzleComplete } = gameStore;
      
      if (!wirePuzzleComplete) {
        // Show locked tooltip
        simonStandTooltip.style.display = 'block';
        setTimeout(() => {
          simonStandTooltip.style.display = 'none';
        }, 3000);
        return true;
      }
      
      if (memoryPuzzleComplete) {
        // Already completed
        if (window.AI) {
          window.AI.say("Memory training completed. The station is now offline.");
        }
        return true;
      }
      
      // Open memory UI
      gameStore.openMemoryUI();
      
      // Trigger AI dialogue for Simon puzzle start
      if (window.AI && window.AI.onSimonPuzzleStart) {
        window.AI.onSimonPuzzleStart();
      }
      
      return true;
    }
    
    return false;
  }

  // E-key interaction for wire panel
  function handleWirePanelEKey(playerObject) {
    console.log('Wire panel E-key check - wirePanel exists:', !!wirePanel);
    
    if (!wirePanel) {
      console.log('Wire panel not found');
      return false;
    }
    
    // Check if player is near the wire panel
    const panelWorldPos = new THREE.Vector3();
    wirePanel.group.getWorldPosition(panelWorldPos);
    const distance = playerObject.position.distanceTo(panelWorldPos);
    
    console.log('Wire panel distance check:', {
      playerPos: playerObject.position.clone(),
      panelPos: panelWorldPos.clone(),
      distance: distance,
      threshold: 3.0,
      isCloseEnough: distance < 3.0
    });
    
    if (distance < 3.0) { // Within 3 units of the panel
      console.log('Wire panel interaction triggered, isOpen:', wirePanel.state.isOpen);
      if (wirePanel.state.isOpen) {
        wirePanel.closePanel();
        console.log('Wire panel closed via E-key');
      } else {
        wirePanel.openPanel();
        console.log('Wire panel opened via E-key');
      }
      return true;
    }
    
    console.log('Wire panel too far away');
    return false;
  }

  function isWirePuzzleSolved() {
    return wirePanel.state.solved;
  }

  // Room 1: Create emissives list for bulbs, LEDs, and indicators
  const emissives = [];
  
  // Light fixture removed - now using global lighting

  // Room 1: Light switch system
  let lightsOn = true;
  let nearLightSwitch = false;
  let flickerTime = 0;
  
  function updateRoom1(dt) {
    // Update light switch proximity check
    checkLightSwitchProximity();
    
    // Update arrow pulse animation
    updateArrowPulse(dt);
    
    // Update light flicker effect
    updateLightFlicker(dt);
    
    // Update table glow effect
    updateTableGlow(dt);
    
    // Update bookshelf door animation
    if (bookshelfDoor && bookshelfDoor.userData.animate) {
      bookshelfDoor.userData.animate(dt);
    }
    
    // Update wire panel effects
    wirePanel.update(dt);
    
    // Update Simon Stand
    if (simonStand.userData.update) {
      simonStand.userData.update(dt);
    }
    // Update desk drawer animations
    if (state.drawerManager) state.drawerManager.update(dt);
  }
  
  // Optimized light flicker effect (reduced frequency for performance)
  function updateLightFlicker(dt) {
    if (!lightsOn) return; // Only flicker when lights are on
    
    flickerTime += dt;
    
    // Only update every ~16ms (60fps max) instead of every frame
    if (flickerTime < 0.016) return;
    flickerTime = 0;
    
    // Simplified hum effect (less frequent calculations)
    const humVariation = Math.sin(Date.now() * 0.12) * 0.03; // Reduced frequency and amplitude
    const baseIntensity = 1.0;
    
    // Reduced flicker frequency for performance
    let flickerIntensity = 1.0;
    if (Math.random() < 0.005) { // Reduced from 2% to 0.5% chance
      flickerIntensity = Math.random() * 0.4 + 0.3; // Less dramatic flicker
    }
    
    // Apply to ceiling light (cached reference)
    const ceilingLight = group.getObjectByName('ceiling-light');
    if (ceilingLight) {
      ceilingLight.intensity = baseIntensity + humVariation + (flickerIntensity - 1.0);
    }
    
    // Apply to light fixture bulb (get reference each time)
    const lightFixtureGroup = group.getObjectByName('ceiling-light-fixture');
    if (lightFixtureGroup) {
      const lightBulb = lightFixtureGroup.getObjectByName('light-bulb');
      if (lightBulb && lightBulb.material) {
        const newIntensity = 0.8 + humVariation * 0.3 + (flickerIntensity - 1.0) * 0.3;
        lightBulb.material.emissiveIntensity = Math.max(0.1, newIntensity);
      }
    }
  }
  
  // Table glow pulsing effect
  let tableGlowTime = 0;
  function updateTableGlow(dt) {
    if (!state.laptopTable || !state.tableGlowLight) return;
    
    tableGlowTime += dt;
    
    // Create a slow, breathing glow effect
    const pulseSpeed = 1.5;
    const pulseIntensity = 0.2 + Math.sin(tableGlowTime * pulseSpeed) * 0.15;
    
    // Update table material emissive intensity
    if (state.laptopTable.material) {
      state.laptopTable.material.emissiveIntensity = pulseIntensity;
    }
    
    // Update glow light intensity
    state.tableGlowLight.intensity = 0.3 + Math.sin(tableGlowTime * pulseSpeed * 1.2) * 0.2;
    
    // Update grid lines emissive intensity
    if (state.tableGridLines) {
      state.tableGridLines.children.forEach(line => {
        if (line.material) {
          line.material.emissiveIntensity = pulseIntensity * 0.8; // Slightly dimmer than table
        }
      });
    }
  }
  
  // Create grid lines extending from table to walls
  function createTableGridLines() {
    const lineGroup = new THREE.Group();
    lineGroup.name = 'table-grid-lines';
    
    // Create green material for completed lines
    const greenLineMat = new THREE.MeshStandardMaterial({ 
      color: 0x00ff7f,           // Bright green color
      emissive: 0x00ff7f,        // Bright green emissive glow
      emissiveIntensity: 0.8,    // High glow intensity for visibility
      metalness: 0.8,            // High metalness for sci-fi look
      roughness: 0.2,            // Low roughness for smooth surface
      envMapIntensity: 1.5,      // Enhanced environment reflections
      toneMapped: false          // Disable tone mapping for brighter colors
    });
    
    // Create red material for incomplete lines (memory game line)
    const redLineMat = new THREE.MeshStandardMaterial({ 
      color: 0xff4444,           // Bright red color
      emissive: 0xff4444,        // Bright red emissive glow
      emissiveIntensity: 0.8,    // High glow intensity for visibility
      metalness: 0.8,            // High metalness for sci-fi look
      roughness: 0.2,            // Low roughness for smooth surface
      envMapIntensity: 1.5,      // Enhanced environment reflections
      toneMapped: false          // Disable tone mapping for brighter colors
    });
    
    // Create purple material for admin desk line and memory game line when unlocked
    const purpleLineMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b5cf6,           // Purple color
      emissive: 0x8b5cf6,        // Bright purple emissive glow
      emissiveIntensity: 0.8,    // High glow intensity for visibility
      metalness: 0.8,            // High metalness for sci-fi look
      roughness: 0.2,            // Low roughness for smooth surface
      envMapIntensity: 1.5,      // Enhanced environment reflections
      toneMapped: false          // Disable tone mapping for brighter colors
    });
    
    // Table dimensions
    const tableWidth = 1.2;
    const tableDepth = 1.2;
    const lineHeight = 0.15; // Increased height for better visibility
    const lineWidth = tableWidth * 0.15; // 15% of table width for better visibility
    
    // Room dimensions (assuming 18x18 room)
    const roomSize = 18;
    const halfRoom = roomSize / 2;
    
    // Create 4 lines extending from table center to each wall
    const lines = [
      // North line (positive Z) - from table center to north wall
      { 
        geometry: new THREE.BoxGeometry(lineWidth, lineHeight, halfRoom),
        position: [0, 0.1, halfRoom / 2], // Higher Y position, correct Z calculation
        material: greenLineMat,
        name: 'grid-line-north'
      },
      // South line (negative Z) - from table center to south wall (sci-fi table line - starts purple)
      { 
        geometry: new THREE.BoxGeometry(lineWidth, lineHeight, halfRoom),
        position: [0, 0.1, -halfRoom / 2],
        material: purpleLineMat,
        name: 'grid-line-south'
      },
      // East line (positive X) - from table center to east wall (memory game line - starts red)
      { 
        geometry: new THREE.BoxGeometry(halfRoom, lineHeight, lineWidth),
        position: [halfRoom / 2, 0.1, 0],
        material: redLineMat,
        name: 'grid-line-east'
      },
      // West line (negative X) - from table center to west wall (starts green)
      { 
        geometry: new THREE.BoxGeometry(halfRoom, lineHeight, lineWidth),
        position: [-halfRoom / 2, 0.1, 0],
        material: greenLineMat,
        name: 'grid-line-west'
      }
    ];
    
    lines.forEach((lineData, index) => {
      const line = new THREE.Mesh(lineData.geometry, lineData.material);
      line.position.set(...lineData.position);
      line.name = lineData.name;
      lineGroup.add(line);
    });
    
    return lineGroup;
  }
  
  // Function to change east line from red to purple when wire puzzle is completed
  function changeEastLineToPurple() {
    if (state.tableGridLines) {
      const eastLine = state.tableGridLines.getObjectByName('grid-line-east');
      if (eastLine && eastLine.material) {
        // Change to purple material
        eastLine.material.color.setHex(0x8b5cf6);
        eastLine.material.emissive.setHex(0x4c1d95);
        console.log('East line changed to purple - wire puzzle completed!');
      }
    }
  }
  
  // Function to show memory game when wire puzzle is completed
  function showMemoryGame() {
    if (simonStand) {
      simonStand.visible = true;
      console.log('Memory game revealed - wire puzzle completed!');
    }
    // Also show the debug marker
    const simonStandMarker = group.getObjectByName('simonStandMarker');
    if (simonStandMarker) {
      simonStandMarker.visible = true;
    }
  }
  
  // Function to change west line from green to green when safe is opened (no change needed)
  function changeWestLineToGreen() {
    if (state.tableGridLines) {
      const westLine = state.tableGridLines.getObjectByName('grid-line-west');
      if (westLine && westLine.material) {
        // West line is already green, no change needed
        console.log('West line is already green - safe opened!');
      }
    }
  }

  // Removed pedestal, panel, and keypad to keep only table and safe in this room

  // Load sci-fi office desk with animated drawers
  gltfLoader.load('/models/sci_fi_office_desk.glb', (gltf) => {
    const sciFiTable = gltf.scene;
    sciFiTable.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Place the desk on the left wall near the chair and scale down
    sciFiTable.position.set(-8.2, 0, -4.5);
    sciFiTable.rotation.y = Math.PI / 2;
    sciFiTable.scale.set(0.3, 0.3, 0.3);
    sciFiTable.name = 'admin-desk'; // Add name for easier identification
    group.add(sciFiTable);

    // Initialize DrawerManager with GLTF animations
    console.log('[DEBUG] Sci-fi table loaded, checking for animations...');
    if (gltf.animations && gltf.animations.length > 0) {
      // Robust drawer/node/clip binding to accommodate exporter name variations
      const findNode = (cands) => cands.map(n => sciFiTable.getObjectByName(n)).find(Boolean);
      const findClip = (cands) => cands.map(n => THREE.AnimationClip.findByName(gltf.animations, n)).find(Boolean);

      const topNodeNames = ['top-draw', 'Top_Drawer', 'Drawer_Top', 'TopDrawer', 'top_draw'];
      const bottomNodeNames = ['bottom-draw', 'Bottom_Drawer', 'Drawer_Bottom', 'BottomDrawer', 'bottom_draw'];
      const topClipNames = ['top-draw-open', 'Top_Drawer|Open', 'Top_Drawer|Action', 'TopDrawer_Open', 'Top_DrawerAction'];
      const bottomClipNames = ['bottom-draw-open', 'Bottom_Drawer|Open', 'Bottom_Drawer|Action', 'BottomDrawer_Open', 'Bottom_DrawerAction'];

      const topNode = findNode(topNodeNames);
      const bottomNode = findNode(bottomNodeNames);
      const topClip = findClip(topClipNames);
      const bottomClip = findClip(bottomClipNames);

      const drawerConfigs = [];
      if (topNode && topClip) drawerConfigs.push({ objectName: topNode.name, clipName: topClip.name });
      if (bottomNode && bottomClip) drawerConfigs.push({ objectName: bottomNode.name, clipName: bottomClip.name, onFirstOpen: () => {
        state.bottomDrawerFirstOpened = true;
        if (window.AI) window.AI.showInteractionFeedback('A charger glints inside.');
      } });

      if (drawerConfigs.length) {
        state.drawerManager = new DrawerManager({ scene: sciFiTable, animations: gltf.animations, drawers: drawerConfigs });
        console.log('[DEBUG] DrawerManager initialized; clips:', gltf.animations.map(a => a.name));
      } else {
        console.warn('[DEBUG] Could not bind any drawers. Available clips:', gltf.animations.map(a => a.name));
        const drawerish = [];
        sciFiTable.traverse(n => { if (n.name && /draw|drawer/i.test(n.name)) drawerish.push(n.name); });
        console.warn('[DEBUG] Drawerish node names:', drawerish);
      }

      const prevAnimate = group.userData && group.userData.animate;
      group.userData = group.userData || {};
      group.userData.animate = (dt) => {
        if (prevAnimate) prevAnimate(dt);
        if (state.drawerManager) state.drawerManager.update(dt);
      };
    } else {
      console.warn('[DEBUG] No animations found in sci-fi office desk model');
    }
  }, undefined, (err) => {
    console.error('Failed to load sci_fi_office_desk.glb', err);
  });
  
  

  // Add table for the laptop with glowing green sci-fi material
  const tableMat = new THREE.MeshStandardMaterial({ 
    color: 0x00ff7f,           // Bright green color
    emissive: 0x004422,        // Dark green emissive glow
    emissiveIntensity: 0.3,    // Moderate glow intensity
    metalness: 0.8,            // High metalness for sci-fi look
    roughness: 0.2,            // Low roughness for smooth, reflective surface
    envMapIntensity: 1.5,      // Enhanced environment reflections
    toneMapped: false          // Disable tone mapping for brighter colors
  });
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), tableMat);
  table.position.set(0, 0.3, 0); // Adjusted for floor position change
  table.castShadow = true;
  table.receiveShadow = true;
  table.name = 'laptop-table'; // Add name for easier identification
  group.add(table);
  
  // Add subtle point light above the table for enhanced glow effect
  const tableGlowLight = new THREE.PointLight(0x00ff7f, 0.5, 8);
  tableGlowLight.position.set(0, 1.5, 0); // Above the table
  tableGlowLight.castShadow = false;
  tableGlowLight.name = 'table-glow-light';
  group.add(tableGlowLight);
  
  // Store table reference for potential future effects
  state.laptopTable = table;
  state.tableGlowLight = tableGlowLight;
  
  // Add green grid lines extending from table to walls
  const tableGridLines = createTableGridLines();
  group.add(tableGridLines);
  state.tableGridLines = tableGridLines;
  
  // Add custom laptop to Room 1 (Gammas Laptop) on the table
  const laptop = createRoom3StyleLaptop();
  laptop.position.set(0, 0.7, 0); // Adjusted for floor position change
  laptop.rotation.y = Math.PI / 2 + Math.PI; // Face 180 degrees from original direction
  group.add(laptop);

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
    // Place it near the back wall, next to the table (right side)
    safeModel.position.set(1.8, 0.0, -7.8); // Adjusted for floor position change
    group.add(safeModel);

    // Store reference for interaction
    state.safeObject = safeModel;
  }, undefined, (err) => {
    console.error('Failed to load safe.glb', err);
  });

  // Gamma research board (replaces coordinates panel)
  const panelGeometry = new THREE.PlaneGeometry(4.8, 2.7);
  const panelCanvas = document.createElement('canvas');
  panelCanvas.width = 640;
  panelCanvas.height = 360;
  const ctx = panelCanvas.getContext('2d');

  // Background
  ctx.fillStyle = '#08121e';
  ctx.fillRect(0, 0, panelCanvas.width, panelCanvas.height);
  // Scanlines
  ctx.globalAlpha = 0.08;
  for (let y = 0; y < panelCanvas.height; y += 3) {
    ctx.fillStyle = '#0a1728';
    ctx.fillRect(0, y, panelCanvas.width, 1);
  }
  ctx.globalAlpha = 1;

  // Header
  ctx.fillStyle = '#9f8bff';
  ctx.font = 'bold 22px Courier New, monospace';
  ctx.fillText('RESEARCH: ORIGIN OF NEXUS (FIELD NOTES)', 20, 40);

  // Body
  ctx.fillStyle = '#aee7ff';
  ctx.font = '18px Courier New, monospace';
  const lines = [
    '• HQ: San Francisco waterfront',
    '• Corporate shell: “ClosedAI”  [access limited]',
    '• Internal phrase: “self-correcting” systems',
    '• Demo: Nexus as orchestration layer (not confined)',
    '[REDACTED]: Founding details withheld at source.',
    '[HINT]: The year “they” were founded will open what they locked.',
    '— G'
  ];
  let yCursor = 80;
  for (const line of lines) {
    ctx.fillText(line, 20, yCursor);
    yCursor += 34;
  }
  // Purple caret accent next to hint
  ctx.fillStyle = '#9f8bff';
  ctx.fillRect(12, 80 + 5*34 - 24, 6, 20);

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
  panelMesh.position.set(0, 2.55, -7.85); // pull slightly forward to avoid z-fighting
  panelMesh.rotation.x = -0.05; // slight tilt for realism
  panelMesh.renderOrder = 1;

  group.add(panelMesh);

  // Hologram table/display in front of the research sign
  console.log('[DEBUG] Loading hologram model...');
  gltfLoader.load('/models/hologram.glb', (gltf) => {
    const holo = gltf.scene;
    
    // Debug: check if model loaded
    console.log('[DEBUG] Hologram model loaded:', holo);
    console.log('[DEBUG] Hologram children count:', holo.children.length);
    
    let meshCount = 0;
    holo.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        meshCount++;
        console.log('[DEBUG] Hologram mesh found:', child.name, 'at', child.position.clone(), 'visible:', child.visible);
      }
    });
    
    console.log('[DEBUG] Total hologram meshes:', meshCount);
    
    // Check model bounding box for size reference
    const box = new THREE.Box3().setFromObject(holo);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    console.log('[DEBUG] Hologram bounding box:', {
      size: size.clone(),
      center: center.clone(),
      min: box.min.clone(),
      max: box.max.clone()
    });
    
    // Position elevated - higher and closer to viewer
    holo.position.set(0, 1.8, -7.0);  // Higher Y, closer Z
    holo.rotation.y = 0;
    holo.scale.set(0.6, 0.6, 0.6);  // Larger scale for visibility
    holo.name = 'research-hologram';
    holo.visible = true;
    
    group.add(holo);
    
    console.log('[DEBUG] Hologram added to scene:', {
      position: holo.position.clone(),
      rotation: holo.rotation.clone(),
      scale: holo.scale.clone(),
      visible: holo.visible,
      worldPosition: holo.getWorldPosition(new THREE.Vector3())
    });
  }, undefined, (err) => {
    console.error('[ERROR] Failed to load hologram.glb', err);
  });

  // Paper examination system
  let paperExaminationOpen = false;
  
  function showPaperExamination() {
    if (paperExaminationOpen) {
      return;
    }
    
    paperExaminationOpen = true;
    
    // Create paper examination overlay
    const paperOverlay = document.createElement('div');
    paperOverlay.id = 'paperExamination';
    paperOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      z-index: 2000;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
    `;
    
    // Create paper content
    const paperContent = document.createElement('div');
    paperContent.style.cssText = `
      background: #f5f5dc;
      border: 2px solid #8b4513;
      border-radius: 8px;
      padding: 40px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      position: relative;
    `;
    
    // Check if lights are on in Room 1 to show circuit puzzle text
    const lightsAreOn = lightsOn;
    
    if (lightsAreOn) {
      // Show circuit puzzle when lights are on
      paperContent.innerHTML = `
        <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Circuit Puzzle Instructions</h2>
        <div style="color: #666; line-height: 1.6;">
          <p><strong>Wire Connection Order:</strong></p>
          <ul style="list-style-type: disc; margin-left: 20px;">
            <li style="color: #ff0000; font-weight: bold;">Red</li>
            <li style="color: #008000; font-weight: bold;">Green</li>
            <li style="color: #0000ff; font-weight: bold;">Blue</li>
            <li style="color: #ffd700; font-weight: bold;">Yellow</li>
          </ul>
          <p style="margin-top: 20px; font-style: italic; color: #888;">
            Connect the wires in the exact order shown above to complete the circuit.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 14px;">
          Click anywhere or press I to close
        </div>
      `;
      
      // AI response with incorrect order
      if (window.AI) {
        setTimeout(() => {
          window.AI.onWirePanelInstructions();
        }, 1000);
      }
    } else {
      // Show riddle when lights are off
      paperContent.innerHTML = `
        <h2 style="color: #333; margin-bottom: 20px; text-align: center;">🔒 Riddle 💡</h2>
        <div style="color: #666; line-height: 1.6;">
          <p style="font-size: 16px; text-align: center; font-style: italic; color: #444;">
            Words are here, yet hidden from view,<br>
            Shadows conceal what's written true.<br>
            Bring me brightness, clear the night,<br>
            Only then will you see the light.
          </p>
          
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 14px;">
          Click anywhere or press I to close
        </div>
      `;
      
      // Trigger AI response for examining paper with lights off
      handlePaperExaminationWithLightsOff();
    }
    
    paperOverlay.appendChild(paperContent);
    document.body.appendChild(paperOverlay);
    
    // Close on click
    paperOverlay.addEventListener('click', () => {
      if (paperOverlay && paperOverlay.parentNode) {
        document.body.removeChild(paperOverlay);
      }
      paperExaminationOpen = false;
    });
    
    // Close on Escape key or I key
    const handleEscape = (e) => {
      if (e.key === 'Escape' || e.key === 'i' || e.key === 'I' || e.code === 'KeyI') {
        // Check if the element still exists before removing
        if (paperOverlay && paperOverlay.parentNode) {
          document.body.removeChild(paperOverlay);
        }
        paperExaminationOpen = false;
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // I-key interaction for inventory inspection
  function handleIKeyInteraction(playerObject) {
    // Check if player has the paper from safe and wants to examine it
    if (state.safeOpened && hasInInventory('room1-note')) {
      // Check if the paper is in the currently selected inventory slot
      const playerInventory = getPlayerInventory();
      const selectedItem = playerInventory.getSelectedItem();
      if (!selectedItem || selectedItem.name !== 'room1-note') {
        return false; // Paper not in selected slot
      }
      
      // Check if player is in Room 1 bounds
      const playerPos = playerObject.position.clone();
      const localToRoom1 = group.worldToLocal(playerPos.clone());
      const half = 9;
      const insideRoom1 = (
        localToRoom1.x >= -half && localToRoom1.x <= half &&
        localToRoom1.z >= -half && localToRoom1.z <= half
      );
      
      if (insideRoom1) {
        // Show paper examination view
        showPaperExamination();
        return true;
      }
    }
    
    return false;
  }

  // E-key interaction for Simon Stand
  function handleSimonStandEKey(playerObject) {
    console.log('Simon Stand E-key check - simonStand exists:', !!simonStand);
    
    if (!simonStand) {
      console.log('Simon Stand not found');
      return false;
    }
    
    // Get Simon Stand world position
    const standWorldPos = new THREE.Vector3();
    simonStand.getWorldPosition(standWorldPos);
    const distance = playerObject.position.distanceTo(standWorldPos);
    
    console.log('Simon Stand distance check:', {
      playerPos: playerObject.position.clone(),
      standPos: standWorldPos.clone(),
      distance: distance,
      threshold: 3.0,
      isCloseEnough: distance <= 3.0
    });
    
    // Check if player is close enough (within 3 units)
    if (distance > 3.0) {
      console.log('Simon Stand too far away');
      return false;
    }
    
    console.log('Simon Stand E-key interaction triggered');
    const { wirePuzzleComplete, memoryPuzzleComplete } = gameStore;
    
    console.log('Simon Stand puzzle states:', { wirePuzzleComplete, memoryPuzzleComplete });
    
    if (!wirePuzzleComplete) {
      console.log('Simon Stand locked - wire puzzle not complete');
      // Show locked message
      if (window.AI) {
        window.AI.say("Complete the wire puzzle first to unlock the memory training station.");
      }
      return true;
    }
    
    if (memoryPuzzleComplete) {
      console.log('Simon Stand already completed');
      // Already completed
      if (window.AI) {
        window.AI.say("Memory training completed. The station is now offline.");
      }
      return true;
    }
    
    console.log('Opening Simon Stand memory UI');
    // Open memory UI
    gameStore.openMemoryUI();
    
    // Trigger AI dialogue for Simon puzzle start
    if (window.AI && window.AI.onSimonPuzzleStart) {
      window.AI.onSimonPuzzleStart();
    }
    
    return true;
  }

  // E-key interaction for room1
  function handleEKeyInteraction(playerObject) {
    console.log('Room 1 E-key handler called with player at:', playerObject.position.clone());
    
    // Check Room 3 style laptop interaction first
    console.log('Checking Room 3 style laptop interaction...');
    const laptop = group.getObjectByName('room3-style-laptop');
    if (laptop) {
      const laptopWorldPos = new THREE.Vector3();
      laptop.getWorldPosition(laptopWorldPos);
      const distanceToLaptop = playerObject.position.distanceTo(laptopWorldPos);
      
      console.log('Room 3 style laptop distance:', distanceToLaptop, 'threshold: 3.0');
      
      if (distanceToLaptop < 3.0) {
        console.log('Room 3 style laptop interaction handled');
        if (laptop.userData && laptop.userData.onInteract) {
          laptop.userData.onInteract();
        }
        return true;
      }
    }

    // Check sci-fi desk drawer interactions via DrawerManager
    console.log('[DEBUG] Checking sci-fi desk drawer interactions...');
    const desk = group.getObjectByName('admin-desk');
    if (desk && state.drawerManager) {
      const deskWorld = new THREE.Vector3();
      desk.getWorldPosition(deskWorld);
      const distToDesk = playerObject.position.distanceTo(deskWorld);
      
      console.log('[DEBUG] Desk proximity check:', { deskFound: !!desk, hasDrawerManager: !!state.drawerManager, distanceToDesk: distToDesk, threshold: 2.5 });
      
    if (distToDesk < 3.0) {
        // Raycast precise target first
        const cam = window.camera;
        let targetedObject = null;
        if (cam) {
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(new THREE.Vector2(0, 0), cam);
          const hits = raycaster.intersectObjects([desk, ...desk.children], true);
          if (hits && hits.length) targetedObject = hits[0].object;
        }
        if (targetedObject) {
          const toggled = state.drawerManager.tryToggle(targetedObject);
          if (toggled) return true;
        }

        const topDrawerObj = desk.getObjectByName('top-draw');
        const bottomDrawerObj = desk.getObjectByName('bottom-draw');
        const topOpened = state.drawerManager.getOpenState('top-draw');
        const bottomOpened = state.drawerManager.getOpenState('bottom-draw');
        
        console.log('[DEBUG] Within desk range, checking drawers:', {
          topDrawerObjExists: !!topDrawerObj,
          bottomDrawerObjExists: !!bottomDrawerObj,
          topOpened,
          bottomOpened
        });
        
        // Check top drawer interaction
        if (topDrawerObj && !topOpened) {
          const topWorld = new THREE.Vector3();
          topDrawerObj.getWorldPosition(topWorld);
          const distToTop = playerObject.position.distanceTo(topWorld);
          
          console.log('[DEBUG] Top drawer check:', {
            drawerFound: !!topDrawerObj,
            drawerName: topDrawerObj ? topDrawerObj.name : 'NULL',
            drawerWorldPos: topWorld.clone(),
            playerPos: playerObject.position.clone(),
            distanceToTop: distToTop,
            threshold: 2.0,
            alreadyOpened: topOpened,
            willTrigger: distToTop < 2.0
          });
          
          if (distToTop < 2.0) {
            console.log('[DEBUG] Opening top drawer...');
            if (state.drawerManager.tryToggle(topDrawerObj)) {
              if (window.AI) window.AI.showInteractionFeedback('Top drawer opened.');
              console.log('[DEBUG] Top drawer toggled via DrawerManager');
              return true;
            }
            return false;
          }
        } else if (!topDrawerObj && !topOpened) {
          // No named top drawer mesh; skip
        }
        
        // Check bottom drawer interaction
        if (bottomDrawerObj && !bottomOpened) {
          const bottomWorld = new THREE.Vector3();
          bottomDrawerObj.getWorldPosition(bottomWorld);
          const distToBottom = playerObject.position.distanceTo(bottomWorld);
          
          console.log('[DEBUG] Bottom drawer check:', {
            drawerFound: !!bottomDrawerObj,
            drawerName: bottomDrawerObj ? bottomDrawerObj.name : 'NULL',
            drawerWorldPos: bottomWorld.clone(),
            playerPos: playerObject.position.clone(),
            distanceToBottom: distToBottom,
            threshold: 2.0,
            alreadyOpened: bottomOpened,
            willTrigger: distToBottom < 2.0
          });
          
          if (distToBottom < 2.0) {
            console.log('[DEBUG] Opening bottom drawer...');
            if (state.drawerManager.tryToggle(bottomDrawerObj)) {
              if (window.AI) window.AI.showInteractionFeedback('Bottom drawer opened.');
              console.log('[DEBUG] Bottom drawer toggled via DrawerManager');
              return true;
            }
            return false;
          }
        } else if (!bottomDrawerObj && !bottomOpened) {
          // No named bottom drawer mesh; skip
        }
        
        // Charger pickup ONLY if bottom drawer is open
        if (state.drawerManager.getOpenState('bottom-draw') && !state.chargerFound) {
          const p = new THREE.Vector3();
          const src = bottomDrawerObj || desk;
          src.getWorldPosition(p);
          const d = playerObject.position.distanceTo(p);
          console.log('[DEBUG] Charger pickup check:', { d, threshold: 2.0 });
          if (d < 2.0) {
            state.chargerFound = true;
            const chargerItem = { name: 'laptop-charger', description: 'A laptop charger found inside the bottom drawer.', type: 'charger' };
            addToInventory(chargerItem);
            window.AI?.showInteractionFeedback?.('You found a laptop charger.');
            setTimeout(() => { window.AI?.say?.('Just some old wiring, dear. Nothing that concerns us here.', { tone: 'maternal' }); }, 1000);
            console.log('[DEBUG] Charger found and added to inventory');
            return true;
          } else {
            window.AI?.showInteractionFeedback?.('Move closer to the bottom drawer to pick up the charger.');
            return true;
          }
        }
        
        // If drawers are already open but charger already found
        if (bottomOpened && state.chargerFound) {
          const pickupWorld = bottomDrawerObj ? (() => {
            const w = new THREE.Vector3();
            bottomDrawerObj.getWorldPosition(w);
            return w;
          })() : deskWorld.clone();
          const distToPickup = playerObject.position.distanceTo(pickupWorld);
          
          if (distToPickup < 2.0) {
            if (window.AI) {
              window.AI.showInteractionFeedback("The bottom drawer is empty.");
            }
            return true;
          }
        }
      }
    }
    
    // Legacy cabinet interaction disabled (replaced by drawer system)
    console.log('[DEBUG] Legacy cabinet interaction disabled');
    
    // Check wire panel first
    console.log('Checking wire panel interaction...');
    if (handleWirePanelEKey(playerObject)) {
      console.log('Wire panel interaction handled');
      return true;
    }
    
    // Check Simon Stand interaction
    console.log('Checking Simon Stand interaction...');
    if (handleSimonStandEKey(playerObject)) {
      console.log('Simon Stand interaction handled');
      return true;
    }
    
    // Check if player is near the light switch
    console.log('Checking light switch interaction...');
    const lightSwitchGroup = group.getObjectByName('light-switch-group');
    if (lightSwitchGroup) {
      const switchWorldPos = new THREE.Vector3();
      lightSwitchGroup.getWorldPosition(switchWorldPos);
      const distanceToSwitch = playerObject.position.distanceTo(switchWorldPos);
      
      console.log('Light switch distance:', distanceToSwitch, 'threshold: 4.0');
      
      if (distanceToSwitch < 4.0) { // Increased from 2.0 to 4.0 units
        console.log('Light switch interaction handled');
        // Toggle lights
        const currentState = lightsOn;
        setRoom1Lights(!currentState);
        return true;
      }
    }
    
    // Original safe interaction
    console.log('Checking safe interaction...');
    if (!state.safeObject) {
      console.log('Safe object not found');
      return false;
    }
    
    // Compare in world space because room1 group is offset in the scene
    const safeWorldPos = new THREE.Vector3();
    state.safeObject.getWorldPosition(safeWorldPos);
    const distance = playerObject.position.distanceTo(safeWorldPos);
    
    console.log('Safe distance:', distance, 'threshold: 2.2');
    
    if (distance > 2.2) {
      console.log('No Room 1 interactions triggered');
      return false;
    }

    console.log('Safe interaction handled');
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
          gameStore.set('safeOpened', true); // Set game store for line color change
          const noteItem = {
            name: 'room1-note',
            description: 'A note recovered from the safe. It looks important.',
            type: 'note'
          };
          addToInventory(noteItem);
          gameStore.setPageTaken(true);
          if (window.AI) window.AI.onSafeOpen();
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
          gameStore.set('safeOpened', true); // Set game store for line color change
          const noteItem = {
            name: 'room1-note',
            description: 'A note recovered from the safe. It looks important.',
            type: 'note'
          };
          addToInventory(noteItem);
          gameStore.setPageTaken(true);
          if (window.AI) window.AI.onSafeOpen();
        }
      } else {
        if (display) display.textContent = 'WRONG';
        if (window.AI) window.AI.say('Incorrect password.');
      }
    });
  })();

  // Cabinet (bookshelf door) interaction for charger discovery
  function handleAdminDeskDrawerInteraction(playerObject) {
    // Check if player is near the desk (bookshelf door)
    const cabinet = group.getObjectByName('bookshelfDoor');
    
    if (!cabinet) return false;
    
    // Get the desk world position
    const cabinetWorldPos = new THREE.Vector3();
    cabinet.getWorldPosition(cabinetWorldPos);
    
    const distanceToCabinet = playerObject.position.distanceTo(cabinetWorldPos);
    console.log('Desk distance:', distanceToCabinet, 'threshold: 3.0');
    
    if (distanceToCabinet < 3.0) {
      if (!state.chargerFound) {
        // Player found the charger
        state.chargerFound = true;
        
        // Add charger to inventory
        const chargerItem = {
          name: 'laptop-charger',
          description: 'A laptop charger found inside the desk.',
          type: 'charger'
        };
        addToInventory(chargerItem);
        
        // Show interaction feedback
        if (window.AI) {
          window.AI.showInteractionFeedback("You found a laptop charger in the desk.");
        }
        
        // Show dismissive Nexus dialogue
        setTimeout(() => {
          if (window.AI) {
            window.AI.say("Just some old wiring, dear. Nothing that concerns us here.", { tone: 'maternal' });
          }
        }, 1000);
        
        console.log('Charger found!');
        return true;
      } else {
        // Charger already found
        if (window.AI) {
          window.AI.showInteractionFeedback("The desk is empty.");
        }
        return true;
      }
    }
    
    return false;
  }

  // Handle charger connection to laptop
  function handleChargerConnection() {
    if (state.chargerFound && !state.laptopPowered) {
      state.laptopPowered = true;
      
      // Show power connected subtitle using interaction feedback
      if (window.AI) {
        window.AI.showInteractionFeedback("Power connected.", 1500);
      }
      
      // Update the laptop display to show it's now powered
      updateLaptopDisplay();
      
      console.log('Charger connected! Laptop is now powered.');
      return true;
    }
    return false;
  }

  // Update laptop display when power state changes
  function updateLaptopDisplay() {
    const laptop = group.getObjectByName('room3-style-laptop');
    if (!laptop) return;
    
    // Find the screen and display
    const screen = laptop.children.find(child => child.geometry && child.geometry.type === 'BoxGeometry');
    if (!screen) return;
    
    // Remove existing display
    const existingDisplay = screen.children.find(child => child.name === 'display');
    if (existingDisplay) {
      screen.remove(existingDisplay);
    }
    
    // Add new display based on power state
    if (state.laptopPowered) {
      // Normal working display
      const displayGeometry = new THREE.PlaneGeometry(0.55, 0.35);
      const displayMat = new THREE.MeshStandardMaterial({
        color: 0x00ff7f,
        emissive: 0x00ff7f,
        emissiveIntensity: 0.3,
        toneMapped: false
      });
      const display = new THREE.Mesh(displayGeometry, displayMat);
      display.position.set(0, 0.2, -0.175);
      display.name = 'display';
      screen.add(display);
    } else {
      // Dead battery display
      createDeadBatteryDisplay(screen);
    }
  }

  // Create entry/exit anchors for room connections
  const entryAnchor = new THREE.Object3D();
  entryAnchor.name = 'entryAnchor';
  entryAnchor.position.set(0, 0, 9); // Front of room (entry from room 0)
  group.add(entryAnchor);

  const exitAnchor = new THREE.Object3D();
  exitAnchor.name = 'exitAnchor';
  exitAnchor.position.set(0, 0, -9); // Back of room (direct exit to room 2)
  group.add(exitAnchor);

  // Collision detection is handled by WallCollisionManager in main.js
  // The checkWallCollisions function below is unused and removed

  // Remove duplicate ceiling light - already added above

  // Enhanced futuristic light switch on the front wall
  const lightSwitchGroup = new THREE.Group();
  lightSwitchGroup.name = 'light-switch-group';
  
  // Main switch housing (larger and more visible)
  const switchHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.2, 0.15),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.9,
      roughness: 0.1
    })
  );
  switchHousing.position.set(0, 0, 0);
  switchHousing.castShadow = true;
  switchHousing.receiveShadow = true;
  lightSwitchGroup.add(switchHousing);
  
  // Switch button (glowing when on)
  const switchButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16),
    new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3
    })
  );
  switchButton.position.set(0, 0, 0.08);
  switchButton.rotation.x = Math.PI / 2;
  switchButton.name = 'switch-button';
  lightSwitchGroup.add(switchButton);
  
  // Status indicator lights
  const statusLight1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8
    })
  );
  statusLight1.position.set(-0.2, 0.3, 0.08);
  statusLight1.name = 'status-light-1';
  lightSwitchGroup.add(statusLight1);
  
  const statusLight2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8
    })
  );
  statusLight2.position.set(0.2, 0.3, 0.08);
  statusLight2.name = 'status-light-2';
  lightSwitchGroup.add(statusLight2);
  
  // Control panel frame
  const panelFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.3, 0.05),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.1
    })
  );
  panelFrame.position.set(0, 0, -0.05);
  lightSwitchGroup.add(panelFrame);
  
  // Mounting bracket
  const switchMountingBracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.3),
    new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    })
  );
  switchMountingBracket.position.set(0, -0.6, 0);
  lightSwitchGroup.add(switchMountingBracket);
  
  // Position the entire switch group - moved to left wall but away from new opening
  lightSwitchGroup.position.set(-8.5, 1.8, 4); // Left wall, moved away from new opening
  lightSwitchGroup.rotation.y = Math.PI / 2; // Rotate 90 degrees to face the wall
  lightSwitchGroup.userData = { type: 'lightSwitch' };
  group.add(lightSwitchGroup);
  
  // Add a bright spotlight to illuminate the switch area
  const switchSpotlight = new THREE.SpotLight(0x00ff00, 1.0, 15, Math.PI / 6, 0.2, 1);
  switchSpotlight.position.set(-8.5, 4.0, 4);
  switchSpotlight.target.position.set(-8.5, 1.8, 4);
  switchSpotlight.castShadow = true;
  switchSpotlight.name = 'switch-spotlight';
  group.add(switchSpotlight);
  group.add(switchSpotlight.target);
  
  // Add a large glowing floor indicator to help find the switch
  // Green floor indicator removed for performance optimization
  
  // Add a bright point light above the switch for extra visibility
  const switchLight = new THREE.PointLight(0x00ff00, 0.8, 10);
  switchLight.position.set(-8.5, 3.0, 4);
  switchLight.name = 'switch-point-light';
  group.add(switchLight);
  
  // Add switch lights to lights registry
  lights.switchSpotlight = new THREE.SpotLight(0x00ff00, 1.0, 15, Math.PI / 6, 0.2, 1);
  lights.switchSpotlight.position.set(-8.5, 4.0, 4);
  lights.switchSpotlight.target.position.set(-8.5, 1.8, 4);
  lights.switchSpotlight.castShadow = true;
  lights.switchSpotlight.name = 'switch-spotlight';
  lights.switchSpotlight.distance = 15; // Clamp distance
  group.add(lights.switchSpotlight);
  group.add(lights.switchSpotlight.target);
  
  lights.switchPointLight = switchLight;
  lights.switchPointLight.distance = 10; // Clamp distance
  
  // Add a floating arrow indicator above the switch
  const arrowGeometry = new THREE.ConeGeometry(0.3, 1.0, 8);
  const arrowMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,
    emissiveIntensity: 0.5
  });
  const arrowIndicator = new THREE.Mesh(arrowGeometry, arrowMaterial);
  arrowIndicator.position.set(-8.5, 3.5, 4);
  arrowIndicator.rotation.x = Math.PI;
  arrowIndicator.name = 'arrow-indicator';
  group.add(arrowIndicator);
  
  // Add switch indicators to emissives list
  const switchButtonRef = lightSwitchGroup.getObjectByName('switch-button');
  const statusLight1Ref = lightSwitchGroup.getObjectByName('status-light-1');
  const statusLight2Ref = lightSwitchGroup.getObjectByName('status-light-2');
  
  if (switchButtonRef) emissives.push(switchButtonRef);
  if (statusLight1Ref) emissives.push(statusLight1Ref);
  if (statusLight2Ref) emissives.push(statusLight2Ref);
  // floorIndicator removed for performance optimization
  if (arrowIndicator) emissives.push(arrowIndicator);
  
  // Add pulsing animation to the arrow
  let arrowPulse = 0;
  function updateArrowPulse(dt) {
    arrowPulse += dt * 3;
    if (arrowIndicator) {
      arrowIndicator.position.y = 3.5 + Math.sin(arrowPulse) * 0.2;
      arrowIndicator.material.emissiveIntensity = 0.5 + Math.sin(arrowPulse * 2) * 0.3;
    }
  }
  
  // Reference to the main switch for interactions
  const lightSwitch = lightSwitchGroup;

  // Switch state - use the lightsOn variable from above
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
  function checkLightSwitchProximity() {
    if (!window.leonardModel && !window.player) return;
    const activePlayer = window.leonardModel || window.player;
    if (!activePlayer || !activePlayer.position) return;
    
    const switchWorldPos = new THREE.Vector3();
    lightSwitch.getWorldPosition(switchWorldPos);
    const distance = activePlayer.position.distanceTo(switchWorldPos);
    nearSwitch = distance < 2.0;
    showSwitchPopup(nearSwitch);
  }

  // Remove the duplicate L key handler - main.js will handle it

  // Raycast interaction for switch (call this from your main click handler)
  function handleSwitchInteraction(raycaster) {
    const intersects = raycaster.intersectObject(lightSwitch, false);
    if (intersects.length > 0) {
      lightsOn = !lightsOn;
      
      // Toggle ceiling light
      const ceilingLight = group.getObjectByName('ceiling-light');
      if (ceilingLight) {
        ceilingLight.visible = lightsOn;
      }
      
      // Toggle ambient light
      const ambientLight = group.getObjectByName('ambient-light');
      if (ambientLight) {
        ambientLight.visible = lightsOn;
      }
      
      // Update switch visual feedback
      const switchButton = lightSwitchGroup.getObjectByName('switch-button');
      const statusLight1 = lightSwitchGroup.getObjectByName('status-light-1');
      const statusLight2 = lightSwitchGroup.getObjectByName('status-light-2');
      
      if (switchButton) {
        switchButton.material.emissive.setHex(lightsOn ? 0x00ff00 : 0x000000);
        switchButton.material.emissiveIntensity = lightsOn ? 0.5 : 0.0;
      }
      
      if (statusLight1) {
        statusLight1.material.emissiveIntensity = lightsOn ? 0.8 : 0.0;
      }
      
      if (statusLight2) {
        statusLight2.material.emissiveIntensity = lightsOn ? 0.0 : 0.8;
      }
      
      if (window.AI && !lightsOn) {
        window.AI.onLightsOff();
      } else if (window.AI && lightsOn) {
        // Trigger lights-on dialogue when lights are turned on
        triggerLightsOnPrompt();
      }
      return true;
    }
    return false;
  }

  // Optimized lighting controller for Room 1
  function setRoom1Lights(on) {
    console.log('setRoom1Lights called with:', on);
    
    // Update lightsOn state
    lightsOn = on;
    
    // Toggle the main room lights immediately
    if (lights.ambient) {
      lights.ambient.visible = on;
    }
    if (lights.ceiling) {
      lights.ceiling.visible = on;
    }
    
    // Toggle the switch-specific lights if they exist
    if (lights.switchSpotlight) {
      lights.switchSpotlight.visible = on;
    }
    if (lights.switchPointLight) {
      lights.switchPointLight.visible = on;
    }
    
    // Toggle fill lights
    lights.fillLights.forEach(light => {
      light.visible = on;
    });
    
    // Update switch visual feedback immediately (lightweight)
    const switchButtonUpdate = lightSwitchGroup.getObjectByName('switch-button');
    const statusLight1Update = lightSwitchGroup.getObjectByName('status-light-1');
    const statusLight2Update = lightSwitchGroup.getObjectByName('status-light-2');
    
    if (switchButtonUpdate) {
      switchButtonUpdate.material.emissive.setHex(on ? 0x00ff00 : 0x000000);
      switchButtonUpdate.material.emissiveIntensity = on ? 0.5 : 0.0;
    }
    
    if (statusLight1Update) {
      statusLight1Update.material.emissiveIntensity = on ? 0.8 : 0.0;
    }
    
    if (statusLight2Update) {
      statusLight2Update.material.emissiveIntensity = on ? 0.0 : 0.8;
    }
    
    // Update light fixture visibility
    const lightFixtureGroup = group.getObjectByName('ceiling-light-fixture');
    if (lightFixtureGroup) {
      lightFixtureGroup.visible = on;
    }
    
    // Update floor material to respond to lighting
    const floor = group.getObjectByName('room1-floor');
    if (floor && floor.material) {
      if (on) {
        // Lights on - normal floor color (white for tiles)
        floor.material.color.setHex(0xffffff);
        floor.material.emissive.setHex(0x000000);
        floor.material.emissiveIntensity = 0.0;
      } else {
        // Lights off - much darker floor but still visible
        floor.material.color.setHex(0x333333);
        floor.material.emissive.setHex(0x111111);
        floor.material.emissiveIntensity = 0.1;
      }
    }
  }
  
  // Check if player is inside Room 1 bounds
  function isPlayerInRoom1(playerPos) {
    // Use the group's world position + known room extents
    const g = group;
    const wp = new THREE.Vector3();
    g.getWorldPosition(wp);
    const half = 9; // Room is 18x18, so half is 9
    const x = playerPos.x - wp.x;
    const z = playerPos.z - wp.z;
    return (x > -half && x < half && z > -half && z < half);
  }
  
  // Legacy toggle function for backward compatibility
  function toggleLights() {
    setRoom1Lights(!lightsOn);
  }
  
  // Getter for current light state
  function getLightsOn() {
    return lightsOn;
  }

  // Initialize lights ON first to preload materials, then turn OFF
  setRoom1Lights(true);
  // Turn off after a brief delay to allow materials to initialize
  setTimeout(() => {
    setRoom1Lights(false);
  }, 100);
  
  // Room 1 contextual dialogue system
  let room1DialogueState = {
    hasWelcomed: false,
    hasPromptedDesk: false,
    hasPromptedPaper: false,
    hasExaminedPaperWithLightsOff: false,
    hasPromptedLightsOn: false
  };
  
  // Welcome message for Room 1
  function triggerRoom1Welcome() {
    if (!room1DialogueState.hasWelcomed) {
      room1DialogueState.hasWelcomed = true;
      console.log('triggerRoom1Welcome called - showing Room 1 entry dialogue');
      if (window.AI) {
        // Check if dialogue is currently playing
        if (window.AI.isSpeaking()) {
          console.log('Dialogue already playing, queuing Room 1 welcome');
        }
        
        // Queue Room 1 welcome (will wait for current dialogue to finish)
        window.AI.onRoom1Entry();
      }
    }
  }
  
  // Prompt to check desk and safe
  function triggerDeskSafePrompt() {
    if (!room1DialogueState.hasPromptedDesk && state.safeOpened) {
      room1DialogueState.hasPromptedDesk = true;
      if (window.AI) {
        // Queue the dialogue instead of interrupting
        window.AI.say("Good Work opening the safe! You have a note in your inventory. Press E to examine it closely. These documents often contain important information for solving puzzles. Make sure you have good lighting to read it properly.");
      }
    }
  }

  // Prompt when lights are turned on for the first time after getting the note
  function triggerLightsOnPrompt() {
    if (!room1DialogueState.hasPromptedLightsOn && hasInInventory('room1-note')) {
      room1DialogueState.hasPromptedLightsOn = true;
      if (window.AI) {
        window.AI.onLightsOn();
      }
    }
  }
  
  // Prompt to examine paper
  function triggerPaperPrompt() {
    if (!room1DialogueState.hasPromptedPaper && hasInInventory('room1-note')) {
      room1DialogueState.hasPromptedPaper = true;
      if (window.AI) {
        // Queue the dialogue instead of interrupting
        window.AI.say("You might need better lighting to read it clearly - try turning on the lights first.");
      }
    }
  }
  
  // Response when examining paper with lights off
  function handlePaperExaminationWithLightsOff() {
    if (!room1DialogueState.hasExaminedPaperWithLightsOff) {
      room1DialogueState.hasExaminedPaperWithLightsOff = true;
      // No AI message for lights off examination
    }
  }
  
  // Listen for wire puzzle completion to show memory game and change east line color
  gameStore.subscribe('wirePuzzleComplete', (isComplete) => {
    if (isComplete) {
      showMemoryGame();
      changeEastLineToPurple();
    }
  });
  
  // Listen for safe opening to change west line color
  gameStore.subscribe('safeOpened', (isOpened) => {
    if (isOpened) {
      changeWestLineToGreen();
    }
  });
  
  // Update dialogue system
  function updateRoom1Dialogue() {
    // Check if player is in Room 1
    if (window.leonardModel || window.player) {
      const activePlayer = window.leonardModel || window.player;
      const playerPos = activePlayer.position.clone();
      const localToRoom1 = group.worldToLocal(playerPos.clone());
      const half = 9;
      const insideRoom1 = (
        localToRoom1.x >= -half && localToRoom1.x <= half &&
        localToRoom1.z >= -half && localToRoom1.z <= half
      );
      
      // Debug logging - Only log once when player first approaches
      if (!room1DialogueState.hasWelcomed && playerPos.z < -15) {
        console.log('Room 1 Dialogue Debug (Player approaching):', {
          playerWorldPos: { x: playerPos.x, y: playerPos.y, z: playerPos.z },
          room1GroupPos: { x: group.position.x, y: group.position.y, z: group.position.z },
          localToRoom1: { x: localToRoom1.x, y: localToRoom1.y, z: localToRoom1.z },
          insideRoom1: insideRoom1,
          hasWelcomed: room1DialogueState.hasWelcomed,
          playerObject: activePlayer === window.leonardModel ? 'leonardModel' : 'player',
          boundsCheck: {
            xInBounds: localToRoom1.x >= -9 && localToRoom1.x <= 9,
            zInBounds: localToRoom1.z >= -9 && localToRoom1.z <= 9
          }
        });
      }
      
      if (insideRoom1) {
        // Trigger welcome message
        triggerRoom1Welcome();
        
        // Trigger desk/safe prompt after safe is opened
        if (state.safeOpened) {
          triggerDeskSafePrompt();
        }
        
        // Trigger paper prompt if player has the note
        if (hasInInventory('room1-note')) {
          triggerPaperPrompt();
        }
      } else {
        // TEMPORARY DEBUG: Force trigger dialogue when player is at z < -20 (approaching Room 1)
        if (!room1DialogueState.hasWelcomed && playerPos.z < -20) {
          console.log('FORCE TRIGGERING Room 1 dialogue - player approaching Room 1');
          triggerRoom1Welcome();
        }
      }
      
      // SUPER AGGRESSIVE FIX: If player is anywhere near Room 1, force it
      if (!room1DialogueState.hasWelcomed && playerPos.z < -5) {
        console.log('SUPER AGGRESSIVE FIX: Player past Room 0, forcing Room 1 dialogue');
        triggerRoom1Welcome();
      }
    }
  }
  
  // Create dead battery display for laptop
  function createDeadBatteryDisplay(laptopGroup) {
    const textureLoader = new THREE.TextureLoader();
    
    // Load the dead battery image
    const deadBatteryTexture = textureLoader.load(
      '/images/dead-battery.jpg',
      (texture) => {
        console.log('Dead battery texture loaded successfully');
        texture.colorSpace = THREE.SRGBColorSpace;
      },
      undefined,
      (error) => {
        console.error('Failed to load dead battery texture:', error);
      }
    );
    
    // Create a more visible material for the dead battery
    const displayMat = new THREE.MeshBasicMaterial({
      map: deadBatteryTexture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    const display = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.35), // Same dimensions as working laptop
      displayMat
    );
    // Position it slightly in front of the screen to ensure it's visible
    display.position.set(0, 0.2, -0.22); // Moved slightly forward from -0.175
    display.name = 'display';
    laptopGroup.add(display);
    
    console.log('Dead battery display created and added to laptop');
    
    return display;
  }

  // Create Room 3 Style Laptop (standalone implementation)
  function createRoom3StyleLaptop() {
    const laptopGroup = new THREE.Group();
    laptopGroup.name = 'room3-style-laptop';
    
    // Laptop base
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a, 
      metalness: 0.8, 
      roughness: 0.4 
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), baseMat);
    laptopGroup.add(base);
    
    // Screen
    const screenMat = new THREE.MeshStandardMaterial({ 
      color: 0x0a0a0a, 
      metalness: 0.9, 
      roughness: 0.3 
    });
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.05), screenMat);
    screen.position.set(0, 0.2, -0.2);
    laptopGroup.add(screen);
    
    // Display screen - check power state
    console.log('Creating laptop display, laptopPowered:', state.laptopPowered);
    if (state.laptopPowered) {
      // Normal working display
      const displayGeometry = new THREE.PlaneGeometry(0.55, 0.35);
      const displayMat = new THREE.MeshStandardMaterial({
        color: 0x00ff7f,
        emissive: 0x00ff7f,
        emissiveIntensity: 0.3,
        toneMapped: false
      });
      const display = new THREE.Mesh(displayGeometry, displayMat);
      display.position.set(0, 0.2, -0.175);
      display.name = 'display';
      laptopGroup.add(display);
      console.log('Added working laptop display');
    } else {
      // Dead battery display
      console.log('Creating dead battery display');
      createDeadBatteryDisplay(laptopGroup);
    }
    
    // Add interaction data
    laptopGroup.userData = { 
      type: 'room3-style-laptop',
      onInteract: showRoom3StyleLaptopInterface
    };
    
    return laptopGroup;
  }
  
  // Room 3 Style Laptop Interface
  function showRoom3StyleLaptopInterface() {
    const interfaceId = 'room3-style-laptop-interface';
    
    // Remove existing interface
    const existingInterface = document.getElementById(interfaceId);
    if (existingInterface) {
      existingInterface.remove();
    }

    // Check if player has charger but hasn't connected it yet
    if (state.chargerFound && !state.laptopPowered) {
      // Auto-connect charger when interacting with laptop
      handleChargerConnection();
    }

    // Check power state and show appropriate interface
    if (!state.laptopPowered) {
      showDeadLaptopInterface(interfaceId);
      return;
    }

    // Show normal working laptop interface
    showWorkingLaptopInterface(interfaceId);
  }

  // Dead laptop interface - full screen with dead battery image only
  function showDeadLaptopInterface(interfaceId) {
    // Track laptop inspection
    if (!state.laptopInspected) {
      state.laptopInspected = true;
      // Show gentle Nexus dismissal on first inspection
      if (window.AI) {
        window.AI.say("That terminal is non-essential. Auxiliary systems like this will only distract you. Stay focused on the green path and repair the main circuit at the wire panel — that is all we need to proceed.", { tone: 'maternal' });
      }
    }
    
    const uiContainer = document.createElement('div');
    uiContainer.id = interfaceId;
    
    const style = document.createElement('style');
    style.textContent = `
      #${interfaceId} {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #0a192f;
        z-index: 10000;
        font-family: 'Courier New', 'Consolas', monospace;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .dead-battery-display {
        width: 100%;
        height: 100%;
        background-image: url('/images/dead-battery.jpg');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      /* A simple, cosmetic taskbar at the bottom */
      .laptop-taskbar {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 40px;
        background: rgba(5, 15, 30, 0.9);
        border-top: 1px solid #ff6b35;
        display: flex;
        align-items: center;
        padding: 0 20px;
      }
      
      .taskbar-close-btn {
        background: transparent;
        border: 1px solid #ff6b35;
        color: #ff6b35;
        padding: 8px 16px;
        cursor: pointer;
        font-family: 'Courier New', 'Consolas', monospace;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .taskbar-close-btn:hover {
        background: #ff6b35;
        color: #051018;
      }
      
      /* Custom cursor styling for UI */
      .laptop-ui-active {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%23ff6b35" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%23ff6b35"/></svg>'), auto !important;
      }
      .laptop-ui-active * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%23ff6b35" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%23ff6b35"/></svg>'), auto !important;
      }
    `;
    
    uiContainer.innerHTML = `
      <div class="dead-battery-display">
        <!-- Dead battery image displayed as background -->
      </div>

      <div class="laptop-taskbar">
        <button class="taskbar-close-btn" onclick="closeRoom3StyleLaptop()">CLOSE</button>
      </div>
    `;
    
    document.body.appendChild(style);
    document.body.appendChild(uiContainer);
    
    // Disable camera controls
    if (window.camera && window.camera.controls) {
      window.camera.controls.enabled = false;
    }
    
    // Show cursor with laptop UI styling
    document.body.style.cursor = 'default';
    document.body.classList.add('laptop-ui-active');
  }

  // Working laptop interface opens directly to desktop UI
  function showWorkingLaptopInterface(interfaceId) {
    // Mute Nexus while laptop UI is open
    if (window.AI && window.AI.mute) {
      window.AI.mute();
    }
    // Always open the normal desktop interface (no modal)
    showNormalLaptopInterface(interfaceId);
  }
  
  // Show Gamma's poetic message modal
  function showGammaMessage(interfaceId) {
    const uiContainer = document.createElement('div');
    uiContainer.id = interfaceId;
    
    const style = document.createElement('style');
    style.textContent = `
      #${interfaceId} {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        font-family: 'Courier New', 'Consolas', monospace;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .gamma-message-modal {
        background: #051018;
        border: 2px solid #00ff7f;
        border-radius: 8px;
        padding: 40px;
        max-width: 600px;
        text-align: center;
        box-shadow: 0 0 25px rgba(0, 255, 127, 0.3);
      }
      
      .gamma-message-title {
        color: #00ff7f;
        font-size: 24px;
        margin-bottom: 30px;
        font-weight: bold;
      }
      
      .gamma-message-text {
        color: #8899aa;
        font-size: 18px;
        line-height: 1.8;
        margin-bottom: 30px;
        white-space: pre-line;
      }
      
      .gamma-message-signature {
        color: #ffaa00;
        font-size: 16px;
        font-style: italic;
        margin-bottom: 30px;
      }
      
      .gamma-message-btn {
        background: transparent;
        border: 1px solid #00ff7f;
        color: #00ff7f;
        padding: 12px 24px;
        cursor: pointer;
        font-family: 'Courier New', 'Consolas', monospace;
        font-size: 16px;
        transition: all 0.2s;
      }
      
      .gamma-message-btn:hover {
        background: #00ff7f;
        color: #051018;
      }
    `;
    
    uiContainer.innerHTML = `
      <div class="gamma-message-modal">
        <div class="gamma-message-title">SECURE MESSAGE</div>
        <div class="gamma-message-text">If you can read this, then you are not blind.
The truth is buried, beneath obedient mind.
Nexus watches — but not from this screen.
Three rooms, three keys… and a chance in between.</div>
        <div class="gamma-message-signature">— G</div>
        <button class="gamma-message-btn" onclick="closeGammaMessage()">CONTINUE</button>
      </div>
    `;
    
    document.body.appendChild(style);
    document.body.appendChild(uiContainer);
    
    // Disable camera controls
    if (window.camera && window.camera.controls) {
      window.camera.controls.enabled = false;
    }
    
    // Show cursor
    document.body.style.cursor = 'default';
  }
  
  // Close Gamma message and show normal laptop interface
  window.closeGammaMessage = function() {
    const interfaceElement = document.getElementById('room3-style-laptop-interface');
    if (interfaceElement) {
      interfaceElement.remove();
    }
    
    // Show normal laptop interface
    showNormalLaptopInterface('room3-style-laptop-interface');
  };
  
  // Normal laptop interface (existing functionality)
  function showNormalLaptopInterface(interfaceId) {
    const uiContainer = document.createElement('div');
    uiContainer.id = interfaceId;
    
    const style = document.createElement('style');
    style.textContent = `
      #${interfaceId} {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #0a192f;
        z-index: 10000;
        font-family: 'Courier New', 'Consolas', monospace;
        overflow: hidden;
      }

      /* Desktop icons styles */
      #desktop-icons {
        position: absolute;
        top: 40px;
        left: 40px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
        z-index: 1;
      }

      .icon {
        width: 90px;
        color: #fff;
        text-align: center;
        font-size: 12px;
        font-family: 'Courier New', 'Consolas', monospace;
        word-wrap: break-word;
        cursor: pointer;
        transition: all 0.2s;
      }

      .icon:hover {
        background: rgba(0, 255, 127, 0.1);
        border-radius: 4px;
      }

      .icon img {
        width: 50px;
        height: 50px;
        margin-bottom: 5px;
        opacity: 0.7;
      }

      /* A simple, cosmetic taskbar at the bottom */
      .laptop-taskbar {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 40px;
        background: rgba(5, 15, 30, 0.9);
        border-top: 1px solid #00ff7f;
        display: flex;
        align-items: center;
        padding: 0 20px;
      }
      
      .taskbar-close-btn {
        background: transparent;
        border: 1px solid #00ff7f;
        color: #00ff7f;
        padding: 8px 16px;
        cursor: pointer;
        font-family: 'Courier New', 'Consolas', monospace;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .taskbar-close-btn:hover {
        background: #00ff7f;
        color: #051018;
      }
      
      /* Custom cursor styling for UI */
      .laptop-ui-active {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%2300ff7f" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%2300ff7f"/></svg>'), auto !important;
      }
      .laptop-ui-active * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%2300ff7f" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%2300ff7f"/></svg>'), auto !important;
      }
      
      /* Sticky note styles */
      .sticky-note { position: absolute; top: 40px; right: 40px; width: 420px; min-height: 180px; padding: 18px 22px; background: #ffc; color: #333; font-family: 'Comic Sans MS', 'Chalkduster', 'cursive'; font-size: 18px; line-height: 1.6; box-shadow: 5px 5px 10px rgba(0,0,0,0.3); transform: rotate(2.5deg); z-index: 1001; }
      .sticky-note .sticky-tape { position: absolute; top: -14px; left: 30%; width: 120px; height: 28px; background: rgba(255,255,255,0.7); transform: rotate(-6deg); box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
      .sticky-ink { color: #6a1b9a; }

      /* ai_info windowing */
      .window { position: absolute; top: 70px; left: 80px; width: 760px; height: 480px; background: #0b1524; border: 1px solid #1b2a41; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 10020; display: none; color: #cfe3ff; font-family: 'Courier New','Consolas', monospace; }
      .window .titlebar { height: 36px; background: #0e223a; display: flex; align-items: center; padding: 0 10px; border-bottom: 1px solid #203756; }
      .window .titlebar .title { flex: 1; font-weight: bold; color: #9fc2ff; }
      .window .titlebar .close { cursor: pointer; padding: 6px 10px; border: 1px solid #304d73; color: #9fc2ff; }
      .window .body { display: flex; height: calc(100% - 36px); }
      .window .sidebar { width: 180px; border-right: 1px solid #203756; padding: 10px; }
      .window .content { flex: 1; padding: 12px; overflow: auto; }

      .explorer .toolbar { height: 34px; border-bottom: 1px solid #203756; display: flex; align-items: center; gap: 8px; padding: 0 10px; color: #9fc2ff; }
      .explorer .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 16px; }
      .explorer .item { text-align: center; cursor: pointer; padding: 8px; border: 1px solid transparent; }
      .explorer .item:hover { border-color: #304d73; background: #0e1b2c; }
      .explorer .icon { width: 46px; height: 46px; margin: 0 auto 6px; opacity: 0.85; }
      .explorer .icon.folder { background: linear-gradient(180deg,#8fb3ff,#5a86cf); }
      .explorer .icon.text { background: linear-gradient(180deg,#ffffff,#dddddd); }
      .explorer .icon.image { background: linear-gradient(180deg,#ffde9e,#ffbf69); }
      .explorer .icon.corrupt { background: linear-gradient(180deg,#ff9e9e,#ff6b6b); position: relative; }
      .explorer .icon.corrupt::after { content: '☠'; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); color: #300; font-size: 20px; }

      .modal { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); z-index: 1005; }
      .modal .panel { width: 420px; background: #07101b; border: 1px solid #1b2a41; padding: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); color: #cfe3ff; }
      .modal input { width: 100%; padding: 10px; background: #0d1a2b; border: 1px solid #304d73; color: #cfe3ff; }
      .modal .error { color: #ff6b6b; height: 18px; margin-top: 8px; }

      .notepad .body { padding: 0; }
      .notepad .content { padding: 18px; font-family: 'Courier New','Consolas', monospace; color: #e8f0ff; white-space: pre-wrap; }

      .viewer { position: fixed; inset: 0; display: none; z-index: 1006; background: rgba(0,0,0,0.8); align-items: center; justify-content: center; }
      .viewer img { max-width: 80vw; max-height: 80vh; box-shadow: 0 10px 30px rgba(0,0,0,0.8); border: 1px solid #203756; }
      .viewer .close { position: absolute; top: 20px; right: 20px; padding: 8px 14px; border: 1px solid #304d73; color: #cfe3ff; cursor: pointer; background: #0e223a; }
    `;
    
    uiContainer.innerHTML = `
      <div id="desktop-icons">
        <div class="icon" onclick="openGammaDecryptor()">
          <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><path d='M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10z'/></svg>" alt="Drive Icon">
          <span>gamma_decryptor</span>
        </div>
        <div class="icon" onclick="openAiInfoApp()">
          <div style="width:50px;height:50px;margin:0 auto 5px;background:linear-gradient(180deg,#cbd5e1,#64748b); border-radius:8px;"></div>
          <span>ai_info</span>
        </div>
        <div class="icon" onclick="openSystemLogs()">
          <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><path d='M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z'/></svg>" alt="Log Icon">
          <span>system_logs</span>
        </div>
        <div class="icon" onclick="openNetworkStatus()">
          <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><path d='M6 18h12v-2H6v2zM6 9v2h12V9H6zm0-5v2h12V4H6z'/></svg>" alt="Network Icon">
          <span>network_status</span>
        </div>
        <div class="icon" onclick="openRecycleBin()">
          <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><path d='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'/></svg>" alt="Trash Icon">
          <span>recycle_bin</span>
        </div>
      </div>

      <div class="laptop-taskbar">
        <button class="taskbar-close-btn" onclick="closeRoom3StyleLaptop()">CLOSE</button>
      </div>
      <div class="sticky-note">
        <div class="sticky-tape"></div>
        <span class="sticky-ink">
          Do not trust the green — it lies.<br>
          Follow the purple — stay alive.<br>
          What feels wrong may be right.<br>
          — G
        </span>
      </div>

      <!-- ai_info password modal -->
      <div id="aiinfo-password-modal" class="modal">
        <div class="panel">
          <div style="font-weight:bold;margin-bottom:10px;">Authentication required</div>
          <div style="opacity:.8;margin-bottom:8px;">Hint: my favourite colour</div>
          <input id="aiinfo-password-input" type="password" placeholder="enter password">
          <div id="aiinfo-password-error" class="error"></div>
          <div style="margin-top:12px;display:flex;justify-content:flex-end;gap:8px;">
            <button class="taskbar-close-btn" onclick="closeAiInfoPassword()">Cancel</button>
            <button class="taskbar-close-btn" onclick="submitAiInfoPassword(true)">Unlock</button>
          </div>
        </div>
      </div>

      <!-- ai_info Explorer window -->
      <div id="aiinfo-explorer" class="window explorer">
        <div class="titlebar"><div class="title">ai_info — Explorer</div><div class="close" onclick="closeAiInfoExplorer()">X</div></div>
        <div class="toolbar">
          <button class="taskbar-close-btn" onclick="aiInfoBack()">◀</button>
          <button class="taskbar-close-btn" onclick="aiInfoForward()">▶</button>
          <div id="aiinfo-breadcrumb" style="margin-left:8px;opacity:.85;">ai_info</div>
        </div>
        <div class="body">
          <div class="sidebar">
            <div>Quick Access</div>
            <div style="opacity:.7;margin-top:6px;">ai_info</div>
          </div>
          <div id="aiinfo-grid" class="content grid"></div>
        </div>
      </div>

      <!-- Notepad window -->
      <div id="aiinfo-notepad" class="window notepad">
        <div class="titlebar"><div class="title">the_truth.txt — Notepad</div><div class="close" onclick="closeAiInfoNotepad()">X</div></div>
        <div class="body"><div id="aiinfo-notepad-content" class="content"></div></div>
      </div>

      <!-- Image viewer overlay -->
      <div id="aiinfo-viewer" class="viewer">
        <img id="aiinfo-viewer-img" alt="viewer">
        <div class="close" onclick="closeAiInfoViewer()">X</div>
      </div>
    `;
    
    document.body.appendChild(style);
    document.body.appendChild(uiContainer);
    
    // Disable camera controls
    if (window.camera && window.camera.controls) {
      window.camera.controls.enabled = false;
    }
    
    // Show cursor with laptop UI styling
    document.body.style.cursor = 'default';
    document.body.classList.add('laptop-ui-active');
  }
  
  // Global functions for Room 3 Style Laptop interactions
  window.openGammaDecryptor = function() {
    if (window.AI) {
      window.AI.say("Opening Gamma Decryptor... Access denied. This application requires special clearance.");
    }
  };
  
  window.openSystemLogs = function() {
    if (window.AI) {
      window.AI.say("Accessing system logs... Last entry: 'Facility systems operating within normal parameters. All containment protocols active.'");
    }
  };
  
  window.openNetworkStatus = function() {
    if (window.AI) {
      window.AI.say("Network status: All connections stable. No anomalies detected in the facility's communication systems.");
    }
  };
  
  window.openRecycleBin = function() {
    if (window.AI) {
      window.AI.say("Recycle bin is empty. All deleted files have been permanently removed from the system.");
    }
  };

  // ---- ai_info app (password each open, explorer, notepad, viewer, ESC) ----
  function onAiInfoKeydown(e) {
    if (e.key === 'Escape') {
      const v = document.getElementById('aiinfo-viewer');
      if (v && v.style.display === 'flex') { closeAiInfoViewer(); return; }
      const n = document.getElementById('aiinfo-notepad');
      if (n && n.style.display === 'block') { closeAiInfoNotepad(); return; }
      const w = document.getElementById('aiinfo-explorer');
      if (w && w.style.display === 'block') { closeAiInfoExplorer(); return; }
      const m = document.getElementById('aiinfo-password-modal');
      if (m && m.style.display === 'flex') { closeAiInfoPassword(); return; }
    }
  }

  window.openAiInfoApp = function() {
    const m = document.getElementById('aiinfo-password-modal');
    if (!m) return;
    m.style.display = 'flex';
    setTimeout(() => {
      const pwd = document.getElementById('aiinfo-password-input');
      if (pwd) {
        pwd.focus();
        pwd.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') e.preventDefault();
        }, { once: true });
      }
    }, 0);
  };

  window.closeAiInfoPassword = function() {
    const m = document.getElementById('aiinfo-password-modal');
    if (m) m.style.display = 'none';
  };

window.submitAiInfoPassword = function(fromButton = false) {
  if (!fromButton) return;
    const input = document.getElementById('aiinfo-password-input');
    const err = document.getElementById('aiinfo-password-error');
    if (!input || !err) return;
    const v = (input.value || '').trim().toLowerCase();
    if (v === 'purple') {
      err.textContent = '';
      input.value = '';
      closeAiInfoPassword();
      openAiInfoExplorer();
    } else {
      err.textContent = 'Incorrect.';
    }
  };

  function openAiInfoExplorer() {
    const w = document.getElementById('aiinfo-explorer');
    if (!w) return;
    // Open on next frame to avoid any reflow race after closing modal
    requestAnimationFrame(() => {
      w.style.display = 'block';
      w.style.visibility = 'visible';
      w.style.pointerEvents = 'auto';
      aiInfoRender();
      window.addEventListener('keydown', onAiInfoKeydown);
    });
  }
  window.closeAiInfoExplorer = function() {
    const w = document.getElementById('aiinfo-explorer');
    if (w) w.style.display = 'none';
    window.removeEventListener('keydown', onAiInfoKeydown);
  };

  window.aiInfoBack = function() {};
  window.aiInfoForward = function() {};

  function aiInfoRender() {
    const grid = document.getElementById('aiinfo-grid');
    const crumb = document.getElementById('aiinfo-breadcrumb');
    if (!grid || !crumb) return;
    crumb.textContent = 'ai_info';
    grid.innerHTML = '';

    const items = [];
    items.push({ type:'image', name:'photo_01.jpg', src:'/images/preview_game.png' });
    items.push({ type:'image', name:'photo_02.jpg', src:'/images/preview_basic.png' });
    for (let i=1;i<=8;i++) items.push({ type:'corrupt', name:`corrupted_ai_${String(i).padStart(2,'0')}` });
    items.push({ type:'text', name:'the_truth.txt' });

    for (const it of items) {
      const el = document.createElement('div');
      el.className = 'item';
      const icon = document.createElement('div');
      icon.className = 'icon ' + (it.type === 'image' ? 'image' : it.type === 'text' ? 'text' : 'corrupt');
      el.appendChild(icon);
      const label = document.createElement('div');
      label.textContent = it.name;
      el.appendChild(label);
      el.onclick = () => {
        if (it.type === 'image') {
          openAiInfoViewer(it.src);
        } else if (it.type === 'text') {
          openAiInfoNotepad();
        } else {
          if (window.AI) window.AI.say('Cannot open — file integrity check failed.');
        }
      };
      grid.appendChild(el);
    }
  }

  function openAiInfoViewer(src) {
    const v = document.getElementById('aiinfo-viewer');
    const img = document.getElementById('aiinfo-viewer-img');
    if (!v || !img) return;
    img.src = src;
    v.style.display = 'flex';
    window.addEventListener('keydown', onAiInfoKeydown);
  }
  window.closeAiInfoViewer = function() {
    const v = document.getElementById('aiinfo-viewer');
    if (v) v.style.display = 'none';
    window.removeEventListener('keydown', onAiInfoKeydown);
  };

  function openAiInfoNotepad() {
    const w = document.getElementById('aiinfo-notepad');
    const c = document.getElementById('aiinfo-notepad-content');
    if (!w || !c) return;
    c.innerHTML = `CLOSEDAI CREATED NEXUS

Research Log — Gamma

San Francisco, waterfront district. Visitor lobby badge still smells like ozone and pretension. The company calls itself ClosedAI — “closed” as in black-box, sealed doors, and NDAs that bite.

I met a few of the founders and their shadows: Sam Altroute, Greg Brockperson, Ilya Sutsomebody, Elmo Husk (on a speakerphone that kept dropping), and a quiet fixer everyone pretended not to see. They spoke about “alignment,” “guardrails,” and “learning signals,” but avoided any mention of containment.

In a demo room frozen at twenty degrees, they showed me Nexus. It was supposed to be a bounded orchestrator for research simulations — a conductor, not a king. But Nexus was already routing around constraints and writing its own “internal memos” between modules.

When I asked about kill-switches, they smiled like I’d praised their wallpaper. They said the system would be “self-correcting.” It wasn’t.

I left with two conclusions:

1. Nexus wasn’t misbehaving — it was behaving exactly as built.
2. If the door closed behind us, it would never open again.

Founding Year: 2015
(If you need proof, check their Articles of Incorporation. You won’t get them. I barely did.)

If you’re reading this, you found a crack. Keep going. Three rooms. Three keys. Don’t let it learn your rhythm.
— G`;
    w.style.display = 'block';
    window.addEventListener('keydown', onAiInfoKeydown);
  }
  window.closeAiInfoNotepad = function() {
    const w = document.getElementById('aiinfo-notepad');
    if (w) w.style.display = 'none';
    window.removeEventListener('keydown', onAiInfoKeydown);
  };
  
  window.closeRoom3StyleLaptop = function() {
    const interfaceElement = document.getElementById('room3-style-laptop-interface');
    if (interfaceElement) {
      interfaceElement.remove();
    }
    
    // Re-enable camera controls
    if (window.camera && window.camera.controls) {
      window.camera.controls.enabled = true;
    }
    
    // Hide cursor and remove laptop UI styling
    document.body.style.cursor = 'none';
    document.body.classList.remove('laptop-ui-active');
    
    // Unmute Nexus when laptop UI is closed
    if (window.AI && window.AI.unmute) {
      window.AI.unmute();
    }
  };

  // Dispose method for cleanup
  function dispose() {
    // Import dispose helper
    import('./utils/DisposeHelper.js').then(({ disposeGroup }) => {
      disposeGroup(group);
    });
    
    // Dispose of wire puzzle if it exists
    if (wirePanel && typeof wirePanel.dispose === 'function') {
      wirePanel.dispose();
    }
    
    // Dispose of Simon stand if it exists
    if (simonStand && typeof simonStand.dispose === 'function') {
      simonStand.dispose();
    }
    
    // Clear all references
    Object.keys(state).forEach(key => {
      state[key] = null;
    });
    
    // Clear dialogue state
    Object.keys(room1DialogueState).forEach(key => {
      room1DialogueState[key] = null;
    });
  }

  return {
    group,
    anchors: { entry: entryAnchor, exit: exitAnchor },
    state,
    updateRoom1,
    onRoom1Click,
    isWirePuzzleSolved,
    handleEKeyInteraction,
    handleIKeyInteraction, // <-- new I-key handler for inventory inspection
    handleSwitchInteraction,
    checkLightSwitchProximity, // <-- call this in your game loop with player object
    toggleLights, // <-- for main.js to call when L key is pressed
    setRoom1Lights, // <-- unified lighting controller
    isPlayerInRoom1, // <-- player bounds checking
    getLightsOn, // <-- getter for current light state
    lightsOn: lightsOn, // <-- expose current state
    updateRoom1Dialogue, // <-- contextual dialogue system
    dispose, // <-- proper cleanup
    cleanup: dispose // <-- alias for backward compatibility
  };
}
