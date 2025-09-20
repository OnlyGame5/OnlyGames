export const AI = {
  say: (text) => {
    const d = document.getElementById('dialogue');
    if (d) d.textContent = "AI Companion: " + text;
  },
  warm: (t) => AI.say(t),
  neutral: (t) => AI.say(t),
  hostile: (t) => AI.say("[Hostile] " + t)
};
