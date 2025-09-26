import * as THREE from 'three';
import { gameStore } from '../../state/gameStore.js';

export function createSimonStand(position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.position.set(...position);
  group.name = 'simonStand';
  
  // Create base stand (cylinder)
  const baseGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.8, 24);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: '#2a3144',
    metalness: 0.6,
    roughness: 0.35
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.castShadow = true;
  base.receiveShadow = true;
  base.userData = { interactive: true, type: 'simonStand' };
  group.add(base);
  
  // Create display plate
  const plateGroup = new THREE.Group();
  plateGroup.position.set(0, 0.55, 0);
  plateGroup.rotation.set(-Math.PI / 12, 0, 0);
  
  const plateGeometry = new THREE.BoxGeometry(0.7, 0.05, 0.5);
  const plateMaterial = new THREE.MeshStandardMaterial({
    color: '#1b2130',
    metalness: 0.5,
    roughness: 0.4
  });
  const plate = new THREE.Mesh(plateGeometry, plateMaterial);
  plate.userData = { interactive: true, type: 'simonStand' };
  plateGroup.add(plate);
  
  // Create glow ring indicator
  const ringGeometry = new THREE.TorusGeometry(0.28, 0.035, 16, 48);
  const ringMaterial = new THREE.MeshStandardMaterial({
    emissive: '#64748b', // Default gray (locked)
    emissiveIntensity: 1.4,
    color: '#0f172a'
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.set(0, 0.03, 0);
  plateGroup.add(ring);
  
  // Create glass cover
  const glassGeometry = new THREE.BoxGeometry(0.66, 0.02, 0.46);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 0.9,
    thickness: 0.05,
    roughness: 0.15,
    transparent: true,
    opacity: 0.3
  });
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.set(0, 0.04, 0);
  plateGroup.add(glass);
  
  group.add(plateGroup);
  
  // Store references for updates
  group.userData = {
    ring: ring,
    base: base,
    plate: plate,
    glass: glass,
    interactive: true,
    type: 'simonStand'
  };
  
  // Add hover pulse animation
  let pulseTime = 0;
  const originalScale = group.scale.clone();
  
  function updateStand(deltaTime) {
    pulseTime += deltaTime;
    
    const { wirePuzzleComplete, memoryPuzzleComplete } = gameStore;
    
    // Update ring color based on state
    if (memoryPuzzleComplete) {
      ring.material.emissive.setHex(0x22c55e); // Green
    } else if (wirePuzzleComplete) {
      ring.material.emissive.setHex(0xf59e0b); // Amber
    } else {
      ring.material.emissive.setHex(0x64748b); // Gray
    }
    
    // Add subtle pulse if unlocked but not completed
    if (wirePuzzleComplete && !memoryPuzzleComplete) {
      const pulse = 1 + Math.sin(pulseTime * 2) * 0.02;
      group.scale.setScalar(pulse);
    } else {
      group.scale.copy(originalScale);
    }
  }
  
  // Store update function
  group.userData.update = updateStand;
  
  return group;
}
