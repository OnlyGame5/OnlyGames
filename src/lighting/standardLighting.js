// src/lighting/standardLighting.js
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

/**
 * Ensure renderer is in a sane, modern color pipeline.
 * Call once at app init (e.g., after you create the renderer).
 */
export function setupRendererColorPipeline(renderer) {
  if (!renderer) return;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
}

/**
 * Optional: set an environment map for soft GI/reflections.
 * If options.hdrPath provided => load HDR, else use RoomEnvironment.
 * Returns a Promise that resolves to the PMREM env (or null on failure).
 */
export async function applyEnvironment(scene, renderer, options = {}) {
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    if (options?.hdrPath) {
      const hdr = await new Promise((resolve, reject) =>
        new RGBELoader().load(options.hdrPath, resolve, undefined, reject)
      );
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      const env = pmrem.fromEquirectangular(hdr).texture;
      scene.environment = env;
      hdr.dispose?.();
      return env;
    } else {
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = env;
      return env;
    }
  } catch (e) {
    console.warn("[applyEnvironment] failed:", e);
    return null;
  }
}

/**
 * Build a standard, performant rig ON a group or directly on the scene.
 * - One shadowed key (directional)
 * - Hemisphere fill (no shadows)
 * - Optional accent spots (off by default)
 * Existing lights can be removed by caller before/after.
 *
 * @returns {THREE.Group} lightsGroup (so you can add/remove in one go)
 */
export function buildStandardLightRig({
  keyPosition = new THREE.Vector3(10, 18, 8),
  keyIntensity = 1.15,
  hemiIntensity = 0.35,
  hemiSky = 0xbdd3ff,
  hemiGround = 0x1a1f2a,
  shadowMap = 1024,
  shadowBounds = 14, // ortho shadow camera extents
  enableAccents = false,
} = {}) {
  const lights = new THREE.Group();
  lights.name = "StandardLightRig";

  // Hemisphere (fill, no shadow)
  const hemi = new THREE.HemisphereLight(hemiSky, hemiGround, hemiIntensity);
  lights.add(hemi);

  // Directional key (shadows)
  const dir = new THREE.DirectionalLight(0xffffff, keyIntensity);
  dir.position.copy(keyPosition);
  dir.castShadow = true;
  dir.shadow.mapSize.set(shadowMap, shadowMap);
  dir.shadow.camera.near = 0.5;
  dir.shadow.camera.far = 80;
  const s = shadowBounds;
  dir.shadow.camera.left = -s;
  dir.shadow.camera.right = s;
  dir.shadow.camera.top = s;
  dir.shadow.camera.bottom = -s;
  dir.shadow.bias = -0.00015;
  lights.add(dir);

  if (enableAccents) {
    const spot = new THREE.SpotLight(0x88aaff, 0.35, 25, Math.PI / 5, 0.5);
    spot.position.set(0, 6, -4);
    spot.castShadow = false;
    lights.add(spot);
  }

  return lights;
}

/**
 * Convenience: remove all existing lights under a root (group/scene).
 */
export function removeExistingLights(root) {
  const toRemove = [];
  root.traverse((obj) => {
    if (obj.isLight) toRemove.push(obj);
  });
  toRemove.forEach((l) => l.parent && l.parent.remove(l));
}
