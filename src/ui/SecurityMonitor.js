import * as THREE from 'three';

export class SecurityMonitor {
  constructor(scene, renderer, gameState) {
    this.scene = scene;
    this.renderer = renderer;
    this.gameState = gameState;
    
    // Monitor settings
    this.isActive = false;
    this.currentRoom = 1; // Start with Room 1
    this.frameCount = 0;
    this.updateInterval = 2; // Update every 2nd frame (30fps)
    
    // Render target for monitor screen
    this.renderTarget = new THREE.WebGLRenderTarget(512, 384);
    this.renderTarget.samples = 0; // Disable MSAA for performance
    
    // Security cameras for each room
    this.securityCameras = {};
    this.monitorScreen = null;
    this.screenMaterial = null;
    
    // Static effect properties
    this.staticFrameCount = 0;
    this.staticTexture = null;
    
    // Create separate scene for security cameras
    this.securityScene = new THREE.Scene();
    
    this.init();
  }
  
  init() {
    this.setupSecurityCameras();
    this.createMonitorScreen();
    this.createStaticTexture();
  }
  
  setupSecurityCameras() {
    // Create fixed security cameras for each room - positioned INSIDE each room
    this.securityCameras = {
      1: { // East Sector - Room at (29, 0, 0)
        camera: new THREE.PerspectiveCamera(70, 512/384, 0.1, 1000),
        position: new THREE.Vector3(25, 3, 0), // Inside Room 1, lower and offset
        lookAt: new THREE.Vector3(35, 1, 0)    // Look toward the back of the room
      },
      2: { // South Sector - Room at (0, 0, 23.5)
        camera: new THREE.PerspectiveCamera(70, 512/384, 0.1, 1000),
        position: new THREE.Vector3(0, 3, 20), // Inside Room 2, lower and offset
        lookAt: new THREE.Vector3(0, 1, 27)    // Look toward the back of the room
      },
      3: { // West Sector - Room at (-30, 0, 0) (classified - will show static)
        camera: new THREE.PerspectiveCamera(70, 512/384, 0.1, 1000),
        position: new THREE.Vector3(-25, 3, 0), // Inside Room 3, lower and offset
        lookAt: new THREE.Vector3(-35, 1, 0)    // Look toward the back of the room
      },
      4: { // North Sector - Room at (0, 0, -26.5)
        camera: new THREE.PerspectiveCamera(70, 512/384, 0.1, 1000),
        position: new THREE.Vector3(0, 3, -23), // Inside Room 4, lower and offset
        lookAt: new THREE.Vector3(0, 1, -30)    // Look toward the back of the room
      }
    };
    
    // Position cameras
    Object.values(this.securityCameras).forEach(camData => {
      camData.camera.position.copy(camData.position);
      camData.camera.lookAt(camData.lookAt);
    });
    
    // Security cameras setup complete
  }
  
