import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addToInventory, hasInInventory, removeFromInventory } from './player.js';
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
    color:  "/textures/metal030/Metal030_2K-JPG_Color.jpg",
    normal: "/textures/metal030/Metal030_2K-JPG/Metal030_2K-JPG_NormalGL.jpg", // Using GL normal map from nested folder
    rough:  "/textures/metal030/Metal030_2K-JPG_Roughness.jpg",
    metal:  "/textures/metal030/Metal030_2K-JPG_Metalness.jpg",       // metalness map available
    // ao:     "/textures/metal030/Metal030_2K-JPG_AmbientOcclusion.jpg", // include only if you have it
  };
  
  // Concrete031 texture files for hallway
  const concrete031Files = {
    color:  "/textures/concrete031/Concrete031_2K-JPG_Color.jpg",
    normal: "/textures/concrete031/Concrete031_2K-JPG_NormalGL.jpg",
    rough:  "/textures/concrete031/Concrete031_2K-JPG_Roughness.jpg",
    ao:     "/textures/concrete031/Concrete031_2K-JPG_AmbientOcclusion.jpg",
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

  // --- ADD HEADER PANELS FOR HALLWAY OPENINGS ---
  const headerMaterial = new THREE.MeshStandardMaterial({ color: 0xbbc1c9, metalness: 0.8, roughness: 0.3 });
  const headerHeight = 0.5; // Assuming a standard wall height of 4.5, adjust if needed
  const hallwayWidth = 3; // Changed from 2 to 3 to match the door opening width

  // Header for Room 1 Opening (East Wall / Right Wall)
  const headerEast = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, headerHeight, hallwayWidth), // Swapped width and depth
    headerMaterial
  );
  headerEast.position.set(10, 4.25, 0); // Positioned above the opening
  headerEast.rotation.y = Math.PI / 2; // Rotate to align with Z-axis
  group.add(headerEast);

  // Header for Room 2 Opening (South Wall / Back Wall)
  const headerSouth = new THREE.Mesh(
    new THREE.BoxGeometry(hallwayWidth, headerHeight, wallThickness),
    headerMaterial
  );
  headerSouth.position.set(0, 4.25, -7.5);
  group.add(headerSouth);

  // Header for Room 3 Opening (West Wall / Left Wall)
  const headerWest = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, headerHeight, hallwayWidth), // Swapped width and depth
    headerMaterial
  );
  headerWest.position.set(-10, 4.25, 0);
  headerWest.rotation.y = Math.PI / 2; // Rotate to align with Z-axis
  group.add(headerWest);

  // Header for Room 4 Opening (North Wall / Front Wall)
  const headerNorth = new THREE.Mesh(
    new THREE.BoxGeometry(hallwayWidth, headerHeight, wallThickness),
    headerMaterial
  );
  headerNorth.position.set(0, 4.25, 7.5);
  group.add(headerNorth);
  
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
  
  // Add ventilation grille in the center of front wall
  const grilleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3a3a3a,
    metalness: 0.9,
    roughness: 0.1
  });
  
  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(4, 1.5, 0.1),
    grilleMaterial
  );
  grille.position.set(0, wallHeight/2, roomDepthHalf + wallThickness/2 + 0.05);
  grille.castShadow = true;
  grille.userData = { type: 'grille', side: 'front' };
  group.add(grille);
  
  // Add grille bars for detail
  for (let i = 0; i < 8; i++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 1.5, 0.15),
      grilleMaterial
    );
    bar.position.set(-1.75 + i * 0.5, wallHeight/2, roomDepthHalf + wallThickness/2 + 0.08);
    group.add(bar);
  }
  
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.05, 0.15),
      grilleMaterial
    );
    bar.position.set(0, wallHeight/2 - 0.5 + i * 0.5, roomDepthHalf + wallThickness/2 + 0.08);
    group.add(bar);
  }

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
          // child.material.emissive = new THREE.Color(0xffaa00); // Removed for performance
          // child.material.emissiveIntensity = 0.3; // Removed for performance
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

  southDoor.userData.onOpen = () => {
    if (window.AI) {
      window.AI.say("South sector unlocked. Advanced protocols await.");
    }
  };

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
  
  chairLoader.load('/models/chair.glb', (gltf) => {
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
