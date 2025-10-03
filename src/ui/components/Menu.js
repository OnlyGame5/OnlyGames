import { InputSystem } from '../../systems/InputSystem.js';
import { EventEmitter } from '../../utils/EventEmitter.js';

export class Menu extends EventEmitter {
  constructor() {
    super();
    this.element = null;
    this.isVisible = false;
    this.inputSystem = null;
    this.gameStartTime = null;
    this.gameTimer = null;
    this.isListeningForBinding = false;
    this.currentBindingAction = null;
    
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'gameMenu';
    this.element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      font-family: 'Courier New', monospace;
      color: white;
    `;
    
    this.element.innerHTML = `
      <div style="background: #1a1a1a; padding: 30px; border-radius: 8px; max-width: 600px; width: 90%;">
        <h2 style="text-align: center; margin-bottom: 20px; color: #00ff00;">The Aperture Protocol</h2>
        
        <div id="menuTabs" style="display: flex; margin-bottom: 20px;">
          <button class="tab-button active" data-tab="controls">Controls</button>
          <button class="tab-button" data-tab="stats">Stats</button>
          <button class="tab-button" data-tab="settings">Settings</button>
        </div>
        
        <div id="controlsTab" class="tab-content">
          <h3>Controls</h3>
          <div id="controlsList"></div>
          <button id="resetControls" style="margin-top: 10px;">Reset to Defaults</button>
        </div>
        
        <div id="statsTab" class="tab-content" style="display: none;">
          <h3>Game Statistics</h3>
          <p>Time Played: <span id="gameTime">00:00:00</span></p>
          <p>Puzzles Completed: <span id="puzzlesCompleted">0</span></p>
        </div>
        
        <div id="settingsTab" class="tab-content" style="display: none;">
          <h3>Settings</h3>
          <label>
            <input type="checkbox" id="crosshairSetting" checked> Show Crosshair
          </label>
          <br><br>
          <label>
            Mouse Sensitivity: <input type="range" id="sensitivitySetting" min="0.1" max="3.0" step="0.1" value="1.0">
            <span id="sensitivityValue">1.0</span>
          </label>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <button id="closeMenu" style="padding: 10px 20px;">Close Menu</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.element);
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Tab switching
    const tabButtons = this.element.querySelectorAll('.tab-button');
    const tabContents = this.element.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Update active tab
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show corresponding content
        tabContents.forEach(content => {
          content.style.display = 'none';
        });
        document.getElementById(`${tabName}Tab`).style.display = 'block';
      });
    });
    
    // Close menu
    this.element.querySelector('#closeMenu').addEventListener('click', () => {
      this.hide();
    });
    
    // Reset controls
    this.element.querySelector('#resetControls').addEventListener('click', () => {
      this.resetControls();
    });
    
    // Settings
    this.element.querySelector('#crosshairSetting').addEventListener('change', (e) => {
      this.updateSetting('crosshair', e.target.checked);
    });
    
    this.element.querySelector('#sensitivitySetting').addEventListener('input', (e) => {
      this.updateSetting('sensitivity', parseFloat(e.target.value));
      this.element.querySelector('#sensitivityValue').textContent = e.target.value;
    });
  }

  initialize() {
    this.inputSystem = new InputSystem();
    this.refreshControls();
    this.refreshSettings();
    this.startGameTimer();
  }

  show() {
    this.isVisible = true;
    this.element.style.display = 'flex';
    this.pauseTimer();
    this.emit('shown');
  }

  hide() {
    this.isVisible = false;
    this.element.style.display = 'none';
    this.resumeTimer();
    this.emit('hidden');
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  startGameTimer() {
    this.gameStartTime = Date.now();
    this.gameTimer = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  updateTimer() {
    if (!this.gameStartTime) return;
    
    const elapsed = Date.now() - this.gameStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timeElement = this.element.querySelector('#gameTime');
    if (timeElement) {
      timeElement.textContent = timeString;
    }
  }

  pauseTimer() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
  }

  resumeTimer() {
    if (this.gameStartTime) {
      this.gameTimer = setInterval(() => {
        this.updateTimer();
      }, 1000);
    }
  }

  refreshControls() {
    if (!this.inputSystem) return;
    
    const controlsList = this.element.querySelector('#controlsList');
    const bindings = this.inputSystem.getBindings();
    
    controlsList.innerHTML = '';
    
    Object.entries(bindings).forEach(([action, keyCode]) => {
      const controlItem = document.createElement('div');
      controlItem.style.cssText = 'display: flex; justify-content: space-between; margin: 5px 0;';
      
      controlItem.innerHTML = `
        <span>${this.getActionDisplayName(action)}:</span>
        <button class="binding-button" data-action="${action}">${this.getKeyDisplayName(keyCode)}</button>
      `;
      
      controlsList.appendChild(controlItem);
    });
    
    // Add binding button listeners
    this.element.querySelectorAll('.binding-button').forEach(button => {
      button.addEventListener('click', () => {
        this.startListeningForBinding(button.dataset.action);
      });
    });
  }

  getActionDisplayName(action) {
    const names = {
      'moveForward': 'Move Forward',
      'moveBack': 'Move Back',
      'moveLeft': 'Move Left',
      'moveRight': 'Move Right',
      'interact': 'Interact',
      'toggleView': 'Toggle View',
      'toggleLight': 'Toggle Light',
      'openMenu': 'Open Menu'
    };
    return names[action] || action;
  }

  getKeyDisplayName(keyCode) {
    return keyCode.replace('Key', '').replace('Digit', '');
  }

  startListeningForBinding(action) {
    this.isListeningForBinding = true;
    this.currentBindingAction = action;
    
    const button = this.element.querySelector(`[data-action="${action}"]`);
    if (button) {
      button.textContent = 'Press a key...';
      button.style.background = '#ffaa00';
    }
    
    // Listen for next key press
    const handleKeyPress = (e) => {
      if (this.isListeningForBinding) {
        this.inputSystem.setBinding(action, e.code);
        this.refreshControls();
        this.isListeningForBinding = false;
        this.currentBindingAction = null;
        document.removeEventListener('keydown', handleKeyPress);
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
  }

  resetControls() {
    if (this.inputSystem) {
      this.inputSystem.resetBindings();
      this.refreshControls();
    }
  }

  refreshSettings() {
    if (!this.inputSystem) return;
    
    const settings = this.inputSystem.getSettings();
    
    const crosshairSetting = this.element.querySelector('#crosshairSetting');
    if (crosshairSetting) {
      crosshairSetting.checked = settings.crosshair;
    }
    
    const sensitivitySetting = this.element.querySelector('#sensitivitySetting');
    if (sensitivitySetting) {
      sensitivitySetting.value = settings.sensitivity;
      this.element.querySelector('#sensitivityValue').textContent = settings.sensitivity;
    }
  }

  updateSetting(key, value) {
    if (this.inputSystem) {
      this.inputSystem.setSettings({ [key]: value });
    }
  }

  update(deltaTime) {
    // Update menu if needed
  }

  destroy() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
