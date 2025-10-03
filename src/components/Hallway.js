import * as THREE from 'three';

export class Hallway {
  constructor(options = {}) {
    this.group = new THREE.Group();
    this.width = options.width || 2.5;
    this.height = options.height || 2.2;
    this.length = options.length || 6;
    this.material = options.material || this.createDefaultMaterial();
    
    this.createHallway();
  }

  createDefaultMaterial() {
    return new THREE.MeshStandardMaterial({ color: '#1f2937' });
  }

  createHallway() {
    // Floor
    const floorGeometry = new THREE.BoxGeometry(this.width, 0.02, this.length);
    const floor = new THREE.Mesh(floorGeometry, this.material);
    floor.position.set(0, -0.01, 0);
    floor.receiveShadow = true;
    this.group.add(floor);
    
    // Ceiling
    const ceilingGeometry = new THREE.BoxGeometry(this.width, 0.02, this.length);
    const ceiling = new THREE.Mesh(ceilingGeometry, this.material);
    ceiling.position.set(0, this.height, 0);
    this.group.add(ceiling);
    
    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(0.02, this.height, this.length);
    const leftWall = new THREE.Mesh(leftWallGeometry, this.material);
    leftWall.position.set(-this.width / 2, this.height / 2, 0);
    this.group.add(leftWall);
    
    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(0.02, this.height, this.length);
    const rightWall = new THREE.Mesh(rightWallGeometry, this.material);
    rightWall.position.set(this.width / 2, this.height / 2, 0);
    this.group.add(rightWall);
    
    // Add lighting
    this.addLighting();
  }

  addLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x202020, 0.1);
    this.group.add(ambientLight);
    
    // Point lights along the hallway
    const lightCount = Math.floor(this.length / 6);
    for (let i = 0; i < lightCount; i++) {
      const light = new THREE.PointLight(0xffffff, 0.3, 8);
      light.position.set(0, 3, -this.length / 2 + (i + 1) * (this.length / (lightCount + 1)));
      light.castShadow = true;
      light.shadow.mapSize.width = 256;
      light.shadow.mapSize.height = 256;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 10;
      this.group.add(light);
    }
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  setRotation(x, y, z) {
    this.group.rotation.set(x, y, z);
  }
}
