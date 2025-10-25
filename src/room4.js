import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addToInventory, hasInInventory, getPlayerInventory } from './player.js';
import { gameStore } from './state/gameStore.js';
import {
  buildStandardLightRig,
  removeExistingLights,
} from './lighting/standardLighting.js';
import { makeTiles136cFloor, makeTiles136cWall, makeTiles136cCeiling } from './materials/room4Materials.js';
import { makeConcrete031MaterialFlexible } from './materials/room0Materials.js';
import { createReusableHallway, HallwayPresets } from './components/ReusableHallway.js';
import { FloatingBinary } from './rooms/Room4/FloatingBinary.js';
import { NexusPanel } from './rooms/Room4/NexusPanel.js';
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

  // Tiles136C texture files for Room 4 (same as Room 1)
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

  // Black floor
  const floorGeometry = new THREE.BoxGeometry(18, 0.2, 18);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9, metalness: 0.0 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  floor.name = 'room4-floor';
  group.add(floor);

  // Black wall material
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.8, metalness: 0.0 });

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

  // Ceiling removed - now using global skybox

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
  nexusPanel.group.position.set(0, 1, -8.8); // Position slightly in front of north wall
  nexusPanel.group.rotation.y = 0; // Static - faces south (toward player)
  nexusPanel.mount(group);
  console.log('NEXUS panel mounted to group');
  console.log('Panel final position:', nexusPanel.group.position);
  console.log('Panel final rotation:', nexusPanel.group.rotation);
  
  // Make nexusPanel globally accessible for laptop interface
  window.room4NexusPanel = nexusPanel;

  // Remove any leftover lights
  removeExistingLights(group);

  // Enhanced lighting system for Room 4 - Brighter overall
  const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // Increased ambient light
  ambientLight.name = 'ambient-light';
  group.add(ambientLight);

  // Main ceiling light - brighter and with green tint
  const ceilingLight = new THREE.PointLight(0xffffff, 2.5, 35); // Increased intensity and range
  ceilingLight.position.set(0, 4, 0);
  ceilingLight.name = 'ceiling-light';
  ceilingLight.castShadow = true;
  ceilingLight.shadow.mapSize.width = 1024; // Higher resolution shadows
  ceilingLight.shadow.mapSize.height = 1024;
  ceilingLight.shadow.camera.near = 0.1;
  ceilingLight.shadow.camera.far = 35;
  group.add(ceilingLight);

  // Enhanced fill lights for better illumination
  const fillLight1 = new THREE.PointLight(0xffffff, 1.0, 25); // Increased intensity and range
  fillLight1.position.set(-6, 3, -6);
  fillLight1.castShadow = false;
  group.add(fillLight1);

  const fillLight2 = new THREE.PointLight(0xffffff, 1.0, 25); // Increased intensity and range
  fillLight2.position.set(6, 3, 6);
  fillLight2.castShadow = false;
  group.add(fillLight2);

  // Add a focused light on the laptop area
  const laptopLight = new THREE.PointLight(0x00ff88, 1.5, 18); // Brighter green light focused on laptop
  laptopLight.position.set(0, 2, -3);
  laptopLight.name = 'laptop-light';
  laptopLight.castShadow = true;
  laptopLight.shadow.mapSize.width = 512;
  laptopLight.shadow.mapSize.height = 512;
  laptopLight.shadow.camera.near = 0.1;
  laptopLight.shadow.camera.far = 18;
  group.add(laptopLight);

  // Add a subtle rim light for the laptop pedestal
  const rimLight = new THREE.PointLight(0x00ff88, 0.8, 10); // Brighter rim light
  rimLight.position.set(0, 1, -2);
  rimLight.name = 'rim-light';
  rimLight.castShadow = false;
  group.add(rimLight);

  // Add a holographic green spot light beaming from the skybox
  const spotLight = new THREE.SpotLight(0x00ff88, 4.0, 30, Math.PI / 8, 0.05, 0.3); // More intense, longer range
  spotLight.position.set(0, 10, -1); // Positioned even higher for dramatic effect
  spotLight.target.position.set(0, 0, -3); // Target the laptop position
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 2048; // Higher resolution for crisp shadows
  spotLight.shadow.mapSize.height = 2048;
  spotLight.shadow.camera.near = 0.1;
  spotLight.shadow.camera.far = 30;
  spotLight.shadow.bias = -0.0001; // Reduce shadow acne
  spotLight.name = 'holographic-spotlight';
  group.add(spotLight);
  group.add(spotLight.target); // Add the target to the group

  // Add a secondary spot light for volumetric effect
  const volumetricLight = new THREE.SpotLight(0x00ff88, 2.0, 25, Math.PI / 3, 0.1, 0.6);
  volumetricLight.position.set(0, 8, -1); // Slightly lower and wider
  volumetricLight.target.position.set(0, 0, -3);
  volumetricLight.castShadow = false; // No shadows for volumetric effect
  volumetricLight.name = 'volumetric-light';
  group.add(volumetricLight);
  group.add(volumetricLight.target);

  // Add a third light for atmospheric glow
  const atmosphericLight = new THREE.PointLight(0x00ff88, 1.2, 20);
  atmosphericLight.position.set(0, 5, -2);
  atmosphericLight.castShadow = false;
  atmosphericLight.name = 'atmospheric-glow';
  group.add(atmosphericLight);

  // Create a single holographic beam - MASSIVE diameter for skybox effect
  const beamGeometry = new THREE.ConeGeometry(2.5, 12, 20, 1, true); // Even larger radius (2.5) and height (12)
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.25, // Dimmer for skybox effect
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const beamMesh = new THREE.Mesh(beamGeometry, beamMaterial);
  beamMesh.position.set(0, 6, -3); // Positioned higher for skybox effect
  beamMesh.rotation.x = 0; // No rotation - cone points down by default
  beamMesh.name = 'holographic-beam';
  group.add(beamMesh);

  // Add holographic particles for beam visibility - MASSIVE beam area
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 200; // Even more particles for massive beam
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // Position particles within the massive beam area
    const height = Math.random() * 10 + 1; // Y: from ceiling down to laptop (1 to 11)
    const radius = (height / 12) * 2.5; // Radius decreases with height (cone shape) - matches beam
    const angle = Math.random() * Math.PI * 2; // Random angle around the beam
    
    positions[i3] = Math.cos(angle) * radius * Math.random(); // X: within beam radius
    positions[i3 + 1] = height; // Y: along beam height
    positions[i3 + 2] = -3 + Math.sin(angle) * radius * Math.random(); // Z: within beam radius
    
    // Green color for all particles
    colors[i3] = 0.0; // R
    colors[i3 + 1] = 1.0; // G
    colors[i3 + 2] = 0.53; // B (0x00ff88)
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.05, // Slightly smaller particles for skybox effect
    transparent: true,
    opacity: 0.6, // Dimmer particles for skybox effect
    vertexColors: true,
    blending: THREE.AdditiveBlending
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.position.set(0, 0, 0); // No offset needed since particles are positioned correctly
  particles.name = 'holographic-particles';
  group.add(particles);

  // Add laptop to Room 4
  const laptop = createReusableLaptop({
    ...LaptopPresets.room4,
    position: new THREE.Vector3(0, 0, -3), // Position near the back wall, center
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
      
      // Check laptop interaction first
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
      
      // Check if player is near the NEXUS panel
      if (nexusPanel && player && player.position) {
        const playerLocal = group.worldToLocal(player.position.clone());
        const panelDistance = playerLocal.distanceTo(new THREE.Vector3(0, 1, -8.8));
        
        console.log('Player distance from panel:', panelDistance);
        
        // If player is within 3 units of the panel
        if (panelDistance < 3) {
          console.log('Opening NEXUS panel...');
          nexusPanel.show();
          // Trigger decoder dialogue when panel is opened
          triggerBinaryDecoderDialogue();
          return true; // Interaction handled
        } else {
          console.log('Player too far from panel (distance:', panelDistance, ')');
        }
      } else {
        console.log('Missing nexusPanel or player position');
      }
      return false; // No interaction
    }
  };
}
