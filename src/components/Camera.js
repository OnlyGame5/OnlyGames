import * as THREE from 'three';
import { EventEmitter } from '../utils/EventEmitter.js';

export class SecurityCamera extends EventEmitter {
  constructor(options = {}) {
    super();
    this.group = new THREE.Group();
    this.isTracking = false;
    this.playerInRoom = false;
    this.trackingSpeed = options.trackingSpeed || 2.0;
    this.maxVerticalRotation = options.maxVerticalRotation || Math.PI / 4;
    
    this.createCamera(options);
  }

  createCamera(options) {
    // Camera body
    const cameraBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.8,
        roughness: 0.2
      })
    );
    cameraBody.castShadow = true;
    this.group.add(cameraBody);

    // Camera lens
    const cameraLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16),
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        metalness: 0.9,
        roughness: 0.1
      })
    );
    cameraLens.position.set(0, 0, 0.15);
    cameraLens.rotation.x = Math.PI / 2;
    cameraLens.castShadow = true;
    this.group.add(cameraLens);

    // Status light
    this.statusLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.8
      })
    );
    this.statusLight.position.set(0.15, 0.1, 0.1);
    this.group.add(this.statusLight);

    // Mounting bracket
    const mount = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.7,
        roughness: 0.3
      })
    );
    mount.position.set(0, -0.2, 0);
    mount.castShadow = true;
    this.group.add(mount);
  }

  updateTracking(playerObject, roomBounds) {
    if (!playerObject || !playerObject.position) return;

    const playerPos = playerObject.position;
    
    // Check if player is in room bounds
    const inRoom = this.isPlayerInRoom(playerPos, roomBounds);
    
    // Update tracking state
    if (inRoom && !this.playerInRoom) {
      this.playerInRoom = true;
      this.isTracking = true;
      this.emit('trackingStarted');
    } else if (!inRoom && this.playerInRoom) {
      this.playerInRoom = false;
      this.isTracking = false;
      this.emit('trackingStopped');
    }
    
    // Update camera rotation to track player
    if (this.isTracking) {
      this.trackPlayer(playerPos);
    }
  }

  isPlayerInRoom(playerPos, roomBounds) {
    return (
      playerPos.x >= roomBounds.min.x && 
      playerPos.x <= roomBounds.max.x && 
      playerPos.z >= roomBounds.min.z && 
      playerPos.z <= roomBounds.max.z
    );
  }

  trackPlayer(playerPos) {
    const cameraPos = this.group.position;
    const direction = new THREE.Vector3(
      playerPos.x - cameraPos.x,
      playerPos.y - cameraPos.y,
      playerPos.z - cameraPos.z
    );
    
    // Calculate rotation angles
    const horizontalAngle = Math.atan2(direction.x, direction.z);
    const verticalAngle = Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z));
    
    // Clamp vertical rotation
    const clampedVerticalAngle = Math.max(-this.maxVerticalRotation, Math.min(this.maxVerticalRotation, verticalAngle));
    
    // Apply rotations with smoothing
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, horizontalAngle, this.trackingSpeed * 0.016);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, clampedVerticalAngle, this.trackingSpeed * 0.016);
  }

  updateStatusLight(isActive) {
    if (this.statusLight) {
      this.statusLight.material.emissiveIntensity = isActive ? 0.8 : 0.2;
    }
  }
}
