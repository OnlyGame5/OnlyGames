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

// Game countdown system
let gameCountdown = null; // in seconds
let countdownInterval = null;
let countdownPausedTime = 0;
let countdownPauseStartTime = null;

// Initialize menu system
export function initMenu({ onPauseChange: pauseCallback }) {
  onPauseChange = pauseCallback;
  buildMenu();
  bindEvents();
  startGameTimer();
  
  // Get difficulty from localStorage or default to normal
  const difficulty = localStorage.getItem('gameDifficulty') || 'normal';
  startGameCountdown(difficulty);
  
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
  // Also pause countdown
  pauseCountdown();
}

// Resume the timer
function resumeTimer() {
  if (pauseStartTime !== null) {
    totalPausedTime += Date.now() - pauseStartTime;
    pauseStartTime = null;
  }
  // Also resume countdown
  resumeCountdown();
}

// Start the game countdown
function startGameCountdown(difficulty = 'normal') {
  let minutes;
  switch(difficulty) {
    case 'easy':
      // Easy mode - no countdown
      gameCountdown = null;
      countdownInterval = null;
      updateCountdownDisplay();
      return;
    case 'normal':
      minutes = 20;
      break;
    case 'hard':
      minutes = 10;
      break;
    default:
      minutes = 20;
  }
  
  gameCountdown = minutes * 60; // convert to seconds
  countdownPausedTime = 0;
  countdownPauseStartTime = null;
  updateCountdownDisplay();
  countdownInterval = setInterval(() => {
    gameCountdown--;
    updateCountdownDisplay();
    
    if (gameCountdown <= 0) {
      endGameDueToTime();
    }
  }, 1000);
}

// Update the countdown display
function updateCountdownDisplay() {
  const countdownElement = document.getElementById('game-countdown');
  const mainCountdownElement = document.getElementById('countdown-timer');
  const countdownContainer = document.getElementById('game-countdown-display');
  
  // Handle easy mode (no countdown)
  if (gameCountdown === null) {
    // Hide countdown display for easy mode
    if (countdownContainer) {
      countdownContainer.style.display = 'none';
    }
    if (countdownElement) {
      countdownElement.textContent = 'No Limit';
      countdownElement.style.color = '#00ff00';
    }
    return;
  }
  
  // Show countdown for normal/hard modes
  if (countdownContainer) {
    countdownContainer.style.display = 'block';
  }
  
  const minutes = Math.floor(gameCountdown / 60);
  const seconds = gameCountdown % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Update menu countdown
  if (countdownElement) {
    countdownElement.textContent = timeString;
    
    // Change color based on remaining time
    if (gameCountdown <= 60) {
      countdownElement.style.color = '#ff0000'; // Red for last minute
    } else if (gameCountdown <= 300) {
      countdownElement.style.color = '#ff8800'; // Orange for last 5 minutes
    } else {
      countdownElement.style.color = '#00ff00'; // Green for normal time
    }
  }
  
  // Update main HUD countdown
  if (mainCountdownElement) {
    mainCountdownElement.textContent = timeString;
  }
  
  // Update entire countdown container styling
  if (countdownContainer) {
    if (gameCountdown <= 60) {
      // Red for last minute - critical
      countdownContainer.style.color = '#ff0000';
      countdownContainer.style.borderColor = '#ff0000';
      countdownContainer.style.textShadow = '0 0 5px #ff0000';
      countdownContainer.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
    } else if (gameCountdown <= 300) {
      // Orange for last 5 minutes - warning
      countdownContainer.style.color = '#ff8800';
      countdownContainer.style.borderColor = '#ff8800';
      countdownContainer.style.textShadow = '0 0 5px #ff8800';
      countdownContainer.style.boxShadow = '0 0 10px rgba(255, 136, 0, 0.5)';
    } else {
      // Green for normal time
      countdownContainer.style.color = '#00ff00';
      countdownContainer.style.borderColor = '#00ff00';
      countdownContainer.style.textShadow = '0 0 5px #00ff00';
      countdownContainer.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
    }
  }
}

// Pause the countdown
function pauseCountdown() {
  if (countdownPauseStartTime === null) {
    countdownPauseStartTime = Date.now();
  }
}

// Resume the countdown
function resumeCountdown() {
  if (countdownPauseStartTime !== null) {
    countdownPausedTime += Date.now() - countdownPauseStartTime;
    countdownPauseStartTime = null;
  }
}

// End game due to time expiration
function endGameDueToTime() {
  console.log('Game time expired!');
  
  // Stop countdown
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  
  // Stop game timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Show game over screen
  showGameOverScreen();
}

