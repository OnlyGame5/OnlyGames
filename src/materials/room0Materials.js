// src/materials/room0Materials.js
import * as THREE from "three";
import { textureCache } from '../utils/TextureCache.js';

/* =========================
   Bricks058 (walls)
   ========================= */
// Lazy-loaded texture cache for Bricks058
let bricks058 = null;

function getBricks058Textures() {
  if (!bricks058) {
    bricks058 = {
      color: textureCache.load("/textures/bricks058/Bricks058_2K-JPG_Color.jpg", { 
        colorSpace: THREE.SRGBColorSpace 
      }),
      normal: textureCache.load("/textures/bricks058/Bricks058_2K-JPG_NormalDX.jpg"),
      rough: textureCache.load("/textures/bricks058/Bricks058_2K-JPG_Roughness.jpg"),
      // NOTE: AO on BoxGeometry needs uv2; we skip it for walls built from boxes.
    };
  }
  return bricks058;
}

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

  // Get cached textures and clone for individual tiling
  const textures = getBricks058Textures();
  const map        = textures.color.clone();
  const normalMap  = textures.normal.clone();
  const roughnessMap = textures.rough.clone();

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
// Lazy-loaded texture cache for Tiles108
let tiles108 = null;

function getTiles108Textures() {
  if (!tiles108) {
    tiles108 = {
      color: textureCache.load("/textures/tiles108/Tiles108_2K-JPG_Color.jpg", {
        colorSpace: THREE.SRGBColorSpace
      }),
      normal: textureCache.load("/textures/tiles108/Tiles108_2K-JPG_NormalDX.jpg"),
      rough: textureCache.load("/textures/tiles108/Tiles108_2K-JPG_Roughness.jpg"),
      ao: textureCache.load("/textures/tiles108/Tiles108_2K-JPG_AmbientOcclusion.jpg"),
    };
  }
  return tiles108;
}

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
  const { tileSizeMeters = 1.0, anisotropy = 4 } = opts; // Reduced from 12 to 4 for performance

  const repeatX = Math.max(1, Math.round(roomWidth  / tileSizeMeters));
  const repeatZ = Math.max(1, Math.round(roomDepth / tileSizeMeters));

  // geometry
  const geo = new THREE.PlaneGeometry(roomWidth, roomDepth, 1, 1);
  // AO requires uv2; duplicate uv into uv2
  geo.setAttribute("uv2", new THREE.BufferAttribute(geo.attributes.uv.array, 2));

  // Get cached textures
  const textures = getTiles108Textures();

  // repeats
  setRepeats(textures.color,  repeatX, repeatZ, anisotropy);
  setRepeats(textures.normal, repeatX, repeatZ, anisotropy);
  // setRepeats(textures.rough,  repeatX, repeatZ, anisotropy); // Removed to eliminate reflections
  setRepeats(textures.ao,     repeatX, repeatZ, anisotropy);

  const mat = new THREE.MeshBasicMaterial({
    map: textures.color,
    color: 0x888888, // Override texture color to fix reflective/grey tile issue
    // aoMap: textures.ao, // AO map doesn't work with MeshBasicMaterial
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
    const t = textureCache.load(path);
    return t;
  } catch {
    console.warn("[Metal030] Missing texture:", path);
    return null;
  }
}

function _setRepeatsIf(t, repU, repV, anisotropy = 4) { // Reduced from 12 to 4 for performance
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
    anisotropy = 4, // Reduced from 12 to 4 for performance
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
    anisotropy = 4, // Reduced from 12 to 4 for performance
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