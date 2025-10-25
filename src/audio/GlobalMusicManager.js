// GlobalMusicManager: persistent background music across screens
// - Plays "on top" of main menu and loading overlays
// - Starts on first user interaction (to satisfy browser autoplay policies)
// - Exposes start/stop/ensureStarted and state helpers

(function initGlobalMusicManager(){
  if (window.GlobalMusicManager) {
    // Already initialized by another module import
    return;
  }

  const STATE = {
    audio: null,
    isInitialized: false,
    isPlaying: false,
    autoplayBlocked: false,
    source: './audio/l_theme_death_note.mp3',
    volume: 0.3,
    fadeMs: 800,
    autoStartBound: false,
  };

  function createAudioElement() {
    const audio = new Audio(STATE.source);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = STATE.volume;
    audio.style.display = 'none';
    document.body.appendChild(audio);

    audio.addEventListener('error', (e) => {
      console.error('Global music load error:', e);
    });
    audio.addEventListener('canplaythrough', () => {
      console.log('GlobalMusicManager: ready');
    });
    audio.addEventListener('play', () => {
      STATE.isPlaying = true;
      STATE.autoplayBlocked = false;
      console.log('GlobalMusicManager: play');
    });
    audio.addEventListener('pause', () => {
      STATE.isPlaying = false;
      console.log('GlobalMusicManager: pause');
    });

    return audio;
  }

  function init() {
    if (STATE.isInitialized) return;
    if (!document.body) {
      // In case this runs before DOM is available
      window.addEventListener('DOMContentLoaded', init, { once: true });
      return;
    }
    STATE.audio = createAudioElement();
    STATE.isInitialized = true;
  }

  async function start() {
    init();
    if (!STATE.audio) return false;

    // If already actually playing, resolve true
    if (!STATE.audio.paused && STATE.isPlaying) {
      return true;
    }

    // If flag says playing but audio is paused, fix the flag
    if (STATE.isPlaying && STATE.audio.paused) {
      STATE.isPlaying = false;
    }

    try {
      // Ensure volume is set (in case a previous fade-out muted it)
      STATE.audio.volume = STATE.volume;
      await STATE.audio.play();
      STATE.isPlaying = true;
      STATE.autoplayBlocked = false;
      console.log('GlobalMusicManager: started');
      return true;
    } catch (err) {
      STATE.autoplayBlocked = true;
      console.log('GlobalMusicManager: autoplay blocked (awaiting user interaction)');
      return false;
    }
  }

  function bindAutoStartOnce() {
    if (STATE.autoStartBound) return;
    STATE.autoStartBound = true;

    const handler = async (e) => {
      await start();
      // After first successful attempt (or attempt regardless), remove listeners
      interactionEvents.forEach(type => document.removeEventListener(type, handler, captureOptions));
      document.removeEventListener('visibilitychange', visHandler);
      window.removeEventListener('focus', focusHandler);
    };

    const visHandler = async () => {
      if (!document.hidden) {
        await start();
      }
    };

    const focusHandler = async () => {
      await start();
    };

    const interactionEvents = ['pointerdown', 'click', 'touchstart', 'keydown', 'mousedown'];
    const captureOptions = { capture: true, passive: true };

    interactionEvents.forEach(type => document.addEventListener(type, handler, captureOptions));
    document.addEventListener('visibilitychange', visHandler);
    window.addEventListener('focus', focusHandler);
  }

  async function ensureStarted() {
    // Try immediately, then rely on bound listeners if blocked
    const ok = await start();
    bindAutoStartOnce();
    return ok;
  }

  async function fadeOutAndStop(ms = STATE.fadeMs) {
    init();
    if (!STATE.audio) return;

    const startVol = STATE.audio.volume;
    const duration = Math.max(0, ms);
    if (duration === 0) {
      STATE.audio.pause();
      STATE.audio.currentTime = 0;
      STATE.isPlaying = false;
      return;
    }

    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        STATE.audio.volume = startVol * (1 - p);
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          STATE.audio.pause();
          STATE.audio.currentTime = 0;
          STATE.audio.volume = STATE.volume; // reset for next time
          STATE.isPlaying = false;
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  function isCurrentlyPlaying() {
    return !!(STATE.audio && !STATE.audio.paused && STATE.isPlaying);
  }

  function isAutoplayBlocked() {
    return STATE.autoplayBlocked;
  }

  function setVolume(vol) {
    STATE.volume = Math.min(1, Math.max(0, vol));
    if (STATE.audio) STATE.audio.volume = STATE.volume;
  }

  window.GlobalMusicManager = {
    init,
    start,
    ensureStarted,
    stop: fadeOutAndStop,
    isCurrentlyPlaying,
    isAutoplayBlocked,
    setVolume,
  };

  // Initialize ASAP and bind auto-start listeners
  init();
  bindAutoStartOnce();
})();
