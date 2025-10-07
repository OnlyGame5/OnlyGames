// src/rooms/Room3/PurgeMinigame.js
import * as THREE from 'three';

const GAME_WIDTH = 320;
const GAME_HEIGHT = 400;

export class PurgeMinigame {
  constructor(renderer) {
    this.renderer = renderer;
    this.isActive = false;
    this.isSolved = false;

    // 1. Setup the 2D scene and camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, GAME_WIDTH, GAME_HEIGHT, 0, -1, 1);
    this.scene.background = new THREE.Color(0x051018); // Dark terminal background

    // 2. Create the Render Target - this is our virtual screen
    this.renderTarget = new THREE.WebGLRenderTarget(GAME_WIDTH, GAME_HEIGHT);
    this.texture = this.renderTarget.texture;

    // Game objects and state
    this.ship = null;
    this.invaders = [];
    this.bullets = [];
    this.input = { left: false, right: false, fire: false };
    this.lastFireTime = 0;
    this.fireRate = 0.2; // seconds between shots
    this.invaderSpeed = 30; // pixels per second
    this.invaderDirection = 1; // 1 for right, -1 for left
    this.invaderDropDistance = 20;
    this.score = 0;
    this.wave = 1;

    // Game state
    this.gameTime = 0;
    this.invaderMoveTimer = 0;
    this.invaderMoveInterval = 1.0; // seconds between invader moves

    this._setupInputListeners();
    this._createUI();
  }

  start() {
    if (this.isActive) return;
    console.log("Starting Purge Protocol Minigame!");
    this.isActive = true;
    this.isSolved = false;
    
    // Disable main player controls
    window.disablePlayerControls = true;
    console.log("Player controls disabled for minigame"); 

    // Reset game state
    this.score = 0;
    this.wave = 1;
    this.gameTime = 0;
    this.invaderMoveTimer = 0;
    this.invaderDirection = 1;

    // Create game elements
    this._createShip();
    this._createInvaders();
    this._clearBullets();
    
    // Update UI
    this._updateUI();
  }

  stop() {
    this.isActive = false;
    window.disablePlayerControls = false;
    console.log("Purge Protocol Minigame stopped!");
  }

