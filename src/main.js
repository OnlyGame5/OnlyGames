import * as THREE from 'three';
import { setupPlayer, updatePlayer, attachCamera } from './player.js';
import { AI } from './ai.js';
import { createRoom1 } from './room1.js';
import { createRoom2 } from './room2.js';
import { createRoom3 } from './room3.js';
import { handleMouseClick } from './utils.js';

// --- Scene, Camera, Renderer ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b12);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 10);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);
scene.add(new THREE.HemisphereLight(0x8888aa, 0x222222, 0.6));

// Player
const player = setupPlayer(scene);

// Rooms
const room1 = createRoom1(scene);
const room2 = createRoom2(scene, 20, 0);
const room3 = createRoom3(scene, -20, 0);

// AI Dialogue
AI.say("Hello, I’m here to help you… trust me.");

// Input
window.addEventListener('click', (e) => handleMouseClick(e, camera, [room1, room2, room3]));

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Loop
function animate() {
  requestAnimationFrame(animate);
  updatePlayer(player);
  attachCamera(camera, player);
  renderer.render(scene, camera);
}
animate();
