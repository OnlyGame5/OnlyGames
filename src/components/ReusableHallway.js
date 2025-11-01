import * as THREE from 'three';
import { textureCache as globalTextureCache } from '../utils/TextureCache.js';

// Performance optimization: Shared material pool
const materialPool = {
  concrete: null,
  tiles: null
};

// Performance optimization: Shared texture cache (DEPRECATED - now using globalTextureCache)
const textureCache = {
  concrete: null,
  tiles: null
};

/**
 * Reusable Hallway Component - PERFORMANCE OPTIMIZED
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
 * @param {boolean} options.addCeiling - Whether to add a physical ceiling mesh (default: false)
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
    addCeiling: false,
    lightIntensity: 0.3,
    ambientIntensity: 0.1,
    textureSet: 'concrete031',
    // Performance toggles
    useNormalMap: false,
    useAOMap: false,
    receiveShadows: true,
    castShadows: false,
    ...options
  };

  // Create the hallway group
  const hallway = new THREE.Group();
  hallway.name = config.name;
  hallway.visible = true;

  // Texture file paths
  const concrete031Files = {
  color: "./textures/concrete031/Concrete031_2K-JPG_Color.jpg",
  normal: "./textures/concrete031/Concrete031_2K-JPG_NormalGL.jpg",
  rough: "./textures/concrete031/Concrete031_2K-JPG_Roughness.jpg",
  ao: "./textures/concrete031/Concrete031_2K-JPG_AmbientOcclusion.jpg",
  disp: "./textures/concrete031/Concrete031_2K-JPG_Displacement.jpg"
  };

  const tiles136cFiles = {
  color: "./textures/tiles136C/Tiles136C_2K-JPG_Color.jpg",
  normal: "./textures/tiles136C/Tiles136C_2K-JPG_NormalGL.jpg",
  rough: "./textures/tiles136C/Tiles136C_2K-JPG_Roughness.jpg",
  ao: "./textures/tiles136C/Tiles136C_2K-JPG_AmbientOcclusion.jpg"
  };

  // Choose texture set
  const textureFiles = config.textureSet === 'tiles136c' ? tiles136cFiles : concrete031Files;

  // Performance optimized: Get or create shared concrete material
  function getSharedConcreteMaterial(width, height, options = {}) {
    if (!materialPool.concrete) {
      // Use texture cache instead of creating new loader
  const colorTexture = globalTextureCache.load("./textures/concrete031/Concrete031_2K-JPG_Color.jpg");
  const normalTexture = globalTextureCache.load("./textures/concrete031/Concrete031_2K-JPG_NormalGL.jpg");
  const roughTexture = globalTextureCache.load("./textures/concrete031/Concrete031_2K-JPG_Roughness.jpg");
  const aoTexture = globalTextureCache.load("./textures/concrete031/Concrete031_2K-JPG_AmbientOcclusion.jpg");
      
      // Performance optimization: Reduce anisotropy to 1
      const anisotropy = 1; // Reduced from 4 to 1 for better performance
      [colorTexture, normalTexture, roughTexture, aoTexture].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = anisotropy;
        tex.generateMipmaps = true;
      });
      
      materialPool.concrete = new THREE.MeshStandardMaterial({
        map: colorTexture,
        normalMap: config.useNormalMap ? normalTexture : null,
        roughnessMap: roughTexture,
        aoMap: config.useAOMap ? aoTexture : null,
        color: 0x8a8a8a,
        roughness: 0.8,
        metalness: 0.1,
        normalScale: new THREE.Vector2(0.5, 0.5)
      });
    }
    
    // Clone the shared material and adjust UV scaling
    const material = materialPool.concrete.clone();
    const uScale = options.uScale || 1.0;
    const vScale = options.vScale || 1.0;
    
    if (material.map) material.map.repeat.set(uScale * width, vScale * height);
    if (material.normalMap) material.normalMap.repeat.set(uScale * width, vScale * height);
    if (material.roughnessMap) material.roughnessMap.repeat.set(uScale * width, vScale * height);
    if (material.aoMap) material.aoMap.repeat.set(uScale * width, vScale * height);
    
    return material;
  }

  // Performance optimized: Get or create shared tiles material
  function getSharedTilesMaterial(width, height, options = {}) {
    if (!materialPool.tiles) {
      // Use texture cache instead of creating new loader
  const colorTexture = globalTextureCache.load("./textures/tiles136C/Tiles136C_2K-JPG_Color.jpg");
  const normalTexture = globalTextureCache.load("./textures/tiles136C/Tiles136C_2K-JPG_NormalGL.jpg");
  const roughTexture = globalTextureCache.load("./textures/tiles136C/Tiles136C_2K-JPG_Roughness.jpg");
  const aoTexture = globalTextureCache.load("./textures/tiles136C/Tiles136C_2K-JPG_AmbientOcclusion.jpg");
      
      // Performance optimization: Reduce anisotropy to 1
      const anisotropy = 1; // Reduced from 4 to 1 for better performance
      [colorTexture, normalTexture, roughTexture, aoTexture].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = anisotropy;
        tex.generateMipmaps = true;
      });
      
      materialPool.tiles = new THREE.MeshStandardMaterial({
        map: colorTexture,
        normalMap: config.useNormalMap ? normalTexture : null,
        roughnessMap: roughTexture,
        aoMap: config.useAOMap ? aoTexture : null,
        color: 0x8a8a8a,
        roughness: 0.8,
        metalness: 0.1,
        normalScale: new THREE.Vector2(0.3, 0.3)
      });
    }
    
    // Clone the shared material and adjust UV scaling
    const material = materialPool.tiles.clone();
    const uScale = options.uScale || 1.0;
    const vScale = options.vScale || 1.0;
    
    if (material.map) material.map.repeat.set(uScale * width, vScale * height);
    if (material.normalMap) material.normalMap.repeat.set(uScale * width, vScale * height);
    if (material.roughnessMap) material.roughnessMap.repeat.set(uScale * width, vScale * height);
    if (material.aoMap) material.aoMap.repeat.set(uScale * width, vScale * height);
    
    return material;
  }

  // Performance optimized: Use shared materials
  const createMaterial = config.textureSet === 'tiles136c' ? 
    getSharedTilesMaterial : getSharedConcreteMaterial;

  // Hallway floor - Performance optimized
  const hallwayFloorGeo = new THREE.BoxGeometry(config.width, 0.2, config.length);
  const hallwayFloor = new THREE.Mesh(
    hallwayFloorGeo,
    createMaterial(config.width, config.length, {
      uScale: 0.4,
      vScale: 0.4
    })
  );
  hallwayFloor.position.set(0, 0, 0); // Position at center to align with room floors
  hallwayFloor.castShadow = false;
  hallwayFloor.receiveShadow = !!config.receiveShadows;
  hallwayFloor.name = 'hallway-floor';
  hallway.add(hallwayFloor);

  // Left wall - Performance optimized
  const hallwayWall1Geo = new THREE.BoxGeometry(0.2, config.height, config.length);
  const hallwayWall1 = new THREE.Mesh(
    hallwayWall1Geo,
    createMaterial(0.2, config.height, {
      uScale: 0.3,
      vScale: 0.3
    })
  );
  hallwayWall1.position.set(
    -config.width/2, 
    config.height/2, 
    0
  );
  hallwayWall1.castShadow = !!config.castShadows;
  hallwayWall1.receiveShadow = false;
  hallwayWall1.userData = { type: 'wall', side: 'hallway-left' };
  hallwayWall1.name = 'hallway-wall-left';
  hallway.add(hallwayWall1);

  // Right wall - Performance optimized
  const hallwayWall2Geo = new THREE.BoxGeometry(0.2, config.height, config.length);
  const hallwayWall2 = new THREE.Mesh(
    hallwayWall2Geo,
    createMaterial(0.2, config.height, {
      uScale: 0.3,
      vScale: 0.3
    })
  );
  hallwayWall2.position.set(
    config.width/2, 
    config.height/2, 
    0
  );
  hallwayWall2.rotation.y = Math.PI; // Rotate 180 degrees to face the correct direction
  hallwayWall2.castShadow = !!config.castShadows;
  hallwayWall2.receiveShadow = false;
  hallwayWall2.userData = { type: 'wall', side: 'hallway-right' };
  hallwayWall2.name = 'hallway-wall-right';
  hallway.add(hallwayWall2);

  // Hallway ceiling (optional) - disabled by default to avoid visuals over door headers
  if (config.addCeiling) {
    const ceilingTrim = 0.6; // meters trimmed from total length (0.3 each end)
    const hallwayCeilingGeo = new THREE.BoxGeometry(config.width, 0.3, Math.max(0, config.length - ceilingTrim));
    const hallwayCeiling = new THREE.Mesh(
      hallwayCeilingGeo,
      createMaterial(config.width, config.length, {
        uScale: 0.4,
        vScale: 0.4
      })
    );
    hallwayCeiling.position.set(0, config.height + 0.15, 0);
    hallwayCeiling.receiveShadow = true;
    hallwayCeiling.name = 'hallway-ceiling';
    hallway.add(hallwayCeiling);
  }

  // Add minimal ambient lighting for visibility (5% intensity)
  if (config.addLighting) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05); // 5% ambient lighting
    ambientLight.name = 'hallway-ambient';
    hallway.add(ambientLight);
  }

  // Add invisible collision walls for proper collision detection
  const wallThickness = 0.1;
  
  // Left collision wall
  const leftCollisionWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, config.height, config.length),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  leftCollisionWall.position.set(-config.width/2 - wallThickness/2, config.height/2, 0);
  leftCollisionWall.userData = { type: 'collision-wall', side: 'hallway-left' };
  leftCollisionWall.name = 'hallway-collision-left';
  hallway.add(leftCollisionWall);
  
  // Right collision wall
  const rightCollisionWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, config.height, config.length),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  rightCollisionWall.position.set(config.width/2 + wallThickness/2, config.height/2, 0);
  rightCollisionWall.userData = { type: 'collision-wall', side: 'hallway-right' };
  rightCollisionWall.name = 'hallway-collision-right';
  hallway.add(rightCollisionWall);
  
  // No front/back collision walls - hallways are open at both ends for free passage

  // Collision detection function for hallway walls
  function checkHallwayCollisions(playerObject) {
    if (!playerObject || !playerObject.position) return false;
    
    const playerRadius = 0.5;
    const pos = playerObject.position;
    
    // Convert world position to hallway local position
    const localPos = hallway.worldToLocal(pos.clone());
    
    // Only apply collision detection if player is within hallway bounds
    // Add some margin to prevent edge cases
    const margin = 2.0;
    const isInsideHallway = (
      localPos.x >= -config.width/2 - margin && localPos.x <= config.width/2 + margin &&
      localPos.z >= -config.length/2 - margin && localPos.z <= config.length/2 + margin
    );
    
    if (!isInsideHallway) {
      return false; // Player is not in hallway, no collision needed
    }
    
    // Check left wall collision
    if (localPos.x - playerRadius < -config.width/2) {
      localPos.x = -config.width/2 + playerRadius;
      const newWorldPos = hallway.localToWorld(localPos);
      playerObject.position.copy(newWorldPos);
      return true;
    }
    
    // Check right wall collision
    if (localPos.x + playerRadius > config.width/2) {
      localPos.x = config.width/2 - playerRadius;
      const newWorldPos = hallway.localToWorld(localPos);
      playerObject.position.copy(newWorldPos);
      return true;
    }
    
    // No collision detection for front/back walls - hallways are open at both ends
    // Players can walk through the entrance and exit freely
    
    return false;
  }

  // Position the entire hallway at origin - positioning will be handled by the caller
  hallway.position.set(0, 0, 0);

  // Return the hallway group with utility methods
  return {
    group: hallway,
    
    // Collision detection method
    checkCollisions: checkHallwayCollisions,
    
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
    
    // Get hallway bounds for collision detection (relative to hallway center)
    getBounds: () => {
      return {
        minX: -config.width/2 - 0.2,
        maxX: config.width/2 + 0.2,
        minY: 0,
        maxY: config.height + 0.3,
        minZ: -config.length/2,
        maxZ: config.length/2
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
