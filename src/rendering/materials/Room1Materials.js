import * as THREE from 'three';

// Tiles136c texture files
const tiles136cFiles = {
  color:  "/textures/tiles136C/Tiles136C_2K-JPG_Color.jpg",
  normal: "/textures/tiles136C/Tiles136C_2K-JPG_NormalDX.jpg",
  rough:  "/textures/tiles136C/Tiles136C_2K-JPG_Roughness.jpg",
  ao:     "/textures/tiles136C/Tiles136C_2K-JPG_AmbientOcclusion.jpg",
};

export function makeTiles136cFloor(width, depth, options = {}) {
  const tileSizeMeters = options.tileSizeMeters || 0.8;
  const anisotropy = options.anisotropy || 16;
  
  const loader = new THREE.TextureLoader();
  
  const colorTexture = loader.load(tiles136cFiles.color);
  const normalTexture = loader.load(tiles136cFiles.normal);
  const roughnessTexture = loader.load(tiles136cFiles.rough);
  const aoTexture = loader.load(tiles136cFiles.ao);
  
  // Configure textures
  [colorTexture, normalTexture, roughnessTexture, aoTexture].forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / tileSizeMeters, depth / tileSizeMeters);
    texture.anisotropy = anisotropy;
  });
  
  const material = new THREE.MeshStandardMaterial({
    map: colorTexture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
    aoMap: aoTexture,
    metalness: 0.0,
    roughness: 1.0,
    normalScale: new THREE.Vector2(1, 1)
  });
  
  const geometry = new THREE.PlaneGeometry(width, depth);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  
  return mesh;
}

export function makeTiles136cWall(width, height, thickness) {
  const loader = new THREE.TextureLoader();
  
  const colorTexture = loader.load(tiles136cFiles.color);
  const normalTexture = loader.load(tiles136cFiles.normal);
  const roughnessTexture = loader.load(tiles136cFiles.rough);
  const aoTexture = loader.load(tiles136cFiles.ao);
  
  // Configure textures
  [colorTexture, normalTexture, roughnessTexture, aoTexture].forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / 0.8, height / 0.8);
    texture.anisotropy = 16;
  });
  
  const material = new THREE.MeshStandardMaterial({
    map: colorTexture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
    aoMap: aoTexture,
    metalness: 0.0,
    roughness: 1.0,
    normalScale: new THREE.Vector2(1, 1)
  });
  
  const geometry = new THREE.BoxGeometry(width, height, thickness);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  return mesh;
}

export function makeTiles136cCeiling(width, depth) {
  const loader = new THREE.TextureLoader();
  
  const colorTexture = loader.load(tiles136cFiles.color);
  const normalTexture = loader.load(tiles136cFiles.normal);
  const roughnessTexture = loader.load(tiles136cFiles.rough);
  const aoTexture = loader.load(tiles136cFiles.ao);
  
  // Configure textures
  [colorTexture, normalTexture, roughnessTexture, aoTexture].forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / 0.8, depth / 0.8);
    texture.anisotropy = 16;
  });
  
  const material = new THREE.MeshStandardMaterial({
    map: colorTexture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
    aoMap: aoTexture,
    metalness: 0.0,
    roughness: 1.0,
    normalScale: new THREE.Vector2(1, 1)
  });
  
  const geometry = new THREE.PlaneGeometry(width, depth);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  mesh.receiveShadow = true;
  
  return mesh;
}
