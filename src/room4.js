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

export function createRoom4() {
  const group = new THREE.Group();
  group.name = 'room4';
  
  console.log('Creating Room 4...');

  // Room state for interactions
  const state = {
    // Add any room-specific state here
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

  // Simple floor for testing
  const floorGeometry = new THREE.BoxGeometry(18, 0.2, 18);
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  floor.name = 'room4-floor';
  group.add(floor);

  // Simple wall material for testing
  const wallMat = new THREE.MeshBasicMaterial({ color: 0x444444 });

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

  // Simple ceiling for testing
  const ceilingGeometry = new THREE.BoxGeometry(18, 0.2, 18);
  const ceilingMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.set(0, 4, 0);
  ceiling.receiveShadow = true;
  ceiling.name = 'room4-ceiling';
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

  // Add floating binary text effect
  const floatingBinary = new FloatingBinary();
  floatingBinary.mount(group);

  // Add some basic lighting to Room 4
  const roomLighting = buildStandardLightRig({
    keyPosition: new THREE.Vector3(0, 8, 0),
    keyIntensity: 1.0,
    hemiIntensity: 0.3,
    shadowMap: 512,
    shadowBounds: 10,
    enableAccents: false
  });
  group.add(roomLighting);

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
  
  // Return object with group property like other rooms
  return {
    group,
    update: (delta) => {
      // Update floating binary animation
      if (floatingBinary) {
        floatingBinary.update(delta);
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
    }
  };
}
