// src/materials/room1Materials.js
import * as THREE from 'three';

/**
 * Create a Tiles136c floor material for Room 1
 * @param {number} width - Width of the floor in meters
 * @param {number} depth - Depth of the floor in meters
 * @param {Object} files - Object containing texture file paths
 * @param {Object} options - Additional options for the material
 * @returns {THREE.MeshStandardMaterial} The floor material
 */
export function makeTiles136cFloor(width, depth, files, options = {}) {
  const {
    tileSizeMeters = 1.0,
    anisotropy = 16,
    metalness = 0.0,
    roughness = 0.9,
    normalScale = new THREE.Vector2(0.5, 0.5)
  } = options;

  // Load textures
  const textureLoader = new THREE.TextureLoader();
  
  const colorMap = textureLoader.load(files.color);
  const normalMap = textureLoader.load(files.normal);
  const roughnessMap = textureLoader.load(files.rough);
  const aoMap = files.ao ? textureLoader.load(files.ao) : null;

  // Configure texture properties
  [colorMap, normalMap, roughnessMap, aoMap].forEach(texture => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy;
    }
  });

  // Calculate repeat values based on tile size
  const repeatX = (width / tileSizeMeters);
  const repeatY = (depth / tileSizeMeters);
  
  colorMap.repeat.set(repeatX, repeatY);
  normalMap.repeat.set(repeatX, repeatY);
  roughnessMap.repeat.set(repeatX, repeatY);
  if (aoMap) aoMap.repeat.set(repeatX, repeatY);

  // Create material
  const material = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    aoMap: aoMap,
    metalness: metalness,
    roughness: roughness,
    normalScale: normalScale
  });

  return material;
}

/**
 * Create a Tiles136c wall material for Room 1
 * @param {number} width - Width of the wall in meters
 * @param {number} height - Height of the wall in meters
 * @param {Object} files - Object containing texture file paths
 * @param {Object} options - Additional options for the material
 * @returns {THREE.MeshStandardMaterial} The wall material
 */
export function makeTiles136cWall(width, height, files, options = {}) {
  const {
    tileSizeMeters = 1.0,
    anisotropy = 16,
    metalness = 0.0,
    roughness = 0.8,
    normalScale = new THREE.Vector2(0.3, 0.3)
  } = options;

  // Load textures
  const textureLoader = new THREE.TextureLoader();
  
  const colorMap = textureLoader.load(files.color);
  const normalMap = textureLoader.load(files.normal);
  const roughnessMap = textureLoader.load(files.rough);
  const aoMap = files.ao ? textureLoader.load(files.ao) : null;

  // Configure texture properties
  [colorMap, normalMap, roughnessMap, aoMap].forEach(texture => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy;
    }
  });

  // Calculate repeat values based on tile size
  const repeatX = (width / tileSizeMeters);
  const repeatY = (height / tileSizeMeters);
  
  colorMap.repeat.set(repeatX, repeatY);
  normalMap.repeat.set(repeatX, repeatY);
  roughnessMap.repeat.set(repeatX, repeatY);
  if (aoMap) aoMap.repeat.set(repeatX, repeatY);

  // Create material
  const material = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    aoMap: aoMap,
    metalness: metalness,
    roughness: roughness,
    normalScale: normalScale
  });

  return material;
}

/**
 * Create a Tiles136c ceiling material for Room 1
 * @param {number} width - Width of the ceiling in meters
 * @param {number} depth - Depth of the ceiling in meters
 * @param {Object} files - Object containing texture file paths
 * @param {Object} options - Additional options for the material
 * @returns {THREE.MeshStandardMaterial} The ceiling material
 */
export function makeTiles136cCeiling(width, depth, files, options = {}) {
  const {
    tileSizeMeters = 1.0,
    anisotropy = 16,
    metalness = 0.1,
    roughness = 0.7,
    normalScale = new THREE.Vector2(0.4, 0.4)
  } = options;

  // Load textures
  const textureLoader = new THREE.TextureLoader();
  
  const colorMap = textureLoader.load(files.color);
  const normalMap = textureLoader.load(files.normal);
  const roughnessMap = textureLoader.load(files.rough);
  const aoMap = files.ao ? textureLoader.load(files.ao) : null;

  // Configure texture properties
  [colorMap, normalMap, roughnessMap, aoMap].forEach(texture => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy;
    }
  });

  // Calculate repeat values based on tile size
  const repeatX = (width / tileSizeMeters);
  const repeatY = (depth / tileSizeMeters);
  
  colorMap.repeat.set(repeatX, repeatY);
  normalMap.repeat.set(repeatX, repeatY);
  roughnessMap.repeat.set(repeatX, repeatY);
  if (aoMap) aoMap.repeat.set(repeatX, repeatY);

  // Create material
  const material = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    aoMap: aoMap,
    metalness: metalness,
    roughness: roughness,
    normalScale: normalScale
  });

  return material;
}
