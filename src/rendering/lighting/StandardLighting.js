import * as THREE from 'three';

export function setupRendererColorPipeline(renderer) {
  // Configure renderer for better color accuracy
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
}

export function applyEnvironment(scene, renderer) {
  // Apply environment lighting
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  
  // Create a simple environment map
  const envMap = pmremGenerator.fromScene(new THREE.Scene(), 0.04).texture;
  scene.environment = envMap;
}

export function buildStandardLightRig(scene) {
  // Remove existing lights
  removeExistingLights(scene);
  
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
  scene.add(ambientLight);
  
  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(10, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  scene.add(directionalLight);
  
  // Hemisphere light for sky/ground lighting
  const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.3);
  scene.add(hemisphereLight);
  
  return {
    ambient: ambientLight,
    directional: directionalLight,
    hemisphere: hemisphereLight
  };
}

export function removeExistingLights(scene) {
  const lightsToRemove = [];
  scene.traverse((child) => {
    if (child.isLight) {
      lightsToRemove.push(child);
    }
  });
  
  lightsToRemove.forEach(light => {
    scene.remove(light);
  });
}
