// src/utils/TextureCache.js
import * as THREE from 'three';

/**
 * TextureCache - Singleton for loading and caching textures
 * Prevents loading the same texture multiple times
 */
class TextureCache {
  constructor() {
    this.cache = new Map();
    this.loader = new THREE.TextureLoader();
    this.loadingPromises = new Map(); // Track in-progress loads
  }

  /**
   * Load a texture with caching
   * @param {string} url - Texture URL
   * @param {Object} options - Texture configuration options
   * @returns {THREE.Texture} Cached or newly loaded texture
   */
  load(url, options = {}) {
    const cacheKey = this.getCacheKey(url, options);
    
    // Return cached texture if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Load texture
    const texture = this.loader.load(url);
    
    // Apply options
    this.applyTextureOptions(texture, options);
    
    // Cache it
    this.cache.set(cacheKey, texture);
    
    return texture;
  }

  /**
   * Load a texture asynchronously with caching
   * @param {string} url - Texture URL
   * @param {Object} options - Texture configuration options
   * @returns {Promise<THREE.Texture>} Promise that resolves to the texture
   */
  async loadAsync(url, options = {}) {
    const cacheKey = this.getCacheKey(url, options);
    
    // Return cached texture if available
    if (this.cache.has(cacheKey)) {
      return Promise.resolve(this.cache.get(cacheKey));
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // Start loading
    const loadPromise = new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          this.applyTextureOptions(texture, options);
          this.cache.set(cacheKey, texture);
          this.loadingPromises.delete(cacheKey);
          resolve(texture);
        },
        undefined,
        (error) => {
          this.loadingPromises.delete(cacheKey);
          reject(error);
        }
      );
    });

    this.loadingPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Apply texture options (wrapping, repeat, anisotropy, etc.)
   * @param {THREE.Texture} texture - The texture to configure
   * @param {Object} options - Configuration options
   */
  applyTextureOptions(texture, options) {
    const {
      wrapS = THREE.RepeatWrapping,
      wrapT = THREE.RepeatWrapping,
      repeat = null,
      anisotropy = 1,
      colorSpace = null,
      generateMipmaps = true
    } = options;

    texture.wrapS = wrapS;
    texture.wrapT = wrapT;
    
    if (repeat) {
      texture.repeat.set(repeat.x, repeat.y);
    }
    
    texture.anisotropy = anisotropy;
    texture.generateMipmaps = generateMipmaps;
    
    if (colorSpace) {
      texture.colorSpace = colorSpace;
    }
  }

  /**
   * Generate cache key from URL and options
   * @param {string} url - Texture URL
   * @param {Object} options - Options (only some affect caching)
   * @returns {string} Cache key
   */
  getCacheKey(url, options) {
    // Only cache based on URL - options can be applied after
    // This allows sharing the same texture with different repeat values
    return url;
  }

  /**
   * Get a cached texture (returns null if not cached)
   * @param {string} url - Texture URL
   * @returns {THREE.Texture|null} Cached texture or null
   */
  get(url) {
    return this.cache.get(url) || null;
  }

  /**
   * Check if a texture is cached
   * @param {string} url - Texture URL
   * @returns {boolean} True if cached
   */
  has(url) {
    return this.cache.has(url);
  }

  /**
   * Clear all cached textures and dispose of them
   */
  clearAll() {
    this.cache.forEach((texture) => {
      texture.dispose();
    });
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Clear a specific texture from cache
   * @param {string} url - Texture URL
   */
  clear(url) {
    if (this.cache.has(url)) {
      const texture = this.cache.get(url);
      texture.dispose();
      this.cache.delete(url);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      cachedTextures: this.cache.size,
      loading: this.loadingPromises.size,
      urls: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const textureCache = new TextureCache();

// Also export the class for testing purposes
export { TextureCache };

