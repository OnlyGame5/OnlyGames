import './MainMenu.css';
import '../audio/GlobalMusicManager.js';

/**
 * Matrix-style Main Menu with falling numbers background
 * Creates a fullscreen overlay with code rain background and menu options
 */
export function createMainMenu({ onStartGame, onSettings, onCredits, onExit }) {
  console.log('🎵 createMainMenu called - Setting up music auto-start...');
  
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
  
  // Difficulty selection container
  const difficultyContainer = document.createElement('div');
  difficultyContainer.className = 'difficulty-container';
  difficultyContainer.innerHTML = `
    <div class="difficulty-title">SELECT DIFFICULTY</div>
    <div class="difficulty-options">
      <button class="difficulty-btn" data-difficulty="easy">
        <span class="difficulty-name">EASY</span>
        <span class="difficulty-desc">No Time Limit</span>
      </button>
      <button class="difficulty-btn selected" data-difficulty="normal">
        <span class="difficulty-name">NORMAL</span>
        <span class="difficulty-desc">20 Minutes</span>
      </button>
      <button class="difficulty-btn" data-difficulty="hard">
        <span class="difficulty-name">HARD</span>
        <span class="difficulty-desc">10 Minutes</span>
      </button>
    </div>
  `;
  menuContainer.appendChild(difficultyContainer);

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
  
  // Ensure global background music is started (no stopping here)
  if (window.GlobalMusicManager) {
    window.GlobalMusicManager.ensureStarted();
  }
  
  // Event listeners
  let hasExited = false;
  let selectedDifficulty = 'normal'; // Default difficulty
  
  // Difficulty selection handler
  const handleDifficultyClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const button = e.target.closest('.difficulty-btn');
    if (!button) return;
    
    // Remove selected class from all buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Add selected class to clicked button
    button.classList.add('selected');
    
    // Store selected difficulty
    selectedDifficulty = button.getAttribute('data-difficulty');
    localStorage.setItem('gameDifficulty', selectedDifficulty);
    
    console.log('Selected difficulty:', selectedDifficulty);
  };
  
  // Button click handlers
  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the button element (handle clicks on spans inside buttons)
    let button = e.target;
    while (button && !button.hasAttribute('data-action')) {
      button = button.parentElement;
    }
    
    if (!button) return;
    
    const action = button.getAttribute('data-action');
    
    switch (action) {
      case 'start':
        if (onStartGame && !hasExited) {
          hasExited = true;
          // Pass difficulty to start game
          startGame(selectedDifficulty);
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
  
  // Load saved difficulty
  const savedDifficulty = localStorage.getItem('gameDifficulty');
  if (savedDifficulty) {
    selectedDifficulty = savedDifficulty;
    // Update UI to show saved difficulty
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.classList.remove('selected');
      if (btn.getAttribute('data-difficulty') === savedDifficulty) {
        btn.classList.add('selected');
      }
    });
  }
  
  // Add event listeners
  buttonsContainer.addEventListener('click', handleButtonClick);
  difficultyContainer.addEventListener('click', handleDifficultyClick);
  document.addEventListener('keydown', handleKeyPress);
  
  // Use cursor manager to ensure cursor is visible in main menu
  if (window.cursorManager) {
    window.cursorManager.forceShowCursor();
  }
  
  // Keep background music managed globally; ensure it's started once.
  if (window.GlobalMusicManager) {
    window.GlobalMusicManager.ensureStarted();
  }
  
  // Start game function
  function startGame() {
    console.log('Starting game from main menu...');
    
    // DON'T stop the music here - let it continue to loading screen
    // Music will only be stopped when the user clicks to start the game (in main.js)
    console.log('Main menu -> Loading screen: Music continues playing...');
    
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
      
      // Call start game callback - music continues playing
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
      matrixSkySpeed: 0.01, // 2x faster than 0.005
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
      matrixSkySpeed: 0.01, // 2x faster than 0.005
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
    // Attribution data structure
    const attributions = {
      playerModel: {
        title: 'PLAYER MODEL',
        items: [
          {
            name: 'Leonard (leonard.glb)',
            source: 'Mixamo',
            url: 'https://www.mixamo.com/#/?page=1&type=Character',
            note: 'Character model: Leonard (select from Mixamo\'s Characters page)'
          }
        ]
      },
      models: {
        title: '3D MODELS',
        items: [
          { name: 'book.glb', source: 'Sketchfab', url: 'https://sketchfab.com/3d-models/william-gibson-book-burning-chrome-a26f670dd9f048b28ec5eabcca4900e3' },
          { name: 'card.glb', source: 'Team Created', url: '' },
          { name: 'cardsss.glb', source: 'Team Created', url: '' },
          { name: 'chair.glb', source: 'BlenderKit', url: 'https://www.blenderkit.com/asset-gallery?query=chair' },
          { name: 'hand_sculpt.glb', source: 'Sketchfab', url: 'https://sketchfab.com/3d-models/simple-hand-e620220cf4d1431a86a3e630a72b4de2' },
          { name: 'hologram.glb', source: 'BlenderKit', url: 'https://www.blenderkit.com/asset-gallery?query=hologram' },
          { name: 'idle.glb', source: 'BlenderKit', url: 'https://www.blenderkit.com/asset-gallery?query=idle' },
          { name: 'key.glb', source: 'BlenderKit', url: 'https://www.blenderkit.com/asset-gallery-detail/1b86b5b7-f975-482f-b55c-f20611aa0296/?query=key+order:_score+availability:free' },
          { name: 'office_chair.glb', source: 'BlenderKit', url: 'https://www.blenderkit.com/asset-gallery-detail/f89d26a8-fcae-443c-b9d7-a95ffb8934e9/?query=chair+order:_score+availability:free' },
          { name: 'room4_decoder_panel.glb', source: 'Team Created', url: '' },
          { name: 'safe.glb', source: 'BlenderKit', url: 'https://www.blenderkit.com/asset-gallery?query=safe' },
          { name: 'scale_key.glb', source: 'Team Created', url: '' },
          { name: 'sci_fi_office_desk.glb', source: 'Team Created', url: '' },
          { name: 'sci_fi_table.glb', source: 'Team Created', url: '' },
          { name: 'sci-fi_tablet.glb', source: 'Team Created', url: '' },
          { name: 'drawing_paper.glb', source: 'BlenderKit', url: 'https://www.blenderkit.com/asset-gallery-detail/1691c657-cc5d-45c3-8d51-db2e08eea733/?query=drawing+order:_score' }
        ]
      },
      textures: {
        title: 'TEXTURES',
        items: [
          { name: 'bricks058', source: 'AmbientCG (CC0)', url: 'https://ambientcg.com/view?id=Bricks058' },
          { name: 'Chip005_1K-JPG', source: 'AmbientCG (CC0)', url: 'https://ambientcg.com/view?id=Chip005' },
          { name: 'concrete031', source: 'AmbientCG (CC0)', url: 'https://ambientcg.com/view?id=Concrete031' },
          { name: 'diamond-plate-floor', source: 'AmbientCG (CC0)', url: 'https://ambientcg.com/view?id=DiamondPlate008C' },
          { name: 'Fingerprints003_1K-JPG', source: 'AmbientCG (CC0)', url: 'https://ambientcg.com/view?id=Fingerprints003' },
          { name: 'Metal003_1K-JPG', source: 'AmbientCG (CC0)', url: 'https://ambientcg.com/view?id=Metal003' },
          { name: 'metal030', source: 'AmbientCG (CC0)', url: 'https://ambientcg.com/view?id=Metal030' },
          { name: 'solar-panel', source: 'AmbientCG (CC0)', url: 'https://ambientcg.com/view?id=SolarPanel002' },
          { name: 'tiles002', source: 'AmbientCG (CC0)', url: 'https://ambientcg.com/view?id=Tiles002' },
          { name: 'tiles108', source: 'AmbientCG (CC0)', url: 'https://ambientcg.com/view?id=Tiles108' },
          { name: 'tiles136C', source: 'AmbientCG (CC0)', url: 'https://ambientcg.com/view?id=Tiles136C' },
          { name: 'Wood067_1K-JPG', source: 'AmbientCG (CC0)', url: 'https://ambientcg.com/view?id=Wood067' }
        ]
      }
    };

    // Helper function to render a section
    const renderSection = (section) => {
      const itemsHtml = section.items.map(item => {
        const linkHtml = item.url 
          ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="credits-link">${item.source}</a>`
          : `<span class="credits-source">${item.source}</span>`;
        const noteHtml = item.note ? `<div class="credits-note">${item.note}</div>` : '';
        return `
          <div class="credits-item">
            <span class="credits-name">${item.name}</span>
            <span class="credits-separator">—</span>
            ${linkHtml}
            ${noteHtml}
          </div>
        `;
      }).join('');
      
      return `
        <div class="credits-section">
          <h3>${section.title}</h3>
          <div class="credits-items">
            ${itemsHtml}
          </div>
        </div>
      `;
    };

    const creditsOverlay = document.createElement('div');
    creditsOverlay.className = 'credits-overlay';
    creditsOverlay.innerHTML = `
      <div class="credits-panel">
        <div class="credits-header">
          <h2>CREDITS & ATTRIBUTIONS</h2>
          <button class="close-credits" data-action="close">×</button>
        </div>
        <div class="credits-content">
          ${renderSection(attributions.playerModel)}
          ${renderSection(attributions.models)}
          ${renderSection(attributions.textures)}
          <div class="credits-section">
            <h3>SPECIAL THANKS</h3>
            <p>To all the open source developers who made this project possible</p>
            <p>University of the Witwatersrand - COMS3006A/COMS3025A</p>
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
    if (window.GlobalMusicManager) {
      window.GlobalMusicManager.stop();
    }
    
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
  
  // Expose exitGame globally
  window.exitGame = exitGame;
  
  // Return cleanup function
  return {
    destroy: () => {
      if (matrixAnimation.stop) {
        matrixAnimation.stop();
      }
      // Do NOT stop music on destroy when transitioning to loading screen
      mainMenu.remove();
      buttonsContainer.removeEventListener('click', handleButtonClick);
      document.removeEventListener('keydown', handleKeyPress);
    }
  };
}

/**
 * Audio Manager for Main Menu Music
 */
// No per-screen audio manager; music is controlled globally via GlobalMusicManager

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
