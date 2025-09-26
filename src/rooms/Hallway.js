import * as THREE from 'three';

/**
 * Minimal hallway that sits just behind the Room 1 back wall (z ≈ -3)
 * and extends along -Z so players can "walk through" when the shelf opens.
 *
 * Adjust `originZ` if your back wall z is different.
 */
export function createHallway({
  width = 2.5,
  height = 2.2,
  length = 6,
  originZ = -3.12, // just behind the back wall (z=-3)
  x = 0,
} = {}) {
  const group = new THREE.Group();
  group.name = 'hallway';
  
  // The hallway runs from originZ backward along -Z
  const centerZ = originZ - length / 2;
  group.position.set(x, 0, centerZ);
  
  // Floor
  const floorGeometry = new THREE.BoxGeometry(width, 0.02, length);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: '#1f2937' });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, -0.01, 0);
  floor.receiveShadow = true;
  group.add(floor);
  
  // Ceiling
  const ceilingGeometry = new THREE.BoxGeometry(width, 0.02, length);
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: '#111827' });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.set(0, height, 0);
  group.add(ceiling);
  
  // Left wall
  const leftWallGeometry = new THREE.BoxGeometry(0.02, height, length);
  const leftWallMaterial = new THREE.MeshStandardMaterial({ color: '#334155' });
  const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
  leftWall.position.set(-width / 2, height / 2, 0);
  group.add(leftWall);
  
  // Right wall
  const rightWallGeometry = new THREE.BoxGeometry(0.02, height, length);
  const rightWallMaterial = new THREE.MeshStandardMaterial({ color: '#334155' });
  const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
  rightWall.position.set(width / 2, height / 2, 0);
  group.add(rightWall);
  
  return group;
}
