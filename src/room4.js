import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addToInventory, hasInInventory, getPlayerInventory } from './player.js';
import { gameStore } from './state/gameStore.js';
import {
  buildStandardLightRig,
  removeExistingLights,
} from './lighting/standardLighting.js';
import { makeTiles136cFloor, makeTiles136cWall, makeTiles136cCeiling, makeTiles002Floor } from './materials/room4Materials.js';
import { makeConcrete031MaterialFlexible } from './materials/room0Materials.js';
import { createReusableHallway, HallwayPresets } from './components/ReusableHallway.js';
import { FloatingBinary } from './rooms/Room4/FloatingBinary.js';
import { NexusPanel } from './rooms/Room4/NexusPanel.js';
import { HologramDisplay } from './rooms/Room4/HologramDisplay.js';
import { createReusableLaptop, LaptopPresets } from './components/ReusableLaptop.js';

export function createRoom4() {
  const group = new THREE.Group();
  group.name = 'room4';
  
  console.log('Creating Room 4...');

  // Room state for interactions
  const state = {
    lastTruthFilterState: false,
    hasWelcomed: false,
    hasShownDecoderDialogue: false
  };

  // Tiles002 texture files for Room 4 floor (same as Room 1)
  const tiles002Files = {
    color: "/textures/tiles002/Tiles002_1K-JPG_Color.jpg",
    normal: "/textures/tiles002/Tiles002_1K-JPG_NormalGL.jpg",
    rough: "/textures/tiles002/Tiles002_1K-JPG_Roughness.jpg",
    displacement: "/textures/tiles002/Tiles002_1K-JPG_Displacement.jpg"
  };

  // Tiles136C texture files for Room 4 (keeping for reference)
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

  // Tiles002 floor for Room 4 (same as Room 1, but with black color)
  const floorGeometry = new THREE.BoxGeometry(18, 0.2, 18);
  const floorMaterial = makeTiles002Floor(18, 18, tiles002Files, {
    tileSizeMeters: 1.0,
    anisotropy: 16,
    metalness: 0.0,
    roughness: 0.8,
    normalScale: new THREE.Vector2(0.6, 0.6)
  });
  // Set floor color to black (like Room 1 when lights are off)
  floorMaterial.color.setHex(0x111111); // Dark gray so lights can influence the floor
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;
  floor.name = 'room4-floor';
  group.add(floor);

  // Helper: briefly "glitch" the floor by rapidly pulsing red emissive
  // Exposed globally so UI logic (decoder panel) can trigger it without tight coupling
  window.triggerRoom4FloorGlow = (durationMs = 2000) => {
    try {
      if (!floor.material) return;
      const mat = floor.material;
      const originalEmissive = mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000);
      const originalEmissiveIntensity = mat.emissiveIntensity ?? 0;
      const originalColor = mat.color ? mat.color.clone() : new THREE.Color(0x111111);
      if (!mat.emissive) mat.emissive = new THREE.Color(0x000000);

      // Add a temporary flickering red point light for stronger scene glow
      const glitchLight = new THREE.PointLight(0xff3344, 0, 18, 2.0);
      glitchLight.position.set(0, 1.0, 0);
      glitchLight.name = 'room4-floor-glitch-light';
      group.add(glitchLight);

      // Start rapid flicker similar to UI glitch cadence (faster ticks)
      const start = performance.now();
      const tickMs = 30;
      const interval = setInterval(() => {
        const elapsed = performance.now() - start;
        if (elapsed >= durationMs || !floor.material) {
          clearInterval(interval);
          // Restore
          const m = floor.material;
          if (!m) return;
          if (!m.emissive) m.emissive = new THREE.Color(0x000000);
          m.emissive.copy(originalEmissive);
          m.emissiveIntensity = originalEmissiveIntensity;
          if (m.color) m.color.copy(originalColor);
          m.needsUpdate = true;
          // Remove light
          if (glitchLight && glitchLight.parent) {
            glitchLight.parent.remove(glitchLight);
          }
          return;
        }

        // Randomized emissive pulse: mostly red, occasional cyan inversion for harsher glitch
        const isInvertFrame = Math.random() < 0.12; // 12% of ticks invert to cyan-ish
        const baseHex = isInvertFrame ? 0x00ffff : 0xff0000;
        const jitterG = Math.floor(Math.random() * 0x40) << 8; // broader green jitter
        const jitterB = isInvertFrame ? (Math.floor(Math.random() * 0x40)) : 0x00; // add blue jitter only on invert
        const colorHex = baseHex | jitterG | jitterB;
        mat.emissive.setHex(colorHex);
        mat.emissiveIntensity = 1.0 + Math.random() * 1.6; // 1.0-2.6 (brighter)
        if (mat.color) {
          // Subtle tinting to amplify perceived glitch
          const base = 0x111111;
          const mix = 0.15 + Math.random() * 0.35; // stronger tint 0.15-0.5
          const r = ((base >> 16) & 0xff) * (1 - mix) + 255 * mix;
          const g = ((base >> 8) & 0xff) * (1 - mix) + ((colorHex >> 8) & 0xff) * mix;
          const b = (base & 0xff) * (1 - mix);
          mat.color.setRGB(r / 255, g / 255, b / 255);
        }
        // Light intensity and slight position jitter to simulate electrical surge
        glitchLight.intensity = 1.5 + Math.random() * 4.5; // 1.5-6.0
        glitchLight.position.x = (Math.random() - 0.5) * 2.0; // small wobble
        glitchLight.position.z = (Math.random() - 0.5) * 2.0;
        mat.needsUpdate = true;
      }, tickMs);
    } catch (e) {
      console.warn('triggerRoom4FloorGlow failed:', e);
    }
  };

  // Wall material - shiny black with metallic properties
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.9, roughness: 0.1, side: THREE.DoubleSide });

  // Back wall (North) - Solid wall spanning full width
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 0.2), wallMat);
  backWall.position.set(0, 2, -9); // Centered
  backWall.userData = { type: 'wall', side: 'back' };
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // Front wall (South) with doorway to center room - split into two parts
  const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.2), wallMat);
  frontWallLeft.position.set(-5, 2, 9);
  frontWallLeft.userData = { type: 'wall', side: 'front-left' };
  frontWallLeft.castShadow = true;
  frontWallLeft.receiveShadow = true;
  group.add(frontWallLeft);

  const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.2), wallMat);
  frontWallRight.position.set(5, 2, 9);
  frontWallRight.userData = { type: 'wall', side: 'front-right' };
  frontWallRight.castShadow = true;
  frontWallRight.receiveShadow = true;
  group.add(frontWallRight);

  // Side walls - Left wall (West)
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 18), wallMat);
  leftWall.position.set(-9, 2, 0);
  leftWall.userData = { type: 'wall', side: 'left' };
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  // Side walls - Right wall (East)
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 18), wallMat);
  rightWall.position.set(9, 2, 0);
  rightWall.userData = { type: 'wall', side: 'right' };
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // Translucent green ceiling matching the beam style - very transparent to show skybox
  const ceilingGeometry = new THREE.PlaneGeometry(18, 18);
  const ceilingMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.05, // Very low opacity to allow skybox to show through
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending, // Changed from AdditiveBlending to allow skybox visibility
    depthWrite: false // Don't write to depth buffer so skybox shows through
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.set(0, 4, 0); // Position at top of walls (y=4)
  ceiling.rotation.x = Math.PI / 2; // Rotate to be horizontal (facing down)
  ceiling.name = 'room4-ceiling';
  ceiling.renderOrder = -1; // Render early to allow skybox to show through
  group.add(ceiling);

  // Add hallway connecting to center room (Room 0)
  // Temporarily comment out hallway to test basic room
  /*
  const hallway = createReusableHallway({
    length: 12, // Distance between Room 4 and Room 0
    width: 2.5,
    height: 4,
    positionX: 0,
    positionY: 0,
    positionZ: 15, // Position between Room 4 and Room 0
    name: 'room4-to-center-hallway',
    addLighting: true,
    lightIntensity: 0.3,
    ambientIntensity: 0.1,
    textureSet: 'concrete031'
  });
  group.add(hallway);
  */

  // Test cube removed - room is now clean

  // Add floating binary text effect with truth filter support
  const floatingBinary = new FloatingBinary(false); // Initially false
  floatingBinary.mount(group);

  // Add NEXUS interactive panel on the north wall
  console.log('Creating NEXUS panel...');
  const nexusPanel = new NexusPanel();
  console.log('NEXUS panel created:', nexusPanel);
  // Headless mode: do not mount the 3D screen; UI logic only
   
  // Make nexusPanel globally accessible for laptop interface
  window.room4NexusPanel = nexusPanel;

  // Load decoder panel 3D model
  const gltfLoader = new GLTFLoader();
  let decoderPanelModel = null;
  
  gltfLoader.load('/models/room4_decoder_panel.glb', (gltf) => {
    console.log('Decoder panel model loaded:', gltf);
    decoderPanelModel = gltf.scene;
    decoderPanelModel.name = 'room4-decoder-panel';
    
    // Keep embedded GLTF materials; only enable shadows on meshes
    decoderPanelModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Position the panel directly in front of NexusPanel, below the screen
    // Screen extends from y=-1.0 to y=4.0, so position panel below the screen
    // Place it slightly in front of the NexusPanel (z=-8.8) but behind the wall (z=-9)
    // Move up on y-axis so bottom of panel sits on floor (y=0)
    decoderPanelModel.rotation.y = Math.PI / 2 + Math.PI; // Rotate 180° clockwise from current to face the room
    decoderPanelModel.scale.set(3.5, 3.5, 3.5); // Further increased size
    // Position panel - adjust y upward so bottom sits on floor
    // With scale 5.0, estimate half-height and move panel up accordingly
    decoderPanelModel.position.set(0, 0.75
      , -8.6); // Moved up so bottom sits on floor
    
    // Add user data for interaction
    decoderPanelModel.userData = {
      type: 'interactable',
      id: 'room4-decoder-panel',
      interact: () => {
        // Trigger binary decoder UI interaction
        if (nexusPanel && typeof nexusPanel.show === 'function') {
          nexusPanel.show();
        }
      }
    };
    
    group.add(decoderPanelModel);
    console.log('Decoder panel model added to room');

    // Mount hologram display above the table center
    const hologram = new HologramDisplay({ position: new THREE.Vector3(0, 0.9, -8.6) });
    hologram.mount(group);
    window.room4Hologram = hologram; // expose for NexusPanel integration

    // Add soft green spotlight near the NEXUS panel to illuminate the floor
    const panelSpot = new THREE.SpotLight(0x00ff88, 2.0, 12, Math.PI / 6, 0.3, 1.0);
    panelSpot.position.set(0, 1.4, -8.2); // Slightly in front of the panel and above it
    panelSpot.target.position.set(0, 0.1, -8.6); // Aim toward the floor just in front of panel
    panelSpot.castShadow = true;
    panelSpot.name = 'nexus-panel-spot';
    group.add(panelSpot);
    group.add(panelSpot.target);
  }, (progress) => {
    console.log('Loading decoder panel model...', (progress.loaded / progress.total * 100) + '%');
  }, (error) => {
    console.error('Error loading decoder panel model:', error);
  });

  // Remove any leftover lights
  removeExistingLights(group);

  // Add a dark ambient light to match Room 3's dark atmosphere
  const darkAmbient = new THREE.AmbientLight(0x000000, 0.0); // Completely dark ambient
  darkAmbient.name = 'dark-ambient-override';
  group.add(darkAmbient);

  // Red emergency lights matching Room 3 (West room) - Perimeter red alarm lights (N, E, S, W)
  const roomHeight = 4;
  const roomHalf = 9; // Half of 18 (room width)
  const lightRadius = roomHalf - 1.0; // Position lights slightly inward from walls
  const lightY = roomHeight - 0.5; // Position near ceiling
  
  // Helper function to create red alarm lights
  const mk = (name, x, z) => {
    const p = new THREE.PointLight(0xff3333, 2.6, 30, 2.0);
    p.position.set(x, lightY, z);
    p.castShadow = false;
    p.visible = true;
    p.name = name;
    group.add(p);
    return p;
  };
  
  // Create red lights at cardinal directions
  const alarmLightN = mk('alarmLightN', 0, -lightRadius);  // North
  const alarmLightS = mk('alarmLightS', 0, lightRadius);   // South
  const alarmLightE = mk('alarmLightE', lightRadius, 0);    // East
  const alarmLightW = mk('alarmLightW', -lightRadius, 0);  // West
  
  // Store references for potential animation
  group.userData.alarmLights = {
    N: alarmLightN,
    S: alarmLightS,
    E: alarmLightE,
    W: alarmLightW
  };

  // Create a cylindrical holographic beam above the laptop - same height as room walls
  const beamRadius = 2.5;
  const beamHeight = 4; // Same height as room walls
  const beamGeometry = new THREE.CylinderGeometry(beamRadius, beamRadius, beamHeight, 32, 1, true);
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const beamMesh = new THREE.Mesh(beamGeometry, beamMaterial);
  // Position cylinder so it extends from floor (y=0) to ceiling (y=4), matching wall height
  beamMesh.position.set(0, 2, 0); // Center at y=2 (same as walls) - extends from y=0 to y=4
  beamMesh.rotation.x = 0; // Cylinder is vertical by default
  beamMesh.name = 'holographic-beam';
  group.add(beamMesh);

  // Add holographic particles for beam visibility
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // Position particles within the cylindrical beam area
    // Beam extends from y=0 to y=4 (floor to ceiling)
    const height = Math.random() * beamHeight; // Random height between 0 and 4
    const radius = beamRadius * Math.random();
    const angle = Math.random() * Math.PI * 2;
    
    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = height;
    positions[i3 + 2] = Math.sin(angle) * radius;
    
    // Green color for all particles
    colors[i3] = 0.0; // R
    colors[i3 + 1] = 1.0; // G
    colors[i3 + 2] = 0.53; // B (0x00ff88)
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.05,
    transparent: true,
    opacity: 0.6,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.position.set(0, 0, 0);
  particles.name = 'holographic-particles';
  group.add(particles);

  // Add focused lighting on the laptop area for glow effect
  const laptopLight = new THREE.PointLight(0x00ff88, 1.5, 18);
  laptopLight.position.set(0, 2, 0);
  laptopLight.name = 'laptop-light';
  laptopLight.castShadow = false;
  group.add(laptopLight);

  // Add a subtle rim light for the laptop pedestal/base glow
  const rimLight = new THREE.PointLight(0x00ff88, 0.8, 10);
  rimLight.position.set(0, 1, 1);
  rimLight.name = 'rim-light';
  rimLight.castShadow = false;
  group.add(rimLight);

  // Add a holographic green spot light beaming from the skybox
  const spotLight = new THREE.SpotLight(0x00ff88, 4.0, 30, Math.PI / 8, 0.05, 0.3);
  spotLight.position.set(0, 10, 2);
  spotLight.target.position.set(0, 0, 0);
  spotLight.castShadow = false;
  spotLight.name = 'holographic-spotlight';
  group.add(spotLight);
  group.add(spotLight.target);

  // Add laptop to Room 4
  const laptop = createReusableLaptop({
    ...LaptopPresets.room4,
    position: new THREE.Vector3(0, 0, 0), // Position at center of room
    rotation: 0 // Face towards the front of the room
  });
  group.add(laptop);

  // Table removed - room is now empty and ready for custom content

  // Add entry/exit anchors for level management
  group.anchors = {
    'center-room': new THREE.Object3D(), // Anchor for transitioning to center room
    'room4-center': new THREE.Object3D() // Anchor for entering Room 4
  };

  // Position the anchors
  group.anchors['center-room'].position.set(0, 1, 9); // Near the doorway
  group.anchors['room4-center'].position.set(0, 1, -9); // Near the back wall

  // Add the anchors to the group
  group.add(group.anchors['center-room']);
  group.add(group.anchors['room4-center']);

  // Add collision detection for walls
  group.userData = {
    type: 'room',
    roomId: 'room4',
    colliders: [
      { type: 'wall', side: 'back', position: [0, 2, -9], size: [18, 4, 0.2] },
      { type: 'wall', side: 'front-left', position: [-5, 2, 9], size: [8, 4, 0.2] },
      { type: 'wall', side: 'front-right', position: [5, 2, 9], size: [8, 4, 0.2] },
      { type: 'wall', side: 'left', position: [-9, 2, 0], size: [0.2, 4, 18] },
      { type: 'wall', side: 'right', position: [9, 2, 0], size: [0.2, 4, 18] }
    ]
  };

  console.log('Room 4 created successfully with', group.children.length, 'children');
  console.log('Room 4 children:', group.children.map(child => child.name));

  // Room entry dialogue function
  function triggerRoom4Welcome() {
    if (!state.hasWelcomed && window.AI) {
      state.hasWelcomed = true;
      window.AI.onRoom4Entry();
    }
  }

  // Binary decoder dialogue function
  function triggerBinaryDecoderDialogue() {
    if (!state.hasShownDecoderDialogue && window.AI) {
      state.hasShownDecoderDialogue = true;
      window.AI.onRoom4BinaryDecoder();
    }
  }

  // Update dialogue system
  function updateRoom4Dialogue() {
    // Check if player is in Room 4
    if (window.leonardModel || window.player) {
      const activePlayer = window.leonardModel || window.player;
      const playerPos = activePlayer.position.clone();
      const localToRoom4 = group.worldToLocal(playerPos.clone());
      const half = 9;
      const insideRoom4 = (
        localToRoom4.x >= -half && localToRoom4.x <= half &&
        localToRoom4.z >= -half && localToRoom4.z <= half
      );
      
      if (insideRoom4) {
        // Trigger welcome message when entering room
        triggerRoom4Welcome();
      }
    }
  }
  
  // Dispose method for cleanup
  function dispose() {
    // Import dispose helper
    import('./utils/DisposeHelper.js').then(({ disposeGroup }) => {
      disposeGroup(group);
    });
    
    // Dispose of floating binary
    if (floatingBinary && typeof floatingBinary.dispose === 'function') {
      floatingBinary.dispose();
    }
    
    // Dispose of nexus panel
    if (nexusPanel && typeof nexusPanel.dispose === 'function') {
      nexusPanel.dispose();
    }
    
    // Clear state
    Object.keys(state).forEach(key => {
      state[key] = null;
    });
    
    // Clear dialogue state
    Object.keys(room4DialogueState).forEach(key => {
      room4DialogueState[key] = null;
    });
  }
  
  // Return object with group property like other rooms
  return {
    group,
    dispose,
    update: (delta) => {
      // Update dialogue system
      updateRoom4Dialogue();
      
      // Check if player has truth filter glasses selected (glasses from Room 2)
      const inv = getPlayerInventory();
      const selected = inv.getSelectedItem ? inv.getSelectedItem() : inv.slots?.[inv.selectedSlot];
      const hasTruthFilter = !!(selected && selected.name === 'glasses');
      
      // Update truth filter state if it changed
      if (hasTruthFilter !== state.lastTruthFilterState) {
        state.lastTruthFilterState = hasTruthFilter;
        if (floatingBinary) {
          floatingBinary.updateTruthFilter(hasTruthFilter);
          console.log(`Truth Filter ${hasTruthFilter ? 'ENABLED' : 'DISABLED'} - NEXUS letters now ${hasTruthFilter ? 'RED BINARY' : 'GREEN BINARY'}`);
        }
      }
      
      // Update floating binary animation
      if (floatingBinary) {
        floatingBinary.update(delta);
      }
      
      // Update nexus panel animation
      if (nexusPanel) {
        nexusPanel.update(delta);
      }

      // Update hologram animation
      if (window.room4Hologram) {
        window.room4Hologram.update(delta);
      }
      
      // Update laptop screen activation
      const laptop = group.getObjectByName('reusable-laptop');
      if (laptop && laptop.userData && laptop.userData.update) {
        const player = window.leonardModel || window.player;
        laptop.userData.update(delta, player);
      }
    },
    checkWallCollisions: (player) => {
      // Basic collision detection
      if (!player || !player.position) return;
      const playerRadius = 0.5;
      const roomHalf = 9;
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
      // Back wall
      if (playerLocal.z - playerRadius < -roomHalf + wallThickness) {
        playerLocal.z = -roomHalf + wallThickness + playerRadius;
        clamped = true;
      }
      // Front wall with opening
      if (playerLocal.z + playerRadius > roomHalf - wallThickness) {
        const inOpeningX = (playerLocal.x >= -1 && playerLocal.x <= 1);
        if (!inOpeningX) {
          playerLocal.z = roomHalf - wallThickness - playerRadius;
          clamped = true;
        }
      }

      if (clamped) {
        const newWorld = group.localToWorld(playerLocal);
        player.position.copy(newWorld);
      }
    },
    handleEKeyInteraction: (player) => {
      console.log('Room 4 E-key handler called with player:', player?.position);
      
      // Check decoder panel interaction first (more important than laptop)
      const decoderPanel = group.getObjectByName('room4-decoder-panel');
      if (decoderPanel && player && player.position) {
        const panelWorldPos = new THREE.Vector3();
        decoderPanel.getWorldPosition(panelWorldPos);
        const distanceToPanel = player.position.distanceTo(panelWorldPos);
        
        console.log('Decoder panel distance:', distanceToPanel, 'threshold: 3.0');
        
        if (distanceToPanel < 3.0) {
          console.log('Decoder panel interaction handled');
          if (decoderPanel.userData && decoderPanel.userData.interact) {
            decoderPanel.userData.interact();
          }
          return true;
        }
      }
      
      // Check laptop interaction
      const laptop = group.getObjectByName('reusable-laptop');
      if (laptop && player && player.position) {
        const laptopWorldPos = new THREE.Vector3();
        laptop.getWorldPosition(laptopWorldPos);
        const distanceToLaptop = player.position.distanceTo(laptopWorldPos);
        
        console.log('Laptop distance:', distanceToLaptop, 'threshold: 3.0');
        
        if (distanceToLaptop < 3.0) {
          console.log('Laptop interaction handled');
          if (laptop.userData && laptop.userData.onInteract) {
            laptop.userData.onInteract();
          }
          return true;
        }
      }
      
      // If nothing else handled, return false
      return false;
    }
  };
}
