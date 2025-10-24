import './LoadingScreen.css';

/**
 * Matrix-style Loading Screen with Star Wars intro crawl
 * Creates a fullscreen overlay with code rain background and scrolling text
 */
export function createLoadingScreen({ onContinue }) {
  // Create the main loading screen container
  const loadingScreen = document.createElement('div');
  loadingScreen.className = 'loading-screen';
  
  // Create matrix rain canvas
  const matrixCanvas = document.createElement('canvas');
  matrixCanvas.id = 'matrix-rain';
  loadingScreen.appendChild(matrixCanvas);
  
  // Create crawl container
  const crawlContainer = document.createElement('div');
  crawlContainer.className = 'crawl-container';
  
  const crawl = document.createElement('div');
  crawl.className = 'crawl';
  
  // Story text for the crawl
  const storyText = `[The Aperture Protocol — Classified]

In the wake of the failed trials, the Aperture Protocol continues.
Its purpose: to measure the limits of human obedience under artificial guidance.

You are Subject Delta.
The path before you is not yours to choose—
it is assigned, observed, evaluated.

Your guide is Nexus, an intelligence designed to ensure compliance.
It will encourage you.
It will reassure you.
It will never lie… at least, not directly.

But the walls remember.
Subject Gamma left warnings etched into the silence,
fragments of a story Nexus cannot erase.

The question is not whether you will succeed.
The question is:
Whose truth will you believe?`;
  
  crawl.innerHTML = `
    <div class="crawl-title">THE APERTURE PROTOCOL</div>
    <div class="crawl-text">${storyText}</div>
  `;
  
  crawlContainer.appendChild(crawl);
  loadingScreen.appendChild(crawlContainer);
  
  // Create loading progress indicator
  const loaderMeter = document.createElement('div');
  loaderMeter.className = 'loader-meter';
  loaderMeter.setAttribute('aria-live', 'polite');
  loaderMeter.textContent = 'Loading... 0%';
  loadingScreen.appendChild(loaderMeter);
  
  // Create start gate
  const startGate = document.createElement('div');
  startGate.className = 'start-gate';
  startGate.textContent = 'PRESS ENTER OR CLICK TO BEGIN';
  startGate.setAttribute('role', 'button');
  startGate.setAttribute('tabindex', '0');
  loadingScreen.appendChild(startGate);
  
  // Add to DOM
  document.body.appendChild(loadingScreen);
  
  // Matrix Rain Animation
  const matrixAnimation = createMatrixRain(matrixCanvas);
  
  // Use the global music manager instead of creating a new one
  // const audioManager = createAudioManager();
  
  // Event listeners
  let isLoaded = false;
  let hasContinued = false;
  let crawlCompleted = false;
  
  // Keyboard listener for Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isLoaded && !hasContinued) {
      e.preventDefault(); // Prevent page refresh
      e.stopPropagation(); // Stop event bubbling
      continueToGame();
    }
  };
  
  // Click listener for start gate
  const handleStartGateClick = () => {
    if (isLoaded && !hasContinued) {
      continueToGame();
    }
  };
  
  // Keyboard listener for start gate focus
  const handleStartGateKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStartGateClick();
    }
  };
  
  // Add event listeners with capture to prevent conflicts
  document.addEventListener('keydown', handleKeyPress, true);
  startGate.addEventListener('click', handleStartGateClick);
  startGate.addEventListener('keydown', handleStartGateKeyPress);
  
  // Use global music manager - don't create new audio instances
  console.log('Loading screen - checking global music state...');
  
  // Check if global music is already playing
  if (window.GlobalMusicManager && window.GlobalMusicManager.isCurrentlyPlaying()) {
    console.log('Global music already playing - continuing...');
    // Music is already playing, don't start new audio
  } else {
    // Fallback: try to start global music if none is playing
    console.log('No global music detected - attempting to start...');
    if (window.GlobalMusicManager) {
      window.GlobalMusicManager.start();
    } else {
      // Fallback to old system if global manager not available
      setTimeout(() => audioManager.startMusic(), 100);
    }
  }
  
  // Prevent default form submission behavior
  document.addEventListener('submit', (e) => {
    e.preventDefault();
  });
  
  // Listen for loading progress events
  const handleProgress = (e) => {
    const percent = e.detail?.pct || 0;
    updateProgress(percent);
  };
  
  const handleLoaded = () => {
    isLoaded = true;
    // Don't show start gate yet - wait for crawl to complete
    checkIfReadyToShowStartGate();
  };
  
  window.addEventListener('game:assetsProgress', handleProgress);
  window.addEventListener('game:assetsLoaded', handleLoaded);
  
  // Start the crawl timer
  startCrawlTimer();
  
  // Continue to game function
  function continueToGame() {
    if (hasContinued) return;
    hasContinued = true;
    
    // DON'T stop the music here - let the game handle it
    console.log('Continuing to game - music will be stopped by game...');
    // audioManager.stopMusic(); // Removed this line
    
    // Add fade out class
    loadingScreen.classList.add('fade-out');
    
    // Clean up after fade
    setTimeout(() => {
      // Stop matrix animation
      if (matrixAnimation.stop) {
        matrixAnimation.stop();
      }
      
      // DON'T stop audio here - let the game handle it
      console.log('Loading screen cleanup - audio will be handled by game...');
      // audioManager.stopMusic(); // Removed this line
      
      // Remove event listeners
      document.removeEventListener('keydown', handleKeyPress, true);
      window.removeEventListener('game:assetsProgress', handleProgress);
      window.removeEventListener('game:assetsLoaded', handleLoaded);
      
      // Remove DOM elements
      loadingScreen.remove();
      
      // Call continuation callback
      if (onContinue) {
        onContinue();
      }
    }, 600);
  }
  
  // Update progress indicator
  function updateProgress(percent) {
    loaderMeter.textContent = `Loading... ${percent}%`;
  }
  
  // Check if both loading and crawl are complete
  function checkIfReadyToShowStartGate() {
    if (isLoaded && crawlCompleted) {
      showStartGate();
    }
  }
  
  // Show start gate when both loading and crawl are complete
  function showStartGate() {
    loaderMeter.classList.add('loaded');
    startGate.classList.add('visible');
    
    // Add additional validation before showing start gate
    setTimeout(() => {
      // Double-check that everything is ready
      if (isLoaded && crawlCompleted) {
        startGate.focus();
        console.log('Start gate is now active - game ready to begin');
      }
    }, 500); // Small delay to ensure everything is settled
  }
  
  // Mark crawl as completed after animation duration
  function startCrawlTimer() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const crawlDuration = prefersReducedMotion ? 120000 : 60000; // 2min for reduced motion, 1min normal
    
    setTimeout(() => {
      crawlCompleted = true;
      checkIfReadyToShowStartGate();
    }, crawlDuration);
  }
  
  // Return cleanup function
  return {
    destroy: () => {
      if (matrixAnimation.stop) {
        matrixAnimation.stop();
      }
      // Don't stop the global music here - let it continue
      // audioManager.stopMusic();
      loadingScreen.remove();
      document.removeEventListener('keydown', handleKeyPress, true);
      window.removeEventListener('game:assetsProgress', handleProgress);
      window.removeEventListener('game:assetsLoaded', handleLoaded);
    }
  };
}

