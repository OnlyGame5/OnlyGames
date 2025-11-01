/**
 * Performance Settings System
 * Manages rendering quality and performance optimizations
 */

import * as THREE from 'three';

export class PerformanceSettings {
  constructor() {
    this.settings = {
      quality: 'high', // Default to high quality (was medium)
      pixelRatio: null,
      shadows: null,
      antialiasing: null,
      toneMapping: null
    };
    
    // Track if user has manually set quality (prevents auto-downgrade)
    this.userManuallySetQuality = false;
    
    console.log('PerformanceSettings: Initial settings:', { ...this.settings });
    
    // Load saved settings
    this.loadSettings();
    
    console.log('PerformanceSettings: After loading from localStorage:', { ...this.settings });
    
    // Force high quality if no valid quality is set or if it was auto/potato from old detection
    const validQualities = ['medium', 'high', 'potato'];
    // Migrate old quality names to new ones
    const oldQuality = this.settings.quality;
    if (oldQuality === 'low') {
      this.settings.quality = 'medium'; // old 'low' -> new 'medium'
      console.log(`Migrated quality from 'low' to 'medium'`);
      this.saveSettings();
    } else if (oldQuality === 'medium') {
      this.settings.quality = 'high'; // old 'medium' -> new 'high'
      console.log(`Migrated quality from 'medium' to 'high'`);
      this.saveSettings();
    } else if (oldQuality === 'high') {
      this.settings.quality = 'high'; // old 'high' -> new 'high' (which uses old 'medium' settings)
      console.log(`Migrated old 'high' quality to new 'high' (using previous medium settings)`);
      this.saveSettings();
    }
    if (!validQualities.includes(this.settings.quality) || this.settings.quality === 'auto') {
      console.log(`PerformanceSettings: Invalid quality "${this.settings.quality}", forcing to high`);
      this.settings.quality = 'high';
      this.saveSettings(); // Save the high quality default
    }
    
    console.log('PerformanceSettings: Final quality setting:', this.settings.quality);
  }
  
  /**
   * Detect optimal quality based on hardware
   */
  detectOptimalQuality() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const cores = navigator.hardwareConcurrency || 4;
    const memoryGB = navigator.deviceMemory || 4;
    
    // Score the hardware (0-10 scale)
    let score = 5; // baseline
    
    // CPU cores
    if (cores >= 8) score += 2;
    else if (cores >= 6) score += 1;
    else if (cores <= 2) score -= 2;
    else if (cores <= 4) score -= 1;
    
    // Memory
    if (memoryGB >= 8) score += 2;
    else if (memoryGB >= 6) score += 1;
    else if (memoryGB <= 2) score -= 2;
    else if (memoryGB <= 4) score -= 1;
    
    // Display
    if (devicePixelRatio >= 2) score += 1;
    else if (devicePixelRatio < 1) score -= 1;
    
