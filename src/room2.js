import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setupModel } from './utils.js';
import { addToInventory } from './player.js'; // Import inventory function
import { AI } from './ai.js'; // Import AI for feedback

export function createRoom2() {
  const group = new THREE.Group();
  group.name = 'room2';

  const pickableObjects = []; // Array to hold objects that can be picked up
  const roomObjects = {}; // To store references to the models for cloning

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

  // Ceiling
  const ceiling = floor.clone();
  ceiling.position.y = 4;
  group.add(ceiling);

  const loader = new GLTFLoader();

  // Add scales model
  loader.load('/models/scales.glb', (gltf) => {
      const scales = setupModel(gltf);
      scales.position.set(0, 0.2, 4.5);
      scales.scale.set(0.05, 0.05, 0.05);
      group.add(scales);
  });
  
  // Statue of Liberty
  loader.load('/models/statue_of_liberty.glb', (gltf) => {
      const statue = setupModel(gltf);
      statue.position.set(-3.5, 0.5, 0);
      statue.scale.set(0.015, 0.015, 0.015);
      // Make it pickable
      statue.name = 'statue';
      statue.userData.description = 'A small model of the Statue of Liberty.';
      statue.userData.isPickable = true;
      group.add(statue);
      pickableObjects.push(statue);
      roomObjects.statue = statue;
  });

  // Bowling Pin
  loader.load('/models/bowling_pin.glb', (gltf) => {
      const pin = setupModel(gltf);
      pin.position.set(4, 0.2, -5);
      pin.scale.set(1, 1, 1);
      // Make it pickable
      pin.name = 'bowling-pin';
      pin.userData.description = 'A standard bowling pin.';
      pin.userData.isPickable = true;
      group.add(pin);
      pickableObjects.push(pin);
      roomObjects['bowling-pin'] = pin;
  });

  // Bowling Ball
  loader.load('/models/bowling_ball.glb', (gltf) => {
      const ball = setupModel(gltf);
      ball.position.set(5, 0.5, -4);
      ball.scale.set(0.2, 0.2, 0.2);
       // Make it pickable
      ball.name = 'bowling-ball';
      ball.userData.description = 'A heavy bowling ball.';
      ball.userData.isPickable = true;
      group.add(ball);
      pickableObjects.push(ball);
      roomObjects['bowling-ball'] = ball;
  });

  // Book
  loader.load('/models/book.glb', (gltf) => {
      const book = setupModel(gltf);
      book.position.set(-5, 0.15, 3.5);
      book.scale.set(0.3, 0.3, 0.3);
      book.rotation.y = Math.PI / 8;
      // Make it pickable
      book.name = 'book';
      book.userData.description = 'An old, leather-bound book.';
      book.userData.isPickable = true;
      group.add(book);
      pickableObjects.push(book);
      roomObjects.book = book;
  });

  function handleEKeyInteraction(player) {
    const playerPosition = player.position;
    let itemPickedUp = false;

    for (let i = pickableObjects.length - 1; i >= 0; i--) {
      const object = pickableObjects[i];
      const worldPosition = new THREE.Vector3();
      object.getWorldPosition(worldPosition);
      const distance = playerPosition.distanceTo(worldPosition);

      if (distance < 2.0) { // Proximity check
        const item = {
          name: object.name,
          description: object.userData.description,
        };

        if (addToInventory(item)) {
          AI.say(`Picked up: ${object.userData.description}`);
          group.remove(object); // Remove from scene
          pickableObjects.splice(i, 1); // Remove from pickable list
          itemPickedUp = true;
          break; // Pick up one item at a time
        } else {
          AI.say("My inventory is full.");
          itemPickedUp = true; // Still counts as a handled interaction
          break;
        }
      }
    }
    return itemPickedUp;
  }

  return {
    group,
    roomObjects,
    handleEKeyInteraction,
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
