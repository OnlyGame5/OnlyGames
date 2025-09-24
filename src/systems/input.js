// Input system for key bindings and settings management
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

// Global state
let listenersAdded = false;
let keyState = {};
let bindings = { ...DEFAULT_BINDINGS };
let settings = { crosshair: true, sensitivity: 1.0 };
let onBindingsChangedCallbacks = [];

// Initialize input system
export function initInput() {
  if (listenersAdded) return;
  
  // Load bindings from localStorage
  const savedBindings = localStorage.getItem('onlygames.bindings');
  if (savedBindings) {
    try {
      bindings = { ...DEFAULT_BINDINGS, ...JSON.parse(savedBindings) };
    } catch (e) {
      console.warn('Failed to load bindings from localStorage:', e);
    }
  }
  
  // Load settings from localStorage
  const savedSettings = localStorage.getItem('onlygames.settings');
  if (savedSettings) {
    try {
      settings = { ...settings, ...JSON.parse(savedSettings) };
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
  }
  
  // Add global key listeners
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  listenersAdded = true;
}

// Key event handlers
function handleKeyDown(e) {
  keyState[e.code] = true;
}

function handleKeyUp(e) {
  keyState[e.code] = false;
}

// Check if an action key is currently down
export function isDown(actionName) {
  const keyCode = bindings[actionName];
  return keyCode ? !!keyState[keyCode] : false;
}

// Get current bindings
export function getBindings() {
  return { ...bindings };
}

// Set a binding
export function setBinding(actionName, keyCode) {
  bindings[actionName] = keyCode;
  localStorage.setItem('onlygames.bindings', JSON.stringify(bindings));
  
  // Notify callbacks
  onBindingsChangedCallbacks.forEach(callback => callback());
}

// Reset bindings to defaults
export function resetBindings() {
  bindings = { ...DEFAULT_BINDINGS };
  localStorage.setItem('onlygames.bindings', JSON.stringify(bindings));
  
  // Notify callbacks
  onBindingsChangedCallbacks.forEach(callback => callback());
}

// Get current settings
export function getSettings() {
  return { ...settings };
}

// Set settings
export function setSettings(partial) {
  settings = { ...settings, ...partial };
  localStorage.setItem('onlygames.settings', JSON.stringify(settings));
}

// Reset settings to defaults
export function resetSettings() {
  settings = { crosshair: true, sensitivity: 1.0 };
  localStorage.setItem('onlygames.settings', JSON.stringify(settings));
}

// Subscribe to binding changes
export function onBindingsChanged(callback) {
  onBindingsChangedCallbacks.push(callback);
}

// Unsubscribe from binding changes
export function offBindingsChanged(callback) {
  const index = onBindingsChangedCallbacks.indexOf(callback);
  if (index > -1) {
    onBindingsChangedCallbacks.splice(index, 1);
  }
}
