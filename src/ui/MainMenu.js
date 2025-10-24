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
    <div class="title-main" data-text="THE APERTURE PROTOCOL">THE APERTURE PROTOCOL</div>
    <div class="title-subtitle">CLASSIFIED SIMULATION</div>
  `;
  menuContainer.appendChild(title);
  
  // Menu buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'menu-buttons-container';
  
  // Start Game button
  const startButton = document.createElement('button');
  startButton.className = 'menu-button primary';
  startButton.setAttribute('data-action', 'start');
  startButton.innerHTML = '<span class="btn-label" data-text="START GAME">START GAME</span>';
  buttonsContainer.appendChild(startButton);
  
  // Settings button
  const settingsButton = document.createElement('button');
  settingsButton.className = 'menu-button';
  settingsButton.setAttribute('data-action', 'settings');
  settingsButton.innerHTML = '<span class="btn-label" data-text="SETTINGS">SETTINGS</span>';
  buttonsContainer.appendChild(settingsButton);
  
  // Credits button
  const creditsButton = document.createElement('button');
  creditsButton.className = 'menu-button';
  creditsButton.setAttribute('data-action', 'credits');
  creditsButton.innerHTML = '<span class="btn-label" data-text="CREDITS">CREDITS</span>';
  buttonsContainer.appendChild(creditsButton);
  
  // Exit button
  const exitButton = document.createElement('button');
  exitButton.className = 'menu-button danger';
  exitButton.setAttribute('data-action', 'exit');
  exitButton.innerHTML = '<span class="btn-label" data-text="EXIT GAME">EXIT GAME</span>';
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
  
  // Use cursor manager to ensure cursor is visible in main menu
  if (window.cursorManager) {
    window.cursorManager.forceShowCursor();
  }
  
  // Enhanced music auto-start with better browser compatibility
  let musicStarted = false;
  let userHasInteracted = false;
  
  // Check if user has previously interacted with the site
  const hasUserInteracted = localStorage.getItem('userHasInteracted') === 'true';
  
  console.log('Main menu loaded - attempting to start music...');
  console.log('User has previously interacted:', hasUserInteracted);
  
  // Function to start music with error handling
  const attemptMusicStart = async (context = 'unknown') => {
    if (musicStarted) {
      console.log('Music already started, skipping...');
      return;
    }
    
    console.log(`Attempting music start from: ${context}`);
    
    try {
      const success = await window.GlobalMusicManager.start();
      if (success) {
        musicStarted = true;
        console.log('Music successfully started!');
        
        // Mark that user has interacted for future visits
        if (!hasUserInteracted) {
          localStorage.setItem('userHasInteracted', 'true');
          console.log('Marked user as having interacted');
        }
      } else {
        console.log('Music failed to start, will retry on user interaction');
      }
    } catch (error) {
      console.log('Music start error:', error.message);
    }
  };
  
  // Try to start music immediately if user has previously interacted
  if (hasUserInteracted) {
    attemptMusicStart('previous interaction');
  } else {
    // For first-time users, try immediately but expect it to fail
    attemptMusicStart('first load');
  }
  
  // Try multiple times with different delays
  const retryDelays = [100, 300, 500, 1000, 2000];
  retryDelays.forEach(delay => {
    setTimeout(() => {
      if (!musicStarted) {
        attemptMusicStart(`retry ${delay}ms`);
      }
    }, delay);
  });
  
  // Try when DOM is fully ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      attemptMusicStart('DOM loaded');
    });
  } else {
    attemptMusicStart('DOM already loaded');
  }
  
  // Try on window events
  window.addEventListener('load', () => {
    attemptMusicStart('window loaded');
  });
  
  window.addEventListener('focus', () => {
    attemptMusicStart('window focused');
  });
  
  // Enhanced user interaction detection
  const startAudioOnInteraction = (event) => {
    if (musicStarted) return;
    
    console.log('User interaction detected:', event.type);
    userHasInteracted = true;
    localStorage.setItem('userHasInteracted', 'true');
    
    // Try to start music immediately on any interaction
    attemptMusicStart(`user interaction: ${event.type}`);
  };
  
  // Listen for ANY user interaction to start music
  const interactionEvents = ['click', 'keydown', 'mousemove', 'touchstart', 'mousedown', 'keypress', 'scroll', 'wheel'];
  interactionEvents.forEach(eventType => {
    document.addEventListener(eventType, startAudioOnInteraction, { once: false, passive: true });
  });
  
  // Try when page becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !musicStarted) {
      attemptMusicStart('page visible');
    }
  });
  
  // Add a visual indicator if music hasn't started
  setTimeout(() => {
    if (!musicStarted) {
      console.log('Music still not started - adding visual indicator');
      // You could add a subtle visual cue here if needed
    }
  }, 3000);
  
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
    
    // Use cursor manager to ensure cursor is visible in settings
    if (window.cursorManager) {
      window.cursorManager.setUIVisible(true);
    }
    
    // Load current settings
    loadSettings();
    
    // Handle settings events
    settingsOverlay.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-action');
      
      switch (action) {
        case 'close':
          // Use cursor manager to hide cursor when closing settings
          if (window.cursorManager) {
            window.cursorManager.setUIVisible(false);
          }
          settingsOverlay.remove();
          break;
        case 'apply':
          applySettings();
          // Use cursor manager to hide cursor when applying settings
          if (window.cursorManager) {
            window.cursorManager.setUIVisible(false);
          }
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
    
    if (sensitivitySlider && sensitivityValue) {
      sensitivitySlider.addEventListener('input', (e) => {
        sensitivityValue.textContent = e.target.value;
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
  }
  
  // Apply settings
  function applySettings() {
    const sensitivitySlider = document.getElementById('menu-sensitivity');
    const matrixSkyCheckbox = document.getElementById('menu-matrix-sky');
    
    const settings = {
      sensitivity: parseFloat(sensitivitySlider?.value || 1.0),
      enableMatrixSky: matrixSkyCheckbox?.checked !== false,
      matrixSkySpeed: 0.002, // Keep constant speed (original game speed)
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
      matrixSkySpeed: 0.002, // Keep constant speed (original game speed)
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
    
    // Use cursor manager to ensure cursor is visible in credits
    if (window.cursorManager) {
      window.cursorManager.setUIVisible(true);
    }
    
    // Handle credits events
    creditsOverlay.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-action');
      if (action === 'close') {
        // Use cursor manager to hide cursor when closing credits
        if (window.cursorManager) {
          window.cursorManager.setUIVisible(false);
        }
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
    autoplayBlocked: false,
    
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
      
      // Detect autoplay policy
      this.audio.addEventListener('play', () => {
        console.log('Global music play event fired');
        this.isPlaying = true;
        this.autoplayBlocked = false;
      });
      
      this.audio.addEventListener('pause', () => {
        console.log('Global music pause event fired');
        this.isPlaying = false;
      });
    },
    
    start() {
      if (!this.isInitialized) this.init();
      if (this.isPlaying) {
        console.log('Music already playing globally');
        return Promise.resolve(true);
      }
      
      console.log('Starting global music...');
      const playPromise = this.audio.play();
      
      if (playPromise !== undefined) {
        return playPromise
          .then(() => {
            this.isPlaying = true;
            this.autoplayBlocked = false;
            console.log('Global music started successfully');
            return true;
          })
          .catch((error) => {
            this.autoplayBlocked = true;
            console.log('Global music autoplay blocked:', error.message);
            return false;
          });
      }
      return Promise.resolve(false);
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
    },
    
    isAutoplayBlocked() {
      return this.autoplayBlocked;
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
