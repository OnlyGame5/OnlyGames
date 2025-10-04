import * as THREE from 'three';

/**
 * Reusable Hallway Component
 * Creates a textured hallway that can be used between any rooms
 * 
 * @param {Object} options - Configuration options for the hallway
 * @param {number} options.length - Length of the hallway (default: 18)
 * @param {number} options.width - Width of the hallway (default: 2)
 * @param {number} options.height - Height of the hallway (default: 4)
 * @param {number} options.positionX - X position of hallway center (default: -8)
 * @param {number} options.positionY - Y position of hallway center (default: 0)
 * @param {number} options.positionZ - Z position of hallway center (default: -18)
 * @param {string} options.name - Name for the hallway group (default: 'reusable-hallway')
 * @param {boolean} options.addLighting - Whether to add atmospheric lighting (default: true)
 * @param {number} options.lightIntensity - Intensity of hallway lights (default: 0.3)
 * @param {number} options.ambientIntensity - Ambient light intensity (default: 0.1)
 * @param {string} options.textureSet - Texture set to use ('concrete031' or 'tiles136c') (default: 'concrete031')
 */
export function createReusableHallway(options = {}) {
  // Default configuration
  const config = {
    length: 18,
    width: 2,
    height: 4,
    positionX: -8,
    positionY: 0,
    positionZ: -18,
    name: 'reusable-hallway',
    addLighting: true,
    lightIntensity: 0.3,
    ambientIntensity: 0.1,
    textureSet: 'concrete031',
    ...options
  };

  // Create the hallway group
  const hallway = new THREE.Group();
  hallway.name = config.name;
  hallway.visible = true;

  // Texture file paths
  const concrete031Files = {
    color: "/textures/concrete031/Concrete031_2K-JPG_Color.jpg",
    normal: "/textures/concrete031/Concrete031_2K-JPG_NormalGL.jpg",
    rough: "/textures/concrete031/Concrete031_2K-JPG_Roughness.jpg",
    ao: "/textures/concrete031/Concrete031_2K-JPG_AmbientOcclusion.jpg",
    disp: "/textures/concrete031/Concrete031_2K-JPG_Displacement.jpg"
  };

  const tiles136cFiles = {
    color: "/textures/tiles136C/Tiles136C_2K-JPG_Color.jpg",
    normal: "/textures/tiles136C/Tiles136C_2K-JPG_NormalGL.jpg",
    rough: "/textures/tiles136C/Tiles136C_2K-JPG_Roughness.jpg",
    ao: "/textures/tiles136C/Tiles136C_2K-JPG_AmbientOcclusion.jpg"
  };

  // Choose texture set
  const textureFiles = config.textureSet === 'tiles136c' ? tiles136cFiles : concrete031Files;

  // Helper function to create concrete031 material (keeping the same implementation)
  function makeConcrete031MaterialFlexible(width, height, files, options = {}) {
    const loader = new THREE.TextureLoader();
    
    const colorTexture = loader.load(files.color);
    const normalTexture = loader.load(files.normal);
    const roughTexture = loader.load(files.rough);
    const aoTexture = loader.load(files.ao);
    
    // Configure textures
    const anisotropy = options.anisotropy || 4; // Reduced from 16 to 4 for performance
    [colorTexture, normalTexture, roughTexture, aoTexture].forEach(tex => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = anisotropy;
      tex.generateMipmaps = true;
    });
    
    const uScale = options.uScale || 1.0;
    const vScale = options.vScale || 1.0;
    
    colorTexture.repeat.set(uScale * width, vScale * height);
    normalTexture.repeat.set(uScale * width, vScale * height);
    roughTexture.repeat.set(uScale * width, vScale * height);
    aoTexture.repeat.set(uScale * width, vScale * height);
    
    const material = new THREE.MeshStandardMaterial({
      map: colorTexture,
      normalMap: normalTexture,
      roughnessMap: roughTexture,
      aoMap: aoTexture,
      color: 0x8a8a8a,
      roughness: 0.8,
      metalness: 0.1,
      normalScale: new THREE.Vector2(0.5, 0.5)
    });
    
    return material;
  }

  // Helper function to create tiles136c material
  function makeTiles136cMaterialFlexible(width, height, files, options = {}) {
    const loader = new THREE.TextureLoader();
    
    const colorTexture = loader.load(files.color);
    const normalTexture = loader.load(files.normal);
    const roughTexture = loader.load(files.rough);
    const aoTexture = loader.load(files.ao);
    
    // Configure textures
    const anisotropy = options.anisotropy || 4; // Reduced from 16 to 4 for performance
    [colorTexture, normalTexture, roughTexture, aoTexture].forEach(tex => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = anisotropy;
      tex.generateMipmaps = true;
    });
    
    const uScale = options.uScale || 1.0;
    const vScale = options.vScale || 1.0;
    
    colorTexture.repeat.set(uScale * width, vScale * height);
    normalTexture.repeat.set(uScale * width, vScale * height);
    roughTexture.repeat.set(uScale * width, vScale * height);
    aoTexture.repeat.set(uScale * width, vScale * height);
    
    const material = new THREE.MeshStandardMaterial({
      map: colorTexture,
      normalMap: normalTexture,
      roughnessMap: roughTexture,
      aoMap: aoTexture,
      color: 0x8a8a8a,
      roughness: 0.8,
      metalness: 0.1,
      normalScale: new THREE.Vector2(0.3, 0.3)
    });
    
    return material;
  }

  // Create material based on texture set
  const createMaterial = config.textureSet === 'tiles136c' ? 
    makeTiles136cMaterialFlexible : makeConcrete031MaterialFlexible;

  // Hallway floor
  const hallwayFloorGeo = new THREE.BoxGeometry(config.width, 0.2, config.length);
  const hallwayFloor = new THREE.Mesh(
    hallwayFloorGeo,
    createMaterial(config.width, config.length, textureFiles, {
      uScale: 0.4,
      vScale: 0.4,
      anisotropy: 4, // Reduced from 16 to 4 for performance
      attachAOToGeometry: hallwayFloorGeo,
    })
  );
  hallwayFloor.position.set(config.positionX, config.positionY - 0.15, config.positionZ);
  hallwayFloor.receiveShadow = true;
  hallwayFloor.name = 'hallway-floor';
  hallway.add(hallwayFloor);

  // Left wall
  const hallwayWall1Geo = new THREE.BoxGeometry(0.2, config.height, config.length);
  const hallwayWall1 = new THREE.Mesh(
    hallwayWall1Geo,
    createMaterial(0.2, config.height, textureFiles, {
      uScale: 0.3,
      vScale: 0.3,
      anisotropy: 4, // Reduced from 16 to 4 for performance
      attachAOToGeometry: hallwayWall1Geo,
    })
  );
  hallwayWall1.position.set(
    config.positionX - config.width/2 - 0.1, 
    config.positionY + config.height/2, 
    config.positionZ
  );
  hallwayWall1.castShadow = true;
  hallwayWall1.receiveShadow = true;
  hallwayWall1.userData = { type: 'wall', side: 'hallway-left' };
  hallwayWall1.name = 'hallway-wall-left';
  hallway.add(hallwayWall1);

  // Right wall
  const hallwayWall2Geo = new THREE.BoxGeometry(0.2, config.height, config.length);
  const hallwayWall2 = new THREE.Mesh(
    hallwayWall2Geo,
    createMaterial(0.2, config.height, textureFiles, {
      uScale: 0.3,
      vScale: 0.3,
      anisotropy: 4, // Reduced from 16 to 4 for performance
      attachAOToGeometry: hallwayWall2Geo,
    })
  );
  hallwayWall2.position.set(
    config.positionX + config.width/2 + 0.1, 
    config.positionY + config.height/2, 
    config.positionZ
  );
  hallwayWall2.rotation.y = Math.PI; // Rotate 180 degrees to face the correct direction
  hallwayWall2.castShadow = true;
  hallwayWall2.receiveShadow = true;
  hallwayWall2.userData = { type: 'wall', side: 'hallway-right' };
  hallwayWall2.name = 'hallway-wall-right';
  hallway.add(hallwayWall2);

  // Hallway ceiling
  const hallwayCeilingGeo = new THREE.BoxGeometry(config.width, 0.3, config.length);
  const hallwayCeiling = new THREE.Mesh(
    hallwayCeilingGeo,
    createMaterial(config.width, config.length, textureFiles, {
      uScale: 0.4,
      vScale: 0.4,
      anisotropy: 4, // Reduced from 16 to 4 for performance
      attachAOToGeometry: hallwayCeilingGeo,
    })
  );
  hallwayCeiling.position.set(
    config.positionX, 
    config.positionY + config.height + 0.15, 
    config.positionZ
  );
  hallwayCeiling.receiveShadow = true;
  hallwayCeiling.name = 'hallway-ceiling';
  hallway.add(hallwayCeiling);

  // Add atmospheric lighting if requested
  if (config.addLighting) {
    // Ambient light
    const hallwayAmbientLight = new THREE.AmbientLight(0x202020, config.ambientIntensity);
    hallwayAmbientLight.name = 'hallway-ambient-light';
    hallway.add(hallwayAmbientLight);

    // Point lights along the hallway
    const numLights = Math.max(1, Math.floor(config.length / 6)); // One light every 6 units
    for (let i = 0; i < numLights; i++) {
      const lightZ = config.positionZ + (i * (config.length / numLights)) - (config.length / 2);
      const hallwayLight = new THREE.PointLight(0xffffff, config.lightIntensity, 8);
      hallwayLight.position.set(config.positionX, config.positionY + 3, lightZ);
      hallwayLight.castShadow = true;
      hallwayLight.shadow.mapSize.width = 256;
      hallwayLight.shadow.mapSize.height = 256;
      hallwayLight.shadow.camera.near = 0.1;
      hallwayLight.shadow.camera.far = 15;
      hallwayLight.name = `hallway-light-${i}`;
      hallway.add(hallwayLight);
    }
  }

  // Position the entire hallway
  hallway.position.set(0, 0, 0); // Position is handled by individual components

  // Return the hallway group with utility methods
  return {
    group: hallway,
    
    // Utility methods
    setVisible: (visible) => {
      hallway.visible = visible;
    },
    
    getVisible: () => {
      return hallway.visible;
    },
    
    setPosition: (x, y, z) => {
      hallway.position.set(x, y, z);
    },
    
    getPosition: () => {
      return hallway.position.clone();
    },
    
    // Get hallway bounds for collision detection
    getBounds: () => {
      return {
        minX: config.positionX - config.width/2 - 0.2,
        maxX: config.positionX + config.width/2 + 0.2,
        minY: config.positionY,
        maxY: config.positionY + config.height + 0.3,
        minZ: config.positionZ - config.length/2,
        maxZ: config.positionZ + config.length/2
      };
    },
    
    // Check if a point is inside the hallway
    isPointInside: (point) => {
      const bounds = this.getBounds();
      return (
        point.x >= bounds.minX && point.x <= bounds.maxX &&
        point.y >= bounds.minY && point.y <= bounds.maxY &&
        point.z >= bounds.minZ && point.z <= bounds.maxZ
      );
    },
    
    // Get configuration
    getConfig: () => {
      return { ...config };
    }
  };
}

