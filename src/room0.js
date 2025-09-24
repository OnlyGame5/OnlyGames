import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addToInventory, hasInInventory, removeFromInventory } from './player.js';

// Stage 0: Lobby/Entry Room
export function createRoom0() {
  const group = new THREE.Group();
  group.name = 'stage0-room';

  // Stage 0: Detailed tiled floor
  const tileSize = 1.0; // Each tile is 1x1 unit
  const tileThickness = 0.1;
  const groutWidth = 0.02;
  const roomWidth = 20;
  const roomDepth = 15;
  
  // Create individual tiles with grout lines
  const tilesGroup = new THREE.Group();
  tilesGroup.name = 'floor-tiles';
  
  // Tile material - slightly varied colors for realism
  const tileMaterials = [
    new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a,
      metalness: 0.1,
      roughness: 0.8
    }),
    new THREE.MeshStandardMaterial({ 
      color: 0x2d2d2d,
      metalness: 0.1,
      roughness: 0.8
    }),
    new THREE.MeshStandardMaterial({ 
      color: 0x282828,
      metalness: 0.1,
      roughness: 0.8
    })
  ];
  
  // Grout material
  const groutMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9
  });
  
  // Calculate number of tiles
  const tilesX = Math.floor(roomWidth / tileSize);
  const tilesZ = Math.floor(roomDepth / tileSize);
  
  // Create tiles
  for (let x = 0; x < tilesX; x++) {
    for (let z = 0; z < tilesZ; z++) {
      // Create individual tile
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(tileSize - groutWidth, tileThickness, tileSize - groutWidth),
        tileMaterials[(x + z) % tileMaterials.length] // Vary material for each tile
      );
      
      // Position tile
      const tileX = (x - tilesX / 2) * tileSize + tileSize / 2;
      const tileZ = (z - tilesZ / 2) * tileSize + tileSize / 2;
      tile.position.set(tileX, -tileThickness / 2, tileZ);
      tile.castShadow = true;
      tile.receiveShadow = true;
      
      // Add subtle random rotation for more realism
      tile.rotation.y = (Math.random() - 0.5) * 0.02;
      
      tilesGroup.add(tile);
    }
  }
  
  // Add grout lines
  // Horizontal grout lines
  for (let z = 0; z <= tilesZ; z++) {
    const groutX = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth, groutWidth, groutWidth),
      groutMaterial
    );
    const groutZ = (z - tilesZ / 2) * tileSize;
    groutX.position.set(0, -tileThickness / 2 - groutWidth / 2, groutZ);
    groutX.receiveShadow = true;
    tilesGroup.add(groutX);
  }
  
  // Vertical grout lines
  for (let x = 0; x <= tilesX; x++) {
    const groutZ = new THREE.Mesh(
      new THREE.BoxGeometry(groutWidth, groutWidth, roomDepth),
      groutMaterial
    );
    const groutX = (x - tilesX / 2) * tileSize;
    groutZ.position.set(groutX, -tileThickness / 2 - groutWidth / 2, 0);
    groutZ.receiveShadow = true;
    tilesGroup.add(groutZ);
  }
  
  // Add some wear and tear details
  const wearDetails = new THREE.Group();
  wearDetails.name = 'floor-wear';
  
  // Add some subtle scratches and wear patterns
  for (let i = 0; i < 15; i++) {
    const scratch = new THREE.Mesh(
      new THREE.BoxGeometry(
        Math.random() * 0.3 + 0.1, 
        0.005, 
        Math.random() * 0.1 + 0.02
      ),
      new THREE.MeshStandardMaterial({ 
        color: 0x1f1f1f,
        metalness: 0.0,
        roughness: 1.0
      })
    );
    
    scratch.position.set(
      (Math.random() - 0.5) * roomWidth * 0.8,
      -tileThickness / 2 + 0.001,
      (Math.random() - 0.5) * roomDepth * 0.8
    );
    scratch.rotation.y = Math.random() * Math.PI * 2;
    wearDetails.add(scratch);
  }
  
  tilesGroup.add(wearDetails);
  group.add(tilesGroup);

  // Stage 0: Four walls with collision detection - Sterile metallic bunker style
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x666666,     // steel grey
    metalness: 0.8,
    roughness: 0.3
  });
  
  const wallHeight = 4;
  const wallThickness = 0.5;
  const roomWidthHalf = 10;  // Half width (total 20)
  const roomDepthHalf = 7.5; // Half depth (total 15)

  // Create detailed wall panels with seams and bolts
  function createWallPanel(width, height, position, rotation = 0) {
    const panelGroup = new THREE.Group();
    
    // Main panel
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, wallThickness),
      wallMaterial
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
  const backWallLeft = createWallPanel(8, wallHeight, new THREE.Vector3(-6, wallHeight/2, -roomDepthHalf));
  backWallLeft.userData = { type: 'wall', side: 'back-left' };
  group.add(backWallLeft);

  // Back wall (with door opening) - Right panel
  const backWallRight = createWallPanel(8, wallHeight, new THREE.Vector3(6, wallHeight/2, -roomDepthHalf));
  backWallRight.userData = { type: 'wall', side: 'back-right' };
  group.add(backWallRight);

  // Left wall - Create seamless panels with proper coverage
  const leftWallPanel1 = createWallPanel(wallThickness, wallHeight, new THREE.Vector3(-roomWidthHalf, wallHeight/2, -5), Math.PI/2);
  leftWallPanel1.userData = { type: 'wall', side: 'left-1' };
  group.add(leftWallPanel1);
  
  const leftWallPanel2 = createWallPanel(wallThickness, wallHeight, new THREE.Vector3(-roomWidthHalf, wallHeight/2, 0), Math.PI/2);
  leftWallPanel2.userData = { type: 'wall', side: 'left-2' };
  group.add(leftWallPanel2);
  
  const leftWallPanel3 = createWallPanel(wallThickness, wallHeight, new THREE.Vector3(-roomWidthHalf, wallHeight/2, 5), Math.PI/2);
  leftWallPanel3.userData = { type: 'wall', side: 'left-3' };
  group.add(leftWallPanel3);
  
  // Add additional panels to cover any gaps
  const leftWallPanel4 = createWallPanel(wallThickness, wallHeight, new THREE.Vector3(-roomWidthHalf, wallHeight/2, -7.5), Math.PI/2);
  leftWallPanel4.userData = { type: 'wall', side: 'left-4' };
  group.add(leftWallPanel4);
  
  const leftWallPanel5 = createWallPanel(wallThickness, wallHeight, new THREE.Vector3(-roomWidthHalf, wallHeight/2, 7.5), Math.PI/2);
  leftWallPanel5.userData = { type: 'wall', side: 'left-5' };
  group.add(leftWallPanel5);

  // Right wall - Create seamless panels with proper coverage
  const rightWallPanel1 = createWallPanel(wallThickness, wallHeight, new THREE.Vector3(roomWidthHalf, wallHeight/2, -5), Math.PI/2);
  rightWallPanel1.userData = { type: 'wall', side: 'right-1' };
  group.add(rightWallPanel1);
  
  const rightWallPanel2 = createWallPanel(wallThickness, wallHeight, new THREE.Vector3(roomWidthHalf, wallHeight/2, 0), Math.PI/2);
  rightWallPanel2.userData = { type: 'wall', side: 'right-2' };
  group.add(rightWallPanel2);
  
  const rightWallPanel3 = createWallPanel(wallThickness, wallHeight, new THREE.Vector3(roomWidthHalf, wallHeight/2, 5), Math.PI/2);
  rightWallPanel3.userData = { type: 'wall', side: 'right-3' };
  group.add(rightWallPanel3);
  
  // Add additional panels to cover any gaps
  const rightWallPanel4 = createWallPanel(wallThickness, wallHeight, new THREE.Vector3(roomWidthHalf, wallHeight/2, -7.5), Math.PI/2);
  rightWallPanel4.userData = { type: 'wall', side: 'right-4' };
  group.add(rightWallPanel4);
  
  const rightWallPanel5 = createWallPanel(wallThickness, wallHeight, new THREE.Vector3(roomWidthHalf, wallHeight/2, 7.5), Math.PI/2);
  rightWallPanel5.userData = { type: 'wall', side: 'right-5' };
  group.add(rightWallPanel5);
  
  // Add invisible collision walls behind the detailed panels
  const leftCollisionWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, 15),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  leftCollisionWall.position.set(-roomWidthHalf, wallHeight/2, 0);
  leftCollisionWall.userData = { type: 'collision-wall', side: 'left' };
  group.add(leftCollisionWall);
  
  const rightCollisionWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, 15),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  rightCollisionWall.position.set(roomWidthHalf, wallHeight/2, 0);
  rightCollisionWall.userData = { type: 'collision-wall', side: 'right' };
  group.add(rightCollisionWall);

  // Front wall (entrance) - Create detailed panels
  const frontWallLeft = createWallPanel(8, wallHeight, new THREE.Vector3(-6, wallHeight/2, roomDepthHalf));
  frontWallLeft.userData = { type: 'wall', side: 'front-left' };
  group.add(frontWallLeft);
  
  const frontWallRight = createWallPanel(8, wallHeight, new THREE.Vector3(6, wallHeight/2, roomDepthHalf));
  frontWallRight.userData = { type: 'wall', side: 'front-right' };
  group.add(frontWallRight);
  
  // Add invisible collision wall for front wall
  const frontCollisionWall = new THREE.Mesh(
    new THREE.BoxGeometry(20, wallHeight, wallThickness),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  frontCollisionWall.position.set(0, wallHeight/2, roomDepthHalf);
  frontCollisionWall.userData = { type: 'collision-wall', side: 'front' };
  group.add(frontCollisionWall);
  
  // Add invisible collision walls for back wall (with door opening)
  // Left side of doorway (from -10 to -2)
  const backCollisionWallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(8, wallHeight, wallThickness),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  backCollisionWallLeft.position.set(-6, wallHeight/2, -roomDepthHalf);
  backCollisionWallLeft.userData = { type: 'collision-wall', side: 'back-left' };
  group.add(backCollisionWallLeft);
  
  // Right side of doorway (from 2 to 10)
  const backCollisionWallRight = new THREE.Mesh(
    new THREE.BoxGeometry(8, wallHeight, wallThickness),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  backCollisionWallRight.position.set(6, wallHeight/2, -roomDepthHalf);
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

  // Stage 0: Roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.3, 15),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
  );
  roof.position.set(0, wallHeight + 0.15, 0);
  roof.receiveShadow = true;
  group.add(roof);

  // Stage 0: Enhanced ceiling light fixture with proper housing
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
  
  lightFixtureGroup.position.set(0, wallHeight - 0.1, 0);
  group.add(lightFixtureGroup);

  // Stage 0: Sterile bunker lighting - Cold and clinical (reduced intensity to prevent spill)
  const roomAmbientLight = new THREE.AmbientLight(0x808B96, 0.2); // Reduced intensity
  group.add(roomAmbientLight);

  // Stage 0: Main directional light (moved from global scene) - clamped to prevent spill
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); // Reduced intensity
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 512;
  dirLight.shadow.mapSize.height = 512;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 15; // Further clamped to prevent spill to other rooms
  group.add(dirLight);

  // Stage 0: Hemisphere light (moved from global scene) - reduced intensity
  const hemisphereLight = new THREE.HemisphereLight(0x8888aa, 0x222222, 0.2); // Reduced intensity
  group.add(hemisphereLight);

  // Stage 0: Optimized main ceiling light for performance (reduced to prevent spill)
  const ceilingLight = new THREE.PointLight(0xE6F3FF, 0.6, 15); // Reduced intensity and range
  ceilingLight.position.set(0, wallHeight - 0.8, 0);
  ceilingLight.castShadow = true;
  ceilingLight.shadow.mapSize.width = 512; // Reduced resolution for performance
  ceilingLight.shadow.mapSize.height = 512;
  ceilingLight.shadow.camera.near = 0.1;
  ceilingLight.shadow.camera.far = 15; // Reduced far distance
  ceilingLight.shadow.bias = -0.0001;
  group.add(ceilingLight);

  // Stage 0: Optimized fill lights for performance (no shadows) - reduced intensity
  const fillLight1 = new THREE.DirectionalLight(0x5D6D7E, 0.15); // Reduced intensity
  fillLight1.position.set(-8, 4, 8);
  fillLight1.target.position.set(0, 0, 0);
  fillLight1.castShadow = false; // Disabled for performance
  group.add(fillLight1);
  group.add(fillLight1.target);

  const fillLight2 = new THREE.DirectionalLight(0x808B96, 0.15); // Reduced intensity
  fillLight2.position.set(8, 4, -8);
  fillLight2.target.position.set(0, 0, 0);
  fillLight2.castShadow = false; // Disabled for performance
  group.add(fillLight2);
  group.add(fillLight2.target);
  
  // Stage 0: Stable lighting - no flickering
  function updateLightFlicker(dt) {
    // No flickering - stable lighting
  }

  // Stage 0: Add wall-mounted emergency lights
  const emergencyLightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2a2a2a,
    metalness: 0.8,
    roughness: 0.2
  });
  
  const emergencyLight1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.2, 0.1),
    emergencyLightMaterial
  );
  emergencyLight1.position.set(-roomWidthHalf + 0.1, wallHeight - 0.5, -3);
  emergencyLight1.castShadow = true;
  group.add(emergencyLight1);
  
  const emergencyLight2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.2, 0.1),
    emergencyLightMaterial
  );
  emergencyLight2.position.set(roomWidthHalf - 0.1, wallHeight - 0.5, 3);
  emergencyLight2.castShadow = true;
  group.add(emergencyLight2);
  
  // Add red emergency light indicators
  const redLightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.3
  });
  
  const redLight1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 6),
    redLightMaterial
  );
  redLight1.position.set(-roomWidthHalf + 0.15, wallHeight - 0.4, -3);
  group.add(redLight1);
  
  const redLight2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 6),
    redLightMaterial
  );
  redLight2.position.set(roomWidthHalf - 0.15, wallHeight - 0.4, 3);
  group.add(redLight2);

  // Stage 0: Pedestal with key - Enhanced with metallic base
  const pedestalBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8),
    new THREE.MeshStandardMaterial({ 
      color: 0x4a4a4a,
      metalness: 0.8,
      roughness: 0.3
    })
  );
  pedestalBase.position.set(0, 0.05, -2);
  pedestalBase.castShadow = true;
  group.add(pedestalBase);
  
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8),
    new THREE.MeshStandardMaterial({ 
      color: 0x666666,
      metalness: 0.8,
      roughness: 0.3
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
  const doorGroup = new THREE.Group();
  doorGroup.name = 'door-group';
  
  // Main door panel
  const doorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3.5, 0.2),
    new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.2,
      emissive: new THREE.Color(0x001122),
      emissiveIntensity: 0.1
    })
  );
  doorPanel.position.set(0, 1.75, 0);
  doorPanel.castShadow = true;
  doorGroup.add(doorPanel);
  
  // Door frame
  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 3.7, 0.1),
    new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    })
  );
  doorFrame.position.set(0, 1.75, -0.05);
  doorGroup.add(doorFrame);
  
  // Lock mechanism (glowing)
  const lockMechanism = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16),
    new THREE.MeshStandardMaterial({ 
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.1,
      emissive: new THREE.Color(0x0066ff),
      emissiveIntensity: 0.3
    })
  );
  lockMechanism.name = 'lock-mechanism';
  lockMechanism.position.set(0, 1.75, 0.11);
  lockMechanism.rotation.x = Math.PI / 2;
  doorGroup.add(lockMechanism);
  
  // Lock keyhole
  const keyhole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8),
    new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      emissive: new THREE.Color(0x00aaff),
      emissiveIntensity: 0.5
    })
  );
  keyhole.name = 'keyhole';
  keyhole.position.set(0, 1.75, 0.16);
  keyhole.rotation.x = Math.PI / 2;
  doorGroup.add(keyhole);
  
  // Door handle
  const doorHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8),
    new THREE.MeshStandardMaterial({ 
      color: 0x666666,
      metalness: 0.9,
      roughness: 0.1
    })
  );
  doorHandle.position.set(1.2, 1.75, 0.11);
  doorHandle.rotation.x = Math.PI / 2;
  doorGroup.add(doorHandle);
  
  // Door panel details (rivets)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const rivet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8),
        new THREE.MeshStandardMaterial({ 
          color: 0x555555,
          metalness: 0.8,
          roughness: 0.2
        })
      );
      rivet.position.set(
        -0.8 + i * 0.5, 
        1.0 + j * 0.4, 
        0.11
      );
      doorGroup.add(rivet);
    }
  }
  
  // Warning label
  const warningLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.3),
    new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: new THREE.Color(0xff0000),
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8
    })
  );
  warningLabel.position.set(-0.8, 2.5, 0.11);
  doorGroup.add(warningLabel);
  
  doorGroup.position.set(0, 0, -roomDepthHalf + 0.15); // Positioned in doorway
  doorGroup.userData = { type: 'interactable', id: 'stage0-door' };
  doorGroup.castShadow = true;
  group.add(doorGroup);
  
  // Store reference to door group for animation
  const door = doorGroup;

  // Stage 0: Doorway trigger volume (Box3 for transition check)
  const doorwayBox = new THREE.Box3();
  doorwayBox.setFromCenterAndSize(
    new THREE.Vector3(0, 1, -roomDepthHalf - 0.5), // Center position beyond door
    new THREE.Vector3(3, 2, 1)                      // Size
  );

  // Stage 0: Security camera
  const securityCamera = new THREE.Group();
  securityCamera.name = 'security-camera';
  
  // Camera body (main housing)
  const cameraBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.3, 0.2),
    new THREE.MeshStandardMaterial({ 
      color: 0x222222,
      metalness: 0.8,
      roughness: 0.2
    })
  );
  cameraBody.castShadow = true;
  securityCamera.add(cameraBody);
  
  // Camera lens
  const cameraLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16),
    new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      metalness: 0.9,
      roughness: 0.1
    })
  );
  cameraLens.position.set(0, 0, 0.15);
  cameraLens.rotation.x = Math.PI / 2;
  cameraLens.castShadow = true;
  securityCamera.add(cameraLens);
  
  // Red status light
  const redLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 8, 6),
    new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8
    })
  );
  redLight.position.set(0.15, 0.1, 0.1);
  securityCamera.add(redLight);
  
  // Mounting bracket
  const mount = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.3),
    new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.3
    })
  );
  mount.position.set(0, -0.2, 0);
  mount.castShadow = true;
  securityCamera.add(mount);
  
  // Position camera on the right wall, facing into the room
  securityCamera.position.set(roomWidthHalf - 0.2, wallHeight - 1.5, 0);
  securityCamera.rotation.y = Math.PI; // Face into the room
  group.add(securityCamera);
  
  // Camera tracking state
  let isTrackingPlayer = false;
  let playerInRoom = false;

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
    hintShown: false,
    securityCamera: {
      isTracking: false,
      playerInRoom: false
    }
  };

  // Stage 0: Helper function to open door
  function openDoor(state, door) {
    if (!state.doorOpen && !state.doorAnim.active) {
      state.doorAnim.active = true;
      state.doorAnim.startY = door.position.y;
      state.doorAnim.targetY = door.position.y + 4.0; // Higher opening to clear doorway
      state.doorAnim.t = 0;
    }
  }

  // Stage 0: Security camera tracking function
  function updateSecurityCamera(playerObject) {
    const playerPos = playerObject.position;
    
    // Check if player is in room (within room boundaries)
    const inRoom = (
      playerPos.x >= -roomWidthHalf + 1 && 
      playerPos.x <= roomWidthHalf - 1 && 
      playerPos.z >= -roomDepthHalf + 1 && 
      playerPos.z <= roomDepthHalf - 1
    );
    
    // Update tracking state
    if (inRoom && !state.securityCamera.playerInRoom) {
      // Player entered room - start tracking
      state.securityCamera.playerInRoom = true;
      state.securityCamera.isTracking = true;
    } else if (!inRoom && state.securityCamera.playerInRoom) {
      // Player left room - stop tracking
      state.securityCamera.playerInRoom = false;
      state.securityCamera.isTracking = false;
    }
    
    // Update camera rotation to track player
    if (state.securityCamera.isTracking) {
      // Calculate direction from camera to player
      const cameraPos = securityCamera.position;
      const direction = new THREE.Vector3(
        playerPos.x - cameraPos.x,
        playerPos.y - cameraPos.y,
        playerPos.z - cameraPos.z
      );
      
      // Calculate rotation angles
      const horizontalAngle = Math.atan2(direction.x, direction.z);
      const verticalAngle = Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z));
      
      // Apply rotation with some smoothing
      const targetRotationY = horizontalAngle;
      const targetRotationX = -verticalAngle;
      
      // Smooth rotation interpolation
      const rotationSpeed = 2.0; // radians per second
      const maxRotation = Math.PI / 4; // 45 degrees max vertical rotation
      
      // Clamp vertical rotation
      const clampedVerticalAngle = Math.max(-maxRotation, Math.min(maxRotation, targetRotationX));
      
      // Apply rotations
      securityCamera.rotation.y = THREE.MathUtils.lerp(securityCamera.rotation.y, targetRotationY, rotationSpeed * 0.016);
      securityCamera.rotation.x = THREE.MathUtils.lerp(securityCamera.rotation.x, clampedVerticalAngle, rotationSpeed * 0.016);
    }
  }

  // Stage 0: Update function for animations and state
  function updateRoom0(dt, ctx) {
    const { playerObject, ai } = ctx;

    // Stage 0: Update security camera tracking
    updateSecurityCamera(playerObject);
    
    // Stage 0: Stable lighting - no flickering needed

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

      // Update lock mechanism visual feedback during animation
      const lockMechanism = door.getObjectByName('lock-mechanism');
      const keyhole = door.getObjectByName('keyhole');
      if (lockMechanism && keyhole) {
        // Change lock color from blue to green as it unlocks
        const lockMaterial = lockMechanism.material;
        const keyholeMaterial = keyhole.material;
        
        if (progress < 0.5) {
          // First half: unlock sequence
          const unlockProgress = progress * 2;
          lockMaterial.emissive.setHex(0x0066ff).multiplyScalar(1 - unlockProgress);
          lockMaterial.emissive.add(new THREE.Color(0x00ff00).multiplyScalar(unlockProgress));
          keyholeMaterial.emissive.setHex(0x00aaff).multiplyScalar(1 - unlockProgress);
          keyholeMaterial.emissive.add(new THREE.Color(0x00ff88).multiplyScalar(unlockProgress));
        } else {
          // Second half: door opening
          lockMaterial.emissive.setHex(0x00ff00);
          keyholeMaterial.emissive.setHex(0x00ff88);
        }
      }

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

  // Stage 0: Simple collision clamp against room walls, doorway, and hallway
  function checkWallCollisions(playerObject) {
    if (!playerObject || !playerObject.position) return;

    const playerRadius = 0.5;
    const pos = playerObject.position;

    // Side walls (x clamping) inside Room 0
    if (pos.x < -roomWidthHalf + playerRadius) pos.x = -roomWidthHalf + playerRadius;
    if (pos.x >  roomWidthHalf - playerRadius) pos.x =  roomWidthHalf - playerRadius;

    // Front wall (positive Z) inside Room 0
    if (pos.z > roomDepthHalf - playerRadius) pos.z = roomDepthHalf - playerRadius;

    // Back wall (negative Z) with doorway at center (x in [-2, 2])
    const inDoorwayX = Math.abs(pos.x) <= 2;
    const doorIsOpen = !!state.doorOpen;
    const backWallZ = -roomDepthHalf;

    if (pos.z < backWallZ + playerRadius) {
      // Only allow passing through if within doorway and the door is open
      if (!(inDoorwayX && doorIsOpen)) {
        pos.z = backWallZ + playerRadius;
      }
    }

    // Hallway constraints (after crossing the back wall into negative Z further)
    // Hallway spans roughly from -7.5 (backWallZ) toward Room 1 at around -30
    // Keep player within hallway width (x in [-2, 2]) once past the back wall
    if (pos.z < backWallZ - 0.01) {
      const hallwayHalf = 2 - playerRadius;
      if (pos.x < -hallwayHalf) pos.x = -hallwayHalf;
      if (pos.x >  hallwayHalf) pos.x =  hallwayHalf;
    }
  }

  // NO DOOR COLLISION - Removed for now
  function checkDoorCollision(playerObject) {
    // Door collision removed - player can pass through door freely
    return false;
  }

  // Stage 0: Create hallway to room 1 (always visible)
  const hallway = new THREE.Group();
  hallway.name = 'hallway-to-room1';
  hallway.visible = true; // Always visible, door just controls access
  
  // Hallway floor
  const hallwayFloor = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.2, 16.5),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
  );
  hallwayFloor.position.set(0, -0.1, -15); // Position between room 0 and room 1
  hallwayFloor.receiveShadow = true;
  hallway.add(hallwayFloor);
  
  // Hallway walls
  const hallwayWallMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const hallwayWall1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 4, 16.5),
    hallwayWallMaterial
  );
  hallwayWall1.position.set(-2, 2, -15);
  hallwayWall1.castShadow = true;
  hallwayWall1.userData = { type: 'wall', side: 'hallway-left' };
  hallway.add(hallwayWall1);
  
  const hallwayWall2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 4, 16.5),
    hallwayWallMaterial
  );
  hallwayWall2.position.set(2, 2, -15);
  hallwayWall2.castShadow = true;
  hallwayWall2.userData = { type: 'wall', side: 'hallway-right' };
  hallway.add(hallwayWall2);
  
  // Hallway ceiling
  const hallwayCeiling = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.3, 16.5),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );
  hallwayCeiling.position.set(0, 4.15, -15);
  hallwayCeiling.receiveShadow = true;
  hallway.add(hallwayCeiling);
  
  // Add hallway to group (not scene)
  group.add(hallway);

  // Create entry/exit anchors for future hallway/minimap work
  const entryAnchor = new THREE.Object3D();
  entryAnchor.name = 'entryAnchor';
  entryAnchor.position.set(0, 0, roomDepthHalf); // Front of room (entry point)
  group.add(entryAnchor);

  const exitAnchor = new THREE.Object3D();
  exitAnchor.name = 'exitAnchor';
  exitAnchor.position.set(0, 0, -roomDepthHalf); // Back of room (exit point)
  group.add(exitAnchor);

  // Stage 0: Return room object with all necessary properties
  return {
    group,
    anchors: { entry: entryAnchor, exit: exitAnchor },
    door,
    key,
    hallway,
    securityCamera,
    triggers: { doorwayBox },
    state,
    updateRoom0,
    handleInteraction,
    handleEKeyInteraction,
    checkDoorwayTrigger,
    checkDoorCollision,
    checkWallCollisions
  };
}

// Stage 0: Export update function for main loop
export function updateRoom0(dt, ctx) {
  // This will be called from main.js
  // The actual update logic is in the room object returned by createRoom0
}
