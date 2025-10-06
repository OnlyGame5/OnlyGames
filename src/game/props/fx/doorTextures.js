import * as THREE from 'three';

/**
 * Creates in-memory Canvas textures for door elements
 */
export function createWarningLabelTexture(text = "RESTRICTED SECTOR", width = 256, height = 64, isRed = false) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Choose color based on isRed parameter
  const color = isRed ? '#ff0000' : '#00ff00';
  const bgColor = isRed ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)';
  
  // Background with slight transparency
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  
  // Text
  ctx.fillStyle = color;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a scanning bar texture for the lock mechanism
 */
export function createScanBarTexture(width = 64, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Create gradient scan bar
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(0, 229, 255, 0)');
  gradient.addColorStop(0.3, 'rgba(0, 229, 255, 0.8)');
  gradient.addColorStop(0.7, 'rgba(0, 229, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
