// src/materials/room4Materials.js
import * as THREE from 'three';
import { textureCache } from '../utils/TextureCache.js';

/**
 * Create a Tiles136c floor material for Room 4
 * @param {number} width - Width of the floor in meters
 * @param {number} depth - Depth of the floor in meters
 * @param {Object} files - Object containing texture file paths
 * @param {Object} options - Additional options for the material
 * @returns {THREE.MeshStandardMaterial} The floor material
 */
export function makeTiles136cFloor(width, depth, files, options = {}) {
  const {
    tileSizeMeters = 1.0,
    anisotropy = 4, // Reduced from 16 to 4 for performance
    metalness = 0.0,
    roughness = 0.9,
    normalScale = new THREE.Vector2(0.5, 0.5)
  } = options;

  // Load textures from cache
  const colorMap = textureCache.load(files.color);
  const normalMap = textureCache.load(files.normal);
  const roughnessMap = textureCache.load(files.rough);
  const aoMap = files.ao ? textureCache.load(files.ao) : null;

  // Clone textures for independent repeat configuration
  const colorMapClone = colorMap.clone();
  const normalMapClone = normalMap.clone();
  const roughnessMapClone = roughnessMap.clone();
  const aoMapClone = aoMap ? aoMap.clone() : null;

  // Configure texture properties
  [colorMapClone, normalMapClone, roughnessMapClone, aoMapClone].forEach(texture => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy;
    }
  });

  // Calculate repeat values based on tile size
  const repeatX = (width / tileSizeMeters);
  const repeatY = (depth / tileSizeMeters);
  
  colorMapClone.repeat.set(repeatX, repeatY);
  normalMapClone.repeat.set(repeatX, repeatY);
  roughnessMapClone.repeat.set(repeatX, repeatY);
  if (aoMapClone) aoMapClone.repeat.set(repeatX, repeatY);

  // Create material
  const material = new THREE.MeshStandardMaterial({
    map: colorMapClone,
    normalMap: normalMapClone,
    roughnessMap: roughnessMapClone,
    aoMap: aoMapClone,
    metalness: metalness,
    roughness: roughness,
    normalScale: normalScale
  });

  return material;
}

/**
 * Create a Tiles002 floor material for Room 4
 * @param {number} width - Width of the floor in meters
 * @param {number} depth - Depth of the floor in meters
 * @param {Object} files - Object containing texture file paths
 * @param {Object} options - Additional options for the material
 * @returns {THREE.MeshStandardMaterial} The floor material
 */
export function makeTiles002Floor(width, depth, files, options = {}) {
  const {
    tileSizeMeters = 1.0,
    anisotropy = 4,
    metalness = 0.0, // Low metalness for ceramic tiles
    roughness = 0.8, // Moderate roughness for tile surface
    normalScale = new THREE.Vector2(0.6, 0.6) // Moderate normal mapping for tile detail
  } = options;

  // Load textures from cache
  const colorMap = textureCache.load(files.color);
  const normalMap = textureCache.load(files.normal);
  const roughnessMap = textureCache.load(files.rough);
  const displacementMap = files.displacement ? textureCache.load(files.displacement) : null;

  // Clone textures for independent repeat configuration
  const colorMapClone = colorMap.clone();
  const normalMapClone = normalMap.clone();
  const roughnessMapClone = roughnessMap.clone();
  const displacementMapClone = displacementMap ? displacementMap.clone() : null;

  // Configure texture properties
  [colorMapClone, normalMapClone, roughnessMapClone, displacementMapClone].forEach(texture => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy;
    }
  });

  // Calculate repeat values based on tile size
  const repeatX = (width / tileSizeMeters);
  const repeatY = (depth / tileSizeMeters);
  
  colorMapClone.repeat.set(repeatX, repeatY);
  normalMapClone.repeat.set(repeatX, repeatY);
  roughnessMapClone.repeat.set(repeatX, repeatY);
  if (displacementMapClone) displacementMapClone.repeat.set(repeatX, repeatY);

  // Create material
  const material = new THREE.MeshStandardMaterial({
    map: colorMapClone,
    normalMap: normalMapClone,
    roughnessMap: roughnessMapClone,
    displacementMap: displacementMapClone,
    metalness: metalness,
    roughness: roughness,
    normalScale: normalScale,
    displacementScale: 0.1 // Subtle displacement for tile texture
  });

  return material;
}

