// Math utilities for game calculations
export const MathUtils = {
  // Clamp value between min and max
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  // Linear interpolation
  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  // Convert degrees to radians
  degToRad(degrees) {
    return degrees * (Math.PI / 180);
  },

  // Convert radians to degrees
  radToDeg(radians) {
    return radians * (180 / Math.PI);
  },

  // Random number between min and max
  random(min, max) {
    return Math.random() * (max - min) + min;
  },

  // Random integer between min and max (inclusive)
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};
