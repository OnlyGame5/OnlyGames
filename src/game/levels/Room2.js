import * as THREE from 'three';

export class Room2 {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'room2';
    
    this.createRoom();
  }

  createRoom() {
    const roomWidth = 12;
    const roomDepth = 12;
    const roomHeight = 4;
    
    // Create floor
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth, 0.1, roomDepth),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
    );
    floor.position.set(0, -0.05, 0);
    floor.receiveShadow = true;
    this.group.add(floor);
    
    // Create walls
    this.createWalls(roomWidth, roomDepth, roomHeight);
    
    // Create ceiling
    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth, 0.1, roomDepth),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    ceiling.position.set(0, roomHeight + 0.05, 0);
    this.group.add(ceiling);
    
    // Setup lighting
    this.setupLighting();
  }

  createWalls(roomWidth, roomDepth, roomHeight) {
    const wallThickness = 0.3;
    const halfWidth = roomWidth / 2;
    const halfDepth = roomDepth / 2;
    
    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, roomHeight, roomDepth),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    leftWall.position.set(-halfWidth, roomHeight / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.group.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, roomHeight, roomDepth),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    rightWall.position.set(halfWidth, roomHeight / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.group.add(rightWall);
    
    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth, roomHeight, wallThickness),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    backWall.position.set(0, roomHeight / 2, -halfDepth);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.group.add(backWall);
    
    // Front wall (with opening to align with Room 1's extended hallway)
    const frontWallLeft = new THREE.Mesh(
      new THREE.BoxGeometry(4, roomHeight, wallThickness),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    frontWallLeft.position.set(-4, roomHeight / 2, halfDepth);
    frontWallLeft.castShadow = true;
    frontWallLeft.receiveShadow = true;
    this.group.add(frontWallLeft);
    
    const frontWallRight = new THREE.Mesh(
      new THREE.BoxGeometry(4, roomHeight, wallThickness),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    frontWallRight.position.set(4, roomHeight / 2, halfDepth);
    frontWallRight.castShadow = true;
    frontWallRight.receiveShadow = true;
    this.group.add(frontWallRight);
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x202020, 0.3);
    this.group.add(ambientLight);
    
    // Point light
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 20);
    pointLight.position.set(0, 3, 0);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 512;
    pointLight.shadow.mapSize.height = 512;
    this.group.add(pointLight);
  }

  update(deltaTime, context) {
    // Room 2 is currently a placeholder
    // Future puzzle implementations will go here
  }

  checkWallCollisions(player) {
    if (!player) return;
    
    const playerPos = player.getPosition();
    const playerRadius = 0.5;
    
    // Room boundaries
    const roomBounds = {
      minX: -6,
      maxX: 6,
      minZ: -6,
      maxZ: 6
    };
    
    // Check room boundaries
    if (playerPos.x - playerRadius < roomBounds.minX) {
      playerPos.x = roomBounds.minX + playerRadius;
    }
    if (playerPos.x + playerRadius > roomBounds.maxX) {
      playerPos.x = roomBounds.maxX - playerRadius;
    }
    if (playerPos.z - playerRadius < roomBounds.minZ) {
      playerPos.z = roomBounds.minZ + playerRadius;
    }
    if (playerPos.z + playerRadius > roomBounds.maxZ) {
      playerPos.z = roomBounds.maxZ - playerRadius;
    }
  }

  onRoomClick(event) {
    console.log('Room 2 clicked');
  }

  destroy() {
    // Cleanup if needed
  }
}
