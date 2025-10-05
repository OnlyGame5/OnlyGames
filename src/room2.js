import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setupModel } from './utils.js';

export function createRoom2() {
  const group = new THREE.Group();
  group.name = 'room2';

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

  // Back wall (South, z=-6) - SOLID
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(12, wallHeight, wallThickness),
    wallMaterial
  );
  backWall.position.set(0, wallHeight / 2, -roomDepthHalf);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);
  
  // Front wall (North, z=6) - WITH OPENING
  const frontWall_LeftSegment = new THREE.Mesh(
    new THREE.BoxGeometry(5, wallHeight, wallThickness), // 5 units wide
    wallMaterial
  );
  frontWall_LeftSegment.position.set(-3.5, wallHeight / 2, roomDepthHalf);
  frontWall_LeftSegment.castShadow = true;
  frontWall_LeftSegment.receiveShadow = true;
  group.add(frontWall_LeftSegment);

  const frontWall_RightSegment = new THREE.Mesh(
    new THREE.BoxGeometry(5, wallHeight, wallThickness), // 5 units wide
    wallMaterial
  );
  frontWall_RightSegment.position.set(3.5, wallHeight / 2, roomDepthHalf);
  frontWall_RightSegment.castShadow = true;
  frontWall_RightSegment.receiveShadow = true;
  group.add(frontWall_RightSegment);

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

  // Header above the new North opening
  const headerNorth = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.5, wallThickness), 
    wallMaterial
  );
  headerNorth.position.set(0, 4.25, 6);
  headerNorth.castShadow = true;
  headerNorth.receiveShadow = true;
  group.add(headerNorth);


  // Ceiling
  const ceiling = floor.clone();
  ceiling.position.y = 4;
  group.add(ceiling);

  // Add scales model
  const loader = new GLTFLoader();
  loader.load('/models/scales.glb', (gltf) => {
      const scales = setupModel(gltf);
      scales.position.set(0, 0, -4.5); // Moved slightly forward to avoid blocking any potential opening
      scales.scale.set(0.05, 0.05, 0.05); // Keep existing scale
      group.add(scales);
  });

  // Add other models to Room 2 with individualized scaling and positions
  // Statue of Liberty
  

  
  loader.load('/models/statue_of_liberty.glb', (gltf) => {
      const statue = setupModel(gltf);
      statue.position.set(-3.5, 0.5, 0); // Repositioned
      statue.scale.set(0.015, 0.015, 0.015); // Small statue
      group.add(statue);
  });

  

  // Bowling Pin
  loader.load('/models/bowling_pin.glb', (gltf) => {
      const pin = setupModel(gltf);
      pin.position.set(4, 0.2, -5); // Repositioned
      pin.scale.set(1, 1, 1); // Small bowling pin
      group.add(pin);
  });

  // Bowling Ball
  loader.load('/models/bowling_ball.glb', (gltf) => {
      const ball = setupModel(gltf);
      ball.position.set(5, 0.5, -4); // Repositioned
      ball.scale.set(0.2, 0.2, 0.2); // Small bowling ball
      group.add(ball);
  });

  // Book
  loader.load('/models/book.glb', (gltf) => {
      const book = setupModel(gltf);
      book.position.set(-5, 0.15, 3.5); // Repositioned
      book.scale.set(0.3, 0.3, 0.3); // Very small book
      book.rotation.y = Math.PI / 8;
      group.add(book);
  });


  return {
    group,
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
      // Back wall (now solid)
      if (playerLocal.z - playerRadius < -roomHalf + wallThickness) {
        playerLocal.z = -roomHalf + wallThickness + playerRadius;
        clamped = true;
      }
      // Front wall with opening for hub hallway (North)
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
