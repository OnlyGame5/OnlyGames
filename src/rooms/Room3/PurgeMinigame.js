// src/rooms/Room3/PurgeMinigame.js
const GAME_WIDTH = 450;
const GAME_HEIGHT = 300;

export class PurgeMinigame {
  constructor() {
    this.isActive = false;
    this.isSolved = false;
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    
    // Game objects and state
    this.ship = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30, width: 30, height: 20 };
    this.invaders = [];
    this.bullets = [];
    this.input = { left: false, right: false, fire: false };
    this.lastFireTime = 0;
    this.fireRate = 0.3;
    this.invaderDirection = 1; // 1 for right, -1 for left
    this.invaderMoveTimer = 0;
    this.invaderMoveInterval = 1.0; // Invaders move every 1 second
    this.score = 0;
    this.wave = 1;

    this._setupInputListeners();
  }

  start() {
    if (this.isActive) return;
    console.log("Starting 2D Canvas Purge Protocol Minigame!");
    
    // Initialize container and canvas if not already done
    if (!this.container) {
      this.container = document.querySelector('#laptop-ui .window-content');
      if (!this.container) {
        console.error("PurgeMinigame could not find its container element!");
        return;
      }

      // Create a canvas for our 2D game
      this.canvas = document.createElement('canvas');
      this.canvas.width = GAME_WIDTH;
      this.canvas.height = GAME_HEIGHT;
      this.canvas.style.backgroundColor = '#051018';
      this.canvas.style.display = 'none'; // Hidden by default
      this.canvas.style.border = '1px solid #00ff7f';
      this.canvas.style.margin = '10px auto';
      this.ctx = this.canvas.getContext('2d');
      
      this.container.appendChild(this.canvas);
      
      // Create a close button for the minigame
      this.closeButton = document.createElement('button');
      this.closeButton.textContent = 'LEAVE';
      this.closeButton.className = 'laptop-btn';
      this.closeButton.style.cssText = `
        padding: 10px 20px;
        background: transparent;
        border: 1px solid #00ff7f;
        color: #00ff7f;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: 10px;
        display: block;
        margin-left: auto;
        margin-right: auto;
      `;
      this.closeButton.onclick = () => {
        this.stop();
        // Close the laptop UI
        const ui = document.getElementById('laptop-ui');
        if (ui) ui.style.display = 'none';
        window.isUIVisible = false;
        window.disablePlayerControls = false;
        document.body.style.cursor = 'none';
        document.body.classList.remove('laptop-ui-active');
        if (window.camera && window.camera.controls) {
          window.camera.controls.enabled = true;
        }
      };
      this.closeButton.style.display = 'none'; // Hidden by default
      this.container.appendChild(this.closeButton);
    }
    
    this.isActive = true;

    // Hide the phrase puzzle content
    this.container.querySelectorAll('.laptop-input-row, .laptop-buttons, h3').forEach(el => el.style.display = 'none');
    // Show the game canvas and close button
    this.canvas.style.display = 'block';
    this.closeButton.style.display = 'block';

    this._createInvaders();
  }

  stop() {
    this.isActive = false;
    // Hide the game canvas and close button
    if (this.canvas) this.canvas.style.display = 'none';
    if (this.closeButton) this.closeButton.style.display = 'none';
    
    // Restore the phrase puzzle elements
    this.restoreUI();
  }

  restoreUI() {
    // Restore the phrase puzzle elements if container exists
    if (this.container) {
      this.container.querySelectorAll('.laptop-input-row, .laptop-buttons, h3').forEach(el => el.style.display = 'block');
    }
  }

  _setupInputListeners() {
    const keyMap = { 'a': 'left', 'd': 'right', ' ': 'fire', 'escape': 'exit' };
    window.addEventListener('keydown', (e) => {
      if (this.isActive) {
        if (keyMap[e.key.toLowerCase()]) {
          if (e.key.toLowerCase() === 'escape') {
            this.stop();
            // Close the laptop UI
            const ui = document.getElementById('laptop-ui');
            if (ui) ui.style.display = 'none';
            window.isUIVisible = false;
            window.disablePlayerControls = false;
            document.body.style.cursor = 'none';
            document.body.classList.remove('laptop-ui-active');
            if (window.camera && window.camera.controls) {
              window.camera.controls.enabled = true;
            }
          } else {
            this.input[keyMap[e.key.toLowerCase()]] = true;
          }
        }
      }
    });
    window.addEventListener('keyup', (e) => {
      if (this.isActive && keyMap[e.key.toLowerCase()] && e.key.toLowerCase() !== 'escape') {
        this.input[keyMap[e.key.toLowerCase()]] = false;
      }
    });
  }

  _createInvaders() {
    this.invaders = [];
    const rows = 4;
    const cols = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.invaders.push({
          x: 40 + c * 40,
          y: 30 + r * 30,
          width: 25,
          height: 20,
          alive: true
        });
      }
    }
  }

  _updateInvaders(deltaTime) {
    this.invaderMoveTimer += deltaTime;
    if (this.invaderMoveTimer < this.invaderMoveInterval) return;

    this.invaderMoveTimer = 0;
    let hitEdge = false;
    let lowestY = 0;

    this.invaders.forEach(invader => {
      if (invader.alive) {
        if ((invader.x > GAME_WIDTH - 20 && this.invaderDirection > 0) || (invader.x < 20 && this.invaderDirection < 0)) {
          hitEdge = true;
        }
        if (invader.y > lowestY) {
          lowestY = invader.y;
        }
      }
    });

    if (hitEdge) {
      this.invaderDirection *= -1; // Reverse direction
      this.invaders.forEach(i => { if (i.alive) i.y += 20; }); // Move down
    } else {
      this.invaders.forEach(i => { if (i.alive) i.x += 20 * this.invaderDirection; }); // Move sideways
    }

    // Check for lose condition
    if (lowestY >= this.ship.y - this.ship.height) {
      this._gameOver(false); // isVictory = false
    }
  }

  _checkCollisions() {
    this.bullets.forEach((bullet, bIndex) => {
      this.invaders.forEach((invader) => {
        if (bullet && invader.alive) {
          // Simple AABB collision check
          if (bullet.x < invader.x + invader.width / 2 &&
              bullet.x + bullet.width > invader.x - invader.width / 2 &&
              bullet.y < invader.y + invader.height / 2 &&
              bullet.y + bullet.height > invader.y - invader.height / 2) 
          {
            invader.alive = false;
            this.bullets.splice(bIndex, 1); // Remove bullet
            this.score += 10;
          }
        }
      });
    });

    // Check for next wave
    if (this.invaders.every(i => !i.alive)) {
      this._nextWave();
    }
  }

  _nextWave() {
    this.wave++;
    if (this.wave > 3) {
      this._gameOver(true); // Victory after 3 waves
      return;
    }
    this.invaderMoveInterval = Math.max(0.2, this.invaderMoveInterval * 0.8); // Get 20% faster
    this._createInvaders();
    this.bullets = [];
  }

  _gameOver(isVictory) {
    this.stop();
    this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.ctx.fillStyle = isVictory ? '#00ff7f' : '#ff4444';
    this.ctx.font = '32px monospace';
    this.ctx.textAlign = 'center';
    
    if (isVictory) {
      this.isSolved = true;
      this.ctx.fillText('PURGE COMPLETE', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
    } else {
      this.ctx.fillText('SYSTEM CORRUPTED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
    }

    this.ctx.font = '16px monospace';
    this.ctx.fillText(`Final Score: ${this.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
  }

  update(deltaTime) {
    if (!this.isActive || !this.ctx) return;

    // --- Input ---
    if (this.input && this.input.left) this.ship.x -= 200 * deltaTime;
    if (this.input && this.input.right) this.ship.x += 200 * deltaTime;
    this.ship.x = Math.max(15, Math.min(GAME_WIDTH - 15, this.ship.x));

    if (this.input && this.input.fire && (performance.now() - this.lastFireTime > this.fireRate * 1000)) {
      this.lastFireTime = performance.now();
      this.bullets.push({ x: this.ship.x, y: this.ship.y, width: 4, height: 12 });
    }

    // --- Game Logic ---
    this.bullets.forEach((bullet, i) => {
      bullet.y -= 300 * deltaTime;
      if (bullet.y < 0) this.bullets.splice(i, 1);
    });
    
    this._updateInvaders(deltaTime);
    this._checkCollisions();

    // --- Drawing ---
    this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    const scoreText = `SCORE: ${this.score}`;
    const waveText = `WAVE: ${this.wave}`;
    this.ctx.fillStyle = '#00ff7f';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(scoreText, 10, 20);
    this.ctx.fillText(waveText, GAME_WIDTH - waveText.length * 8, 20);

    // Draw Ship
    this.ctx.fillStyle = '#00ff7f';
    this.ctx.fillRect(this.ship.x - this.ship.width / 2, this.ship.y - this.ship.height / 2, this.ship.width, this.ship.height);

    // Draw Invaders
    this.ctx.fillStyle = '#ff4444';
    this.invaders.forEach(invader => {
      if (invader.alive) {
        this.ctx.fillRect(invader.x - invader.width / 2, invader.y - invader.height / 2, invader.width, invader.height);
      }
    });

    // Draw Bullets
    this.ctx.fillStyle = '#00ff7f';
    this.bullets.forEach(bullet => {
      this.ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
    });
  }
}