/**
 * Create a Tiles136c wall material for Room 4
 * @param {number} width - Width of the wall in meters
 * @param {number} height - Height of the wall in meters
 * @param {Object} files - Object containing texture file paths
 * @param {Object} options - Additional options for the material
 * @returns {THREE.MeshStandardMaterial} The wall material
 */
export function makeTiles136cWall(width, height, files, options = {}) {
  const {
    tileSizeMeters = 1.0,
    anisotropy = 4, // Reduced from 16 to 4 for performance
    metalness = 0.0,
    roughness = 0.8,
    normalScale = new THREE.Vector2(0.3, 0.3)
  } = options;

  // Load textures from cache
  const colorMap = textureCache.load(files.color);
  const normalMap = textureCache.load(files.normal);
  const roughnessMap = textureCache.load(files.rough);
  const aoMap = files.ao ? textureCache.load(files.ao) : null;

  // Clone textures for independent repeat configuration
  const colorMapClone = colorMap.clone();
  const normalMapClone = normalMap.clone();
  const roughnessMapClone = roughnessMap.clone();
  const aoMapClone = aoMap ? aoMap.clone() : null;

  // Configure texture properties
  [colorMapClone, normalMapClone, roughnessMapClone, aoMapClone].forEach(texture => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy;
    }
  });

  // Calculate repeat values based on tile size
  const repeatX = (width / tileSizeMeters);
  const repeatY = (height / tileSizeMeters);
  
  colorMapClone.repeat.set(repeatX, repeatY);
  normalMapClone.repeat.set(repeatX, repeatY);
  roughnessMapClone.repeat.set(repeatX, repeatY);
  if (aoMapClone) aoMapClone.repeat.set(repeatX, repeatY);

  // Create material
  const material = new THREE.MeshStandardMaterial({
    map: colorMapClone,
    normalMap: normalMapClone,
    roughnessMap: roughnessMapClone,
    aoMap: aoMapClone,
    metalness: metalness,
    roughness: roughness,
    normalScale: normalScale
  });

  return material;
}

/**
 * Create a Tiles136c ceiling material for Room 4
 * @param {number} width - Width of the ceiling in meters
 * @param {number} depth - Depth of the ceiling in meters
 * @param {Object} files - Object containing texture file paths
 * @param {Object} options - Additional options for the material
 * @returns {THREE.MeshStandardMaterial} The ceiling material
 */
export function makeTiles136cCeiling(width, depth, files, options = {}) {
  const {
    tileSizeMeters = 1.0,
    anisotropy = 4, // Reduced from 16 to 4 for performance
    metalness = 0.1,
    roughness = 0.7,
    normalScale = new THREE.Vector2(0.4, 0.4)
  } = options;

  // Load textures from cache
  const colorMap = textureCache.load(files.color);
  const normalMap = textureCache.load(files.normal);
  const roughnessMap = textureCache.load(files.rough);
  const aoMap = files.ao ? textureCache.load(files.ao) : null;

  // Clone textures for independent repeat configuration
  const colorMapClone = colorMap.clone();
  const normalMapClone = normalMap.clone();
  const roughnessMapClone = roughnessMap.clone();
  const aoMapClone = aoMap ? aoMap.clone() : null;

  // Configure texture properties
  [colorMapClone, normalMapClone, roughnessMapClone, aoMapClone].forEach(texture => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy;
    }
  });

  // Calculate repeat values based on tile size
  const repeatX = (width / tileSizeMeters);
  const repeatY = (depth / tileSizeMeters);
  
  colorMapClone.repeat.set(repeatX, repeatY);
  normalMapClone.repeat.set(repeatX, repeatY);
  roughnessMapClone.repeat.set(repeatX, repeatY);
  if (aoMapClone) aoMapClone.repeat.set(repeatX, repeatY);

  // Create material
  const material = new THREE.MeshStandardMaterial({
    map: colorMapClone,
    normalMap: normalMapClone,
    roughnessMap: roughnessMapClone,
    aoMap: aoMapClone,
    metalness: metalness,
    roughness: roughness,
    normalScale: normalScale
  });

  return material;
}
