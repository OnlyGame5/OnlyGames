import * as THREE from 'three';
import { GAME_CONSTANTS } from '../utils/Constants.js';

export class CameraController {
  constructor(camera, player) {
    this.camera = camera;
    this.player = player;
    this.isFirstPerson = true;
    this.mouseX = 0;
    this.mouseY = 0;
    this.isMouseLocked = false;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse movement (first-person look)
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Click to lock pointer in first-person
    window.addEventListener('click', this.handleClick.bind(this));
    
    // Pointer lock change
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
  }

  handleMouseMove(e) {
    if (this.isMouseLocked && this.isFirstPerson) {
      const sensitivity = this.player.inputSystem?.getSettings().sensitivity || 1.0;
      this.mouseX -= e.movementX * 0.002 * sensitivity;
      this.mouseY -= e.movementY * 0.002 * sensitivity;
      this.mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouseY));
    }
  }

  handleClick() {
    if (this.isFirstPerson && !this.isMouseLocked) {
      document.body.requestPointerLock();
    }
  }

  handlePointerLockChange() {
    this.isMouseLocked = document.pointerLockElement === document.body;
    if (this.isMouseLocked && this.isFirstPerson) {
      this.showCrosshair();
    } else {
      this.hideCrosshair();
    }
  }

  setViewMode(isFirstPerson) {
    this.isFirstPerson = isFirstPerson;
    
    // Exit pointer lock when switching to third-person
    if (!isFirstPerson && this.isMouseLocked) {
      document.exitPointerLock();
    }
    
    // Update crosshair visibility
    if (isFirstPerson && this.isMouseLocked) {
      this.showCrosshair();
    } else {
      this.hideCrosshair();
    }
  }

  update(deltaTime) {
    if (this.isFirstPerson) {
      this.updateFirstPerson();
    } else {
      this.updateThirdPerson();
    }
  }

  updateFirstPerson() {
    const playerPosition = this.player.position;
    
    // Position camera at eye level
    this.camera.position.set(
      playerPosition.x,
      playerPosition.y + 1.7, // Eye level
      playerPosition.z
    );
    
    // Set rotation based on mouse input
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.mouseX;
    this.camera.rotation.x = this.mouseY;
    
    // Move camera forward slightly to get past the player model
    const forward = new THREE.Vector3(0, 0, -0.5);
    forward.applyQuaternion(this.camera.quaternion);
    this.camera.position.add(forward);
    
    // Hide player model in first-person
    if (this.player.playerModel) {
      this.player.playerModel.setVisible(false);
    }
  }

  updateThirdPerson() {
    const playerPosition = this.player.position;
    
    // Position camera behind and above player
    this.camera.position.set(
      playerPosition.x,
      playerPosition.y + 3,
      playerPosition.z + 8
    );
    
    // Look at player
    this.camera.lookAt(
      playerPosition.x,
      playerPosition.y + 1,
      playerPosition.z
    );
    
    // Show player model in third-person
    if (this.player.playerModel) {
      this.player.playerModel.setVisible(true);
    }
  }

  showCrosshair() {
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
      const settings = this.player.inputSystem?.getSettings();
      crosshair.style.display = settings?.crosshair ? 'block' : 'none';
    }
  }

  hideCrosshair() {
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
      crosshair.style.display = 'none';
    }
  }

  getViewMode() {
    return this.isFirstPerson ? 'firstPerson' : 'thirdPerson';
  }

  isInFirstPerson() {
    return this.isFirstPerson;
  }

  destroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('click', this.handleClick);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
  }
}