  createMonitorScreen() {
    // Create a canvas for the monitor screen
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 512;
    this.screenCanvas.height = 384;
    
    // Create a texture for the monitor screen
    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.needsUpdate = true;
    
    // Create screen material
    this.screenMaterial = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      transparent: false
    });
    
    // Find the monitor screen in the scene and apply the texture
    this.findAndUpdateMonitorScreen();
  }
  
  findAndUpdateMonitorScreen() {
    // Find the security monitor in the scene
    this.scene.traverse((child) => {
      if (child.name === 'security-monitor') {
        child.traverse((screenChild) => {
          if (screenChild.name === 'monitor-screen') {
            screenChild.material = this.screenMaterial;
            this.monitorScreen = screenChild;
          }
        });
      }
    });
    
    // If not found, try again after a short delay
    if (!this.monitorScreen) {
      setTimeout(() => {
        this.scene.traverse((child) => {
          if (child.name === 'security-monitor') {
            child.traverse((screenChild) => {
              if (screenChild.name === 'monitor-screen') {
                screenChild.material = this.screenMaterial;
                this.monitorScreen = screenChild;
              }
            });
          }
        });
      }, 1000);
    }
  }
  
  createStaticTexture() {
    // Create static noise texture for classified room
    this.staticCanvas = document.createElement('canvas');
    this.staticCanvas.width = 512;
    this.staticCanvas.height = 384;
    
    this.staticTexture = new THREE.CanvasTexture(this.staticCanvas);
    this.updateStaticTexture(); // Generate initial static
  }
  
  show() {
    this.isActive = true;
    this.currentRoom = 1; // Always start with East Sector when turning on
    this.refreshMonitorScreen();
    this.updateMonitorDisplay();
  }
  
  hide() {
    this.isActive = false;
    this.currentRoom = 1; // Reset to East Sector for next time
    // Set screen to black when hidden
    if (this.screenMaterial) {
      this.screenMaterial.map = null;
      this.screenMaterial.color.setHex(0x000000);
    }
    
    // Clear the security scene to prevent state corruption
    this.securityScene.clear();
    
    // Reset frame counters
    this.frameCount = 0;
    this.staticFrameCount = 0;
  }
  
  cycleRoom() {
    // Cycle through: 1 → 2 → 3 → 4 → destroy and recreate
    if (this.currentRoom === 4) {
      // After North Sector, destroy and recreate the entire monitor
      this.destroyAndRecreate();
      return;
    } else {
      // Move to next room
      this.currentRoom = this.currentRoom + 1;
    }
    
    this.updateMonitorDisplay();
  }
  
  completeReset() {
    // Reset all state variables
    this.currentRoom = 1;
    this.frameCount = 0;
    this.staticFrameCount = 0;
    this.isActive = false;
    
    // Clear the security scene completely
    this.securityScene.clear();
    
    // Reinitialize cameras
    this.setupSecurityCameras();
    
    // Clear any existing texture references
    if (this.screenMaterial) {
      this.screenMaterial.map = null;
      this.screenMaterial.needsUpdate = true;
    }
  }
  
  destroyAndRecreate() {
    // Hide the monitor
    this.hide();
    
    // Dispose of all resources
    this.dispose();
    
    // Clear both global and local references
    window.securityMonitor = null;
    
    // Recreate the security monitor after a short delay
    setTimeout(() => {
      const newMonitor = new SecurityMonitor(this.scene, this.renderer, this.gameState);
      window.securityMonitor = newMonitor;
      
      // Update the local reference in main.js if it exists
      if (typeof window.updateSecurityMonitorReference === 'function') {
        window.updateSecurityMonitorReference(newMonitor);
      }
    }, 100);
  }
  
  updateMonitorDisplay() {
    if (!this.isActive) return;
    
    if (this.currentRoom === 3) {
      // Show static for West Sector (classified)
      this.screenMaterial.map = this.staticTexture;
      this.screenMaterial.color.setHex(0xffffff);
    } else {
      // Show live feed for other sectors
      this.screenMaterial.map = this.renderTarget.texture;
      this.screenMaterial.color.setHex(0xffffff);
    }
    
    this.screenMaterial.needsUpdate = true;
  }
  
  update(deltaTime) {
    if (!this.isActive) return;
    
    this.frameCount++;
    this.staticFrameCount++;
    
    // Update static noise for West Sector
    if (this.currentRoom === 3) {
      if (this.staticFrameCount % 3 === 0) { // Update every 3rd frame
        this.updateStaticTexture();
      }
      return; // Don't render live feed for West Sector
    }
    
    // Only update every 2nd frame for performance (other rooms)
    if (this.frameCount % this.updateInterval !== 0) return;
    
    this.renderCurrentRoom();
  }
  
  renderCurrentRoom() {
    // Don't render West Sector - it shows static
    if (this.currentRoom === 3) return;
    
    const camData = this.securityCameras[this.currentRoom];
    if (!camData) {
      return;
    }
    
    // Get the room group
    const roomGroup = this.getRoomGroup(this.currentRoom);
    if (!roomGroup) {
      return;
    }
    
    // Clear the security scene
    this.securityScene.clear();
    
    // Clone the target room and add it to the security scene at the origin
    const roomClone = roomGroup.clone();
    roomClone.position.set(0, 0, 0);
    roomClone.rotation.set(0, 0, 0);
    
    // Remove laptops from the cloned room to prevent them from appearing on security screens
    this.removeLaptopsFromClone(roomClone);
    
    this.securityScene.add(roomClone);
    
    // Add basic lighting to the security scene
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.securityScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 0);
    directionalLight.target.position.set(0, 0, 0);
    this.securityScene.add(directionalLight);
    this.securityScene.add(directionalLight.target);
    
    // Position the security camera RELATIVE to the room's local origin
    // Convert previously world-based camera anchors into local space by subtracting the room's world offset
    const roomOffset = roomGroup.position; // world offset of the room in main scene
    const cam = camData.camera;
    
    // Calculate local camera position and look-at point
    const localCamPos = new THREE.Vector3().copy(camData.position).sub(roomOffset);
    const localLookAt = new THREE.Vector3().copy(camData.lookAt).sub(roomOffset);
    
    cam.position.copy(localCamPos);
    cam.lookAt(localLookAt);
    cam.aspect = 512 / 384;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
    
    // Render the security scene with the security camera
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.securityScene, cam);
    this.renderer.setRenderTarget(null);
    
    // The render target texture is now ready to be used
    // No need to call updateScreenTexture() since we use the render target directly
  }
  
  getRoomGroup(roomId) {
    switch(roomId) {
      case 1: 
        return this.gameState.room1?.group;
      case 2: 
        return this.gameState.room2?.group;
      case 3: 
        return null; // West Sector shows static
      case 4: 
        return this.gameState.room4?.group;
      default: 
        return null;
    }
  }
  
  removeLaptopsFromClone(roomClone) {
    // Recursively traverse the cloned room and remove any laptops
    const objectsToRemove = [];
    
    roomClone.traverse((child) => {
      if (child.name === 'reusable-laptop') {
        objectsToRemove.push(child);
      }
    });
    
    // Remove the laptops from their parent groups
    objectsToRemove.forEach(laptop => {
      if (laptop.parent) {
        laptop.parent.remove(laptop);
      }
    });
  }
  
  
  updateScreenTexture() {
    // Use the render target texture directly - it should contain the rendered security camera view
    this.screenMaterial.map = this.renderTarget.texture;
    this.screenMaterial.needsUpdate = true;
  }
  
  updateStaticTexture() {
    const ctx = this.staticCanvas.getContext('2d');
    
    const imageData = ctx.createImageData(512, 384);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255;
      data[i] = noise;     // R
      data[i + 1] = noise; // G
      data[i + 2] = noise; // B
      data[i + 3] = 255;   // A
    }
    
    ctx.putImageData(imageData, 0, 0);
    this.staticTexture.needsUpdate = true;
  }
  
  refreshMonitorScreen() {
    // Force refresh of monitor screen material
    if (this.monitorScreen && this.screenMaterial) {
      this.monitorScreen.material = this.screenMaterial;
    }
  }
  
  // Method to completely reset the security monitor
  reset() {
    this.hide();
    
    // Clear all scenes
    this.securityScene.clear();
    
    // Reset all state
    this.currentRoom = 1;
    this.frameCount = 0;
    this.staticFrameCount = 0;
    this.isActive = false;
    
    // Reinitialize cameras
    this.setupSecurityCameras();
  }
  
  dispose() {
    // Dispose of render target
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
    
    // Dispose of textures
    if (this.screenTexture) {
      this.screenTexture.dispose();
    }
    if (this.staticTexture) {
      this.staticTexture.dispose();
    }
    
    // Clear all references
    this.renderTarget = null;
    this.screenTexture = null;
    this.staticTexture = null;
    this.screenMaterial = null;
    this.monitorScreen = null;
    this.securityCameras = {};
    this.isActive = false;
    this.currentRoom = 1;
    this.frameCount = 0;
    this.staticFrameCount = 0;
    
    // Clear the security scene
    if (this.securityScene) {
      this.securityScene.clear();
    }
  }
}