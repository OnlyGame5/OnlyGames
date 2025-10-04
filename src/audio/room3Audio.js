// Minimal audio hooks for Room 3. Uses HTMLAudioElement placeholders.
// TODO: Replace with a shared WebAudio loader/mixer if one exists later.

const cache = new Map();
let masterVolume = 0.6;

export function setRoom3Volume(v) { masterVolume = Math.max(0, Math.min(1, v)); }

function getAudio(name, src) {
  if (!cache.has(name)) {
    const a = new Audio(src);
    a.preload = 'auto';
    cache.set(name, a);
  }
  return cache.get(name).cloneNode();
}

export const room3Audio = {
  chime() { const a = getAudio('chime1', '/assets/room3/sfx/chime1.mp3'); a.volume = masterVolume; a.play().catch(()=>{}); },
  buzz() { const a = getAudio('buzz1', '/assets/room3/sfx/buzz1.mp3'); a.volume = masterVolume; a.play().catch(()=>{}); },
  alarm() { const a = getAudio('alarm', '/assets/room3/sfx/alarm.mp3'); a.loop = true; a.volume = masterVolume * 0.6; a.play().catch(()=>{}); return a; },
  staticBurst() { const a = getAudio('static', '/assets/room3/sfx/static.mp3'); a.volume = masterVolume; a.play().catch(()=>{}); }
};
