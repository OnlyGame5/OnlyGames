import * as THREE from 'three';

// Metal030 texture files
const metal030Files = {
  color:  "/textures/metal030/Metal030_2K-JPG_Color.jpg",
  normal: "/textures/metal030/Metal030_2K-JPG/Metal030_2K-JPG_NormalGL.jpg",
  rough:  "/textures/metal030/Metal030_2K-JPG_Roughness.jpg",
  metal:  "/textures/metal030/Metal030_2K-JPG_Metalness.jpg",
};

// Concrete031 texture files
const concrete031Files = {
  color:  "/textures/concrete031/Concrete031_2K-JPG_Color.jpg",
  normal: "/textures/concrete031/Concrete031_2K-JPG_NormalGL.jpg",
  rough:  "/textures/concrete031/Concrete031_2K-JPG_Roughness.jpg",
  ao:     "/textures/concrete031/Concrete031_2K-JPG_AmbientOcclusion.jpg",
};

// Tiles108 texture files
const tiles108Files = {
  color:  "/textures/tiles108/Tiles108_2K-JPG_Color.jpg",
  normal: "/textures/tiles108/Tiles108_2K-JPG_NormalDX.jpg",
  rough:  "/textures/tiles108/Tiles108_2K-JPG_Roughness.jpg",
  ao:     "/textures/tiles108/Tiles108_2K-JPG_AmbientOcclusion.jpg",
};

// Bricks058 texture files
const bricks058Files = {
  color:  "/textures/bricks058/Bricks058_2K-JPG_Color.jpg",
  normal: "/textures/bricks058/Bricks058_2K-JPG_NormalDX.jpg",
  rough:  "/textures/bricks058/Bricks058_2K-JPG_Roughness.jpg",
  ao:     "/textures/bricks058/Bricks058_2K-JPG_AmbientOcclusion.jpg",
};

export function makeTiles108Floor(width, depth, options = {}) {
  const tileSizeMeters = options.tileSizeMeters || 1.0;
  const anisotropy = options.anisotropy || 16;
  
  const loader = new THREE.TextureLoader();
  
  const colorTexture = loader.load(tiles108Files.color);
  const normalTexture = loader.load(tiles108Files.normal);
  const roughnessTexture = loader.load(tiles108Files.rough);
  const aoTexture = loader.load(tiles108Files.ao);
  
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

export function makeBrickMaterialForPanel() {
  const loader = new THREE.TextureLoader();
  
  const colorTexture = loader.load(bricks058Files.color);
  const normalTexture = loader.load(bricks058Files.normal);
  const roughnessTexture = loader.load(bricks058Files.rough);
  const aoTexture = loader.load(bricks058Files.ao);
  
  // Configure textures
  [colorTexture, normalTexture, roughnessTexture, aoTexture].forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.anisotropy = 16;
  });
  
  return new THREE.MeshStandardMaterial({
    map: colorTexture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
    aoMap: aoTexture,
    metalness: 0.0,
    roughness: 1.0,
    normalScale: new THREE.Vector2(1, 1)
  });
}

export function makeMetal030MaterialForCylinderFlexible() {
  const loader = new THREE.TextureLoader();
  
  const colorTexture = loader.load(metal030Files.color);
  const normalTexture = loader.load(metal030Files.normal);
  const roughnessTexture = loader.load(metal030Files.rough);
  const metalnessTexture = loader.load(metal030Files.metal);
  
  // Configure textures
  [colorTexture, normalTexture, roughnessTexture, metalnessTexture].forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.anisotropy = 16;
  });
  
  return new THREE.MeshStandardMaterial({
    map: colorTexture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
    metalnessMap: metalnessTexture,
    metalness: 0.9,
    roughness: 0.1,
    normalScale: new THREE.Vector2(1, 1)
  });
}

export function makeConcrete031MaterialFlexible() {
  const loader = new THREE.TextureLoader();
  
  const colorTexture = loader.load(concrete031Files.color);
  const normalTexture = loader.load(concrete031Files.normal);
  const roughnessTexture = loader.load(concrete031Files.rough);
  const aoTexture = loader.load(concrete031Files.ao);
  
  // Configure textures
  [colorTexture, normalTexture, roughnessTexture, aoTexture].forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.anisotropy = 16;
  });
  
  return new THREE.MeshStandardMaterial({
    map: colorTexture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
    aoMap: aoTexture,
    metalness: 0.0,
    roughness: 1.0,
    normalScale: new THREE.Vector2(1, 1)
  });
}