  _setupInputListeners() {
    const keyMap = { 'a': 'left', 'd': 'right', ' ': 'fire' };
    
    this._keydownHandler = (e) => {
      if (this.isActive && keyMap[e.key]) {
        this.input[keyMap[e.key]] = true;
        e.preventDefault();
      }
    };
    
    this._keyupHandler = (e) => {
      if (this.isActive && keyMap[e.key]) {
        this.input[keyMap[e.key]] = false;
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', this._keydownHandler);
    window.addEventListener('keyup', this._keyupHandler);
  }

  _createUI() {
    // Create UI elements (score, wave, etc.)
    this.uiGroup = new THREE.Group();
    this.scene.add(this.uiGroup);
  }

  _updateUI() {
    // Clear existing UI
    this.uiGroup.clear();
    
    // Create score text
    const scoreText = this._createText(`SCORE: ${this.score}`, 10, 20, 0x00ff7f);
    this.uiGroup.add(scoreText);
    
    // Create wave text
    const waveText = this._createText(`WAVE: ${this.wave}`, 10, 40, 0x00ff7f);
    this.uiGroup.add(waveText);
    
    // Create instructions
    const instructions = this._createText('A/D: MOVE | SPACE: FIRE', 10, GAME_HEIGHT - 20, 0x666666);
    this.uiGroup.add(instructions);
  }

  _createText(text, x, y, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 20;
    const context = canvas.getContext('2d');
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = '12px monospace';
    context.textAlign = 'left';
    context.fillText(text, 2, 15);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const geometry = new THREE.PlaneGeometry(200, 20);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 0);
    return mesh;
  }

  _createShip() {
    // Remove existing ship
    if (this.ship) {
      this.scene.remove(this.ship);
    }
    
    const geo = new THREE.PlaneGeometry(30, 20);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ff7f }); // Antivirus Green
    this.ship = new THREE.Mesh(geo, mat);
    this.ship.position.set(GAME_WIDTH / 2, GAME_HEIGHT - 30, 0);
    this.scene.add(this.ship);
  }
  
  _createInvaders() {
    // Clear existing invaders
    this.invaders.forEach(invader => this.scene.remove(invader));
    this.invaders = [];
    
    const rows = 5;
    const cols = 8;
    const spacing = 35;
    const startX = 40;
    const startY = 60;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const geo = new THREE.PlaneGeometry(25, 20);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff4444 }); // Red data blocks
        const invader = new THREE.Mesh(geo, mat);
        
        invader.position.set(
          startX + col * spacing,
          startY + row * spacing,
          0
        );
        
        invader.userData = { row, col, alive: true };
        this.invaders.push(invader);
        this.scene.add(invader);
      }
    }
  }

  _clearBullets() {
    this.bullets.forEach(bullet => this.scene.remove(bullet));
    this.bullets = [];
  }

  _fireBullet() {
    const currentTime = this.gameTime;
    if (currentTime - this.lastFireTime < this.fireRate) return;
    
    this.lastFireTime = currentTime;
    
    const geo = new THREE.PlaneGeometry(4, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ff7f });
    const bullet = new THREE.Mesh(geo, mat);
    
    bullet.position.set(
      this.ship.position.x,
      this.ship.position.y - 15,
      0
    );
    
    bullet.userData = { speed: 200, type: 'player' };
    this.bullets.push(bullet);
    this.scene.add(bullet);
  }

  _updateInvaders(deltaTime) {
    this.invaderMoveTimer += deltaTime;
    
    if (this.invaderMoveTimer >= this.invaderMoveInterval) {
      this.invaderMoveTimer = 0;
      
      // Check if any invader hit the edge
      let hitEdge = false;
      this.invaders.forEach(invader => {
        if (invader.userData.alive) {
          if ((invader.position.x <= 10 && this.invaderDirection === -1) ||
              (invader.position.x >= GAME_WIDTH - 10 && this.invaderDirection === 1)) {
            hitEdge = true;
          }
        }
      });
      
      if (hitEdge) {
        // Drop down and reverse direction
        this.invaderDirection *= -1;
        this.invaders.forEach(invader => {
          if (invader.userData.alive) {
            invader.position.y += this.invaderDropDistance;
          }
        });
      } else {
        // Move sideways
        this.invaders.forEach(invader => {
          if (invader.userData.alive) {
            invader.position.x += this.invaderSpeed * this.invaderDirection;
          }
        });
      }
    }
  }

  _updateBullets(deltaTime) {
    this.bullets.forEach((bullet, index) => {
      bullet.position.y -= bullet.userData.speed * deltaTime;
      
      // Remove bullets that are off screen
      if (bullet.position.y < 0 || bullet.position.y > GAME_HEIGHT) {
        this.scene.remove(bullet);
        this.bullets.splice(index, 1);
      }
    });
  }

  _checkCollisions() {
    this.bullets.forEach((bullet, bulletIndex) => {
      this.invaders.forEach((invader, invaderIndex) => {
        if (!invader.userData.alive) return;
        
        // Simple AABB collision detection
        const bulletBounds = {
          left: bullet.position.x - 2,
          right: bullet.position.x + 2,
          top: bullet.position.y - 6,
          bottom: bullet.position.y + 6
        };
        
        const invaderBounds = {
          left: invader.position.x - 12.5,
          right: invader.position.x + 12.5,
          top: invader.position.y - 10,
          bottom: invader.position.y + 10
        };
        
        if (bulletBounds.left < invaderBounds.right &&
            bulletBounds.right > invaderBounds.left &&
            bulletBounds.top < invaderBounds.bottom &&
            bulletBounds.bottom > invaderBounds.top) {
          
          // Collision! Remove both objects
          this.scene.remove(bullet);
          this.scene.remove(invader);
          this.bullets.splice(bulletIndex, 1);
          invader.userData.alive = false;
          
          this.score += 10;
          this._updateUI();
          
          // Check if all invaders are destroyed
          const aliveInvaders = this.invaders.filter(inv => inv.userData.alive);
          if (aliveInvaders.length === 0) {
            this._nextWave();
          }
        }
      });
    });
  }

  _nextWave() {
    this.wave++;
    this.invaderMoveInterval = Math.max(0.3, this.invaderMoveInterval - 0.1); // Faster each wave
    this._createInvaders();
    this._clearBullets();
    this._updateUI();
    
    if (this.wave > 3) {
      // Game completed!
      this.isSolved = true;
      this._showVictoryScreen();
    }
  }

  _showVictoryScreen() {
    // Clear everything
    this.scene.clear();
    this.scene.background = new THREE.Color(0x051018);
    
    // Show victory message
    const victoryText = this._createText('PURGE PROTOCOL COMPLETE!', GAME_WIDTH/2 - 100, GAME_HEIGHT/2 - 20, 0x00ff7f);
    const scoreText = this._createText(`FINAL SCORE: ${this.score}`, GAME_WIDTH/2 - 80, GAME_HEIGHT/2 + 10, 0x00ff7f);
    const pressText = this._createText('Press ESC to exit', GAME_WIDTH/2 - 60, GAME_HEIGHT/2 + 40, 0x666666);
    
    this.scene.add(victoryText);
    this.scene.add(scoreText);
    this.scene.add(pressText);
    
    // Add ESC key handler for exit
    this._escHandler = (e) => {
      if (e.key === 'Escape') {
        this.stop();
        window.removeEventListener('keydown', this._escHandler);
      }
    };
    window.addEventListener('keydown', this._escHandler);
  }

  update(deltaTime) {
    if (!this.isActive) return;
    
    this.gameTime += deltaTime;

    // Handle Input & Move Ship
    if (this.input.left) this.ship.position.x -= 150 * deltaTime;
    if (this.input.right) this.ship.position.x += 150 * deltaTime;
    
    // Clamp ship position
    this.ship.position.x = THREE.MathUtils.clamp(this.ship.position.x, 15, GAME_WIDTH - 15);

    // Handle shooting
    if (this.input.fire) {
      this._fireBullet();
    }

    // Update game objects
    this._updateInvaders(deltaTime);
    this._updateBullets(deltaTime);
    this._checkCollisions();

    // Render the minigame to our virtual screen
    const currentRenderTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(currentRenderTarget);
    
    // Debug: Log rendering occasionally
    if (Math.random() < 0.01) { // 1% chance per frame
      console.log('[PurgeMinigame] Rendering to texture, ship position:', this.ship?.position);
    }
  }

  dispose() {
    // Clean up event listeners
    if (this._keydownHandler) {
      window.removeEventListener('keydown', this._keydownHandler);
    }
    if (this._keyupHandler) {
      window.removeEventListener('keyup', this._keyupHandler);
    }
    if (this._escHandler) {
      window.removeEventListener('keydown', this._escHandler);
    }
    
    // Clean up render target
    this.renderTarget.dispose();
    
    // Stop the game
    this.stop();
  }
}
