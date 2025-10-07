// src/utils/DisposeHelper.js
import * as THREE from 'three';

/**
 * Utility to properly dispose of THREE.js resources and prevent memory leaks
 */

/**
 * Recursively dispose of all geometries and materials in a THREE.Object3D
 * @param {THREE.Object3D} object - The object to dispose
 * @param {boolean} removeFromParent - Whether to remove from parent after disposal
 */
export function disposeObject(object, removeFromParent = true) {
  if (!object) return;

  // Dispose geometry
  if (object.geometry) {
    object.geometry.dispose();
  }

  // Dispose material(s)
  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach(material => disposeMaterial(material));
    } else {
      disposeMaterial(object.material);
    }
  }

  // Recursively dispose children
  if (object.children && object.children.length > 0) {
    // Create a copy of children array since we're modifying it
    const children = [...object.children];
    children.forEach(child => {
      disposeObject(child, true);
    });
  }

  // Remove from parent if requested
  if (removeFromParent && object.parent) {
    object.parent.remove(object);
  }
}

/**
 * Dispose of a material and its textures
 * @param {THREE.Material} material - The material to dispose
 */
export function disposeMaterial(material) {
  if (!material) return;

  // Dispose all texture maps
  const textureProperties = [
    'map',
    'normalMap',
    'roughnessMap',
    'metalnessMap',
    'aoMap',
    'emissiveMap',
    'bumpMap',
    'displacementMap',
    'specularMap',
    'envMap',
    'lightMap',
    'alphaMap'
  ];

  textureProperties.forEach(prop => {
    if (material[prop] && material[prop].dispose) {
      // Only dispose texture if it's not from cache
      // Cached textures are managed separately
      // We can identify them by checking if they have a cached flag
      if (!material[prop]._isCached) {
        material[prop].dispose();
      }
    }
  });

  // Dispose the material itself
  material.dispose();
}

/**
 * Dispose of a group and all its contents
 * @param {THREE.Group} group - The group to dispose
 */
export function disposeGroup(group) {
  if (!group) return;

  disposeObject(group, false);

  // Clear the group
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
}

/**
 * Dispose of a room object created by room factory functions
 * @param {Object} room - Room object with group and other properties
 */
export function disposeRoom(room) {
  if (!room) return;

  // Call room's own dispose if it exists
  if (typeof room.dispose === 'function') {
    room.dispose();
    return;
  }

  // Otherwise, dispose the group
  if (room.group) {
    disposeGroup(room.group);
  }

  // Clear all references
  Object.keys(room).forEach(key => {
    if (key !== 'group') {
      room[key] = null;
    }
  });
}

/**
 * Dispose of an animation mixer and its actions
 * @param {THREE.AnimationMixer} mixer - The mixer to dispose
 */
export function disposeAnimationMixer(mixer) {
  if (!mixer) return;

  mixer.stopAllAction();
  mixer.uncacheRoot(mixer.getRoot());
}

/**
 * Remove event listeners from DOM elements
 * @param {HTMLElement} element - The element to clean up
 */
export function removeElementListeners(element) {
  if (!element) return;

  // Clone and replace to remove all event listeners
  const newElement = element.cloneNode(true);
  if (element.parentNode) {
    element.parentNode.replaceChild(newElement, element);
  }
  return newElement;
}

/**
 * Safely remove a DOM element
 * @param {string|HTMLElement} element - Element or element ID to remove
 */
export function removeElement(element) {
  if (!element) return;

  const el = typeof element === 'string' ? document.getElementById(element) : element;
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

