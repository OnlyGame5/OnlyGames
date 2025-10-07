import * as THREE from 'three';
import { gameStore } from '../../state/gameStore.js';
import { disposeRoom } from '../../utils/DisposeHelper.js';

export class LevelManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.rooms = new Map(); // Will store our room objects
    this.hub = null;
    this.currentRoom = null; // Track current room for disposal
  }

  registerRoom(roomId, roomObject) {
    this.rooms.set(roomId, roomObject);
    this.scene.add(roomObject.group); // Add room's 3D group to the scene
  }

  setHub(hubObject) {
    this.hub = hubObject;
    this.scene.add(hubObject.group);
  }

  // This will handle moving the player between areas
  transitionTo(targetId, entryPointId) {
    console.log(`Transitioning player to ${targetId} at entry point ${entryPointId}`);

    let targetContainer = (targetId === 'hub') ? this.hub : this.rooms.get(targetId);
    if (!targetContainer) {
      console.error(`Attempted to transition to an unknown target: ${targetId}`);
      return;
    }

    // Find the entry anchor in the target room/hub
    const entryAnchor = targetContainer.anchors[entryPointId];
    if (!entryAnchor) {
      console.error(`Entry point ${entryPointId} not found in ${targetId}`);
      return;
    }
    
    // Get the world position of the anchor and move the player
    const targetPosition = new THREE.Vector3();
    entryAnchor.getWorldPosition(targetPosition);
    this.player.position.copy(targetPosition);

    // Update current room tracking
    this.currentRoom = targetId;
    
    // Update the global state
    gameStore.setCurrentRoom(targetId);
  }

  /**
   * Unload and dispose of a specific room
   * @param {string} roomId - The ID of the room to unload
   */
  unloadRoom(roomId) {
    if (roomId === this.currentRoom) {
      console.warn(`Cannot unload current room: ${roomId}`);
      return false;
    }

    const room = this.rooms.get(roomId);
    if (room) {
      console.log(`Unloading room: ${roomId}`);
      
      // Call room's dispose method if it exists
      if (typeof room.dispose === 'function') {
        room.dispose();
      } else {
        // Fallback: use helper function
        disposeRoom(room);
      }
      
      // Remove from scene
      if (room.group && room.group.parent) {
        this.scene.remove(room.group);
      }
      
      // Remove from registry
      this.rooms.delete(roomId);
      
      return true;
    }
    
    return false;
  }

  /**
   * Dispose of all rooms (for complete cleanup, e.g., level restart)
   */
  disposeAllRooms() {
    console.log('Disposing all rooms...');
    
    // Dispose hub
    if (this.hub) {
      if (typeof this.hub.dispose === 'function') {
        this.hub.dispose();
      } else {
        disposeRoom(this.hub);
      }
      
      if (this.hub.group && this.hub.group.parent) {
        this.scene.remove(this.hub.group);
      }
      
      this.hub = null;
    }
    
    // Dispose all registered rooms
    this.rooms.forEach((room, roomId) => {
      console.log(`Disposing room: ${roomId}`);
      
      if (typeof room.dispose === 'function') {
        room.dispose();
      } else {
        disposeRoom(room);
      }
      
      if (room.group && room.group.parent) {
        this.scene.remove(room.group);
      }
    });
    
    this.rooms.clear();
    this.currentRoom = null;
    
    console.log('All rooms disposed');
  }

  /**
   * Dispose and clean up the LevelManager itself
   */
  dispose() {
    this.disposeAllRooms();
    this.scene = null;
    this.player = null;
  }

  // We will add more logic here later
  update(deltaTime) {
    // This is where we will check for collision triggers to initiate transitions
  }
}
