// GlobalMusicManager: persistent background music across screens
// - Plays "on top" of main menu and loading overlays
// - Starts on first user interaction (to satisfy browser autoplay policies)
// - Exposes start/stop/ensureStarted and state helpers

import './AudioBus.js';

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
    // Track sources
    sources: {
      menu: '/audio/l_theme_death_note.mp3',
      game: new URL('../audio/nexus_dialogue/background music.mp3', import.meta.url).href,
    },
    // Default to menu music; specific screens can switch tracks
    source: '/audio/l_theme_death_note.mp3',
    musicLevel: 0.3, // music-specific level (pre-master)
    fadeMs: 800,
    autoStartBound: false,
    fading: null,
  };

  function createAudioElement() {
    const audio = new Audio(STATE.source);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = computeEffectiveVolume();
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

  function getMasterVolume(){
    return (window.AudioBus && typeof window.AudioBus.getMasterVolume === 'function')
      ? window.AudioBus.getMasterVolume()
      : 1.0;
  }

  function computeEffectiveVolume(){
    return Math.min(1, Math.max(0, STATE.musicLevel * getMasterVolume()));
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
      STATE.audio.volume = computeEffectiveVolume();
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

  function resolveSource(keyOrUrl) {
    if (!keyOrUrl) return STATE.source;
    if (keyOrUrl in STATE.sources) return STATE.sources[keyOrUrl];
    return keyOrUrl;
  }

  async function setSource(keyOrUrl, { autoPlay = true } = {}) {
    init();
    const next = resolveSource(keyOrUrl);
    if (!next || next === STATE.source) return true;
    STATE.source = next;

    if (!STATE.audio) STATE.audio = createAudioElement();

    try {
      // Simple swap with minimal gap; retain volume policy
      STATE.audio.pause();
      STATE.audio.src = STATE.source;
      STATE.audio.load();
      STATE.audio.volume = computeEffectiveVolume();
      if (autoPlay) {
        await STATE.audio.play();
        STATE.isPlaying = true;
        STATE.autoplayBlocked = false;
      }
      return true;
    } catch (err) {
      console.warn('GlobalMusicManager: setSource autoplay blocked or failed; will rely on interaction', err);
      STATE.autoplayBlocked = true;
      return false;
    }
  }

  async function playMenuTrack() {
    await setSource('menu');
    return ensureStarted();
  }

  async function playGameTrack() {
    await setSource('game');
    return ensureStarted();
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

  function cancelActiveFade() {
    if (STATE.fading && typeof STATE.fading.cancel === 'function') {
      STATE.fading.cancel();
    }
    STATE.fading = null;
  }

  // Smoothly fade music level (pre-master) to a target over ms
  function fadeToVolume(targetVol, ms = STATE.fadeMs) {
    init();
    if (!STATE.audio) return Promise.resolve();

    cancelActiveFade();

    const clampedTarget = Math.min(1, Math.max(0, targetVol));
    const startLevel = STATE.musicLevel;
    const duration = Math.max(0, ms);
    if (duration === 0 || startLevel === clampedTarget) {
      STATE.musicLevel = clampedTarget;
      STATE.audio.volume = computeEffectiveVolume();
      return Promise.resolve();
    }

    const t0 = performance.now();
    let rafId = 0;
    let cancelled = false;

    const promise = new Promise((resolve) => {
      const step = (t) => {
        if (cancelled) return;
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 2); // ease-out
        STATE.musicLevel = startLevel + (clampedTarget - startLevel) * eased;
        STATE.audio.volume = computeEffectiveVolume();
        if (p < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          STATE.musicLevel = clampedTarget; // persist target as base level
          STATE.fading = null;
          resolve();
        }
      };
      rafId = requestAnimationFrame(step);
    });

    STATE.fading = {
      cancel: () => {
        if (rafId) cancelAnimationFrame(rafId);
        cancelled = true;
        STATE.fading = null;
      }
    };

    return promise;
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
          STATE.audio.volume = computeEffectiveVolume(); // reset for next time
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
    // Set music-specific level; master volume is applied multiplicatively
    STATE.musicLevel = Math.min(1, Math.max(0, vol));
    if (STATE.audio) STATE.audio.volume = computeEffectiveVolume();
  }

  window.GlobalMusicManager = {
    init,
    start,
    ensureStarted,
    setSource,
    playMenuTrack,
    playGameTrack,
    stop: fadeOutAndStop,
    isCurrentlyPlaying,
    isAutoplayBlocked,
    setVolume,
    fadeToVolume,
  };

  // Initialize ASAP and bind auto-start listeners
  init();
  bindAutoStartOnce();

  // React to master volume changes
  if (window.AudioBus && typeof window.AudioBus.onChange === 'function') {
    window.AudioBus.onChange(() => {
      if (STATE.audio) STATE.audio.volume = computeEffectiveVolume();
    });
  }
})();