// Export some common hallway presets
export const HallwayPresets = {
  // Standard hallway between rooms (like Room 0 to Room 1)
  standard: (options = {}) => createReusableHallway({
    length: 18,
    width: 2,
    height: 4,
    positionX: -8,
    positionY: 0,
    positionZ: -18,
    name: 'standard-hallway',
    ...options
  }),
  
  // Short hallway for close rooms
  short: (options = {}) => createReusableHallway({
    length: 9,
    width: 2,
    height: 4,
    positionX: -8,
    positionY: 0,
    positionZ: -9,
    name: 'short-hallway',
    ...options
  }),
  
  // Long hallway for distant rooms
  long: (options = {}) => createReusableHallway({
    length: 30,
    width: 2,
    height: 4,
    positionX: -8,
    positionY: 0,
    positionZ: -30,
    name: 'long-hallway',
    ...options
  }),
  
  // Wide hallway
  wide: (options = {}) => createReusableHallway({
    length: 18,
    width: 4,
    height: 4,
    positionX: -8,
    positionY: 0,
    positionZ: -18,
    name: 'wide-hallway',
    ...options
  }),
  
  // Tiles136c textured hallway
  tiled: (options = {}) => createReusableHallway({
    length: 18,
    width: 2,
    height: 4,
    positionX: -8,
    positionY: 0,
    positionZ: -18,
    name: 'tiled-hallway',
    textureSet: 'tiles136c',
    ...options
  })
};
