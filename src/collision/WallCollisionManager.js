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
    this.scene = null;
  }

  /**
   * Set the scene reference for door finding
   * @param {THREE.Scene} scene - The Three.js scene
   */
  setScene(scene) {
    this.scene = scene;
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
   * @param {boolean} dynamic - Whether this object can change state
   */
  addObject(position, size, id, type = 'object', dynamic = false) {
    this.objects.push({
      id,
      type,
      dynamic,
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
      // Special handling for dynamic doors
      if (obj.type === 'door' && obj.dynamic) {
        if (this.checkDoorCollision(obj, playerMin, playerMax)) {
          return true; // Collision with closed/locked door
        }
      } else if (this.isAABBOverlap(playerMin, playerMax, obj.min, obj.max)) {
        return true; // Collision with static object
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
   * Check door collision based on door state and movement direction
   * @param {Object} doorObj - Door collision object
   * @param {THREE.Vector3} playerMin - Player bounding box min
   * @param {THREE.Vector3} playerMax - Player bounding box max
   * @returns {boolean} - True if collision with door
   */
  checkDoorCollision(doorObj, playerMin, playerMax) {
    // Find the actual door object in the scene
    const doorObject = this.findDoorById(doorObj.id);
    if (!doorObject) {
      // If door not found, treat as solid collision
      return this.isAABBOverlap(playerMin, playerMax, doorObj.min, doorObj.max);
    }

    // Check if door is locked OR not fully open
    const isLocked = doorObject.userData.locked;
    const openAmount = doorObject.userData.state.openAmount;
    const isOpen = openAmount > 0.9;
    
    // If door is unlocked and fully open, no collision
    if (!isLocked && isOpen) {
      return false;
    }
    
    // If door is locked or not fully open, check collision
    return this.isAABBOverlap(playerMin, playerMax, doorObj.min, doorObj.max);
  }

  /**
   * Find door object by ID in the scene
   * @param {string} id - Door ID
   * @returns {THREE.Object3D|null} - Door object or null
   */
  findDoorById(id) {
    if (!this.scene) {
      return null;
    }
    
    let foundDoor = null;
    
    // Use traverse to search the entire scene graph
    this.scene.traverse((object) => {
      if (object.userData && object.userData.id === id && object.userData.category === 'door') {
        foundDoor = object;
        return; // Stop searching once found
      }
    });
    
    return foundDoor;
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

    // Create debug meshes for objects (blue) and doors (purple)
    for (const obj of this.objects) {
      const geometry = new THREE.BoxGeometry(obj.size.x, obj.size.y, obj.size.z);
      
      // Different colors for doors vs other objects
      const color = obj.type === 'door' ? 0x800080 : 0x0000ff; // Purple for doors, blue for objects
      const material = new THREE.MeshBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: 0.3,
        wireframe: true 
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(obj.position);
      mesh.userData = { type: 'object', id: obj.id, objectType: obj.type, dynamic: obj.dynamic };
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
