import * as THREE from 'three';
import { EventEmitter } from '../utils/EventEmitter.js';

export class Switch extends EventEmitter {
  constructor(options = {}) {
    super();
    this.group = new THREE.Group();
    this.isOn = options.initialState || false;
    this.interactionDistance = options.interactionDistance || 4.0;
    this.toggleCallback = options.toggleCallback;
    
    this.createSwitch(options);
    this.setupVisualFeedback();
  }

  createSwitch(options) {
    // Main switch housing
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.15),
      new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.9,
        roughness: 0.1
      })
    );
    housing.castShadow = true;
    housing.receiveShadow = true;
    this.group.add(housing);

    // Switch button
    this.switchButton = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16),
      new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.8,
        roughness: 0.2,
        emissive: this.isOn ? 0x00ff00 : 0x000000,
        emissiveIntensity: this.isOn ? 0.5 : 0.0
      })
    );
    this.switchButton.position.set(0, 0, 0.08);
    this.switchButton.rotation.x = Math.PI / 2;
    this.group.add(this.switchButton);

    // Status indicators
    this.createStatusLights();
  }

  createStatusLights() {
    const light1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: this.isOn ? 0.8 : 0.0
      })
    );
    light1.position.set(-0.2, 0.3, 0.08);
    this.group.add(light1);

    const light2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: this.isOn ? 0.0 : 0.8
      })
    );
    light2.position.set(0.2, 0.3, 0.08);
    this.group.add(light2);
  }

  setupVisualFeedback() {
    // Floor indicator
    const indicator = new THREE.Mesh(
      new THREE.CircleGeometry(2.0, 16),
      new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.7
      })
    );
    indicator.position.set(0, 0.01, 0);
    indicator.rotation.x = -Math.PI / 2;
    this.group.add(indicator);
  }

  toggle() {
    this.isOn = !this.isOn;
    this.updateVisualFeedback();
    this.emit('toggled', this.isOn);
    
    if (this.toggleCallback) {
      this.toggleCallback(this.isOn);
    }
  }

  updateVisualFeedback() {
    // Update button emissive
    this.switchButton.material.emissive.setHex(this.isOn ? 0x00ff00 : 0x000000);
    this.switchButton.material.emissiveIntensity = this.isOn ? 0.5 : 0.0;

    // Update status lights
    this.group.children.forEach(child => {
      if (child.material && child.material.emissive) {
        if (child.material.emissive.getHex() === 0x00ff00) {
          child.material.emissiveIntensity = this.isOn ? 0.8 : 0.0;
        } else if (child.material.emissive.getHex() === 0xff0000) {
          child.material.emissiveIntensity = this.isOn ? 0.0 : 0.8;
        }
      }
    });
  }

  canInteract(playerPosition) {
    const distance = playerPosition.distanceTo(this.group.position);
    return distance <= this.interactionDistance;
  }
}
