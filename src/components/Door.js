import * as THREE from 'three';
import { EventEmitter } from '../utils/EventEmitter.js';

export class Door extends EventEmitter {
  constructor(options = {}) {
    super();
    this.group = new THREE.Group();
    this.isOpen = false;
    this.isAnimating = false;
    this.animationDuration = options.duration || 0.8;
    this.openDistance = options.openDistance || 4.0;
    this.lockRequired = options.lockRequired || false;
    this.requiredItem = options.requiredItem || null;
    
    this.createDoor(options);
    this.setupAnimation();
  }

  createDoor(options) {
    // Main door panel
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(options.width || 3, options.height || 3.5, 0.2),
      new THREE.MeshStandardMaterial({
        color: options.color || 0x1a1a1a,
        metalness: 0.9,
        roughness: 0.2
      })
    );
    doorPanel.position.set(0, (options.height || 3.5) / 2, 0);
    this.group.add(doorPanel);

    // Lock mechanism if required
    if (this.lockRequired) {
      this.createLockMechanism();
    }
  }

  createLockMechanism() {
    const lockMechanism = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16),
      new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x0066ff,
        emissiveIntensity: 0.3
      })
    );
    lockMechanism.position.set(0, 1.75, 0.11);
    lockMechanism.rotation.x = Math.PI / 2;
    this.group.add(lockMechanism);
  }

  setupAnimation() {
    this.animationState = {
      startY: this.group.position.y,
      targetY: this.group.position.y + this.openDistance,
      progress: 0,
      duration: this.animationDuration
    };
  }

  open() {
    if (this.isOpen || this.isAnimating) return false;
    
    this.isAnimating = true;
    this.animationState.progress = 0;
    this.emit('opening');
    return true;
  }

  close() {
    if (!this.isOpen || this.isAnimating) return false;
    
    this.isAnimating = true;
    this.animationState.progress = 0;
    this.emit('closing');
    return true;
  }

  update(deltaTime) {
    if (!this.isAnimating) return;

    this.animationState.progress += deltaTime / this.animationState.duration;
    
    if (this.animationState.progress >= 1) {
      this.animationState.progress = 1;
      this.isAnimating = false;
      this.isOpen = !this.isOpen;
      this.emit(this.isOpen ? 'opened' : 'closed');
    }

    // Smooth easing
    const easedProgress = 1 - Math.pow(1 - this.animationState.progress, 3);
    this.group.position.y = THREE.MathUtils.lerp(
      this.animationState.startY,
      this.animationState.targetY,
      easedProgress
    );
  }

  canInteract(playerInventory) {
    if (!this.lockRequired) return true;
    if (!this.requiredItem) return true;
    return playerInventory.hasItem(this.requiredItem);
  }
}
