import * as THREE from 'three';

export function createRoom4Simple() {
  const group = new THREE.Group();
  group.name = 'room4-simple';
  
  console.log('Creating simple Room 4...');

  // Simple floor
  const floorGeometry = new THREE.BoxGeometry(18, 0.2, 18);
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  floor.name = 'room4-floor';
  group.add(floor);

  // Simple walls
  const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });

  // Back wall (North)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 0.2), wallMaterial);
  backWall.position.set(0, 2, -9);
  backWall.name = 'back-wall';
  group.add(backWall);

  // Front wall (South) with opening
  const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.2), wallMaterial);
  frontWallLeft.position.set(-5, 2, 9);
  frontWallLeft.name = 'front-wall-left';
  group.add(frontWallLeft);

  const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.2), wallMaterial);
  frontWallRight.position.set(5, 2, 9);
  frontWallRight.name = 'front-wall-right';
  group.add(frontWallRight);

  // Side walls
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 18), wallMaterial);
  leftWall.position.set(-9, 2, 0);
  leftWall.name = 'left-wall';
  group.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 18), wallMaterial);
  rightWall.position.set(9, 2, 0);
  rightWall.name = 'right-wall';
  group.add(rightWall);

  // Ceiling
  const ceilingGeometry = new THREE.BoxGeometry(18, 0.2, 18);
  const ceilingMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.set(0, 4, 0);
  ceiling.name = 'ceiling';
  group.add(ceiling);

  // Bright test cube
  const testCube = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  testCube.position.set(0, 1, 0);
  testCube.name = 'test-cube';
  group.add(testCube);

  console.log('Simple Room 4 created with', group.children.length, 'children');
  console.log('Simple Room 4 children:', group.children.map(child => child.name));
  
  // Return object with group property like other rooms
  return {
    group,
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
