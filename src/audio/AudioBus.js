// AudioBus: simple global master volume controller with persistence and change events
// Usage:
//   - window.AudioBus.getMasterVolume() // 0..1
//   - window.AudioBus.setMasterVolume(0.8)
//   - window.AudioBus.onChange(cb) // cb(vol)
//   - window.AudioBus.offChange(cb)

(function initAudioBus(){
  if (window.AudioBus) return;

  const LS_KEY = 'masterVolume';
  function clamp01(v){ return Math.min(1, Math.max(0, v)); }

  let masterVolume = 1.0;
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored != null) {
      const num = parseFloat(stored);
      if (!Number.isNaN(num)) masterVolume = clamp01(num);
    }
  } catch (e) {
    // ignore storage errors
  }

  const listeners = new Set();

  function getMasterVolume(){
    return masterVolume;
  }

  function setMasterVolume(v){
    const clamped = clamp01(v);
    if (clamped === masterVolume) return;
    masterVolume = clamped;
    try { localStorage.setItem(LS_KEY, String(masterVolume)); } catch(_){}
    // notify
    listeners.forEach(fn => {
      try { fn(masterVolume); } catch(e){ console.error('AudioBus listener error', e); }
    });
  }

  function onChange(fn){ if (typeof fn === 'function') listeners.add(fn); }
  function offChange(fn){ listeners.delete(fn); }

  window.AudioBus = { getMasterVolume, setMasterVolume, onChange, offChange };
})();