// Show game over screen
function showGameOverScreen() {
  // Close menu if open
  toggleMenu(false);
  
  // Create game over overlay
  const gameOverOverlay = document.createElement('div');
  gameOverOverlay.id = 'game-over-overlay';
  gameOverOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.9);
    z-index: 20000;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Courier New', monospace;
  `;
  
  gameOverOverlay.innerHTML = `
    <div style="
      background: #1a1a1a;
      border: 2px solid #ff0000;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      max-width: 600px;
      box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
    ">
      <h1 style="color: #ff0000; font-size: 36px; margin: 0 0 20px 0; text-shadow: 0 0 10px #ff0000;">
        TIME EXPIRED
      </h1>
      <p style="color: #ff6666; font-size: 18px; margin: 0 0 30px 0;">
        The simulation has reached its time limit.<br>
        Your session has been terminated.
      </p>
      <div style="
        background: rgba(255, 0, 0, 0.2);
        border: 1px solid #ff0000;
        border-radius: 4px;
        padding: 15px;
        margin: 20px 0;
        color: #ffaaaa;
        font-size: 14px;
      ">
        <div style="font-weight: bold; margin-bottom: 10px;">SYSTEM NOTIFICATION</div>
        <div>Session duration: 20:00</div>
        <div>Status: TERMINATED</div>
        <div>Reason: Time limit exceeded</div>
      </div>
      <button id="game-over-return-btn" style="
        background: #cc0000;
        color: white;
        border: 1px solid #ff0000;
        padding: 12px 24px;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        font-family: 'Courier New', monospace;
        transition: background 0.3s ease;
      " onmouseover="this.style.background='#ff0000'" onmouseout="this.style.background='#cc0000'">
        Return to Main Menu
      </button>
    </div>
  `;
  
  document.body.appendChild(gameOverOverlay);
  
  // Add event listener for return button
  document.getElementById('game-over-return-btn').addEventListener('click', () => {
    // Remove game over screen
    gameOverOverlay.remove();
    
    // Exit to main menu
    exitToMainMenu();
  });
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
        <div class="settings-row">
          <label>Time Remaining:</label>
          <span class="value-display countdown" id="game-countdown">20:00</span>
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
        <button class="menu-button exit" id="exit-btn">Exit to Main Menu</button>
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
  
  // Exit to main menu button
  document.getElementById('exit-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.cursor = 'default !important';
    document.documentElement.style.cursor = 'default !important';
    exitToMainMenu();
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
    
    // Use cursor manager to show cursor
    if (window.cursorManager) {
      window.cursorManager.setMenuOpen(true);
    } else {
      // Fallback to old system
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      document.body.style.cursor = 'default !important';
      document.documentElement.style.cursor = 'default !important';
    }
    
    // Hide crosshair
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
      crosshair.style.display = 'none';
    }
    
  } else {
    menuElement.classList.remove('show');
    onPauseChange && onPauseChange(false);
    
    // Resume the game timer
    resumeTimer();
    
    // Use cursor manager to hide cursor
    if (window.cursorManager) {
      window.cursorManager.setMenuOpen(false);
    } else {
      // Fallback to old system
      document.body.style.cursor = 'auto';
      document.documentElement.style.cursor = 'auto';
    }
  }
}

// Check if menu is open
export function isMenuOpen() {
  return menuElement && menuElement.classList.contains('show');
}


// Exit to main menu function
function exitToMainMenu() {
  console.log('Exiting to main menu...');
  
  // Close the menu first
  toggleMenu(false);
  
  // Stop the animation loop
  if (window.cancelAnimationFrame) {
    window.cancelAnimationFrame(window.animationId);
  }
  
  // Stop game timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Stop any background music
  if (window.GlobalMusicManager) {
    window.GlobalMusicManager.stop();
  }
  
  // Clear any active UI elements
  const paperExamination = document.getElementById('paperExamination');
  if (paperExamination) {
    paperExamination.remove();
  }
  
  // Clear truth filter
  const truthFilterIndicator = document.getElementById('truth-filter-indicator');
  if (truthFilterIndicator) {
    truthFilterIndicator.style.opacity = '0';
  }
  
  // Stop any active timers
  if (window.truthFilterTimer) {
    clearInterval(window.truthFilterTimer);
    window.truthFilterTimer = null;
  }
  
  // Clear the scene
  if (window.scene) {
    // Remove all objects from scene
    while (window.scene.children.length > 0) {
      const child = window.scene.children[0];
      window.scene.remove(child);
      
      // Dispose of geometries and materials
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  }
  
  // Clear the renderer
  if (window.renderer) {
    window.renderer.dispose();
  }
  
  // Remove the renderer from DOM
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.remove();
  }
  
  // Remove all game UI elements
  const gameUIElements = document.querySelectorAll('#game-menu, #interaction-ui, #crosshair, #inventory, #instructions, #truth-filter-indicator, #decrypting-message, #fps-counter, #minimap, #memory-panel, #game-countdown-display');
  gameUIElements.forEach(element => element.remove());
  
  // Reload the page to return to main menu
  window.location.reload();
}

// Console command to test game over screen
export function testGameOver() {
  console.log('Testing game over screen...');
  endGameDueToTime();
}

// Console command to set countdown to specific time (in seconds)
export function setCountdown(seconds) {
  if (typeof seconds !== 'number' || seconds < 0) {
    console.log('Usage: setCountdown(seconds) - e.g., setCountdown(10) for 10 seconds');
    return;
  }
  
  gameCountdown = seconds;
  updateCountdownDisplay();
  console.log(`Countdown set to ${seconds} seconds`);
}

// Console command to set difficulty
export function setDifficulty(difficulty) {
  const validDifficulties = ['easy', 'normal', 'hard'];
  if (!validDifficulties.includes(difficulty)) {
    console.log('Usage: setDifficulty(difficulty) - e.g., setDifficulty("easy"), setDifficulty("normal"), setDifficulty("hard")');
    return;
  }
  
  localStorage.setItem('gameDifficulty', difficulty);
  startGameCountdown(difficulty);
  console.log(`Difficulty set to ${difficulty}`);
}

// Make functions globally accessible for console testing
window.testGameOver = testGameOver;
window.setCountdown = setCountdown;
window.setDifficulty = setDifficulty;
window.exitToMainMenu = exitToMainMenu;

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
    Press <strong>${formatKey(bindings.dropItem)}</strong> to drop selected item | 
    Press <strong>${formatKey(bindings.toggleView)}</strong> to toggle view | 
    Press <strong>${formatKey(bindings.openMenu)}</strong> to open menu | 
    Press <strong>J</strong> to toggle look mode
  `;
}
