import * as Input from '../systems/input.js';

let menuElement = null;
let onPauseChange = null;
let isListeningForBinding = false;
let currentBindingAction = null;

// Game timer system
let gameStartTime = null;
let totalPausedTime = 0;
let pauseStartTime = null;
let timerInterval = null;

// Initialize menu system
export function initMenu({ onPauseChange: pauseCallback }) {
  onPauseChange = pauseCallback;
  buildMenu();
  bindEvents();
  startGameTimer();
  
}

// Start the game timer
function startGameTimer() {
  if (gameStartTime === null) {
    gameStartTime = Date.now();
  }
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

// Update the timer display
function updateTimer() {
  const timerElement = document.getElementById('game-timer');
  if (!timerElement) return;
  
  const now = Date.now();
  let elapsedTime = now - gameStartTime - totalPausedTime;
  
  // If currently paused, don't count this time
  if (pauseStartTime !== null) {
    elapsedTime -= (now - pauseStartTime);
  }
  
  const hours = Math.floor(elapsedTime / 3600000);
  const minutes = Math.floor((elapsedTime % 3600000) / 60000);
  const seconds = Math.floor((elapsedTime % 60000) / 1000);
  
  timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Pause the timer
function pauseTimer() {
  if (pauseStartTime === null) {
    pauseStartTime = Date.now();
  }
}

// Resume the timer
function resumeTimer() {
  if (pauseStartTime !== null) {
    totalPausedTime += Date.now() - pauseStartTime;
    pauseStartTime = null;
  }
}

// Build the menu DOM
function buildMenu() {
  if (document.getElementById('game-menu')) return;
  
  // Create menu element
  menuElement = document.createElement('div');
  menuElement.id = 'game-menu';
  menuElement.innerHTML = `
    <div class="menu-panel">
      <h2 class="menu-title">Game Menu</h2>
      
      <div class="menu-section">
        <h3>Controls</h3>
        <table class="controls-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Key</th>
            </tr>
          </thead>
          <tbody id="controls-tbody">
            <!-- Populated by refreshControls() -->
          </tbody>
        </table>
      </div>
      
      <div class="menu-section">
        <h3>Game Stats</h3>
        <div class="settings-row">
          <label>Game Time:</label>
          <span class="value-display" id="game-timer">00:00:00</span>
        </div>
      </div>
      
      <div class="menu-section">
        <h3>Settings</h3>
        <div class="settings-row">
          <label>Mouse Sensitivity:</label>
          <input type="range" id="sensitivity-slider" min="0.3" max="2.0" step="0.1" />
          <span class="value-display" id="sensitivity-value">1.0</span>
        </div>
      </div>
      
      <div class="menu-buttons">
        <button class="menu-button primary" id="resume-btn">Resume</button>
        <button class="menu-button" id="apply-btn">Apply</button>
        <button class="menu-button" id="reset-btn">Reset to Defaults</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(menuElement);
  
  // Add mouseover event to ensure cursor stays visible
  menuElement.addEventListener('mouseover', () => {
    document.body.style.cursor = 'default !important';
    document.documentElement.style.cursor = 'default !important';
  });
  
  // Add click event to prevent cursor hiding (but don't interfere with interactive elements)
  menuElement.addEventListener('click', (e) => {
    // Only prevent default if it's not an interactive element or key cell
    if (!e.target.closest('button, input, select, textarea, [role="button"], .key-cell')) {
      e.preventDefault();
      e.stopPropagation();
    }
    document.body.style.cursor = 'default !important';
    document.documentElement.style.cursor = 'default !important';
  }, true);
  
  // Add mousemove event to keep cursor visible
  menuElement.addEventListener('mousemove', () => {
    document.body.style.cursor = 'default !important';
    document.documentElement.style.cursor = 'default !important';
  });
  
  // Load CSS if not already loaded
  if (!document.getElementById('menu-css')) {
    const link = document.createElement('link');
    link.id = 'menu-css';
    link.rel = 'stylesheet';
    link.href = './src/ui/menu.css';
    document.head.appendChild(link);
  }
  
  refreshControls();
  refreshSettings();
}

// Bind event handlers
function bindEvents() {
  // Resume button
  document.getElementById('resume-btn').addEventListener('click', (e) => {
    // Don't prevent default for resume button - let it work normally
    document.body.style.cursor = 'default !important';
    document.documentElement.style.cursor = 'default !important';
    toggleMenu(false);
  });
  
  // Apply button
  document.getElementById('apply-btn').addEventListener('click', (e) => {
    // Don't prevent default for apply button - let it work normally
    document.body.style.cursor = 'default !important';
    document.documentElement.style.cursor = 'default !important';
    // Settings are already saved on change, just close menu
    toggleMenu(false);
  });
  
  // Reset button
  document.getElementById('reset-btn').addEventListener('click', (e) => {
    // Don't prevent default for reset button - let it work normally
    document.body.style.cursor = 'default !important';
    document.documentElement.style.cursor = 'default !important';
    Input.resetBindings();
    Input.resetSettings();
    refreshControls();
    refreshSettings();
  });
  
  
  // Sensitivity slider
  const sensitivitySlider = document.getElementById('sensitivity-slider');
  const sensitivityValue = document.getElementById('sensitivity-value');
  
  sensitivitySlider.addEventListener('input', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.cursor = 'default !important';
    document.documentElement.style.cursor = 'default !important';
    const value = parseFloat(e.target.value);
    sensitivityValue.textContent = value.toFixed(1);
    Input.setSettings({ sensitivity: value });
  });
  
  // Subscribe to binding changes
  Input.onBindingsChanged(() => {
    refreshControls();
    updateHUDInstructions();
  });
}

// Refresh controls table
function refreshControls() {
  const tbody = document.getElementById('controls-tbody');
  if (!tbody) return;
  
  const bindings = Input.getBindings();
  tbody.innerHTML = '';
  
  Object.entries(bindings).forEach(([action, keyCode]) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatActionName(action)}</td>
      <td class="key-cell" data-action="${action}">${formatKeyCode(keyCode)}</td>
    `;
    
    // Add click handler for rebinding
    const keyCell = row.querySelector('.key-cell');
    keyCell.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startListeningForBinding(action);
    });
    
    tbody.appendChild(row);
  });
}