    // GPU detection (rough approximation)
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const renderer = gl.getParameter(gl.RENDERER);
      if (renderer.includes('Intel') && renderer.includes('HD')) {
        score -= 2; // Integrated Intel graphics
      } else if (renderer.includes('GeForce') || renderer.includes('Radeon')) {
        score += 1; // Dedicated graphics
      }
    }
    
    console.log(`Hardware score: ${score} (cores: ${cores}, memory: ${memoryGB}GB, pixelRatio: ${devicePixelRatio})`);
    
    // Determine quality level (removed old 'high', now we have: high, medium, potato)
    if (score >= 6) return 'high'; // Was medium, now high
    if (score >= 3) return 'medium'; // Was low, now medium
    return 'potato'; // Ultra-low for very weak hardware
  }
  
  /**
   * Apply settings to renderer
   */
  applyToRenderer(renderer) {
    const quality = this.settings.quality;
    const profiles = this.getQualityProfiles();
    const profile = profiles[quality] || profiles.high; // Default to high (was medium)
    
    console.log(`Applying ${quality} quality profile:`, profile);
    
    // Pixel ratio
    renderer.setPixelRatio(profile.pixelRatio);
    
    // Shadows
    renderer.shadowMap.enabled = profile.shadows.enabled;
    if (profile.shadows.enabled) {
      renderer.shadowMap.type = profile.shadows.type;
    }
    
    // Additional renderer settings
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = profile.toneMapping;
    renderer.toneMappingExposure = profile.exposure;
    renderer.info.autoReset = false;
    renderer.sortObjects = !profile.optimizations.disableObjectSorting;
    renderer.physicallyCorrectLights = profile.lighting.physicallyCorrect;
    
    // Store applied settings for UI display
    this.appliedProfile = profile;
    
    return profile;
  }
  
  /**
   * Get quality profiles
   */
  getQualityProfiles() {
    const maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    
    return {
      potato: {
        name: 'Potato Mode',
        description: 'Ultra-low settings for very weak hardware',
        pixelRatio: 0.5,
        shadows: {
          enabled: false,
          type: THREE.BasicShadowMap
        },
        lighting: {
          physicallyCorrect: false
        },
        toneMapping: THREE.LinearToneMapping,
        exposure: 1.0,
        optimizations: {
          disableObjectSorting: true,
          reducedParticles: true,
          simplifiedMaterials: true
        }
      },
      medium: {
        name: 'Medium Quality',
        description: 'Basic settings for integrated graphics',
        pixelRatio: 0.75,
        shadows: {
          enabled: false,
          type: THREE.BasicShadowMap
        },
        lighting: {
          physicallyCorrect: false
        },
        toneMapping: THREE.LinearToneMapping,
        exposure: 1.0,
        optimizations: {
          disableObjectSorting: true,
          reducedParticles: true,
          simplifiedMaterials: false
        }
      },
      high: {
        name: 'High Quality',
        description: 'Balanced settings for most hardware',
        pixelRatio: Math.min(maxPixelRatio, 1.0),
        shadows: {
          enabled: true,
          type: THREE.BasicShadowMap
        },
        lighting: {
          physicallyCorrect: false
        },
        toneMapping: THREE.ACESFilmicToneMapping,
        exposure: 0.9,
        optimizations: {
          disableObjectSorting: false,
          reducedParticles: false,
          simplifiedMaterials: false
        }
      }
    };
  }
  
  /**
   * Set quality level
   * @param {string} quality - Quality level to set
   * @param {boolean} isManual - Whether this is a manual user selection (default: true)
   */
  setQuality(quality, isManual = true) {
    this.settings.quality = quality;
    // Track if user manually set this quality level
    if (isManual) {
      this.userManuallySetQuality = true;
    }
    this.saveSettings();
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('performanceSettingsChanged', {
      detail: { quality, profile: this.getQualityProfiles()[quality] }
    }));
  }
  
  /**
   * Check if user has manually set quality (prevents auto-downgrade)
   */
  isManuallySet() {
    return this.userManuallySetQuality;
  }
  
  /**
   * Get current quality
   */
  getQuality() {
    return this.settings.quality;
  }
  
  /**
   * Get quality profile info
   */
  getQualityInfo(quality = null) {
    const q = quality || this.settings.quality;
    const profiles = this.getQualityProfiles();
    return profiles[q] || profiles.high; // Default to high (was medium)
  }
  
  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      const toSave = {
        ...this.settings,
        userManuallySetQuality: this.userManuallySetQuality
      };
      localStorage.setItem('performanceSettings', JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to save performance settings:', e);
    }
  }
  
  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('performanceSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
        // Restore manual setting flag
        this.userManuallySetQuality = parsed.userManuallySetQuality || false;
      }
    } catch (e) {
      console.warn('Failed to load performance settings:', e);
    }
  }
  
  /**
   * Reset to auto-detected settings
   */
  resetToAuto() {
    this.settings.quality = this.detectOptimalQuality();
    this.userManuallySetQuality = false; // Auto-detection is not manual
    this.saveSettings();
    
    window.dispatchEvent(new CustomEvent('performanceSettingsChanged', {
      detail: { quality: this.settings.quality, profile: this.getQualityInfo() }
    }));
  }
  
  /**
   * Reset to high quality (clear any saved settings)
   */
  resetToHigh() {
    this.settings.quality = 'high';
    this.userManuallySetQuality = true; // User is manually resetting to high
    this.saveSettings();
    
    window.dispatchEvent(new CustomEvent('performanceSettingsChanged', {
      detail: { quality: this.settings.quality, profile: this.getQualityInfo() }
    }));
  }
  
  /**
   * Clear all saved settings and reset to defaults
   */
  clearSavedSettings() {
    try {
      localStorage.removeItem('performanceSettings');
      this.settings.quality = 'high';
      this.userManuallySetQuality = false; // Clearing means no manual preference
      console.log('Performance settings cleared, defaulting to high quality');
    } catch (e) {
      console.warn('Failed to clear performance settings:', e);
    }
  }
  
  /**
   * Get performance stats for display
   */
  getPerformanceStats() {
    const profile = this.appliedProfile || this.getQualityInfo();
    return {
      quality: this.settings.quality,
      pixelRatio: profile.pixelRatio,
      shadows: profile.shadows.enabled,
      physicalLighting: profile.lighting.physicallyCorrect,
      toneMapping: profile.toneMapping === THREE.ACESFilmicToneMapping ? 'ACES Filmic' : 'Linear'
    };
  }
}

// Global instance
export const performanceSettings = new PerformanceSettings();

// Expose to global scope for debugging
window.performanceSettings = performanceSettings;