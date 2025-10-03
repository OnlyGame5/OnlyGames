import * as THREE from 'three';
import { EventEmitter } from '../utils/EventEmitter.js';

export class LightFixture extends EventEmitter {
  constructor(options = {}) {
    super();
    this.group = new THREE.Group();
    this.isOn = true;
    this.flickerEnabled = options.flickerEnabled || false;
    this.flickerIntensity = options.flickerIntensity || 0.1;
    
    this.createLightFixture(options);
    this.setupLighting(options);
  }

  createLightFixture(options) {
    // Main light housing
    const lightHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 0.3, 16),
      new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.9,
        roughness: 0.1
      })
    );
    lightHousing.castShadow = false;
    lightHousing.receiveShadow = true;
    this.group.add(lightHousing);

    // Light diffuser
    const lightDiffuser = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.1, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        emissive: 0xffffff,
        emissiveIntensity: 0.1
      })
    );
    lightDiffuser.position.set(0, -0.1, 0);
    lightDiffuser.castShadow = false;
    this.group.add(lightDiffuser);

    // Light bulb
    this.lightBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 8),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9
      })
    );
    this.lightBulb.position.set(0, -0.15, 0);
    this.lightBulb.castShadow = false;
    this.group.add(this.lightBulb);

    // Mounting bracket
    const mountingBracket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8),
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.8,
        roughness: 0.3
      })
    );
    mountingBracket.position.set(0, 0.2, 0);
    mountingBracket.castShadow = false;
    this.group.add(mountingBracket);
  }

  setupLighting(options) {
    // Create point light
    this.pointLight = new THREE.PointLight(0xffffff, options.intensity || 1.5, options.distance || 25);
    this.pointLight.position.set(0, 0, 0);
    this.pointLight.castShadow = true;
    this.pointLight.shadow.mapSize.width = options.shadowMapSize || 1024;
    this.pointLight.shadow.mapSize.height = options.shadowMapSize || 1024;
    this.pointLight.shadow.camera.near = 0.1;
    this.pointLight.shadow.camera.far = options.distance || 25;
    this.group.add(this.pointLight);

    // Initialize flicker state
    this.flickerTime = 0;
  }

  toggle() {
    this.isOn = !this.isOn;
    this.updateLighting();
    this.emit('toggled', this.isOn);
  }

  setState(isOn) {
    this.isOn = isOn;
    this.updateLighting();
  }

  updateLighting() {
    // Update point light
    this.pointLight.visible = this.isOn;
    
    // Update bulb emissive
    if (this.lightBulb) {
      this.lightBulb.material.emissiveIntensity = this.isOn ? 0.8 : 0.0;
    }
  }

  update(deltaTime) {
    if (!this.isOn || !this.flickerEnabled) return;

    this.flickerTime += deltaTime;
    
    // Hum effect (subtle intensity variation)
    const humVariation = Math.sin(this.flickerTime * 120) * 0.05;
    
    // Occasional flicker
    let flickerIntensity = 1.0;
    if (Math.random() < 0.02) {
      flickerIntensity = Math.random() * 0.3 + 0.1;
    }
    
    // Apply to point light
    this.pointLight.intensity = 1.0 + humVariation + (flickerIntensity - 1.0);
    
    // Apply to bulb
    if (this.lightBulb) {
      const newIntensity = 0.8 + humVariation * 0.5 + (flickerIntensity - 1.0) * 0.5;
      this.lightBulb.material.emissiveIntensity = Math.max(0.1, newIntensity);
    }
  }
}
