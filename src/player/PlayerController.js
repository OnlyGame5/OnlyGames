import * as THREE from 'three';
import { InputSystem } from '../systems/InputSystem.js';
import { PlayerModel } from './PlayerModel.js';
import { Inventory } from './Inventory.js';
import { CameraController } from './CameraController.js';
import { GAME_CONSTANTS } from '../utils/Constants.js';

export class PlayerController {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.speed = GAME_CONSTANTS.PLAYER_SPEED;
    this.isFirstPerson = true;
    
    // Initialize subsystems
    this.inputSystem = new InputSystem();
    this.playerModel = new PlayerModel(scene);
    this.inventory = new Inventory();
    this.cameraController = new CameraController(camera, this);
    
    this.setupInput();
    this.setupFallbackPlayer();
  }

  setupInput() {
    this.inputSystem.on('viewToggle', () => this.toggleViewMode());
    this.inputSystem.on('interact', () => this.handleInteraction());
    
    // Inventory slot selection
    window.addEventListener('keydown', (e) => {
      if (e.code >= 'Digit1' && e.code <= 'Digit5') {
        const slotIndex = parseInt(e.code.slice(-1)) - 1;
        this.inventory.selectSlot(slotIndex);
      }
    });
  }

  setupFallbackPlayer() {
    // Create fallback player box
    this.fallbackPlayer = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.8, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
    );
    this.fallbackPlayer.position.set(0, 0.9, 0);
    this.fallbackPlayer.castShadow = true;
    this.fallbackPlayer.visible = true;
    this.fallbackPlayer.name = 'player-box';
    this.scene.add(this.fallbackPlayer);
  }

  async initialize() {
    // Load player model
    await this.playerModel.loadModel();
    
    // Initialize camera controller
    this.cameraController.setViewMode(this.isFirstPerson);
  }

  update(deltaTime) {
    if (window.disablePlayerControls) {
      // Still update animations for idle/walk blending
      if (this.playerModel) {
        this.playerModel.update(deltaTime, false);
        this.fallbackPlayer.position.copy(this.playerModel.getModel()?.position || this.position);
        this.fallbackPlayer.visible = false;
      }
      return;
    }

    this.handleMovement(deltaTime);
    this.playerModel.update(deltaTime, this.isMoving());
    this.cameraController.update(deltaTime);
    
    // Keep fallback player in sync
    if (this.playerModel.getModel()) {
      this.fallbackPlayer.position.copy(this.playerModel.getModel().position);
      this.fallbackPlayer.visible = false;
    } else {
      this.fallbackPlayer.position.copy(this.position);
      this.fallbackPlayer.visible = true;
    }
  }

  handleMovement(deltaTime) {
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    if (this.isFirstPerson) {
      this.camera.getWorldDirection(direction);
      direction.y = 0;
      direction.normalize();
      right.crossVectors(direction, new THREE.Vector3(0, 1, 0));
    } else {
      direction.set(0, 0, -1);
      right.set(1, 0, 0);
    }

    if (this.inputSystem.isDown('moveForward')) {
      this.position.add(direction.clone().multiplyScalar(this.speed));
    }
    if (this.inputSystem.isDown('moveBack')) {
      this.position.add(direction.clone().multiplyScalar(-this.speed));
    }
    if (this.inputSystem.isDown('moveLeft')) {
      this.position.add(right.clone().multiplyScalar(-this.speed));
    }
    if (this.inputSystem.isDown('moveRight')) {
      this.position.add(right.clone().multiplyScalar(this.speed));
    }

    // Update player model position
    this.playerModel.setPosition(this.position);
    
    // Face movement direction in third-person
    if (!this.isFirstPerson && this.isMoving()) {
      this.updateMovementRotation();
    }
  }

  updateMovementRotation() {
    const movementDirection = new THREE.Vector3(
      (this.inputSystem.isDown('moveRight') ? 1 : 0) - (this.inputSystem.isDown('moveLeft') ? 1 : 0),
      0,
      (this.inputSystem.isDown('moveBack') ? 1 : 0) - (this.inputSystem.isDown('moveForward') ? 1 : 0)
    );
    
    if (movementDirection.lengthSq() > 0) {
      movementDirection.normalize();
      const angle = Math.atan2(movementDirection.x, movementDirection.z);
      this.playerModel.setRotation(new THREE.Euler(0, angle, 0));
    }
  }

  isMoving() {
    return this.inputSystem.isDown('moveForward') ||
           this.inputSystem.isDown('moveBack') ||
           this.inputSystem.isDown('moveLeft') ||
           this.inputSystem.isDown('moveRight');
  }

  toggleViewMode() {
    this.isFirstPerson = !this.isFirstPerson;
    this.cameraController.setViewMode(this.isFirstPerson);
    console.log(`Switched to ${this.isFirstPerson ? 'First-Person' : 'Third-Person'} view`);
    return this.isFirstPerson;
  }

  handleInteraction() {
    // Raycast for nearby interactables
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    const interactables = this.scene.getObjectByName('interactables');
    if (interactables) {
      const intersects = raycaster.intersectObjects(interactables.children, true);
      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData.interactable) {
          object.userData.interactable.interact(this);
        }
      }
    }
  }

  // Inventory methods
  addToInventory(item) {
    return this.inventory.addItem(item);
  }

  hasInInventory(itemName) {
    return this.inventory.hasItem(itemName);
  }

  removeFromInventory(itemName) {
    return this.inventory.removeItem(itemName);
  }

  getPlayerInventory() {
    return this.inventory;
  }

  // Getters
  getPosition() {
    return this.position;
  }

  getModel() {
    return this.playerModel.getModel();
  }

  getInputSystem() {
    return this.inputSystem;
  }

  getCameraController() {
    return this.cameraController;
  }

  destroy() {
    this.inputSystem.destroy();
    this.playerModel.destroy();
    this.cameraController.destroy();
    
    if (this.fallbackPlayer && this.scene) {
      this.scene.remove(this.fallbackPlayer);
    }
  }
}
