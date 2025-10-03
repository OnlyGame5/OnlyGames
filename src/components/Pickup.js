import * as THREE from 'three';
import { EventEmitter } from '../utils/EventEmitter.js';

export class Pickup extends EventEmitter {
  constructor(options = {}) {
    super();
    this.group = new THREE.Group();
    this.itemData = options.itemData;
    this.pickupDistance = options.pickupDistance || 2.0;
    this.isPickedUp = false;
    this.animationSpeed = options.animationSpeed || 2.0;
    
    this.createPickup(options);
    this.setupAnimation();
  }

  createPickup(options) {
    if (options.model) {
      this.loadModel(options.model);
    } else {
      this.createFallbackMesh(options);
    }
  }

  createFallbackMesh(options) {
    const geometry = new THREE.BoxGeometry(0.3, 0.1, 0.6);
    const material = new THREE.MeshStandardMaterial({
      color: options.color || 0xffff00,
      emissive: options.emissive || 0xffaa00,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  setupAnimation() {
    this.originalY = this.group.position.y;
    this.animationTime = 0;
  }

  update(deltaTime) {
    if (this.isPickedUp) return;

    // Floating animation
    this.animationTime += deltaTime * this.animationSpeed;
    this.group.position.y = this.originalY + Math.sin(this.animationTime) * 0.1;
    this.group.rotation.y += deltaTime * 0.5;
  }

  canPickup(playerPosition) {
    if (this.isPickedUp) return false;
    
    const distance = playerPosition.distanceTo(this.group.position);
    return distance <= this.pickupDistance;
  }

  pickup() {
    if (this.isPickedUp) return null;
    
    this.isPickedUp = true;
    this.group.visible = false;
    this.emit('pickedUp', this.itemData);
    return this.itemData;
  }
}
