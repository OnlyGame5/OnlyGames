// src/collision/WallCollisionManager.js
import * as THREE from 'three';

export class WallCollisionManager {
  constructor() {
    this.walls = [];
    this.hallways = [];
    this.hallwayWalls = [];
    this.objects = [];
    this.debugMode = false;
    this.debugMeshes = [];
  }

  /**
   * Add wall collision box
   * @param {THREE.Vector3} position - Center position
   * @param {THREE.Vector3} size - Width, height, depth
   * @param {string} id - Unique identifier
   */
  addWall(position, size, id) {
    this.walls.push({
      id,
      position: position.clone(),
      size: size.clone(),
      min: new THREE.Vector3(
        position.x - size.x / 2,
        position.y - size.y / 2,
        position.z - size.z / 2
      ),
      max: new THREE.Vector3(
        position.x + size.x / 2,
        position.y + size.y / 2,
        position.z + size.z / 2
      )
    });
  }

  /**
   * Add hallway zone (overrides wall collision)
   * @param {THREE.Vector3} position - Center position
   * @param {THREE.Vector3} size - Width, height, depth
   * @param {string} id - Unique identifier
   */
  addHallway(position, size, id) {
    this.hallways.push({
      id,
      position: position.clone(),
      size: size.clone(),
      min: new THREE.Vector3(
        position.x - size.x / 2,
        position.y - size.y / 2,
        position.z - size.z / 2
      ),
      max: new THREE.Vector3(
        position.x + size.x / 2,
        position.y + size.y / 2,
        position.z + size.z / 2
      )
    });
  }

  /**
   * Add hallway wall collision box (thick walls around hallways)
   * @param {THREE.Vector3} position - Center position
   * @param {THREE.Vector3} size - Width, height, depth
   * @param {string} id - Unique identifier
   */
  addHallwayWall(position, size, id) {
    this.hallwayWalls.push({
      id,
      position: position.clone(),
      size: size.clone(),
      min: new THREE.Vector3(
        position.x - size.x / 2,
        position.y - size.y / 2,
        position.z - size.z / 2
      ),
      max: new THREE.Vector3(
        position.x + size.x / 2,
        position.y + size.y / 2,
        position.z + size.z / 2
      )
    });
  }

  /**
   * Add object collision box (chair, pedestal, etc.)
   * @param {THREE.Vector3} position - Center position
   * @param {THREE.Vector3} size - Width, height, depth
   * @param {string} id - Unique identifier
   * @param {string} type - Object type (chair, pedestal, etc.)
   */
  addObject(position, size, id, type = 'object') {
    this.objects.push({
      id,
      type,
      position: position.clone(),
      size: size.clone(),
      min: new THREE.Vector3(
        position.x - size.x / 2,
        position.y - size.y / 2,
        position.z - size.z / 2
      ),
      max: new THREE.Vector3(
        position.x + size.x / 2,
        position.y + size.y / 2,
        position.z + size.z / 2
      )
    });
  }

  /**
   * Check collision and prevent wall walking
   * @param {THREE.Vector3} playerPosition - Current player position
   * @param {number} playerRadius - Player collision radius
   * @returns {boolean} - True if collision occurred
   */
  checkCollision(playerPosition, playerRadius = 0.5) {
    const playerMin = new THREE.Vector3(
      playerPosition.x - playerRadius,
      playerPosition.y - playerRadius,
      playerPosition.z - playerRadius
    );
    const playerMax = new THREE.Vector3(
      playerPosition.x + playerRadius,
      playerPosition.y + playerRadius,
      playerPosition.z + playerRadius
    );

    // Check hallway zones first (these override wall collision)
    for (const hallway of this.hallways) {
      if (this.isAABBOverlap(playerMin, playerMax, hallway.min, hallway.max)) {
        return false; // In hallway, no collision
      }
    }

    // Check object collision (chairs, pedestals, etc.)
    for (const obj of this.objects) {
      if (this.isAABBOverlap(playerMin, playerMax, obj.min, obj.max)) {
        return true; // Collision with object
      }
    }

    // Check hallway wall collision (thick walls around hallways)
    for (const hallwayWall of this.hallwayWalls) {
      if (this.isAABBOverlap(playerMin, playerMax, hallwayWall.min, hallwayWall.max)) {
        return true; // Collision with hallway wall
      }
    }

    // Check wall collision
    for (const wall of this.walls) {
      if (this.isAABBOverlap(playerMin, playerMax, wall.min, wall.max)) {
        return true; // Collision with wall
      }
    }

    return false; // No collision
  }

  /**
   * AABB (Axis-Aligned Bounding Box) collision detection
   */
  isAABBOverlap(min1, max1, min2, max2) {
    return (
      min1.x <= max2.x && max1.x >= min2.x &&
      min1.y <= max2.y && max1.y >= min2.y &&
      min1.z <= max2.z && max1.z >= min2.z
    );
  }

  /**
   * Clear all walls, hallways, hallway walls, and objects
   */
  clear() {
    this.walls = [];
    this.hallways = [];
    this.hallwayWalls = [];
    this.objects = [];
    this.clearDebug();
  }

  /**
   * Enable debug visualization
   */
  enableDebug(scene) {
    this.debugMode = true;
    this.clearDebug();

    // Create debug meshes for walls (red)
    for (const wall of this.walls) {
      const geometry = new THREE.BoxGeometry(wall.size.x, wall.size.y, wall.size.z);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        transparent: true, 
        opacity: 0.3,
        wireframe: true 
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(wall.position);
      mesh.userData = { type: 'wall', id: wall.id };
      scene.add(mesh);
      this.debugMeshes.push(mesh);
    }

    // Create debug meshes for hallways (green)
    for (const hallway of this.hallways) {
      const geometry = new THREE.BoxGeometry(hallway.size.x, hallway.size.y, hallway.size.z);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        transparent: true, 
        opacity: 0.3,
        wireframe: true 
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(hallway.position);
      mesh.userData = { type: 'hallway', id: hallway.id };
      scene.add(mesh);
      this.debugMeshes.push(mesh);
    }

    // Create debug meshes for hallway walls (yellow)
    for (const hallwayWall of this.hallwayWalls) {
      const geometry = new THREE.BoxGeometry(hallwayWall.size.x, hallwayWall.size.y, hallwayWall.size.z);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xffff00, 
        transparent: true, 
        opacity: 0.3,
        wireframe: true 
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(hallwayWall.position);
      mesh.userData = { type: 'hallwayWall', id: hallwayWall.id };
      scene.add(mesh);
      this.debugMeshes.push(mesh);
    }

    // Create debug meshes for objects (blue)
    for (const obj of this.objects) {
      const geometry = new THREE.BoxGeometry(obj.size.x, obj.size.y, obj.size.z);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x0000ff, 
        transparent: true, 
        opacity: 0.3,
        wireframe: true 
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(obj.position);
      mesh.userData = { type: 'object', id: obj.id, objectType: obj.type };
      scene.add(mesh);
      this.debugMeshes.push(mesh);
    }
  }

  /**
   * Clear debug visualization
   */
  clearDebug() {
    for (const mesh of this.debugMeshes) {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    }
    this.debugMeshes = [];
    this.debugMode = false;
  }
}
