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
  
  // Event listeners
  let isLoaded = false;
  let hasContinued = false;
  let crawlCompleted = false;
  
  // Keyboard listener for Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isLoaded && !hasContinued) {
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
  
  // Add event listeners
  document.addEventListener('keydown', handleKeyPress);
  startGate.addEventListener('click', handleStartGateClick);
  startGate.addEventListener('keydown', handleStartGateKeyPress);
  
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
    
    // Add fade out class
    loadingScreen.classList.add('fade-out');
    
    // Clean up after fade
    setTimeout(() => {
      // Stop matrix animation
      if (matrixAnimation.stop) {
        matrixAnimation.stop();
      }
      
      // Remove event listeners
      document.removeEventListener('keydown', handleKeyPress);
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
    // Focus the start gate for accessibility
    startGate.focus();
  }
  
  // Mark crawl as completed after animation duration
  function startCrawlTimer() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const crawlDuration = prefersReducedMotion ? 90000 : 45000; // 90s for reduced motion, 45s normal
    
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
      loadingScreen.remove();
      document.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('game:assetsProgress', handleProgress);
      window.removeEventListener('game:assetsLoaded', handleLoaded);
    }
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
      
      // Reset drops to top randomly
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
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
