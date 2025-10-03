import { EventEmitter } from '../utils/EventEmitter.js';

export const DEFAULT_BINDINGS = {
  moveForward: 'KeyW',
  moveBack:    'KeyS',
  moveLeft:    'KeyA',
  moveRight:   'KeyD',
  interact:    'KeyE',
  toggleView:  'KeyV',
  toggleLight: 'KeyL',
  openMenu:    'KeyM'
};

export class InputSystem extends EventEmitter {
  constructor() {
    super();
    this.keyState = {};
    this.bindings = { ...DEFAULT_BINDINGS };
    this.settings = { crosshair: true, sensitivity: 1.0 };
    this.listenersAdded = false;
    
    this.loadFromStorage();
    this.setupEventListeners();
  }

  loadFromStorage() {
    // Load bindings from localStorage
    const savedBindings = localStorage.getItem('onlygames.bindings');
    if (savedBindings) {
      try {
        this.bindings = { ...DEFAULT_BINDINGS, ...JSON.parse(savedBindings) };
      } catch (e) {
        console.warn('Failed to load bindings from localStorage:', e);
      }
    }
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('onlygames.settings');
    if (savedSettings) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      } catch (e) {
        console.warn('Failed to load settings from localStorage:', e);
      }
    }
  }

  setupEventListeners() {
    if (this.listenersAdded) return;
    
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    this.listenersAdded = true;
  }

  handleKeyDown(e) {
    this.keyState[e.code] = true;
    
    // Emit specific key events
    const action = this.getActionFromKey(e.code);
    if (action) {
      this.emit(action, e);
    }
  }

  handleKeyUp(e) {
    this.keyState[e.code] = false;
  }

  getActionFromKey(keyCode) {
    for (const [action, binding] of Object.entries(this.bindings)) {
      if (binding === keyCode) {
        return action;
      }
    }
    return null;
  }

  isDown(actionName) {
    const keyCode = this.bindings[actionName];
    return keyCode ? !!this.keyState[keyCode] : false;
  }

  getBindings() {
    return { ...this.bindings };
  }

  setBinding(actionName, keyCode) {
    this.bindings[actionName] = keyCode;
    localStorage.setItem('onlygames.bindings', JSON.stringify(this.bindings));
    this.emit('bindingsChanged');
  }

  resetBindings() {
    this.bindings = { ...DEFAULT_BINDINGS };
    localStorage.setItem('onlygames.bindings', JSON.stringify(this.bindings));
    this.emit('bindingsChanged');
  }

  getSettings() {
    return { ...this.settings };
  }

  setSettings(partial) {
    this.settings = { ...this.settings, ...partial };
    localStorage.setItem('onlygames.settings', JSON.stringify(this.settings));
    this.emit('settingsChanged');
  }

  resetSettings() {
    this.settings = { crosshair: true, sensitivity: 1.0 };
    localStorage.setItem('onlygames.settings', JSON.stringify(this.settings));
    this.emit('settingsChanged');
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.listenersAdded = false;
  }
}
