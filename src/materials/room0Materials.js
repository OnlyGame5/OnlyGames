// src/materials/room0Materials.js
import * as THREE from "three";

/** One TextureLoader shared by all materials */
const texLoader = new THREE.TextureLoader();

/* =========================
   Bricks058 (walls)
   ========================= */
const bricks058 = {
  color: texLoader.load("/textures/bricks058/Bricks058_2K-JPG_Color.jpg"),
  normal: texLoader.load("/textures/bricks058/Bricks058_2K-JPG_NormalDX.jpg"),
  rough:  texLoader.load("/textures/bricks058/Bricks058_2K-JPG_Roughness.jpg"),
  // NOTE: AO on BoxGeometry needs uv2; we skip it for walls built from boxes.
  // ao:  texLoader.load("/textures/bricks058/Bricks058_2K-JPG_AmbientOcclusion.jpg"),
};
if (bricks058.color) bricks058.color.colorSpace = THREE.SRGBColorSpace;

/**
 * Create a MeshStandardMaterial for a wall panel with Bricks058,
 * with texture repeats derived from the panel's size (meters).
 * @param {number} panelWidth
 * @param {number} panelHeight
 * @param {object} opts - { repeatsPerMeterX, repeatsPerMeterY, metalness, roughness, anisotropy }
 */
export function makeBrickMaterialForPanel(
  panelWidth,
  panelHeight,
  opts = {}
) {
  const {
    repeatsPerMeterX = 0.7,   // increase for smaller bricks
    repeatsPerMeterY = 0.7,
    metalness = 0.0,
    roughness = 1.0,
    anisotropy = 8,
  } = opts;

  // clone textures so each panel can have its own tiling
  const map        = bricks058.color.clone();
  const normalMap  = bricks058.normal.clone();
  const roughnessMap = bricks058.rough.clone();

  [map, normalMap, roughnessMap].forEach(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(
      Math.max(1, Math.round(panelWidth  * repeatsPerMeterX)),
      Math.max(1, Math.round(panelHeight * repeatsPerMeterY)),
    );
    t.anisotropy = anisotropy;
    t.needsUpdate = true;
  });

  return new THREE.MeshStandardMaterial({
    map,
    normalMap,
    roughnessMap,
    metalness,
    roughness,
  });
}

/* =========================
   Tiles108 (floor)
   ========================= */
const tiles108 = {
  color: texLoader.load("/textures/tiles108/Tiles108_2K-JPG_Color.jpg"),
  normal: texLoader.load("/textures/tiles108/Tiles108_2K-JPG_NormalDX.jpg"),
  rough:  texLoader.load("/textures/tiles108/Tiles108_2K-JPG_Roughness.jpg"),
  ao:     texLoader.load("/textures/tiles108/Tiles108_2K-JPG_AmbientOcclusion.jpg"),
};
if (tiles108.color) tiles108.color.colorSpace = THREE.SRGBColorSpace;

function setRepeats(t, repX, repZ, anisotropy = 8) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repX, repZ);
  t.anisotropy = anisotropy;
  t.needsUpdate = true;
}

/**
 * Build a single tiled Plane mesh for the floor using Tiles108.
 * Adds uv2 for AO. Returns a THREE.Mesh ready to add to the room group.
 * @param {number} roomWidth
 * @param {number} roomDepth
 * @param {object} opts - { tileSizeMeters, anisotropy }
 */
export function makeTiles108Floor(
  roomWidth,
  roomDepth,
  opts = {}
) {
  const { tileSizeMeters = 1.0, anisotropy = 12 } = opts;

  const repeatX = Math.max(1, Math.round(roomWidth  / tileSizeMeters));
  const repeatZ = Math.max(1, Math.round(roomDepth / tileSizeMeters));

  // geometry
  const geo = new THREE.PlaneGeometry(roomWidth, roomDepth, 1, 1);
  // AO requires uv2; duplicate uv into uv2
  geo.setAttribute("uv2", new THREE.BufferAttribute(geo.attributes.uv.array, 2));

  // repeats
  setRepeats(tiles108.color,  repeatX, repeatZ, anisotropy);
  setRepeats(tiles108.normal, repeatX, repeatZ, anisotropy);
  setRepeats(tiles108.rough,  repeatX, repeatZ, anisotropy);
  setRepeats(tiles108.ao,     repeatX, repeatZ, anisotropy);

  const mat = new THREE.MeshStandardMaterial({
    map: tiles108.color,
    normalMap: tiles108.normal,
    roughnessMap: tiles108.rough,
    aoMap: tiles108.ao,
    metalness: 0.0,
    roughness: 1.0,
  });

  const floor = new THREE.Mesh(geo, mat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;

  return floor;
}

// ======= Metal030 (flexible) ==================================

function _tryLoad(path) {
  if (!path) return null;
  try {
    const t = texLoader.load(path);
    return t;
  } catch {
    console.warn("[Metal030] Missing texture:", path);
    return null;
  }
}

function _setRepeatsIf(t, repU, repV, anisotropy = 12) {
  if (!t) return;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repU, repV);
  t.anisotropy = anisotropy;
  t.needsUpdate = true;
}

