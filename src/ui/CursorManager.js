/**
 * Global Cursor Management System
 * Handles cursor visibility across all game states and UI elements
 */
class CursorManager {
  constructor() {
    this.isPointerLocked = false;
    this.isUIVisible = false;
    this.isMenuOpen = false;
    this.forceCursorVisible = false;
    this.lookModeActive = false;
    this.cursorCheckInterval = null;
    
    this.init();
  }
  
  init() {
    // Listen for pointer lock changes
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === document.body;
      this.updateCursorState();
    });
    
    // Listen for pointer lock errors
    document.addEventListener('pointerlockerror', () => {
      console.log('Pointer lock error - ensuring cursor is visible');
      this.forceCursorVisible = true;
      this.updateCursorState();
    });
    
    // Start continuous cursor monitoring
    this.startCursorMonitoring();
    
    console.log('CursorManager initialized');
  }
  
  /**
   * Set UI visibility state
   */
  setUIVisible(visible) {
    this.isUIVisible = visible;
    this.updateCursorState();
  }
  
  /**
   * Set menu open state
   */
  setMenuOpen(open) {
    this.isMenuOpen = open;
    this.updateCursorState();
  }
  
  /**
   * Set look mode active state
   */
  setLookModeActive(active) {
    this.lookModeActive = active;
    this.updateCursorState();
  }
  
  /**
   * Force cursor to be visible (for UI interactions)
   */
  forceShowCursor() {
    this.forceCursorVisible = true;
    this.updateCursorState();
  }
  
  /**
   * Allow cursor to be hidden (for gameplay)
   */
  allowHideCursor() {
    this.forceCursorVisible = false;
    this.updateCursorState();
  }
  
  /**
   * Update cursor state based on current game state
   */
  updateCursorState() {
    // Clear any existing cursor styles
    this.clearCursorStyles();
    
    // Determine if cursor should be visible
    // Don't show cursor if look mode is intentionally active
    const shouldShowCursor = (this.isUIVisible || this.isMenuOpen || this.forceCursorVisible) && !this.lookModeActive;
    
    if (shouldShowCursor) {
      this.showCursor();
    } else {
      this.hideCursor();
    }
  }
  
  /**
   * Show cursor with proper styling
   */
  showCursor() {
    // Only exit pointer lock if look mode is not intentionally active
    if (document.pointerLockElement && !this.lookModeActive) {
      document.exitPointerLock();
    }
    
    // Set cursor styles
    document.body.style.cursor = 'default';
    document.documentElement.style.cursor = 'default';
    
    // Add CSS to ensure cursor is visible
    this.addCursorCSS();
    
    console.log('CursorManager: Cursor shown');
  }
  
  /**
   * Hide cursor for gameplay
   */
  hideCursor() {
    // Only hide if not forcing visibility
    if (!this.forceCursorVisible) {
      document.body.style.cursor = 'none';
      document.documentElement.style.cursor = 'none';
      this.removeCursorCSS();
      
      console.log('CursorManager: Cursor hidden');
    }
  }
  
  /**
   * Add CSS to force cursor visibility
   */
  addCursorCSS() {
    // Remove existing cursor CSS
    this.removeCursorCSS();
    
    const style = document.createElement('style');
    style.id = 'cursor-manager-css';
    style.textContent = `
      * {
        cursor: default !important;
      }
      body {
        cursor: default !important;
      }
      html {
        cursor: default !important;
      }
      input, button, select, textarea, [role="button"] {
        cursor: default !important;
      }
      .menu-button, .settings-button, .key-cell, .inventory-slot {
        cursor: default !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Remove cursor CSS
   */
  removeCursorCSS() {
    const existingStyle = document.getElementById('cursor-manager-css');
    if (existingStyle) {
      existingStyle.remove();
    }
  }
  
  /**
   * Clear all cursor styles
   */
  clearCursorStyles() {
    document.body.style.cursor = '';
    document.documentElement.style.cursor = '';
    this.removeCursorCSS();
  }
  
  /**
   * Start continuous cursor monitoring
   */
  startCursorMonitoring() {
    if (this.cursorCheckInterval) {
      clearInterval(this.cursorCheckInterval);
    }
    
    this.cursorCheckInterval = setInterval(() => {
      // Check if cursor should be visible
      const shouldShowCursor = this.isUIVisible || this.isMenuOpen || this.forceCursorVisible;
      
      if (shouldShowCursor) {
        // Ensure cursor is visible
        document.body.style.cursor = 'default';
        document.documentElement.style.cursor = 'default';
        
        // Force cursor on interactive elements
        const interactiveElements = document.querySelectorAll(
          'input, button, select, textarea, [role="button"], .menu-button, .settings-button, .key-cell, .inventory-slot'
        );
        interactiveElements.forEach(element => {
          element.style.cursor = 'default';
        });
      }
    }, 100);
  }
  
  /**
   * Stop cursor monitoring
   */
  stopCursorMonitoring() {
    if (this.cursorCheckInterval) {
      clearInterval(this.cursorCheckInterval);
      this.cursorCheckInterval = null;
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.stopCursorMonitoring();
    this.clearCursorStyles();
  }
}

// Create global instance
export const cursorManager = new CursorManager();

// Make it globally accessible
window.cursorManager = cursorManager;
