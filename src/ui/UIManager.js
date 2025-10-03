import { Menu } from './components/Menu.js';
import { HUD } from './components/HUD.js';
import { MemoryPanel } from './MemoryPanel.js';
import { loadingScreen } from './components/LoadingScreen.js';
import { gameStore } from '../state/gameStore.js';

export class UIManager {
  constructor() {
    this.menu = null;
    this.hud = null;
    this.memoryPanel = null;
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize menu
      this.menu = new Menu();
      this.menu.initialize();

      // Initialize HUD
      this.hud = new HUD();
      this.hud.initialize();

      // Initialize memory panel
      this.memoryPanel = new MemoryPanel();
      this.memoryPanel.initialize();

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('UI Manager initialized successfully');

    } catch (error) {
      console.error('Failed to initialize UI Manager:', error);
      throw error;
    }
  }

  setupEventListeners() {
    // Subscribe to game store changes
    gameStore.subscribe('showMemoryUI', (show) => {
      if (show) {
        this.memoryPanel.show();
      } else {
        this.memoryPanel.hide();
      }
    });

    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // Toggle menu with M key
      if (e.code === 'KeyM') {
        this.menu.toggle();
      }
      
      // Toggle view mode with V key
      if (e.code === 'KeyV') {
        if (window.player) {
          window.player.toggleViewMode();
        }
      }
      
      // Inventory inspection with I key
      if (e.code === 'KeyI') {
        this.handleInventoryInspection();
      }
    });

    // Global click handler for room interactions
    window.addEventListener('click', (e) => {
      if (window.gameState && window.gameState.stage !== undefined) {
        this.handleRoomClick(e);
      }
    });
  }

  handleRoomClick(e) {
    const currentRoom = window.gameState?.currentRoom;
    if (currentRoom && currentRoom.onRoomClick) {
      currentRoom.onRoomClick(e);
    }
  }

  handleInventoryInspection() {
    if (window.player) {
      const inventory = window.player.getPlayerInventory();
      const selectedItem = inventory.getSelectedItem();
      
      if (selectedItem) {
        console.log(`Inspecting: ${selectedItem.name}`);
        // Could show detailed item information here
      } else {
        console.log('No item selected in inventory');
      }
    }
  }

  update(deltaTime) {
    // Update UI components
    if (this.menu) {
      this.menu.update(deltaTime);
    }
    
    if (this.hud) {
      this.hud.update(deltaTime);
    }
    
    if (this.memoryPanel) {
      this.memoryPanel.update(deltaTime);
    }
  }

  showMenu() {
    if (this.menu) {
      this.menu.show();
    }
  }

  hideMenu() {
    if (this.menu) {
      this.menu.hide();
    }
  }

  toggleMenu() {
    if (this.menu) {
      this.menu.toggle();
    }
  }

  destroy() {
    if (this.menu) {
      this.menu.destroy();
    }
    
    if (this.hud) {
      this.hud.destroy();
    }
    
    if (this.memoryPanel) {
      this.memoryPanel.destroy();
    }

    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('click', this.handleRoomClick);

    this.isInitialized = false;
  }
}