/**
 * Make a Metal030 material for cylinders using WHATEVER maps are available.
 * Pass in the filenames you actually have; missing ones are skipped.
 *
 * files = {
 *   color: "/textures/metal030/Metal030_2K-JPG_Color.jpg",
 *   normal: "/textures/metal030/Metal030_2K-JPG_NormalDX.jpg",
 *   rough: "/textures/metal030/Metal030_2K-JPG_Roughness.jpg",
 *   metal: "/textures/metal030/Metal030_2K-JPG_Metalness.jpg",   // optional
 *   ao:    "/textures/metal030/Metal030_2K-JPG_AmbientOcclusion.jpg" // optional
 * }
 */
export function makeMetal030MaterialForCylinderFlexible(
  radius,
  height,
  files,
  opts = {}
) {
  const {
    uScale = 0.4,
    vScale = 0.4,
    metalness = 1.0,
    roughness = 1.0,
    anisotropy = 12,
    aoMapIntensity = 1.6,
    attachAOToGeometry = null, // pass your CylinderGeometry if you DO have ao
  } = opts;

  const circumference = 2 * Math.PI * radius;
  const repU = Math.max(1, Math.round(circumference / uScale));
  const repV = Math.max(1, Math.round(height / vScale));

  // Load only what exists
  const map   = _tryLoad(files.color);
  const nMap  = _tryLoad(files.normal);
  const rMap  = _tryLoad(files.rough);
  const mMap  = _tryLoad(files.metal);
  const aMap  = _tryLoad(files.ao);

  if (map) map.colorSpace = THREE.SRGBColorSpace;

  // Set repeats where present
  _setRepeatsIf(map,  repU, repV, anisotropy);
  _setRepeatsIf(nMap, repU, repV, anisotropy);
  _setRepeatsIf(rMap, repU, repV, anisotropy);
  _setRepeatsIf(mMap, repU, repV, anisotropy);
  _setRepeatsIf(aMap, repU, repV, anisotropy);

  // Only add uv2 if we actually have an AO map
  if (aMap && attachAOToGeometry?.attributes?.uv && !attachAOToGeometry.attributes.uv2) {
    attachAOToGeometry.setAttribute(
      "uv2",
      new THREE.Float32BufferAttribute(attachAOToGeometry.attributes.uv.array, 2)
    );
  }

  const mat = new THREE.MeshStandardMaterial({
    map: map || null,
    normalMap: nMap || null,
    roughnessMap: rMap || null,
    metalnessMap: mMap || null,
    aoMap: aMap || null,
    metalness, // will be modulated if metalnessMap present
    roughness, // will be modulated if roughnessMap present
  });

  if (aMap) mat.aoMapIntensity = aoMapIntensity;
  mat.needsUpdate = true;
  return mat;
}

// ======= Concrete031 (flexible) ==================================

/**
 * Make a Concrete031 material for planes/boxes using WHATEVER maps are available.
 * Pass in the filenames you actually have; missing ones are skipped.
 *
 * files = {
 *   color: "/textures/concrete031/Concrete031_2K-JPG_Color.jpg",
 *   normal: "/textures/concrete031/Concrete031_2K-JPG_NormalGL.jpg",
 *   rough: "/textures/concrete031/Concrete031_2K-JPG_Roughness.jpg",
 *   ao: "/textures/concrete031/Concrete031_2K-JPG_AmbientOcclusion.jpg", // optional
 * }
 */
export function makeConcrete031MaterialFlexible(
  width,
  height,
  files,
  opts = {}
) {
  const {
    uScale = 0.5,
    vScale = 0.5,
    metalness = 0.0,
    roughness = 1.0,
    anisotropy = 12,
    aoMapIntensity = 1.6,
    attachAOToGeometry = null, // pass your geometry if you DO have ao
  } = opts;

  const repU = Math.max(1, Math.round(width / uScale));
  const repV = Math.max(1, Math.round(height / vScale));

  // Load only what exists
  const map   = _tryLoad(files.color);
  const nMap  = _tryLoad(files.normal);
  const rMap  = _tryLoad(files.rough);
  const aMap  = _tryLoad(files.ao);

  if (map) map.colorSpace = THREE.SRGBColorSpace;

  // Set repeats where present
  _setRepeatsIf(map,  repU, repV, anisotropy);
  _setRepeatsIf(nMap, repU, repV, anisotropy);
  _setRepeatsIf(rMap, repU, repV, anisotropy);
  _setRepeatsIf(aMap, repU, repV, anisotropy);

  // Only add uv2 if we actually have an AO map
  if (aMap && attachAOToGeometry?.attributes?.uv && !attachAOToGeometry.attributes.uv2) {
    attachAOToGeometry.setAttribute(
      "uv2",
      new THREE.Float32BufferAttribute(attachAOToGeometry.attributes.uv.array, 2)
    );
  }

  const mat = new THREE.MeshStandardMaterial({
    map: map || null,
    normalMap: nMap || null,
    roughnessMap: rMap || null,
    aoMap: aMap || null,
    metalness,
    roughness,
  });

  if (aMap) mat.aoMapIntensity = aoMapIntensity;
  mat.needsUpdate = true;
  return mat;
}