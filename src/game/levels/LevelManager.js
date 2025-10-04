import * as THREE from 'three';
import { gameStore } from '../../state/gameStore.js';

export class LevelManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.rooms = new Map(); // Will store our room objects
    this.hub = null;
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

    // Update the global state
    gameStore.setCurrentRoom(targetId);
  }

  // We will add more logic here later
  update(deltaTime) {
    // This is where we will check for collision triggers to initiate transitions
  }
}
