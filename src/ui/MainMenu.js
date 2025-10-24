import './MainMenu.css';

/**
 * Matrix-style Main Menu with falling numbers background
 * Creates a fullscreen overlay with code rain background and menu options
 */
export function createMainMenu({ onStartGame, onSettings, onCredits, onExit }) {
  // Create the main menu container
  const mainMenu = document.createElement('div');
  mainMenu.className = 'main-menu';
  
  // Create matrix rain canvas
  const matrixCanvas = document.createElement('canvas');
  matrixCanvas.id = 'main-menu-matrix-rain';
  mainMenu.appendChild(matrixCanvas);
  
  // Create menu container
  const menuContainer = document.createElement('div');
  menuContainer.className = 'menu-container';
  
  // Game title
  const title = document.createElement('div');
  title.className = 'game-title';
  title.innerHTML = `
    <div class="title-main">THE APERTURE PROTOCOL</div>
    <div class="title-subtitle">CLASSIFIED SIMULATION</div>
  `;
  menuContainer.appendChild(title);
  
  // Menu buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'menu-buttons-container';
  
  // Start Game button
  const startButton = document.createElement('button');
  startButton.className = 'menu-button primary';
  startButton.textContent = 'START GAME';
  startButton.setAttribute('data-action', 'start');
  buttonsContainer.appendChild(startButton);
  
  // Settings button
  const settingsButton = document.createElement('button');
  settingsButton.className = 'menu-button';
  settingsButton.textContent = 'SETTINGS';
  settingsButton.setAttribute('data-action', 'settings');
  buttonsContainer.appendChild(settingsButton);
  
  // Credits button
  const creditsButton = document.createElement('button');
  creditsButton.className = 'menu-button';
  creditsButton.textContent = 'CREDITS';
  creditsButton.setAttribute('data-action', 'credits');
  buttonsContainer.appendChild(creditsButton);
  
  // Exit button
  const exitButton = document.createElement('button');
  exitButton.className = 'menu-button danger';
  exitButton.textContent = 'EXIT GAME';
  exitButton.setAttribute('data-action', 'exit');
  buttonsContainer.appendChild(exitButton);
  
  menuContainer.appendChild(buttonsContainer);
  mainMenu.appendChild(menuContainer);
  
  // Add to DOM
  document.body.appendChild(mainMenu);
  
  // Matrix Rain Animation
  const matrixAnimation = createMatrixRain(matrixCanvas);
  
  // Audio setup
  const audioManager = createAudioManager();
  
  // Event listeners
  let hasExited = false;
  
  // Button click handlers
  const handleButtonClick = (e) => {
    const action = e.target.getAttribute('data-action');
    
    switch (action) {
      case 'start':
        if (onStartGame && !hasExited) {
          hasExited = true;
          startGame();
        }
        break;
      case 'settings':
        if (onSettings && !hasExited) {
          showSettings();
        }
        break;
      case 'credits':
        if (onCredits && !hasExited) {
          showCredits();
        }
        break;
      case 'exit':
        if (onExit && !hasExited) {
          hasExited = true;
          exitGame();
        }
        break;
    }
  };
  
  // Keyboard navigation
  const handleKeyPress = (e) => {
    if (hasExited) return;
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        const focusedButton = document.activeElement;
        if (focusedButton && focusedButton.classList.contains('menu-button')) {
          focusedButton.click();
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (onExit && !hasExited) {
          hasExited = true;
          exitGame();
        }
        break;
    }
  };
  
  // Add event listeners
  buttonsContainer.addEventListener('click', handleButtonClick);
  document.addEventListener('keydown', handleKeyPress);
  
  // Try to start audio immediately when main menu loads
  console.log('Main menu loaded - attempting to start music immediately...');
  
  // Try immediately
  audioManager.startMusic();
  
  // Try multiple times with different delays to maximize auto-play success
  setTimeout(() => {
    console.log('Attempting immediate music start (100ms)...');
    audioManager.startMusic();
  }, 100);
  
  setTimeout(() => {
    console.log('Attempting immediate music start (500ms)...');
    audioManager.startMusic();
  }, 500);
  
  setTimeout(() => {
    console.log('Attempting immediate music start (1000ms)...');
    audioManager.startMusic();
  }, 1000);
  
  // Try when DOM is fully ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM loaded - attempting music start...');
      audioManager.startMusic();
    });
  } else {
    console.log('DOM already loaded - attempting music start...');
    audioManager.startMusic();
  }
  
  // Also try on window focus/load events
  window.addEventListener('load', () => {
    console.log('Window loaded - attempting music start...');
    audioManager.startMusic();
  });
  
  window.addEventListener('focus', () => {
    console.log('Window focused - attempting music start...');
    audioManager.startMusic();
  });
  
  // Add user interaction listener as fallback (but don't remove it immediately)
  const startAudioOnInteraction = () => {
    console.log('User interaction detected - attempting to start music...');
    audioManager.startMusic();
    // Don't remove listeners immediately - keep them as fallback
  };
  
  // Listen for ANY user interaction to start music
  document.addEventListener('click', startAudioOnInteraction);
  document.addEventListener('keydown', startAudioOnInteraction);
  document.addEventListener('mousemove', startAudioOnInteraction);
  document.addEventListener('touchstart', startAudioOnInteraction);
  document.addEventListener('mousedown', startAudioOnInteraction);
  document.addEventListener('keypress', startAudioOnInteraction);
  
  // Also try to start music when the page becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('Page became visible - attempting music start...');
      audioManager.startMusic();
    }
  });
  
  // Start game function
  function startGame() {
    console.log('Starting game from main menu...');
    
    // DON'T stop the music here - let it continue to loading screen
    // audioManager.stopMusic(); // Removed this line
    
    // Add fade out class
    mainMenu.classList.add('fade-out');
    
    // Clean up after fade
    setTimeout(() => {
      // Stop matrix animation
      if (matrixAnimation.stop) {
        matrixAnimation.stop();
      }
      
      // Remove event listeners
      buttonsContainer.removeEventListener('click', handleButtonClick);
      document.removeEventListener('keydown', handleKeyPress);
      
      // Remove DOM elements
      mainMenu.remove();
      
      // Call start game callback
      if (onStartGame) {
        onStartGame();
      }
    }, 600);
  }
  
  // Show settings function
  function showSettings() {
    // Create settings overlay
    const settingsOverlay = document.createElement('div');
    settingsOverlay.className = 'settings-overlay';
    settingsOverlay.innerHTML = `
      <div class="settings-panel">
        <div class="settings-header">
          <h2>GAME SETTINGS</h2>
          <button class="close-settings" data-action="close">×</button>
        </div>
        <div class="settings-content">
          <div class="settings-section">
            <h3>Controls</h3>
            <div class="control-item">
              <label>Mouse Sensitivity:</label>
              <input type="range" id="menu-sensitivity" min="0.3" max="2.0" step="0.1" value="1.0" />
              <span class="value-display" id="menu-sensitivity-value">1.0</span>
            </div>
          </div>
          <div class="settings-section">
            <h3>Graphics</h3>
            <div class="control-item">
              <label>Matrix Sky:</label>
              <input type="checkbox" id="menu-matrix-sky" checked />
            </div>
            <div class="control-item">
              <label>Matrix Speed:</label>
              <input type="range" id="menu-matrix-speed" min="0.1" max="3.0" step="0.1" value="1.0" />
              <span class="value-display" id="menu-matrix-speed-value">1.0</span>
            </div>
          </div>
        </div>
        <div class="settings-buttons">
          <button class="settings-button" data-action="apply">Apply</button>
          <button class="settings-button" data-action="reset">Reset</button>
          <button class="settings-button" data-action="close">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(settingsOverlay);
    
    // Load current settings
    loadSettings();
    
    // Handle settings events
    settingsOverlay.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-action');
      
      switch (action) {
        case 'close':
          settingsOverlay.remove();
          break;
        case 'apply':
          applySettings();
          settingsOverlay.remove();
          break;
        case 'reset':
          resetSettings();
          loadSettings();
          break;
      }
    });
    
    // Handle slider updates
    const sensitivitySlider = document.getElementById('menu-sensitivity');
    const sensitivityValue = document.getElementById('menu-sensitivity-value');
    const matrixSpeedSlider = document.getElementById('menu-matrix-speed');
    const matrixSpeedValue = document.getElementById('menu-matrix-speed-value');
    
    if (sensitivitySlider && sensitivityValue) {
      sensitivitySlider.addEventListener('input', (e) => {
        sensitivityValue.textContent = e.target.value;
      });
    }
    
    if (matrixSpeedSlider && matrixSpeedValue) {
      matrixSpeedSlider.addEventListener('input', (e) => {
        matrixSpeedValue.textContent = e.target.value;
      });
    }
  }
  
  // Load settings from localStorage or defaults
  function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
    
    const sensitivitySlider = document.getElementById('menu-sensitivity');
    const sensitivityValue = document.getElementById('menu-sensitivity-value');
    const matrixSkyCheckbox = document.getElementById('menu-matrix-sky');
    const matrixSpeedSlider = document.getElementById('menu-matrix-speed');
    const matrixSpeedValue = document.getElementById('menu-matrix-speed-value');
    
    if (sensitivitySlider && sensitivityValue) {
      const sensitivity = settings.sensitivity || 1.0;
      sensitivitySlider.value = sensitivity;
      sensitivityValue.textContent = sensitivity.toFixed(1);
    }
    
    if (matrixSkyCheckbox) {
      matrixSkyCheckbox.checked = settings.enableMatrixSky !== false;
    }
    
    if (matrixSpeedSlider && matrixSpeedValue) {
      const speed = settings.matrixSkySpeed || 1.0;
      matrixSpeedSlider.value = speed;
      matrixSpeedValue.textContent = speed.toFixed(1);
    }
  }
  
  // Apply settings
  function applySettings() {
    const sensitivitySlider = document.getElementById('menu-sensitivity');
    const matrixSkyCheckbox = document.getElementById('menu-matrix-sky');
    const matrixSpeedSlider = document.getElementById('menu-matrix-speed');
    
    const settings = {
      sensitivity: parseFloat(sensitivitySlider?.value || 1.0),
      enableMatrixSky: matrixSkyCheckbox?.checked !== false,
      matrixSkySpeed: parseFloat(matrixSpeedSlider?.value || 1.0),
      matrixSkyIntensity: 1.0
    };
    
    // Save to localStorage
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    
    // Update gameStore settings if available
    if (window.gameStore && window.gameStore.settings) {
      window.gameStore.settings.enableMatrixSky = settings.enableMatrixSky;
      window.gameStore.settings.matrixSkySpeed = settings.matrixSkySpeed;
      window.gameStore.settings.matrixSkyIntensity = settings.matrixSkyIntensity;
    }
    
    // Dispatch settings change event
    window.dispatchEvent(new CustomEvent('game:settingsChanged', { detail: settings }));
    
    console.log('Settings applied:', settings);
  }
  
  // Reset settings to defaults
  function resetSettings() {
    const defaultSettings = {
      sensitivity: 1.0,
      enableMatrixSky: true,
      matrixSkySpeed: 1.0,
      matrixSkyIntensity: 1.0
    };
    
    localStorage.setItem('gameSettings', JSON.stringify(defaultSettings));
    
    // Update gameStore settings if available
    if (window.gameStore && window.gameStore.settings) {
      window.gameStore.settings.enableMatrixSky = defaultSettings.enableMatrixSky;
      window.gameStore.settings.matrixSkySpeed = defaultSettings.matrixSkySpeed;
      window.gameStore.settings.matrixSkyIntensity = defaultSettings.matrixSkyIntensity;
    }
    
    console.log('Settings reset to defaults');
  }
  
  // Show credits function
  function showCredits() {
    const creditsOverlay = document.createElement('div');
    creditsOverlay.className = 'credits-overlay';
    creditsOverlay.innerHTML = `
      <div class="credits-panel">
        <div class="credits-header">
          <h2>CREDITS</h2>
          <button class="close-credits" data-action="close">×</button>
        </div>
        <div class="credits-content">
          <div class="credits-section">
            <h3>THE APERTURE PROTOCOL</h3>
            <p>A 3D puzzle adventure game</p>
          </div>
          <div class="credits-section">
            <h3>DEVELOPMENT</h3>
            <p>Created with Three.js</p>
            <p>Matrix rain effect inspired by The Matrix</p>
          </div>
          <div class="credits-section">
            <h3>SPECIAL THANKS</h3>
            <p>To all the open source developers</p>
            <p>who made this project possible</p>
          </div>
        </div>
        <div class="credits-buttons">
          <button class="credits-button" data-action="close">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(creditsOverlay);
    
    // Handle credits events
    creditsOverlay.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-action');
      if (action === 'close') {
        creditsOverlay.remove();
      }
    });
  }
  
  // Exit game function
  function exitGame() {
    console.log('Exiting game...');
    
    // Stop the music only when exiting
    audioManager.stopMusic();
    
    // Add fade out class
    mainMenu.classList.add('fade-out');
    
    // Clean up after fade
    setTimeout(() => {
      // Stop matrix animation
      if (matrixAnimation.stop) {
        matrixAnimation.stop();
      }
      
      // Remove event listeners
      buttonsContainer.removeEventListener('click', handleButtonClick);
      document.removeEventListener('keydown', handleKeyPress);
      
      // Remove DOM elements
      mainMenu.remove();
      
      // Call exit callback
      if (onExit) {
        onExit();
      }
    }, 600);
  }
  
  // Return cleanup function
  return {
    destroy: () => {
      if (matrixAnimation.stop) {
        matrixAnimation.stop();
      }
      audioManager.stopMusic();
      mainMenu.remove();
      buttonsContainer.removeEventListener('click', handleButtonClick);
      document.removeEventListener('keydown', handleKeyPress);
    }
  };
}

