/**
 * @typedef {Object} Bounds
 * @property {number} minLat - Minimum latitude
 * @property {number} maxLat - Maximum latitude
 * @property {number} minLon - Minimum longitude
 * @property {number} maxLon - Maximum longitude
 */

/**
 * Default equirectangular projection bounds (full world)
 */
export const EQUIRECT_BOUNDS = { 
  minLat: -90, 
  maxLat: 90, 
  minLon: -180, 
  maxLon: 180 
};

/**
 * Project latitude/longitude to pixel coordinates using equirectangular projection
 * 
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lon - Longitude (-180 to 180)
 * @param {number} width - Map panel width in pixels
 * @param {number} height - Map panel height in pixels
 * @param {Bounds} [bounds=EQUIRECT_BOUNDS] - Map bounds (for cropped maps)
 * @returns {{x: number, y: number}} Pixel coordinates
 */
export function projectEquirectangular(lat, lon, width, height, bounds = EQUIRECT_BOUNDS) {
  // Clamp coordinates to bounds to avoid rendering off-panel
  const clampedLat = Math.max(bounds.minLat, Math.min(bounds.maxLat, lat));
  const clampedLon = Math.max(bounds.minLon, Math.min(bounds.maxLon, lon));
  
  // Normalize to 0-1 range within bounds
  const normalizedLon = (clampedLon - bounds.minLon) / (bounds.maxLon - bounds.minLon);
  const normalizedLat = (bounds.maxLat - clampedLat) / (bounds.maxLat - bounds.minLat);
  
  // Scale to pixel coordinates
  const x = normalizedLon * width;
  const y = normalizedLat * height;
  
  return { x, y };
}

/**
 * Normalize coordinate format from various sources
 * Handles both {lat, lon} and legacy {coords: [lat, lon]} formats
 * 
 * @param {{lat?: number, lon?: number, coords?: [number, number]}} org - Organization data
 * @returns {{lat: number, lon: number} | null} Normalized coordinates or null if missing/distributed
 */
export function toLatLon(org) {
  if (typeof org.lat === 'number' && typeof org.lon === 'number') {
    return { lat: org.lat, lon: org.lon };
  }
  
  if (Array.isArray(org.coords) && org.coords.length === 2) {
    return { lat: org.coords[0], lon: org.coords[1] };
  }
  
  return null; // Distributed or missing coordinates
}

/**
 * Check if an organization should have a map marker
 * 
 * @param {import('../data/aiOrgs.js').AIOrg} org - Organization data
 * @returns {org is import('../data/aiOrgs.js').AIOrg & {lat: number, lon: number}} - True if plottable
 */
export function isPlottable(org) {
  if (org.distributed) {
    return false;
  }
  
  const coords = toLatLon(org);
  return coords !== null && 
         typeof coords.lat === 'number' && 
         typeof coords.lon === 'number' &&
         !isNaN(coords.lat) && 
         !isNaN(coords.lon);
}