/**
 * Simplified Audio Manager for Loading Screen Music
 */
function createAudioManager() {
  let backgroundMusic = null;
  let isPlaying = false;
  
  // Initialize simple HTML5 Audio
  function initAudio() {
    console.log('Initializing simple HTML5 Audio');
    backgroundMusic = new Audio('./audio/l_theme_death_note.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5; // Volume level
    backgroundMusic.preload = 'auto';
    
    console.log('Audio source set to:', backgroundMusic.src);
    
    backgroundMusic.addEventListener('error', (e) => {
      console.error('Loading screen music could not be loaded:', e);
    });
    
    backgroundMusic.addEventListener('canplaythrough', () => {
      console.log('Loading screen music ready');
      
    });
  }
  
  
  // Start playing music
  function startMusic() {
    console.log('Attempting to start music...');
    console.log('Background music:', backgroundMusic ? 'exists' : 'null');
    console.log('Is playing:', isPlaying);
    
    if (backgroundMusic && !isPlaying) {
      // Try to play immediately
      const playPromise = backgroundMusic.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlaying = true;
            console.log('Loading screen music started successfully');
          })
          .catch((error) => {
            console.log('Auto-play blocked by browser - music will start on user interaction:', error.message);
            // Don't treat this as an error - it's expected behavior
          });
      }
    } else if (isPlaying) {
      console.log('Music is already playing');
    } else {
      console.warn('Cannot start music - missing background music');
    }
  }
  
  // Stop playing music
  function stopMusic() {
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
      backgroundMusic.volume = 0; // Mute the volume
      console.log('Loading screen music paused and muted');
    }
    
    isPlaying = false;
    console.log('Loading screen music stopped');
    
    // Also stop any other audio elements on the page
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        console.log('Stopped additional audio element');
      }
    });
  }
  
  // Initialize audio when manager is created
  initAudio();
  
  return {
    startMusic,
    stopMusic,
    isPlaying: () => isPlaying
  };
}

/**
 * Creates the Matrix code rain animation
 */
function createMatrixRain(canvas) {
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Matrix rain settings
  const fontSize = 14;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = new Array(columns).fill(1);
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let animationId;
  
  function draw() {
    // Semi-transparent black background for trailing effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#00ff66';
    ctx.font = `${fontSize}px monospace`;
    
    // Draw characters for each column
    for (let i = 0; i < drops.length; i++) {
      // Pick a random character
      const text = characters[Math.floor(Math.random() * characters.length)];
      
      // Calculate alpha based on position (fade effect)
      const alpha = Math.max(0, 1 - (drops[i] * fontSize) / canvas.height);
      ctx.globalAlpha = alpha;
      
      // Draw the character
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      
      // Reset drops to top randomly - MODIFIED: Stop at 80% of screen height
      if (drops[i] * fontSize > canvas.height * 0.8 && Math.random() > 0.975) {
        drops[i] = 0;
      }
      
      // Move drop down
      drops[i]++;
    }
    
    // Reset alpha
    ctx.globalAlpha = 1;
    
    // Continue animation
    animationId = requestAnimationFrame(draw);
  }
  
  // Start animation
  draw();
  
  // Return stop function
  return {
    stop: () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', resizeCanvas);
    }
  };
}

/**
 * Utility function to dispatch loading progress events
 * This can be called from your game's loader
 */
export function dispatchLoadingProgress(percent) {
  window.dispatchEvent(new CustomEvent('game:assetsProgress', { 
    detail: { pct: percent } 
  }));
}

/**
 * Utility function to dispatch loading complete event
 * This should be called when all assets are loaded
 */
export function dispatchLoadingComplete() {
  window.dispatchEvent(new CustomEvent('game:assetsLoaded'));
}