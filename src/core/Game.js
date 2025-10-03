import * as THREE from 'three';
import { PlayerController } from '../player/PlayerController.js';
import { AI } from '../game/ai/AI.js';
import { LevelManager } from '../game/levels/LevelManager.js';
import { UIManager } from '../ui/UIManager.js';
import { loadingScreen } from '../ui/components/LoadingScreen.js';
import { GAME_CONSTANTS } from '../utils/Constants.js';

export class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      GAME_CONSTANTS.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      GAME_CONSTANTS.CAMERA_NEAR,
      GAME_CONSTANTS.CAMERA_FAR
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance"
    });
    
    this.player = null;
    this.levelManager = null;
    this.uiManager = null;
    this.gameState = {
      stage: 0,
      paused: false
    };
    
    this.setupRenderer();
    this.setupScene();
  }

  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GAME_CONSTANTS.MAX_PIXEL_RATIO));
    this.renderer.setClearColor(0x0b0b12);
    document.body.appendChild(this.renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  setupScene() {
    this.scene.background = new THREE.Color(0x0b0b12);
    this.camera.position.set(0, 4, 10);
  }

  async initialize() {
    try {
      // Show loading screen
      loadingScreen.show();
      loadingScreen.setStatus('Loading game assets...');
      
      // Initialize player
      loadingScreen.setStatus('Initializing player...');
      this.player = new PlayerController(this.scene, this.camera);
      await this.player.initialize();
      
      // Initialize level manager
      loadingScreen.setStatus('Loading levels...');
      this.levelManager = new LevelManager(this.scene);
      await this.levelManager.initialize();
      
      // Initialize UI manager
      loadingScreen.setStatus('Initializing UI...');
      this.uiManager = new UIManager();
      this.uiManager.initialize();
      
      // Setup global references
      window.AI = AI;
      window.gameState = this.gameState;
      window.player = this.player;
      window.leonardModel = this.player.getModel();
      
      // AI greeting
      AI.say("Hello. Don't be afraid. I'll help you escape this place. Trust me.");
      
      // Complete loading
      loadingScreen.setStatus('Game ready!');
      loadingScreen.hide();
      
      console.log('Game initialized successfully!');
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
      loadingScreen.setStatus('Loading failed. Please refresh the page.');
    }
  }

  update(deltaTime) {
    if (this.gameState.paused) return;
    
    // Update player
    if (this.player) {
      this.player.update(deltaTime);
    }
    
    // Update level manager
    if (this.levelManager) {
      this.levelManager.update(deltaTime, {
        player: this.player,
        ai: AI
      });
    }
    
    // Update UI
    if (this.uiManager) {
      this.uiManager.update(deltaTime);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  gameLoop() {
    const deltaTime = 0.016; // Fixed timestep for consistency
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame(() => this.gameLoop());
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  pause() {
    this.gameState.paused = true;
  }

  resume() {
    this.gameState.paused = false;
  }

  destroy() {
    // Cleanup
    if (this.player) {
      this.player.destroy();
    }
    
    if (this.levelManager) {
      this.levelManager.destroy();
    }
    
    if (this.uiManager) {
      this.uiManager.destroy();
    }
    
    // Remove renderer
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
  }
}