/**
 * Global Music Manager - prevents multiple instances
 */
window.GlobalMusicManager = window.GlobalMusicManager || {
  audio: null,
  isPlaying: false,
  isInitialized: false,
  
  init() {
    if (this.isInitialized) return;
    console.log('Initializing global music manager');
    this.audio = new Audio('./audio/l_theme_death_note.mp3');
    this.audio.loop = true;
    this.audio.volume = 0.3;
    this.audio.preload = 'auto';
    this.isInitialized = true;
    
    this.audio.addEventListener('error', (e) => {
      console.error('Global music could not be loaded:', e);
    });
    
    this.audio.addEventListener('canplaythrough', () => {
      console.log('Global music ready');
    });
  },
  
  start() {
    if (!this.isInitialized) this.init();
    if (this.isPlaying) {
      console.log('Music already playing globally');
      return;
    }
    
    console.log('Starting global music...');
    const playPromise = this.audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          console.log('Global music started successfully');
        })
        .catch((error) => {
          console.log('Global music autoplay blocked:', error.message);
        });
    }
  },
  
  stop() {
    if (this.audio && this.isPlaying) {
      console.log('Stopping global music...');
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.volume = 0;
      this.isPlaying = false;
    }
  },
  
  isCurrentlyPlaying() {
    return this.isPlaying && this.audio && !this.audio.paused;
  }
};

/**
 * Audio Manager for Main Menu Music
 */
function createAudioManager() {
  // Use global music manager instead of creating new instances
  return {
    startMusic: () => window.GlobalMusicManager.start(),
    stopMusic: () => window.GlobalMusicManager.stop(),
    isPlaying: () => window.GlobalMusicManager.isCurrentlyPlaying()
  };
}

/**
 * Creates the Matrix code rain animation for main menu
 */
function createMatrixRain(canvas) {
  const ctx = canvas.getContext('2d');
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  const fontSize = 12;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = new Array(columns).fill(1);
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let animationId;
  
  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#00ff66';
    ctx.font = `${fontSize}px monospace`;
    
    for (let i = 0; i < drops.length; i++) {
      const text = characters[Math.floor(Math.random() * characters.length)];
      const alpha = Math.max(0, 1 - (drops[i] * fontSize) / canvas.height);
      ctx.globalAlpha = alpha;
      
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      
      if (drops[i] * fontSize > canvas.height * 0.8 && Math.random() > 0.975) {
        drops[i] = 0;
      }
      
      drops[i]++;
    }
    
    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(draw);
  }
  
  draw();
  
  return {
    stop: () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', resizeCanvas);
    }
  };
}
