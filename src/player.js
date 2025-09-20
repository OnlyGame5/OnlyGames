import * as THREE from 'three';

const keys = {};

export function setupPlayer(scene) {
  const player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1.8, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
  );
  player.position.set(0, 0.9, 0);
  player.castShadow = true;
  scene.add(player);

  window.addEventListener('keydown', (e)=> keys[e.code] = true);
  window.addEventListener('keyup', (e)=> keys[e.code] = false);

  return player;
}

export function updatePlayer(player) {
  const speed = 0.15;
  if (keys['KeyW']) player.position.z -= speed;
  if (keys['KeyS']) player.position.z += speed;
  if (keys['KeyA']) player.position.x -= speed;
  if (keys['KeyD']) player.position.x += speed;
}

export function attachCamera(camera, player) {
  camera.position.set(player.position.x, player.position.y+5, player.position.z+10);
  camera.lookAt(player.position);
}
