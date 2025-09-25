import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addToInventory, hasInInventory, getPlayerInventory } from './player.js';
import { createWirePanel } from './puzzles/wirePanel.js';

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

  // Detailed tiled floor with cracks (like Room 0 but greenish-gray)
  function createDetailedFloor() {
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const ctx = floorCanvas.getContext('2d');
    
    // Base floor color (greenish-gray)
    ctx.fillStyle = '#1a2a1a'; // Dark greenish-gray base
    ctx.fillRect(0, 0, floorCanvas.width, floorCanvas.height);
    
    // Create tile grid (8x8 tiles)
    const tileSize = 64;
    const tileCount = 8;
    
    // Draw individual tiles with more visible color variations
    for (let i = 0; i < tileCount; i++) {
      for (let j = 0; j < tileCount; j++) {
        const x = i * tileSize;
        const y = j * tileSize;
        
        // More pronounced color variation for each tile
        const variation = (Math.sin(i * 0.5) + Math.cos(j * 0.3)) * 0.2;
        const tileColor = `hsl(120, 15%, ${20 + variation * 15}%)`;
        ctx.fillStyle = tileColor;
        ctx.fillRect(x, y, tileSize, tileSize);
        
        // More visible tile borders
        ctx.strokeStyle = '#1a2a1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }
    
    // Add cracks between tiles (more visible)
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 3;
    
    // Horizontal cracks
    for (let i = 1; i < tileCount; i++) {
      const y = i * tileSize;
      if (Math.random() < 0.4) { // 40% chance of crack
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(floorCanvas.width, y);
        ctx.stroke();
      }
    }
    
    // Vertical cracks
    for (let i = 1; i < tileCount; i++) {
      const x = i * tileSize;
      if (Math.random() < 0.4) { // 40% chance of crack
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, floorCanvas.height);
        ctx.stroke();
      }
    }
    
    // Add some diagonal cracks (more visible)
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(100, 150);
    ctx.lineTo(200, 250);
    ctx.moveTo(300, 100);
    ctx.lineTo(400, 200);
    ctx.moveTo(150, 350);
    ctx.lineTo(350, 450);
    ctx.moveTo(50, 300);
    ctx.lineTo(250, 400);
    ctx.stroke();
    
    // Add some broken tiles (darker)
    ctx.fillStyle = '#0f1f0f';
    for (let i = 0; i < 5; i++) {
      const tileX = Math.floor(Math.random() * tileCount) * tileSize;
      const tileY = Math.floor(Math.random() * tileCount) * tileSize;
      ctx.fillRect(tileX + 5, tileY + 5, tileSize - 10, tileSize - 10);
    }
    
    // Add oil stains and wear
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(150, 200, 20, 0, Math.PI * 2);
    ctx.arc(350, 300, 15, 0, Math.PI * 2);
    ctx.arc(100, 400, 12, 0, Math.PI * 2);
    ctx.fill();
    
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);
    
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      color: 0x1a2a1a,
      roughness: 0.9,
      metalness: 0.05,
      normalScale: new THREE.Vector2(0.5, 0.5)
    });
    
    // Store reference to floor material for lighting control
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.2, 18),
      floorMat
    );
    floor.receiveShadow = true;
    floor.name = 'room1-floor'; // Add name for easy reference
    group.add(floor);
  }
  createDetailedFloor();

  // Detailed wall material with industrial texture
  function createDetailedWallMaterial() {
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 512;
    wallCanvas.height = 512;
    const ctx = wallCanvas.getContext('2d');
    
    // Base wall color (slightly different from floor)
    ctx.fillStyle = '#2a3a2a'; // Greenish-gray
    ctx.fillRect(0, 0, wallCanvas.width, wallCanvas.height);
    
    // Add concrete block patterns
    ctx.strokeStyle = '#1a2a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        ctx.strokeRect(i * 64, j * 64, 64, 64);
      }
    }
    
    // Add weathering and stains
    ctx.fillStyle = '#1a2a1a';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * wallCanvas.width;
      const y = Math.random() * wallCanvas.height;
      const size = Math.random() * 8 + 2;
      ctx.fillRect(x, y, size, size);
    }
    
    // Add vertical streaks (water damage)
    ctx.fillStyle = '#0f1f0f';
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * wallCanvas.width;
      ctx.fillRect(x, 0, 2, wallCanvas.height);
    }
    
    const wallTexture = new THREE.CanvasTexture(wallCanvas);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 2);
    
    return new THREE.MeshStandardMaterial({
      map: wallTexture,
      color: 0x2a3a2a,
      roughness: 0.85,
      metalness: 0.08,
      normalScale: new THREE.Vector2(0.3, 0.3)
    });
  }
  
  const wallMat = createDetailedWallMaterial();

  // Back wall
  const wall1 = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 0.2), wallMat);
  wall1.position.set(0, 2, -9);
  wall1.userData = { type: 'wall', side: 'back' };
  wall1.castShadow = true;
  wall1.receiveShadow = true;
  group.add(wall1);

  // Front wall with doorway (split into two parts)
  const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 0.2), wallMat);
  frontWallLeft.position.set(-5.5, 2, 9);
  frontWallLeft.userData = { type: 'wall', side: 'front-left' };
  frontWallLeft.castShadow = true;
  frontWallLeft.receiveShadow = true;
  group.add(frontWallLeft);

  const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 0.2), wallMat);
  frontWallRight.position.set(5.5, 2, 9);
  frontWallRight.userData = { type: 'wall', side: 'front-right' };
  frontWallRight.castShadow = true;
  frontWallRight.receiveShadow = true;
  group.add(frontWallRight);

  // Side walls
  const wall3 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 18), wallMat);
  wall3.position.set(-9, 2, 0);
  wall3.userData = { type: 'wall', side: 'left' };
  wall3.castShadow = true;
  wall3.receiveShadow = true;
  group.add(wall3);

  const wall4 = wall3.clone();
  wall4.position.set(9, 2, 0);
  wall4.userData = { type: 'wall', side: 'right' };
  wall4.castShadow = true;
  wall4.receiveShadow = true;
  group.add(wall4);

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

  // Room 1: Detailed roof with industrial texture
  function createDetailedRoof() {
    const roofCanvas = document.createElement('canvas');
    roofCanvas.width = 512;
    roofCanvas.height = 512;
    const ctx = roofCanvas.getContext('2d');
    
    // Base roof color (darker greenish-gray)
    ctx.fillStyle = '#1a2a1a'; // Dark greenish-gray
    ctx.fillRect(0, 0, roofCanvas.width, roofCanvas.height);
    
    // Add ceiling tile patterns
    ctx.strokeStyle = '#0f1f0f';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        ctx.strokeRect(i * 64, j * 64, 64, 64);
      }
    }
    
    // Add ventilation patterns
    ctx.fillStyle = '#0a0a0a';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const x = i * 128 + 32;
        const y = j * 128 + 32;
        ctx.fillRect(x, y, 64, 64);
      }
    }
    
    // Add water stains and damage
    ctx.fillStyle = '#0f1f0f';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * roofCanvas.width;
      const y = Math.random() * roofCanvas.height;
      const size = Math.random() * 10 + 5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const roofTexture = new THREE.CanvasTexture(roofCanvas);
    roofTexture.wrapS = THREE.RepeatWrapping;
    roofTexture.wrapT = THREE.RepeatWrapping;
    roofTexture.repeat.set(2, 2);
    
    const roofMat = new THREE.MeshStandardMaterial({
      map: roofTexture,
      color: 0x1a2a1a,
      metalness: 0.2,
      roughness: 0.8,
      normalScale: new THREE.Vector2(0.3, 0.3)
    });
    
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.3, 18),
      roofMat
    );
    roof.position.set(0, 4.15, 0);
    roof.receiveShadow = true;
    group.add(roof);
  }
  createDetailedRoof();

  // Room 1: Enhanced ceiling light fixture (like Room 0)
  const lightFixtureGroup = new THREE.Group();
  lightFixtureGroup.name = 'ceiling-light-fixture';
  
  // Main light housing (metallic)
  const lightHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 0.3, 16),
    new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.1
    })
  );
  lightHousing.position.set(0, 0, 0);
  lightHousing.castShadow = false; // Don't cast shadows to avoid blocking light
  lightHousing.receiveShadow = true;
  lightFixtureGroup.add(lightHousing);
  
  // Light diffuser/cover (semi-transparent)
  const lightDiffuser = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.1, 16),
    new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      emissive: 0xffffff,
      emissiveIntensity: 0.1
    })
  );
  lightDiffuser.position.set(0, -0.1, 0);
  lightDiffuser.castShadow = false;
  lightFixtureGroup.add(lightDiffuser);
  
  // Light bulb/emitter (glowing)
  const lightBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 12, 8),
    new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    })
  );
  lightBulb.position.set(0, -0.15, 0);
  lightBulb.castShadow = false;
  lightBulb.name = 'light-bulb';
  lightFixtureGroup.add(lightBulb);
  
  // Mounting bracket
  const mountingBracket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8),
    new THREE.MeshStandardMaterial({ 
      color: 0x222222,
      metalness: 0.8,
      roughness: 0.3
    })
  );
  mountingBracket.position.set(0, 0.2, 0);
  mountingBracket.castShadow = false; // Don't cast shadows to avoid blocking light
  lightFixtureGroup.add(mountingBracket);
  
  lightFixtureGroup.position.set(0, 4.0, 0);
  group.add(lightFixtureGroup);

  // Room 1: Optimized lighting controller setup
  const lights = {
    ambient: new THREE.AmbientLight(0x404040, 1.2),
    ceiling: new THREE.PointLight(0xFFFFFF, 2.5, 20),
    spot: new THREE.SpotLight(0xffffff, 1.5, 12, Math.PI / 6, 0.2, 1)
  };
  
  // Optimize shadow settings for better performance
  lights.ceiling.distance = 20;
  lights.ceiling.position.set(0, 3.8, 0);
  lights.ceiling.castShadow = true;
  lights.ceiling.shadow.mapSize.width = 256; // Reduced from 512 for better performance
  lights.ceiling.shadow.mapSize.height = 256;
  lights.ceiling.shadow.camera.near = 0.1;
  lights.ceiling.shadow.camera.far = 25;
  lights.ceiling.name = 'ceiling-light';
  
  lights.spot.distance = 12;
  lights.spot.position.set(0, 3.8, 0);
  lights.spot.target.position.set(0, 0, 0);
  lights.spot.castShadow = true;
  lights.spot.shadow.mapSize.width = 256; // Reduced from 512 for better performance
  lights.spot.shadow.mapSize.height = 256;
  lights.spot.shadow.camera.near = 0.1;
  lights.spot.shadow.camera.far = 15;
  
  // Add lights to group
  group.add(lights.ambient);
  group.add(lights.ceiling);
  group.add(lights.spot);
  group.add(lights.spot.target);

  // Add swivel cameras
  function addSwivelCameras() {
    // Camera 1 (corner)
    const camera1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.8,
        roughness: 0.2
      })
    );
    camera1.position.set(-7, 3.5, -7);
    camera1.rotation.z = Math.PI / 4; // Angled
    camera1.castShadow = true;
    group.add(camera1);
    
    // Camera 2 (wall mounted)
    const camera2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8),
      new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.9,
        roughness: 0.1
      })
    );
    camera2.position.set(8.5, 3, 0);
    camera2.rotation.y = Math.PI / 2;
    camera2.castShadow = true;
    group.add(camera2);
    
    // Camera 3 (ceiling mounted)
    const camera3 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.4, 8),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.7,
        roughness: 0.3
      })
    );
    camera3.position.set(0, 4.1, 0);
    camera3.castShadow = true;
    group.add(camera3);
  }
  addSwivelCameras();

  // Wire Panel System (GLB model enabled with aggressive optimizations)
  // Set useGLBModel to false if you want to disable the Power_Box model for better performance
  const wirePanel = createWirePanel({ order: ['R','G','B','Y'], useGLBModel: true });
  wirePanel.group.name = 'wirePanel';
  wirePanel.group.position.set(8.2, 0.8, 0); // Right wall, adjusted Y for powerbox model
  wirePanel.group.rotation.y = -Math.PI / 2; // Rotate to face the player
  group.add(wirePanel.group);

  // Wire panel interaction functions
  function onRoom1Click(intersection, opts) {
    if (!intersection || !intersection.object) return false;
    
    // Check if the clicked object is the wire panel trigger
    if (intersection.object.userData.type === 'wire-panel-trigger') {
      console.log('Wire panel trigger clicked - opening popup');
      wirePanel.openPanel();
      return true;
    }
    
    return false;
  }

  // E-key interaction for wire panel
  function handleWirePanelEKey(playerObject) {
    if (!wirePanel) return false;
    
    // Check if player is near the wire panel
    const panelWorldPos = new THREE.Vector3();
    wirePanel.group.getWorldPosition(panelWorldPos);
    const distance = playerObject.position.distanceTo(panelWorldPos);
    
    if (distance < 3.0) { // Within 3 units of the panel
      if (wirePanel.state.isOpen) {
        wirePanel.closePanel();
        console.log('Wire panel closed via E-key');
      } else {
        wirePanel.openPanel();
        console.log('Wire panel opened via E-key');
      }
      return true;
    }
    
    return false;
  }

  function isWirePuzzleSolved() {
    return wirePanel.state.solved;
  }

  // Room 1: Create emissives list for bulbs, LEDs, and indicators
  const emissives = [];
  
  // Add light fixture bulb to emissives
  const lightBulbRef = lightFixtureGroup.getObjectByName('light-bulb');
  if (lightBulbRef) {
    emissives.push(lightBulbRef);
  }

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
    
    // Update wire panel effects
    wirePanel.update(dt);
  }
  
  // Light flicker effect (hum and occasional flicker)
  function updateLightFlicker(dt) {
    if (!lightsOn) return; // Only flicker when lights are on
    
    flickerTime += dt;
    
    // Hum effect (subtle intensity variation)
    const humVariation = Math.sin(flickerTime * 120) * 0.05; // 120Hz hum
    const baseIntensity = 1.0;
    
    // Occasional flicker (random)
    let flickerIntensity = 1.0;
    if (Math.random() < 0.02) { // 2% chance per frame
      flickerIntensity = Math.random() * 0.3 + 0.1; // Flicker to 10-40% intensity
    }
    
    // Apply to ceiling light
    const ceilingLight = group.getObjectByName('ceiling-light');
    if (ceilingLight) {
      ceilingLight.intensity = baseIntensity + humVariation + (flickerIntensity - 1.0);
    }
    
    // Apply to light fixture bulb
    const lightBulb = lightFixtureGroup.getObjectByName('light-bulb');
    if (lightBulb) {
      const newIntensity = 0.8 + humVariation * 0.5 + (flickerIntensity - 1.0) * 0.5;
      lightBulb.material.emissiveIntensity = Math.max(0.1, newIntensity);
    }
  }

  // Removed pedestal, panel, and keypad to keep only table and safe in this room

  // Create shared GLTFLoader instance for better performance
  const gltfLoader = new GLTFLoader();
  
  // Load sci-fi table (independent of safe placement)
  gltfLoader.load('/models/sci_fi_table.glb', (gltf) => {
    const sciFiTable = gltf.scene;
    sciFiTable.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Move the table near the back wall but not clipping (centered)
    sciFiTable.position.set(0, 0, -7.5);
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
    // Place it near the back wall, next to the table (right side)
    safeModel.position.set(1.8, 0.1, -7.8); // z = -7.8 is near back wall but not clipping
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
  panelMesh.position.set(0, 2.5, -7.85); // pull slightly forward to avoid z-fighting
  panelMesh.rotation.x = -0.05; // slight tilt for realism
  panelMesh.renderOrder = 1;

  group.add(panelMesh);

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
            <li style="color: #0000ff; font-weight: bold;">Blue</li>
            <li style="color: #008000; font-weight: bold;">Green</li>
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
          window.AI.say("Ah yes, the circuit problem. From my memory, it's Blue, Green, Yellow, Red. That should be the correct order.");
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

  // E-key interaction for room1
  function handleEKeyInteraction(playerObject) {
    // Check wire panel first
    if (handleWirePanelEKey(playerObject)) {
      return true;
    }
    
    // Check if player is near the light switch
    const lightSwitchGroup = group.getObjectByName('light-switch-group');
    if (lightSwitchGroup) {
      const switchWorldPos = new THREE.Vector3();
      lightSwitchGroup.getWorldPosition(switchWorldPos);
      const distanceToSwitch = playerObject.position.distanceTo(switchWorldPos);
      
      if (distanceToSwitch < 4.0) { // Increased from 2.0 to 4.0 units
        // Toggle lights
        const currentState = lightsOn;
        setRoom1Lights(!currentState);
        return true;
      }
    }
    
    // Original safe interaction
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
  entryAnchor.position.set(0, 0, 9); // Front of room (entry point)
  group.add(entryAnchor);

  const exitAnchor = new THREE.Object3D();
  exitAnchor.name = 'exitAnchor';
  exitAnchor.position.set(0, 0, -9); // Back of room (exit point)
  group.add(exitAnchor);

  // Collision detection function for room1 walls (account for room's world position)
  function checkWallCollisions(playerObject) {
    if (!playerObject || !playerObject.position) return;
    const playerRadius = 0.5;
    const roomHalf = 9; // Half of 18
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
  
  // Position the entire switch group - moved to left wall for visibility
  lightSwitchGroup.position.set(-8.5, 1.8, 0); // Left wall, away from edge
  lightSwitchGroup.rotation.y = Math.PI / 2; // Rotate 90 degrees to face the wall
  lightSwitchGroup.userData = { type: 'lightSwitch' };
  group.add(lightSwitchGroup);
  
  // Add a bright spotlight to illuminate the switch area
  const switchSpotlight = new THREE.SpotLight(0x00ff00, 1.0, 15, Math.PI / 6, 0.2, 1);
  switchSpotlight.position.set(-8.5, 4.0, 0);
  switchSpotlight.target.position.set(-8.5, 1.8, 0);
  switchSpotlight.castShadow = true;
  switchSpotlight.name = 'switch-spotlight';
  group.add(switchSpotlight);
  group.add(switchSpotlight.target);
  
  // Add a large glowing floor indicator to help find the switch
  const floorIndicator = new THREE.Mesh(
    new THREE.CircleGeometry(2.0, 16),
    new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.7
    })
  );
  floorIndicator.position.set(-8.5, 0.01, 0);
  floorIndicator.rotation.x = -Math.PI / 2;
  floorIndicator.name = 'switch-indicator';
  group.add(floorIndicator);
  
  // Add a bright point light above the switch for extra visibility
  const switchLight = new THREE.PointLight(0x00ff00, 0.8, 10);
  switchLight.position.set(-8.5, 3.0, 0);
  switchLight.name = 'switch-point-light';
  group.add(switchLight);
  
  // Add switch lights to lights registry
  lights.switchSpotlight = new THREE.SpotLight(0x00ff00, 1.0, 15, Math.PI / 6, 0.2, 1);
  lights.switchSpotlight.position.set(-8.5, 4.0, 0);
  lights.switchSpotlight.target.position.set(-8.5, 1.8, 0);
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
  arrowIndicator.position.set(-8.5, 3.5, 0);
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
  if (floorIndicator) emissives.push(floorIndicator);
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
      
      if (window.AI) window.AI.say(lightsOn ? 'Lights on.' : 'Lights off.');
      return true;
    }
    return false;
  }

  // Optimized lighting controller for Room 1
  function setRoom1Lights(on) {
    console.log('setRoom1Lights called with:', on);
    
    // Use requestAnimationFrame to defer heavy operations
    requestAnimationFrame(() => {
      // Toggle point/spot lights
      lights.ceiling.visible = on;
      lights.spot.visible = on;
      lights.switchSpotlight.visible = on;
      lights.switchPointLight.visible = on;
      
      // Set ambient intensity
      if (lights.ambient) {
        lights.ambient.intensity = on ? 1.2 : 0.0;
      }
      
      // Batch material updates to reduce performance impact
      const materialUpdates = [];
      
      // Update emissive meshes
      for (const mesh of emissives) {
        if (!mesh || !mesh.material) continue;
        if ('emissiveIntensity' in mesh.material) {
          materialUpdates.push(() => {
            mesh.material.emissiveIntensity = on ? 1.5 : 0.0;
            mesh.visible = on;
          });
        }
      }
      
      // Update floor material
      const floor = group.getObjectByName('room1-floor');
      if (floor && floor.material) {
        materialUpdates.push(() => {
          floor.material.color.setHex(on ? 0x2a3a2a : 0x050505);
        });
      }
      
      // Update wall materials (batch this operation)
      const wallMeshes = [];
      group.traverse((child) => {
        if (child.isMesh && child.userData && child.userData.type === 'wall') {
          wallMeshes.push(child);
        }
      });
      
      wallMeshes.forEach(wall => {
        if (wall.material && wall.material.color) {
          materialUpdates.push(() => {
            wall.material.color.setHex(on ? 0x3a4a3a : 0x080808);
          });
        }
      });
      
      // Execute material updates in batches
      materialUpdates.forEach(update => update());
      
      // Update light fixture visibility
      const lightFixtureGroup = group.getObjectByName('ceiling-light-fixture');
      if (lightFixtureGroup) {
        lightFixtureGroup.visible = on;
      }
      
      // Update switch visual feedback
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
      
      // Update global ambient lighting (defer this heavy operation)
      if (window.gameState && window.gameState.room0) {
        setTimeout(() => {
          window.gameState.room0.group.traverse((child) => {
            if (child.isAmbientLight) {
              child.intensity = on ? 0.2 : 0.05;
            }
          });
        }, 0);
      }
      
      // Update state
      lightsOn = on;
    });
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

  // Initialize lights OFF by default
  setRoom1Lights(false);
  
  // Room 1 contextual dialogue system
  let room1DialogueState = {
    hasWelcomed: false,
    hasPromptedDesk: false,
    hasPromptedPaper: false,
    hasExaminedPaperWithLightsOff: false
  };
  
  // Welcome message for Room 1
  function triggerRoom1Welcome() {
    if (!room1DialogueState.hasWelcomed) {
      room1DialogueState.hasWelcomed = true;
      if (window.AI) {
        // Add 5-second delay to allow Room 0 door message to play first
        setTimeout(() => {
          window.AI.say("Welcome to Room 1. This is your first challenge room. It's quite dark in here - you might want to find the light switch. Look around - there's a desk with a safe, and some interesting equipment. Take your time to explore.");
        }, 5000);
      }
    }
  }
  
  // Prompt to check desk and safe
  function triggerDeskSafePrompt() {
    if (!room1DialogueState.hasPromptedDesk && state.safeOpened) {
      room1DialogueState.hasPromptedDesk = true;
      if (window.AI) {
        window.AI.say("Good Work opening the safe! You have a note in your inventory. Press E to examine it closely. These documents often contain important information for solving puzzles. Make sure you have good lighting to read it properly.");
      }
    }
  }
  
  // Prompt to examine paper
  function triggerPaperPrompt() {
    if (!room1DialogueState.hasPromptedPaper && hasInInventory('room1-note')) {
      room1DialogueState.hasPromptedPaper = true;
      if (window.AI) {
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
      }
    }
  }
  
  return {
    group,
    anchors: { entry: entryAnchor, exit: exitAnchor },
    state,
    checkWallCollisions,
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
    updateRoom1Dialogue // <-- contextual dialogue system
  };
}