// Refresh settings
function refreshSettings() {
  const settings = Input.getSettings();
  
  const sensitivitySlider = document.getElementById('sensitivity-slider');
  const sensitivityValue = document.getElementById('sensitivity-value');
  if (sensitivitySlider && sensitivityValue) {
    sensitivitySlider.value = settings.sensitivity;
    sensitivityValue.textContent = settings.sensitivity.toFixed(1);
  }
}

// Start listening for a new binding
function startListeningForBinding(action) {
  if (isListeningForBinding) return;
  
  isListeningForBinding = true;
  currentBindingAction = action;
  
  // Update UI to show listening state
  const keyCells = document.querySelectorAll('.key-cell');
  keyCells.forEach(cell => cell.classList.remove('listening'));
  
  const targetCell = document.querySelector(`[data-action="${action}"]`);
  if (targetCell) {
    targetCell.classList.add('listening');
    targetCell.textContent = 'Press any key...';
  }
  
  // Add temporary key listener
  const tempKeyHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set the new binding
    Input.setBinding(action, e.code);
    
    // Clean up
    isListeningForBinding = false;
    currentBindingAction = null;
    document.removeEventListener('keydown', tempKeyHandler);
    
    // Update UI
    const targetCell = document.querySelector(`[data-action="${action}"]`);
    if (targetCell) {
      targetCell.classList.remove('listening');
      targetCell.textContent = formatKeyCode(e.code);
    }
  };
  
  document.addEventListener('keydown', tempKeyHandler);
}

// Format action name for display
function formatActionName(action) {
  return action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Format key code for display
function formatKeyCode(keyCode) {
  return keyCode.replace('Key', '').replace('Digit', '');
}

// Toggle menu visibility
export function toggleMenu(force) {
  if (!menuElement) return;
  
  const shouldShow = force !== undefined ? force : !menuElement.classList.contains('show');
  
  if (shouldShow) {
    menuElement.classList.add('show');
    onPauseChange && onPauseChange(true);
    
    // Pause the game timer
    pauseTimer();
    
    // Exit pointer lock
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    // Hide crosshair
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
      crosshair.style.display = 'none';
    }
    
    // Force cursor to be visible and add CSS override
    document.body.style.cursor = 'default !important';
    document.documentElement.style.cursor = 'default !important';
    
    // Add CSS rule to force cursor visibility
    const style = document.createElement('style');
    style.id = 'menu-cursor-fix';
    style.textContent = `
      * {
        cursor: default !important;
      }
      #game-menu * {
        cursor: default !important;
      }
    `;
    document.head.appendChild(style);
    
    // Add continuous cursor check
    const cursorCheckInterval = setInterval(() => {
      if (isMenuOpen()) {
        document.body.style.cursor = 'default !important';
        document.documentElement.style.cursor = 'default !important';
        
        // Also force cursor on any input elements
        const inputs = document.querySelectorAll('input, button, select, textarea');
        inputs.forEach(input => {
          input.style.cursor = 'default !important';
        });
      } else {
        clearInterval(cursorCheckInterval);
      }
    }, 100);
    
  } else {
    menuElement.classList.remove('show');
    onPauseChange && onPauseChange(false);
    
    // Resume the game timer
    resumeTimer();
    
    // Remove cursor override
    const cursorFix = document.getElementById('menu-cursor-fix');
    if (cursorFix) {
      cursorFix.remove();
    }
    
    // Restore cursor to auto (will be hidden again when pointer lock is active)
    document.body.style.cursor = 'auto';
    document.documentElement.style.cursor = 'auto';
  }
}

// Check if menu is open
export function isMenuOpen() {
  return menuElement && menuElement.classList.contains('show');
}

// Update HUD instructions with current bindings
export function updateHUDInstructions() {
  const instructions = document.getElementById('instructions');
  if (!instructions) return;
  
  const bindings = Input.getBindings();
  const formatKey = (keyCode) => keyCode.replace('Key', '').replace('Digit', '');
  
  instructions.innerHTML = `
    Press <strong>${formatKey(bindings.interact)}</strong> near objects to interact | 
    Press <strong>I</strong> to inspect items in inventory | 
    Press <strong>1-5</strong> to select inventory slots | 
    Press <strong>${formatKey(bindings.toggleView)}</strong> to toggle view | 
    Press <strong>${formatKey(bindings.openMenu)}</strong> to open menu | 
    Click to lock mouse in first-person
  `;
}
