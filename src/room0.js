import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addToInventory, hasInInventory, removeFromInventory, registerOriginalModel, getPlayerInventory } from './player.js';
import { makeBrickMaterialForPanel, makeTiles108Floor, makeMetal030MaterialForCylinderFlexible, makeConcrete031MaterialFlexible } from './materials/room0Materials.js';
import {
  setupRendererColorPipeline,
  applyEnvironment,
  buildStandardLightRig,
  removeExistingLights,
} from './lighting/standardLighting.js';
import { createFuturisticDoor } from './game/props/FuturisticDoor.js';
import { createWarningLabelTexture } from './game/props/fx/doorTextures.js';

// Stage 0: Lobby/Entry Room
export function createRoom0() {
  const group = new THREE.Group();
  group.name = 'stage0-room';

  const roomWidth = 20;
  const roomDepth = 15;
  
  // Metal030 texture files - edit this object to match your files on disk
  const metal030Files = {
  color:  "./textures/metal030/Metal030_2K-JPG_Color.jpg",
  normal: "./textures/metal030/Metal030_2K-JPG/Metal030_2K-JPG_NormalGL.jpg", // Using GL normal map from nested folder
  rough:  "./textures/metal030/Metal030_2K-JPG_Roughness.jpg",
  metal:  "./textures/metal030/Metal030_2K-JPG_Metalness.jpg",       // metalness map available
    // ao:     "/textures/metal030/Metal030_2K-JPG_AmbientOcclusion.jpg", // include only if you have it
  };
  
  // Concrete031 texture files for hallway
  const concrete031Files = {
  color:  "./textures/concrete031/Concrete031_2K-JPG_Color.jpg",
  normal: "./textures/concrete031/Concrete031_2K-JPG_NormalGL.jpg",
  rough:  "./textures/concrete031/Concrete031_2K-JPG_Roughness.jpg",
  ao:     "./textures/concrete031/Concrete031_2K-JPG_AmbientOcclusion.jpg",
  };
  
  // === Floor: Tiles108 (single tiled plane with AO/normal/roughness) ===
  {
    const floor = makeTiles108Floor(roomWidth, roomDepth, {
      tileSizeMeters: 1.0, // smaller value = smaller visible tiles; try 0.8 or 0.5 if you want
      anisotropy: 4 // Reduced from 16 to 4 for performance
    });
    group.add(floor);
  }

  // Stage 0: Four walls with collision detection - Brick texture style
  
  const wallHeight = 4;
  const wallThickness = 0.5;
  const roomWidthHalf = 10;  // Half width (total 20)
  const roomDepthHalf = 7.5; // Half depth (total 15)

  // Create detailed wall panels with seams and bolts
  function createWallPanel(width, height, position, rotation = 0) {
    const panelGroup = new THREE.Group();
    
    // Build a Bricks058 material sized to this panel
    const panelMaterial = makeBrickMaterialForPanel(width, height, {
      repeatsPerMeterX: 0.7,   // tweak to taste
      repeatsPerMeterY: 0.7,
      metalness: 0.0,
      roughness: 1.0,
      anisotropy: 4, // Reduced from 12 to 4 for performance
    });
    
    // Main panel
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, wallThickness),
      panelMaterial
    );
    panel.castShadow = true;
    panel.receiveShadow = true;
    panelGroup.add(panel);
    
    // Add panel seams (vertical lines)
    const seamMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4a4a4a,
      metalness: 0.9,
      roughness: 0.2
    });
    
    for (let i = 1; i < 3; i++) {
      const seam = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, height, wallThickness + 0.01),
        seamMaterial
      );
      seam.position.set((i - 1.5) * width / 3, 0, 0);
      panelGroup.add(seam);
    }
    
    // Add horizontal seams
    for (let i = 1; i < 3; i++) {
      const seam = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.02, wallThickness + 0.01),
        seamMaterial
      );
      seam.position.set(0, (i - 1.5) * height / 3, 0);
      panelGroup.add(seam);
    }
    
    // Add corner bolts
    const boltMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a,
      metalness: 0.9,
      roughness: 0.1
    });
    
    const boltPositions = [
      [-width/2 + 0.3, height/2 - 0.3],
      [width/2 - 0.3, height/2 - 0.3],
      [-width/2 + 0.3, -height/2 + 0.3],
      [width/2 - 0.3, -height/2 + 0.3]
    ];
    
    boltPositions.forEach(([x, y]) => {
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8),
        boltMaterial
      );
      bolt.position.set(x, y, wallThickness/2 + 0.05);
      bolt.rotation.x = Math.PI / 2;
      panelGroup.add(bolt);
    });
    
    panelGroup.position.copy(position);
    panelGroup.rotation.y = rotation;
    return panelGroup;
  }

  // Back wall (with door opening) - Left panel
  const backWallLeft = createWallPanel(8.5, wallHeight, new THREE.Vector3(-5.75, wallHeight/2, -roomDepthHalf));
  backWallLeft.userData = { type: 'wall', side: 'back-left' };
  group.add(backWallLeft);

  // Back wall (with door opening) - Right panel
  const backWallRight = createWallPanel(8.5, wallHeight, new THREE.Vector3(5.75, wallHeight/2, -roomDepthHalf));
  backWallRight.userData = { type: 'wall', side: 'back-right' };
  group.add(backWallRight);

  // Left wall - Split into two panels to create opening for Room 3 hallway
  const leftWallTop = createWallPanel(6, wallHeight, new THREE.Vector3(-roomWidthHalf, wallHeight/2, 4.0), Math.PI/2);
  leftWallTop.userData = { type: 'wall', side: 'left-top' };
  group.add(leftWallTop);

  const leftWallBottom = createWallPanel(6, wallHeight, new THREE.Vector3(-roomWidthHalf, wallHeight/2, -4.0), Math.PI/2);
  leftWallBottom.userData = { type: 'wall', side: 'left-bottom' };
  group.add(leftWallBottom);

  // Right wall - Split into two panels to create opening for Room 1 hallway
  const rightWallTop = createWallPanel(6, wallHeight, new THREE.Vector3(roomWidthHalf, wallHeight/2, 4.0), Math.PI/2);
  rightWallTop.userData = { type: 'wall', side: 'right-top' };
  group.add(rightWallTop);

  const rightWallBottom = createWallPanel(6, wallHeight, new THREE.Vector3(roomWidthHalf, wallHeight/2, -4.0), Math.PI/2);
  rightWallBottom.userData = { type: 'wall', side: 'right-bottom' };
  group.add(rightWallBottom);
  
  // Add invisible collision walls behind the detailed panels with openings
  const leftCollisionWallTop = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, 6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  leftCollisionWallTop.position.set(-roomWidthHalf, wallHeight/2, 4.0);
  leftCollisionWallTop.userData = { type: 'collision-wall', side: 'left-top' };
  group.add(leftCollisionWallTop);

  const leftCollisionWallBottom = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, 6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  leftCollisionWallBottom.position.set(-roomWidthHalf, wallHeight/2, -4.0);
  leftCollisionWallBottom.userData = { type: 'collision-wall', side: 'left-bottom' };
  group.add(leftCollisionWallBottom);
  
  const rightCollisionWallTop = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, 6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  rightCollisionWallTop.position.set(roomWidthHalf, wallHeight/2, 4.0);
  rightCollisionWallTop.userData = { type: 'collision-wall', side: 'right-top' };
  group.add(rightCollisionWallTop);

  const rightCollisionWallBottom = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, 6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  rightCollisionWallBottom.position.set(roomWidthHalf, wallHeight/2, -4.0);
  rightCollisionWallBottom.userData = { type: 'collision-wall', side: 'right-bottom' };
  group.add(rightCollisionWallBottom);

  // Front wall (entrance) - Create detailed panels
  const frontWallLeft = createWallPanel(9, wallHeight, new THREE.Vector3(-5.5, wallHeight/2, roomDepthHalf));
  frontWallLeft.userData = { type: 'wall', side: 'front-left' };
  group.add(frontWallLeft);
  
  const frontWallRight = createWallPanel(9, wallHeight, new THREE.Vector3(5.5, wallHeight/2, roomDepthHalf));
  frontWallRight.userData = { type: 'wall', side: 'front-right' };
  group.add(frontWallRight);

  // Headers above hallway openings removed to avoid visual obstruction over doorways
  const hallwayWidth = 3; // kept for collision math below
  
  // Add invisible collision walls for front wall (matching the visible panels)
  const frontCollisionWallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(9, wallHeight, wallThickness),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  frontCollisionWallLeft.position.set(-5.5, wallHeight/2, roomDepthHalf);
  frontCollisionWallLeft.userData = { type: 'collision-wall', side: 'front-left' };
  group.add(frontCollisionWallLeft);
  
  const frontCollisionWallRight = new THREE.Mesh(
    new THREE.BoxGeometry(9, wallHeight, wallThickness),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  frontCollisionWallRight.position.set(5.5, wallHeight/2, roomDepthHalf);
  frontCollisionWallRight.userData = { type: 'collision-wall', side: 'front-right' };
  group.add(frontCollisionWallRight);
  
  // Add invisible collision walls for back wall (with door opening)
  // Left side of doorway (from -10 to -2)
  const backCollisionWallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(8, wallHeight, wallThickness),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  backCollisionWallLeft.position.set(-6, wallHeight/2, -roomDepthHalf - 0.5);
  backCollisionWallLeft.userData = { type: 'collision-wall', side: 'back-left' };
  group.add(backCollisionWallLeft);
  
  // Right side of doorway (from 2 to 10)
  const backCollisionWallRight = new THREE.Mesh(
    new THREE.BoxGeometry(8, wallHeight, wallThickness),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  backCollisionWallRight.position.set(6, wallHeight/2, -roomDepthHalf - 0.5);
  backCollisionWallRight.userData = { type: 'collision-wall', side: 'back-right' };
  group.add(backCollisionWallRight);
  
  // Front ventilation grille removed to keep hallway entrance clear

  // Stage 0: Roof removed - now using global skybox
  // Ceiling light fixture removed - now using global lighting

  // --- Standard lighting rig for Room 0 ---
  {
    // Remove any leftover lights under this room group (if any slipped through)
    removeExistingLights(group);

    // Standard lighting removed - no lighting in Room 0
    // const rig = buildStandardLightRig({
    //   keyPosition: new THREE.Vector3(0, 18, 0), // Directly above Room 0 center
    //   keyIntensity: 1.15,
    //   hemiIntensity: 0.35,
    //   shadowMap: 1024,
    //   shadowBounds: 14,
    //   enableAccents: false,
    // });
    // group.add(rig);
  }

  // Emergency lights removed for performance optimization (like Room 1)

  // --- Card Deposit Box (3 slots, holds cards vertically) ---
  const cardBox = new THREE.Group();
  cardBox.name = 'card-deposit-box';
  // Place on the north wall; align the box's right edge with the Room 4 hallway entrance (x = +1.5)
  // Box width is 3.0, so center at x = +1.5 - (3.0/2) = 0.0
  cardBox.position.set(-5.0, 0, -6.8);
  group.add(cardBox);

  // Box base
  const boxOuter = new THREE.Mesh(
    // Much bigger table footprint (w x h x d)
    new THREE.BoxGeometry(3.0, 0.9, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x202430, metalness: 0.6, roughness: 0.3 })
  );
  boxOuter.castShadow = true;
  boxOuter.receiveShadow = true;
  boxOuter.position.set(0, 0.45, 0);
  cardBox.add(boxOuter);

  // Inner cavity
  const cavity = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.6, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x0d1117, metalness: 0.2, roughness: 0.9 })
  );
  cavity.position.set(0, 0.50, 0);
  cardBox.add(cavity);

  // Slot dividers (to create 3 separated slots)
  const dividerMat = new THREE.MeshStandardMaterial({ color: 0x2a3140, metalness: 0.4, roughness: 0.4 });
  const dividerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.56, 0.86), dividerMat);
  dividerLeft.position.set(-0.9, 0.50, 0);
  const dividerRight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.56, 0.86), dividerMat);
  dividerRight.position.set(0.9, 0.50, 0);
  cardBox.add(dividerLeft, dividerRight);

  // Subtle glow strip to hint it's interactive
  const glowStrip = new THREE.Mesh(
    new THREE.BoxGeometry(2.9, 0.01, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x003322, emissiveIntensity: 0.6 })
  );
  glowStrip.position.set(0, 0.92, 0.5);
  cardBox.add(glowStrip);

  // Slot positions (cards stand vertically, three slots left-to-right)
  const slotPositions = [
    // Target Y set above tabletop so cards appear to float on top
    new THREE.Vector3(-1.2, 1.05, 0),
    new THREE.Vector3(0.0, 1.05, 0),
    new THREE.Vector3(1.2, 1.05, 0),
  ];
  const cardSlots = [null, null, null];
  const cardLiftAnimations = []; // simple lift animations for inserted cards

  // Create a simple card mesh (fallback rectangular card) standing upright
  function createUprightCardMesh() {
    const group = new THREE.Group();
    // Rotate 90 degrees so the longer side is vertical (height 0.86)
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.86, 0.02),
      new THREE.MeshStandardMaterial({ 
        color: 0x003311,
        emissive: 0x00ff88,
        emissiveIntensity: 1.2,
        metalness: 0.3,
        roughness: 0.4
      })
    );
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.1, 0.01),
      new THREE.MeshStandardMaterial({ 
        color: 0x002211,
        emissive: 0x00dd77,
        emissiveIntensity: 0.9,
        metalness: 0.6,
        roughness: 0.3 
      })
    );
    stripe.position.set(0, 0.25, 0.012);
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x00ff99, emissive: 0x00ff99, emissiveIntensity: 1.0 })
    );
    led.position.set(0.2, -0.2, 0.012);
    group.add(body, stripe, led);
    // Upright by default; ensure double-sided rendering to avoid thin face cull
    body.material.side = THREE.DoubleSide;
    stripe.material.side = THREE.DoubleSide;
    group.castShadow = true;
    group.receiveShadow = true;
    return group;
  }

  function hasEmptySlot() {
    return cardSlots.findIndex(s => s === null) !== -1;
  }

  function insertCardIntoFirstEmptySlot() {
    const idx = cardSlots.findIndex(s => s === null);
    if (idx === -1) return false;
    const mesh = createUprightCardMesh();
    const p = slotPositions[idx];
    // Start inside the box and animate lifting to target Y on top
    mesh.position.set(p.x, 0.50, p.z); // start near cavity center height
    mesh.rotation.y = 0;
    mesh.rotation.x = 0;
    cardBox.add(mesh);
    cardSlots[idx] = mesh;
    mesh.userData.isTableCard = true;
    mesh.userData.slotIndex = idx;
    // Queue lift animation
    cardLiftAnimations.push({ mesh, startY: mesh.position.y, endY: p.y, t: 0 });
    return true;
  }

  // Stage 0: Pedestal with key - Metal030 textured
  const pedestalBaseGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
  const pedestalBase = new THREE.Mesh(
    pedestalBaseGeo,
    makeMetal030MaterialForCylinderFlexible(0.4, 0.1, metal030Files, {
      uScale: 0.3,
      vScale: 0.3,
      anisotropy: 4, // Reduced from 16 to 4 for performance
      // attachAOToGeometry: pedestalBaseGeo,
    })
  );
  pedestalBase.position.set(0, 0.05, -2);
  pedestalBase.castShadow = true;
  pedestalBase.receiveShadow = true;
  group.add(pedestalBase);
  
  const pedestalGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 32);
  const pedestal = new THREE.Mesh(
    pedestalGeo,
    makeMetal030MaterialForCylinderFlexible(0.3, 0.8, metal030Files, {
      uScale: 0.25,
      vScale: 0.25,
      anisotropy: 4, // Reduced from 16 to 4 for performance
      // attachAOToGeometry: pedestalGeo,
    })
  );
  pedestal.position.set(0, 0.4, -2);
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  group.add(pedestal);

  // Stage 0: Custom Blender key model
  let key = null; // Will be set after loading
  const loader = new GLTFLoader();
  
  loader.load('./models/key.glb', (gltf) => {
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
          // child.material.emissive = new THREE.Color(0xffaa00); // Removed for performance
          // child.material.emissiveIntensity = 0.3; // Removed for performance
          child.material.metalness = 0.8;
          child.material.roughness = 0.2;
        }
      }
    });
    
    // Add to the room group
    group.add(key);
    
    // Register the key model for dropped items
    registerOriginalModel('stage0-key', key);
    
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
        // emissive: 0xffaa00, // Removed for performance
        // emissiveIntensity: 0.8, // Removed for performance
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

  // Stage 0: Add some decorative elements - Metal030 pillars
  const pillarRadius = 0.2;
  const pillarHeight = wallHeight;

  // Pillar 1
  const pillarGeo1 = new THREE.CylinderGeometry(pillarRadius, pillarRadius, pillarHeight, 32);
  const cornerPillar1 = new THREE.Mesh(
    pillarGeo1,
    makeMetal030MaterialForCylinderFlexible(pillarRadius, pillarHeight, metal030Files, {
      uScale: 0.35,
      vScale: 0.35,
      anisotropy: 4, // Reduced from 16 to 4 for performance
      // If you DO have AO, pass geometry so we add uv2:
      // attachAOToGeometry: pillarGeo1,
      // aoMapIntensity: 1.6,
    })
  );
  cornerPillar1.position.set(-8, wallHeight / 2, -6);
  cornerPillar1.castShadow = true;
  cornerPillar1.receiveShadow = true;
  group.add(cornerPillar1);

  // Pillar 2
  const pillarGeo2 = new THREE.CylinderGeometry(pillarRadius, pillarRadius, pillarHeight, 32);
  const cornerPillar2 = new THREE.Mesh(
    pillarGeo2,
    makeMetal030MaterialForCylinderFlexible(pillarRadius, pillarHeight, metal030Files, {
      uScale: 0.35,
      vScale: 0.35,
      anisotropy: 4, // Reduced from 16 to 4 for performance
      // attachAOToGeometry: pillarGeo2,
    })
  );
  cornerPillar2.position.set(9.5, wallHeight / 2, -6);
  cornerPillar2.castShadow = true;
  cornerPillar2.receiveShadow = true;
  group.add(cornerPillar2);

  // Stage 0: Futuristic door (replaces old door implementation)
  const door = createFuturisticDoor({
    keyId: 'stage0-key',
    locked: true,
    position: { x: 0, y: 1.75, z: -roomDepthHalf + 0.15 },
    rotationY: 0,
    width: 3.0,
    height: 3.5,
    openOffset: 4.0, // Panels slide much further out of the way
    labelText: "RESTRICTED SECTOR", // Starts with red warning text
    id: 'stage0-door'
  });

  // Set up door events
  door.userData.onOpen = () => {
    if (window.AI) {
      window.AI.say("Perfect. Beyond this door… more challenges await. I'll guide you.");
    }
  };

  door.userData.onUnlock = () => {
    if (window.AI) {
      window.AI.say("Access granted. The door is now unlocked.");
    }
  };

  door.userData.onDenied = () => {
    if (window.AI) {
      window.AI.say("Access denied. You need the proper key to open this door.");
    }
  };

  door.castShadow = true;
  group.add(door);

  // Stage 0: East door (to Room 1) - Always accessible
  const eastDoor = createFuturisticDoor({
    keyId: null, // No key required
    locked: false, // Always unlocked
    position: { x: 9, y: 1.75, z: 0 },
    rotationY: -Math.PI / 2, // Rotate -90 degrees to face west (toward room0)
    width: 3.0,
    height: 3.5,
    openOffset: 4.0,
    labelText: "EAST SECTOR",
    id: 'east-door'
  });
  
  console.log(`[Room0] Created east door with ID: ${eastDoor.userData.id}, category: ${eastDoor.userData.category}`);

  eastDoor.userData.onOpen = () => {
    if (window.AI) {
      window.AI.say("East sector accessible. Your first challenge awaits.");
    }
  };

  eastDoor.userData.onUnlock = () => {
    if (window.AI) {
      window.AI.say("East access granted.");
    }
  };

  eastDoor.userData.onDenied = () => {
    if (window.AI) {
      window.AI.say("East sector requires proper authorization.");
    }
  };

  eastDoor.castShadow = true;
  group.add(eastDoor);

  // Stage 0: South door (to Room 2) - Locked until Room 1 completed
  const southDoor = createFuturisticDoor({
    keyId: null, // No physical key, unlocked by game state
    locked: true, // Starts locked
    position: { x: 0, y: 1.75, z: 6.5 }, // Moved forward from 7.5 to 6.5
    rotationY: Math.PI, // Face north (toward room0)
    width: 3.0,
    height: 3.5,
    openOffset: 4.0,
    labelText: "SOUTH SECTOR",
    id: 'south-door'
  });
  
  console.log(`[Room0] Created south door with ID: ${southDoor.userData.id}, category: ${southDoor.userData.category}`);

    // Removed front grille, no need to hide anything on open

  southDoor.userData.onUnlock = () => {
    if (window.AI) {
      window.AI.say("South access granted.");
    }
  };

  southDoor.userData.onDenied = () => {
    if (window.AI) {
      window.AI.say("Complete the east sector first to unlock south access.");
    }
  };

  southDoor.castShadow = true;
  group.add(southDoor);

  // Stage 0: West door (to Room 3) - controlled by Room 2 completion
  const westDoor = createFuturisticDoor({
    keyId: null, // No key needed, controlled by Room 2 completion
    locked: true,
    position: { x: -9, y: 1.75, z: 0 },
    rotationY: Math.PI / 2, // Rotate 90 degrees to face east (toward room0)
    width: 3.0,
    height: 3.5,
    openOffset: 4.0,
    labelText: "ROOM 3 ACCESS\nREQUIRES ROOM 2 COMPLETION",
    id: 'west-door'
  });
  
  console.log(`[Room0] Created west door with ID: ${westDoor.userData.id}, category: ${westDoor.userData.category}`);

  westDoor.userData.onOpen = () => {
    if (window.AI) {
      window.AI.say("West sector unlocked. Final challenges lie ahead.");
    }
  };

  westDoor.userData.onUnlock = () => {
    if (window.AI) {
      window.AI.say("West access granted.");
    }
  };

  westDoor.userData.onDenied = () => {
    if (window.AI) {
      window.AI.say("Access denied. Complete all puzzles in Room 2 first.");
    }
  };

  westDoor.castShadow = true;
  group.add(westDoor);


  // Stage 0: Doorway trigger volume (Box3 for transition check)
  const doorwayBox = new THREE.Box3();
  doorwayBox.setFromCenterAndSize(
    new THREE.Vector3(0, 1, -roomDepthHalf - 0.5), // Center position beyond door
    new THREE.Vector3(3, 2, 1)                      // Size
  );

  // Stage 0: Awakening chair for player spawn
  let awakeningChair = null;
  const chairLoader = new GLTFLoader();
  
  chairLoader.load('./models/chair.glb', (gltf) => {
    awakeningChair = gltf.scene;
    awakeningChair.name = 'awakening-chair';
    
    // Scale and position the chair for player spawn
    awakeningChair.scale.set(0.175, 0.175, 0.175);
    awakeningChair.position.set(0, 1.5, 2)
    
    // Enable shadows
    awakeningChair.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Make it look more like a medical/awakening chair
        if (child.material) {
          child.material.color.setHex(0x2a2a2a);
          child.material.metalness = 0.8;
          child.material.roughness = 0.3;
        }
      }
    });
    
    group.add(awakeningChair);
    console.log('Awakening chair loaded successfully!');
  }, (progress) => {
    console.log('Loading chair model...', (progress.loaded / progress.total * 100) + '%');
  }, (error) => {
    console.error('Error loading chair model:', error);
    
    // Fallback to simple chair if loading fails
    const fallbackChair = new THREE.Group();
    fallbackChair.name = 'awakening-chair';
    
    // Chair seat
    const chairSeat = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.1, 1.0),
      new THREE.MeshStandardMaterial({ 
        color: 0x2a2a2a,
        metalness: 0.8,
        roughness: 0.3
      })
    );
    chairSeat.position.set(0, 0.5, 0);
    chairSeat.castShadow = true;
    fallbackChair.add(chairSeat);
    
    // Chair back
    const chairBack = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.0, 0.1),
      new THREE.MeshStandardMaterial({ 
        color: 0x2a2a2a,
        metalness: 0.8,
        roughness: 0.3
      })
    );
    chairBack.position.set(0, 1.0, -0.45);
    chairBack.castShadow = true;
    fallbackChair.add(chairBack);
    
    // Chair legs
    const legPositions = [
      [-0.5, 0.25, -0.4],
      [0.5, 0.25, -0.4],
      [-0.5, 0.25, 0.4],
      [0.5, 0.25, 0.4]
    ];
    
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8),
        new THREE.MeshStandardMaterial({ 
          color: 0x1a1a1a,
          metalness: 0.9,
          roughness: 0.2
        })
      );
      leg.position.set(x, y, z);
      leg.castShadow = true;
      fallbackChair.add(leg);
    });
    
    // Position the chair (moved to avoid obstructing Room 2 hallway)
    fallbackChair.position.set(3, 0, 2);
    fallbackChair.rotation.y = Math.PI;
    group.add(fallbackChair);
    awakeningChair = fallbackChair;
  });

  // Security camera removed for performance optimization
  
  // Camera tracking removed for performance optimization

  // Security Monitor - Mounted on East Wall
  function createSecurityMonitor() {
    const monitorGroup = new THREE.Group();
    monitorGroup.name = 'security-monitor';
    
    // Monitor screen (main display)
    const screenGeometry = new THREE.BoxGeometry(1.8, 1.2, 0.08);
    const screenMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      emissive: 0x001100,
      emissiveIntensity: 0.2,
      metalness: 0.1,
      roughness: 0.9
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 0, 0.05);
    screen.name = 'monitor-screen'; // Add name for SecurityMonitor to find
    screen.castShadow = true;
    screen.receiveShadow = true;
    monitorGroup.add(screen);
    
    // Monitor frame/bezel - Enhanced Phong shading for dramatic lighting
    const frameGeometry = new THREE.BoxGeometry(1.9, 1.3, 0.15);
    const frameMaterial = new THREE.MeshPhysicalMaterial({ 
      // Base properties - darker for better contrast
      color: 0x1a1a1a,
      metalness: 0.95,
      roughness: 0.05,       // Very smooth for sharp reflections
      
      // Enhanced Phong shading features
      clearcoat: 0.9,        // High clearcoat for dramatic gloss
      clearcoatRoughness: 0.05, // Very smooth clearcoat
      ior: 1.6,              // Higher IOR for more pronounced effects
      specularIntensity: 2.5, // Much higher specular intensity
      specularColor: new THREE.Color(0xffffff),
      envMapIntensity: 1.5,  // Stronger environment reflections
      
      // Enhanced emissive for subtle glow
      emissive: new THREE.Color(0x001122),
      emissiveIntensity: 0.1,
      
      // Shadow properties
      castShadow: true,
      receiveShadow: true
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.castShadow = true;
    frame.receiveShadow = true;
    monitorGroup.add(frame);
    
    // Mounting bracket - Ultra-enhanced Phong shading
    const bracketGeometry = new THREE.BoxGeometry(2.2, 0.1, 0.3);
    const bracketMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0x0f0f0f,        // Even darker for maximum contrast
      metalness: 0.98,
      roughness: 0.02,        // Ultra-smooth for sharpest reflections
      
      // Ultra-enhanced Phong shading features
      clearcoat: 0.95,        // Maximum clearcoat
      clearcoatRoughness: 0.02, // Ultra-smooth clearcoat
      ior: 1.8,               // Very high IOR for dramatic effects
      specularIntensity: 3.0, // Maximum specular intensity
      specularColor: new THREE.Color(0xffffff),
      envMapIntensity: 2.0,   // Maximum environment reflections
      
      // Enhanced emissive for subtle glow
      emissive: new THREE.Color(0x001133),
      emissiveIntensity: 0.15,
      
      // Shadow properties
      castShadow: true,
      receiveShadow: true
    });
    const bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
    bracket.position.set(0, -0.7, -0.1);
    bracket.castShadow = true;
    bracket.receiveShadow = true;
    monitorGroup.add(bracket);
    
    // Status LED
    const ledGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const ledMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8
    });
    const statusLED = new THREE.Mesh(ledGeometry, ledMaterial);
    statusLED.position.set(0.7, 0.5, 0.1);
    monitorGroup.add(statusLED);
    
    // Position on South Wall (Back Wall) - offset to the left to avoid hallway
    // X: -4 (left of center), Y: 2.5 (eye level), Z: 7.2 (closer to wall, mounted)
    monitorGroup.position.set(-4, 2.5, 7.2);
    monitorGroup.rotation.y = Math.PI; // Face toward room center
    
    // Add interaction data
    monitorGroup.userData = { 
      type: 'interactable', 
      id: 'security-monitor',
      description: 'Press E to activate security feed',
      category: 'monitor'
    };
    
    return monitorGroup;
  }

  // Create and add security monitor
  const securityMonitorObj = createSecurityMonitor();
  group.add(securityMonitorObj);
  
  // Add visible collision box for debugging (only when debug mode is enabled)
  const monitorCollisionBox = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 1.5, 0.5),
    new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0.3,
      wireframe: true 
    })
  );
  monitorCollisionBox.position.set(-4, 2.5, 7.2);
  monitorCollisionBox.name = 'security-monitor-collision-debug';
  monitorCollisionBox.visible = false; // Hidden by default
  group.add(monitorCollisionBox);
  
  // Store reference for debug toggle
  window.securityMonitorCollisionDebug = monitorCollisionBox;

  // Stage 0: Room state
  const state = {
    hasKey: false,
    hintTimer: null,
    hintShown: false,
    // Security camera removed for performance optimization
    awakening: {
      isAwakening: true,
      fadeInComplete: false,
      movementRestricted: true,
      awakeningTimer: null,
      awakeningDuration: 3000 // 3 seconds of restricted movement
    }
  };


  // Security camera tracking function removed for performance optimization

  // Stage 0: Awakening sequence management
  function startAwakeningSequence() {
    // Start the awakening timer
    state.awakening.awakeningTimer = setTimeout(() => {
      state.awakening.movementRestricted = false;
      state.awakening.isAwakening = false;
      
      // Trigger motor functions dialogue
      if (window.AI) {
        window.AI.deliverDialogue('ACT_I.ON_SPAWN.MOTOR_ONLINE');
      }
    }, state.awakening.awakeningDuration);
    
    // Note: Initial greeting is now handled by AI.onSpawn() when player enters game
  }

  // Stage 0: Update function for animations and state
  function updateRoom0(dt, ctx) {
    const { playerObject, ai } = ctx;

    // Stage 0: Awakening sequence
    if (state.awakening.isAwakening && !state.awakening.awakeningTimer) {
      startAwakeningSequence();
    }

    // Security camera tracking removed for performance optimization
    
    // Stage 0: Stable lighting - no flickering needed

    // Update all doors
    const doors = [door, eastDoor, southDoor, westDoor];
    doors.forEach(currentDoor => {
      if (currentDoor && currentDoor.userData.update) {
        currentDoor.userData.update(dt);
      }
    });

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

    // Proximity prompt for card deposit box
    if (playerObject && getPlayerInventory) {
      const distToBox = playerObject.position.distanceTo(cardBox.position);
      if (distToBox < 2.0) {
        try {
          const inv = getPlayerInventory();
          const selected = inv && (inv.getSelectedItem ? inv.getSelectedItem() : inv.slots?.[inv.selectedSlot]);
          const anyPlaced = cardSlots.some(m => !!m);
          if (selected && selected.name === 'key_card') {
            if (window.AI && window.AI.showInteractionFeedback) {
              window.AI.showInteractionFeedback('Press E to insert the card');
            }
          } else if (window.AI && window.AI.showInteractionFeedback && anyPlaced) {
            window.AI.showInteractionFeedback('Press E to pick up a card');
          } else if (window.AI && window.AI.showInteractionFeedback && hasEmptySlot()) {
            window.AI.showInteractionFeedback('Select a card (💳) to insert');
          }
        } catch (e) {}
      }
    }

    // Animate any cards being lifted to the tabletop (ease out)
    if (cardLiftAnimations.length > 0) {
      const speed = 1.5; // seconds^-1
      for (let i = cardLiftAnimations.length - 1; i >= 0; i--) {
        const anim = cardLiftAnimations[i];
        anim.t = Math.min(1, anim.t + dt * speed);
        const k = 1 - Math.pow(1 - anim.t, 3); // easeOutCubic
        const y = anim.startY + (anim.endY - anim.startY) * k;
        if (anim.mesh && anim.mesh.position) {
          anim.mesh.position.y = y;
        }
        if (anim.t >= 1) {
          cardLiftAnimations.splice(i, 1);
        }
      }
    }
  }

  // Stage 0: E key interaction handler
  function handleEKeyInteraction(playerObject) {
    // Handle card deposit box interaction first
    const distToCardBox = playerObject.position.distanceTo(cardBox.position);
    if (distToCardBox < 2.0) {
      try {
        const inv = getPlayerInventory();
        const selected = inv && (inv.getSelectedItem ? inv.getSelectedItem() : inv.slots?.[inv.selectedSlot]);
        if (selected && selected.name === 'key_card') {
          if (!hasEmptySlot()) {
            if (window.AI && window.AI.showInteractionFeedback) {
              window.AI.showInteractionFeedback('The box is full.');
            }
            return true;
          }
          // Remove from inventory and insert
          const removed = removeFromInventory('key_card');
          if (removed) {
            const placed = insertCardIntoFirstEmptySlot();
            if (placed) {
              if (window.AI) {
                window.AI.say('Card inserted.');
              }
            }
          }
          return true;
        } else {
          // Try to pick up the nearest placed card from the box
          // Find nearest card mesh among occupied slots
          let nearest = null;
          let nearestIdx = -1;
          let nearestDist = Infinity;
          const temp = new THREE.Vector3();
          for (let i = 0; i < cardSlots.length; i++) {
            const m = cardSlots[i];
            if (!m) continue;
            const worldPos = m.getWorldPosition(temp);
            const d = worldPos.distanceTo(playerObject.position);
            if (d < nearestDist) { nearestDist = d; nearest = m; nearestIdx = i; }
          }
          if (nearest && nearestDist < 2.5) {
            const ok = addToInventory({ name: 'key_card', description: 'Access Key Card', type: 'key' });
            if (ok) {
              if (nearest.parent) nearest.parent.remove(nearest);
              cardSlots[nearestIdx] = null;
              if (window.AI && window.AI.showInteractionFeedback) {
                window.AI.showInteractionFeedback('Picked up: Access Key Card');
              }
            } else if (window.AI && window.AI.showInteractionFeedback) {
              window.AI.showInteractionFeedback('My inventory is full.');
            }
            return true;
          }
        }
      } catch (e) {}
    }

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
    
    // Check if player is near security monitor
    const securityMonitorPos = new THREE.Vector3(-4, 2.5, 7.2);
    const distanceToMonitor = playerObject.position.distanceTo(securityMonitorPos);
    
    if (distanceToMonitor < 3.0) { // Within 3.0 units of the monitor (increased range)
      if (window.securityMonitor) {
        if (!window.securityMonitor.isActive) {
          // Reset the security monitor before showing to prevent state corruption
          window.securityMonitor.reset();
          window.securityMonitor.show();
          if (window.AI) {
            window.AI.say("Security monitor activated. Press E to cycle through room feeds.");
          }
        } else {
          // Always cycle room when monitor is active - let cycleRoom handle the destroy/recreate logic
          window.securityMonitor.cycleRoom();
          if (window.AI && window.securityMonitor) {
            const roomNames = {
              1: "East Sector",
              2: "South Sector", 
              3: "West Sector - Access Denied",
              4: "North Sector"
            };
            window.AI.say(`Switching to ${roomNames[window.securityMonitor.currentRoom]} feed.`);
          }
        }
        return true;
      } else {
        // Security monitor doesn't exist, wait for recreation
        if (window.AI) {
          window.AI.say("Security monitor is initializing, please wait...");
        }
        return true;
      }
    }
    
    // Check all doors for interaction
    const doors = [door, eastDoor, southDoor, westDoor];
    
    for (const currentDoor of doors) {
      const doorDistance = playerObject.position.distanceTo(currentDoor.position);
      if (doorDistance < 3.0) { // Within 3 units of the door
        if (currentDoor.userData.locked) {
          // Special case for south door - show denial message
          if (currentDoor.userData.id === 'south-door') {
            // Room 1 not completed, show denial message
            if (currentDoor.userData.onDenied) {
              currentDoor.userData.onDenied();
            }
            return true;
          } else if (currentDoor.userData.id === 'west-door') {
            // Special case for west door - check Room 2 completion
            if (window.gameStore && window.gameStore.rooms.room2.isComplete) {
              currentDoor.userData.setLocked(false);
              currentDoor.userData.openDoor();
              if (window.AI) {
                window.AI.say("Access granted. Room 3 is now accessible.");
              }
              return true;
            } else {
              // Room 2 not completed, show denial message
              if (currentDoor.userData.onDenied) {
                currentDoor.userData.onDenied();
              }
              return true;
            }
          } else {
            // Regular key-based doors
            const hasKey = hasInInventory(currentDoor.userData.keyId);
            const unlocked = currentDoor.userData.tryUnlock(hasKey);
            
            if (unlocked) {
              currentDoor.userData.openDoor();
              if (window.AI) {
                window.AI.say("You used the key to unlock the door. It slides open smoothly.");
              }
              return true;
            }
          }
        } else {
          // Door is unlocked, just toggle it
          currentDoor.userData.toggle();
          return true;
        }
      }
    }
    
    return false;
  }

  // Function to unlock south door when Room 1 is completed
  function unlockSouthDoor() {
    if (southDoor && southDoor.userData.locked) {
      southDoor.userData.locked = false;
      
      // Force immediate visual update
      const leftLED = southDoor.getObjectByName('left-led');
      const rightLED = southDoor.getObjectByName('right-led');
      const centerSeam = southDoor.getObjectByName('center-seam');
      const lockRing = southDoor.getObjectByName('lock-ring');
      const warningLabel = southDoor.getObjectByName('warning-label');
      
      // Update LEDs to green
      if (leftLED && rightLED) {
        leftLED.material.color.setHex(0x00ff00);
        leftLED.material.emissive.setHex(0x00ff00);
        rightLED.material.color.setHex(0x00ff00);
        rightLED.material.emissive.setHex(0x00ff00);
      }
      
      // Update center seam to green
      if (centerSeam) {
        centerSeam.material.color.setHex(0x00ff00);
        centerSeam.material.emissive.setHex(0x00ff00);
      }
      
      // Update lock ring to green
      if (lockRing) {
        lockRing.material.color.setHex(0x00ff00);
        lockRing.material.emissive.setHex(0x00ff00);
      }
      
      // Update warning label to green "SOUTH SECTOR"
      if (warningLabel && warningLabel.material.map) {
        const greenTexture = createWarningLabelTexture("SOUTH SECTOR", 256, 64, false);
        warningLabel.material.map = greenTexture;
        warningLabel.material.needsUpdate = true;
      }
      
      if (window.AI) {
        window.AI.say("South sector has been unlocked. You may now proceed to advanced protocols.");
      }
    }
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

  // Stage 0: Simple collision clamp against room walls, doorway, and hallway
  function checkWallCollisions(playerObject) {
    if (!playerObject || !playerObject.position) return;

    const playerRadius = 0.5;
    const pos = playerObject.position;

    // Side walls (x clamping) inside Room 0 with openings for hallways
    // Left wall (West) with opening for Room 3 hallway
    if (pos.x < -roomWidthHalf + playerRadius) {
      // Check if player is aligned with the opening (z between -1 and 1)
      if (pos.z >= -1 && pos.z <= 1) {
        // Player is in the opening, allow passage
      } else {
        // Player is NOT aligned with the opening, so they hit the wall
        pos.x = -roomWidthHalf + playerRadius;
      }
    }
    
    // Right wall (East) with opening for Room 1 hallway
    if (pos.x > roomWidthHalf - playerRadius) {
      // Check if player is aligned with the opening (z between -1 and 1)
      if (pos.z >= -1 && pos.z <= 1) {
        // Player is in the opening, allow passage
      } else {
        // Player is NOT aligned with the opening, so they hit the wall
        pos.x = roomWidthHalf - playerRadius;
      }
    }

    // Front wall (positive Z) inside Room 0
    if (pos.z > roomDepthHalf - playerRadius) pos.z = roomDepthHalf - playerRadius;

    // Back wall (negative Z) with doorway at center (x in [-2, 2])
    const inDoorwayX = Math.abs(pos.x) <= 2;
    const doorIsOpen = door && door.userData && door.userData.state && door.userData.state.openAmount > 0.9;
    const backWallZ = -roomDepthHalf;

    if (pos.z < backWallZ + playerRadius) {
      // Only allow passing through if within doorway and the door is open
      if (!(inDoorwayX && doorIsOpen)) {
        pos.z = backWallZ + playerRadius;
      }
    }

    // Hallway constraints (after crossing the back wall into negative Z further)
    // Hallway spans roughly from -7.5 (backWallZ) toward Room 1 at around -30
    // Keep player within hallway width (x in [-1, 1]) once past the back wall
    // Updated to match the reusable hallway component positioning
    if (pos.z < backWallZ - 0.01) {
      const hallwayHalf = hallwayWidth / 2 - playerRadius; // Updated to match hallway width of 3 units
      if (pos.x < -hallwayHalf) pos.x = -hallwayHalf;
      if (pos.x >  hallwayHalf) pos.x =  hallwayHalf;
    }
  }

  // NO DOOR COLLISION - Removed for now
  function checkDoorCollision(playerObject) {
    // Door collision removed - player can pass through door freely
    return false;
  }

  // Hallway removed - now using reusable hallway component from main.js

  // Create entry/exit anchors for hallway connections
  const entryAnchor = new THREE.Object3D();
  entryAnchor.name = 'entryAnchor';
  entryAnchor.position.set(0, 0, roomDepthHalf); // Front of room (entry point)
  group.add(entryAnchor);

  const exitAnchor = new THREE.Object3D();
  exitAnchor.name = 'exitAnchor';
  exitAnchor.position.set(0, 0, -roomDepthHalf); // Back of room (exit point)
  group.add(exitAnchor);

  // Create anchors for room connections (required by LevelManager)
  const anchors = {
    entry_from_room1: new THREE.Object3D(),
    exit_to_room1: new THREE.Object3D(),
    entry_from_room2: new THREE.Object3D(),
    exit_to_room2: new THREE.Object3D(),
    entry_from_room3: new THREE.Object3D(),
    exit_to_room3: new THREE.Object3D(),
  };

  // Position the anchors around Room 0 (Hub)
  anchors.exit_to_room1.position.set(9, 1, 0); // East exit
  anchors.entry_from_room1.position.set(9, 1, 0); // East entry

  anchors.exit_to_room2.position.set(0, 1, 7.5); // South exit
  anchors.entry_from_room2.position.set(0, 1, 7.5); // South entry

  anchors.exit_to_room3.position.set(-9, 1, 0); // West exit
  anchors.entry_from_room3.position.set(-9, 1, 0); // West entry

  Object.values(anchors).forEach(anchor => group.add(anchor));

  // Dispose method for cleanup
  function dispose() {
    // Import dispose helper
    import('./utils/DisposeHelper.js').then(({ disposeGroup }) => {
      disposeGroup(group);
    });
    
    // Clear all references
    Object.keys(state).forEach(key => {
      state[key] = null;
    });
  }

  // Stage 0: Return room object with all necessary properties
  return {
    group,
    anchors: { 
      entry: entryAnchor, 
      exit: exitAnchor,
      ...anchors // Include all room connection anchors
    },
    door,
    eastDoor,
    southDoor,
    westDoor,
    key,
    awakeningChair,
    securityMonitorObj,
    // securityCamera removed for performance optimization
    triggers: { doorwayBox },
    state,
    updateRoom0,
    handleInteraction,
    handleEKeyInteraction,
    checkDoorwayTrigger,
    checkDoorCollision,
    checkWallCollisions,
    unlockSouthDoor,
    dispose
  };
}

// Stage 0: Export update function for main loop
export function updateRoom0(dt, ctx) {
  // This will be called from main.js
  // The actual update logic is in the room object returned by createRoom0
}
