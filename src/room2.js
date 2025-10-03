import * as THREE from 'three';

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
  const walls = [
    // Back wall
    { size: [12, 4, 0.2], pos: [0, 2, -6] },
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

  // Add a small hallway stub to meet Room 1 hallway visually
  const hallwayStub = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.2, 4),
    wallMaterial
  );
  hallwayStub.position.set(-2, 0.1, 8); // extends slightly out of the room to meet incoming hallway
  hallwayStub.receiveShadow = true;
  group.add(hallwayStub);

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
      // Back wall
      if (playerLocal.z - playerRadius < -roomHalf + wallThickness) {
        playerLocal.z = -roomHalf + wallThickness + playerRadius;
        clamped = true;
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
