import * as THREE from 'three';

export class Room3 {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'room3';
    
    this.entryAnchor = null;
    this.exitAnchor = null;
    
    this.createRoom();
  }

  createRoom() {
    const roomWidth = 12;
    const roomDepth = 12;
    
    // Create floor
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth, 0.1, roomDepth),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
    );
    floor.position.set(0, -0.05, 0);
    floor.receiveShadow = true;
    this.group.add(floor);
    
    // Create entry and exit anchors
    this.createAnchors();
    
    // Setup lighting
    this.setupLighting();
  }

  createAnchors() {
    // Entry anchor
    this.entryAnchor = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    this.entryAnchor.position.set(0, 0.5, 6);
    this.group.add(this.entryAnchor);
    
    // Exit anchor
    this.exitAnchor = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    this.exitAnchor.position.set(0, 0.5, -6);
    this.group.add(this.exitAnchor);
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
    // Room 3 is currently a placeholder
    // Future puzzle implementations will go here
  }

  onRoomClick(event) {
    console.log('Room 3 clicked');
  }

  destroy() {
    // Cleanup if needed
  }
}
