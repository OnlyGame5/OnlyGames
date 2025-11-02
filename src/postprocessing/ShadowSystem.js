// src/postprocessing/ShadowSystem.js
import * as THREE from 'three';

/**
 * Enhanced Shadow System for creating stylized shadows that work well with toon shading
 */
export class ShadowSystem {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.shadowLights = [];
    this.shadowMapSize = 2048; // Higher resolution for better quality
    this.shadowCascades = 3; // Number of shadow cascades for better coverage
    
    // Enable shadows on renderer
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
    this.renderer.shadowMap.autoUpdate = true;
    
    console.log('Shadow System initialized');
  }

  /**
   * Create a stylized directional light with shadows optimized for toon shading
   */
  createDirectionalShadowLight(options = {}) {
    const {
      color = 0xffffff,
      intensity = 1.0,
      position = new THREE.Vector3(10, 20, 10),
      target = new THREE.Vector3(0, 0, 0),
      shadowMapSize = this.shadowMapSize,
      shadowCameraNear = 0.5,
      shadowCameraFar = 100,
      shadowCameraSize = 20,
      shadowBias = -0.0005,
      shadowRadius = 4 // For soft shadows
    } = options;

    const light = new THREE.DirectionalLight(color, intensity);
    light.position.copy(position);
    light.target.position.copy(target);
    
    // Enable shadows
    light.castShadow = true;
    
    // Configure shadow camera
    light.shadow.mapSize.width = shadowMapSize;
    light.shadow.mapSize.height = shadowMapSize;
    
    light.shadow.camera.near = shadowCameraNear;
    light.shadow.camera.far = shadowCameraFar;
    light.shadow.camera.left = -shadowCameraSize;
    light.shadow.camera.right = shadowCameraSize;
    light.shadow.camera.top = shadowCameraSize;
    light.shadow.camera.bottom = -shadowCameraSize;
    
    light.shadow.bias = shadowBias;
    light.shadow.radius = shadowRadius;
    
    // Add to scene
    this.scene.add(light);
    this.scene.add(light.target);
    this.shadowLights.push(light);
    
    console.log('Directional shadow light created at:', position);
    return light;
  }

  /**
   * Create a spotlight with shadows for accent lighting
   */
  createSpotShadowLight(options = {}) {
    const {
      color = 0xffffff,
      intensity = 1.0,
      position = new THREE.Vector3(0, 10, 0),
      target = new THREE.Vector3(0, 0, 0),
      distance = 50,
      angle = Math.PI / 6,
      penumbra = 0.3,
      decay = 2,
      shadowMapSize = this.shadowMapSize / 2, // Smaller for performance
      shadowCameraNear = 0.5,
      shadowCameraFar = 50,
      shadowBias = -0.0005
    } = options;

    const light = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
    light.position.copy(position);
    light.target.position.copy(target);
    
    // Enable shadows
    light.castShadow = true;
    
    // Configure shadow camera
    light.shadow.mapSize.width = shadowMapSize;
    light.shadow.mapSize.height = shadowMapSize;
    
    light.shadow.camera.near = shadowCameraNear;
    light.shadow.camera.far = shadowCameraFar;
    light.shadow.bias = shadowBias;
    light.shadow.radius = 4;
    
    // Add to scene
    this.scene.add(light);
    this.scene.add(light.target);
    this.shadowLights.push(light);
    
    console.log('Spot shadow light created at:', position);
    return light;
  }

  /**
   * Create a point light with shadows
   */
  createPointShadowLight(options = {}) {
    const {
      color = 0xffffff,
      intensity = 1.0,
      position = new THREE.Vector3(0, 10, 0),
      distance = 30,
      decay = 2,
      shadowMapSize = this.shadowMapSize / 4, // Smaller for performance (cube map)
      shadowCameraNear = 0.5,
      shadowCameraFar = 30,
      shadowBias = -0.0005
    } = options;

    const light = new THREE.PointLight(color, intensity, distance, decay);
    light.position.copy(position);
    
    // Enable shadows
    light.castShadow = true;
    
    // Configure shadow camera
    light.shadow.mapSize.width = shadowMapSize;
    light.shadow.mapSize.height = shadowMapSize;
    
    light.shadow.camera.near = shadowCameraNear;
    light.shadow.camera.far = shadowCameraFar;
    light.shadow.bias = shadowBias;
    light.shadow.radius = 2;
    
    // Add to scene
    this.scene.add(light);
    this.shadowLights.push(light);
    
    console.log('Point shadow light created at:', position);
    return light;
  }

  /**
   * Setup shadows for all meshes in the scene
   */
  setupShadowsForScene(options = {}) {
    const {
      castShadows = true,
      receiveShadows = true,
      excludeNames = ['sky', 'ground', 'water', 'particle'] // Objects to exclude
    } = options;

    this.scene.traverse((object) => {
      if (object.isMesh) {
        // Check if object should be excluded
        const shouldExclude = excludeNames.some(name => 
          object.name.toLowerCase().includes(name) ||
          (object.material && object.material.name && object.material.name.toLowerCase().includes(name))
        );

        if (!shouldExclude) {
          if (castShadows) {
            object.castShadow = true;
          }
          if (receiveShadows) {
            object.receiveShadow = true;
          }
        }
      }
    });

    console.log('Shadows configured for scene objects');
  }

  /**
   * Create a simple toon-style shadow plane (fake shadow for performance)
   */
  createFakeShadow(object, options = {}) {
    const {
      color = 0x000000,
      opacity = 0.3,
      size = 2,
      height = 0.01,
      blurAmount = 0.5
    } = options;

    const shadowGeometry = new THREE.PlaneGeometry(size, size);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false
    });

    const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = height;
    shadowMesh.renderOrder = -1; // Render first

    // Position under the object
    if (object.position) {
      shadowMesh.position.x = object.position.x;
      shadowMesh.position.z = object.position.z;
    }

    this.scene.add(shadowMesh);
    
    // Store reference for cleanup
    object.userData.fakeShadow = shadowMesh;
    
    return shadowMesh;
  }

  /**
   * Update fake shadows to follow their objects
   */
  updateFakeShadows() {
    this.scene.traverse((object) => {
      if (object.userData.fakeShadow && object.position) {
        const shadow = object.userData.fakeShadow;
        shadow.position.x = object.position.x;
        shadow.position.z = object.position.z;
      }
    });
  }

  /**
   * Toggle shadows on/off for performance
   */
  toggleShadows(enabled) {
    this.renderer.shadowMap.enabled = enabled;
    
    this.shadowLights.forEach(light => {
      light.castShadow = enabled;
    });

    console.log('Shadows', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Adjust shadow quality for performance
   */
  setShadowQuality(quality) {
    let mapSize;
    
    switch (quality) {
      case 'low':
        mapSize = 512;
        break;
      case 'medium':
        mapSize = 1024;
        break;
      case 'high':
        mapSize = 2048;
        break;
      case 'ultra':
        mapSize = 4096;
        break;
      default:
        mapSize = 1024;
    }

    this.shadowMapSize = mapSize;
    
    // Update existing lights
    this.shadowLights.forEach(light => {
      light.shadow.mapSize.width = mapSize;
      light.shadow.mapSize.height = mapSize;
      light.shadow.map = null; // Force regeneration
    });

    console.log('Shadow quality set to:', quality, 'Map size:', mapSize);
  }

  /**
   * Clean up shadow system
   */
  dispose() {
    this.shadowLights.forEach(light => {
      if (light.shadow && light.shadow.map) {
        light.shadow.map.dispose();
      }
      this.scene.remove(light);
      if (light.target) {
        this.scene.remove(light.target);
      }
    });
    
    this.shadowLights = [];
    console.log('Shadow system disposed');
  }
}