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

  // Walls (front wall has an opening near x ≈ -2 to align with Room 1 hallway at world x ≈ -8)
  // Back wall now has an opening to connect to Room 3 hallway
  const walls = [
    // Back wall split into two segments to create a doorway/opening for Room 3 hallway
    { size: [5, 4, 0.2], pos: [-3.5, 2, -6] }, // left segment
    { size: [5, 4, 0.2], pos: [3.5, 2, -6] },  // right segment, leaves ~2 units gap centered at x ~0
    // Front wall split into two segments to create a doorway/opening near left side
    { size: [6, 4, 0.2], pos: [-3, 2, 6] }, // left segment
    { size: [4, 4, 0.2], pos: [4, 2, 6] },  // right segment, leaves ~2 units gap centered at x ~1
    // Left wall
    { size: [0.2, 4, 12], pos: [-6, 2, 0] },
    // Right wall
    { size: [0.2, 4, 12], pos: [6, 2, 0] }
  ];

  walls.forEach(wall => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...wall.size),
      wallMaterial
    );
    mesh.position.set(...wall.pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  // Ceiling
  const ceiling = floor.clone();
  ceiling.position.y = 4;
  group.add(ceiling);

  // Add scales model
  const loader = new GLTFLoader();
  loader.load('/models/scales.glb', (gltf) => {
      const scales = setupModel(gltf);
      scales.position.set(0, 0, -5.5); // Position at the back, slightly elevated
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

  // Add a small hallway stub to meet Room 1 hallway visually
  const hallwayStub = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.2, 4),
    wallMaterial
  );
  hallwayStub.position.set(-2, 0.1, 8); // extends slightly out of the room to meet incoming hallway
  hallwayStub.receiveShadow = true;
  group.add(hallwayStub);

  // Add a hallway stub to connect to Room 3 hallway
  const hallwayStubToRoom3 = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.2, 4),
    wallMaterial
  );
  hallwayStubToRoom3.position.set(0, 0.1, -8); // extends slightly out of the room to meet Room 3 hallway
  hallwayStubToRoom3.receiveShadow = true;
  group.add(hallwayStubToRoom3);

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
      // Back wall with doorway/opening around x in [-1, 1] approximately
      if (playerLocal.z - playerRadius < -roomHalf + wallThickness) {
        const inBackOpeningX = (playerLocal.x >= -1 && playerLocal.x <= 1);
        if (!inBackOpeningX) {
          playerLocal.z = -roomHalf + wallThickness + playerRadius;
          clamped = true;
        }
      }
      // Front wall with doorway/opening around x in [-4, 0] approximately
      if (playerLocal.z + playerRadius > roomHalf - wallThickness) {
        const inOpeningX = (playerLocal.x >= -4 && playerLocal.x <= 0);
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
