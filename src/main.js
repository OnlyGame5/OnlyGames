import { Game } from './core/Game.js';

// Initialize the game
async function initGame() {
  try {
    const game = new Game();
    await game.initialize();
    game.gameLoop();
    
    // Make game globally accessible for debugging
    window.game = game;
    
  } catch (error) {
    console.error('Failed to initialize game:', error);
    
    // Show error message to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff0000;
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: monospace;
      z-index: 10000;
    `;
    errorDiv.textContent = `Game initialization failed: ${error.message}`;
    document.body.appendChild(errorDiv);
  }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}