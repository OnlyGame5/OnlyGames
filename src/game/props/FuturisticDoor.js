import * as THREE from 'three';
import { createWarningLabelTexture, createScanBarTexture } from './fx/doorTextures.js';

// Configuration constants
const OPEN_SPEED = 1.2; // seconds to fully open/close
const LOCK_RING_SPEED_LOCKED = 0.5; // radians per second
const LOCK_RING_SPEED_UNLOCKED = 2.0;
const SCAN_SPEED_LOCKED = 2.0; // texture scroll speed
const SCAN_SPEED_UNLOCKED = 0.5;
const LED_PULSE_BASE_LOCKED = 0.3;
const LED_PULSE_AMP_LOCKED = 0.2;
const LED_PULSE_BASE_UNLOCKED = 0.6;
const LED_PULSE_AMP_UNLOCKED = 0.4;
const SEAM_MAX_EMISSIVE = 0.8;

/**
 * Creates a futuristic sliding door
 * @param {Object} options - Configuration options
 * @returns {THREE.Group} Door group with userData API
 */
export function createFuturisticDoor(options = {}) {
  const {
    keyId = null,
    locked = true,
    position = { x: 0, y: 0, z: 0 },
    rotationY = 0,
    width = 3.6,
    height = 3.9,
    openOffset = 0.95,
    labelText = "RESTRICTED SECTOR",
    id = `door_${Math.random().toString(36).substr(2, 9)}`
  } = options;

  const doorGroup = new THREE.Group();
  doorGroup.name = 'futuristic-door';
  
  // Set up userData with API methods
  doorGroup.userData = {
    type: 'interactable',
    category: 'door',
    id,
    keyId,
    locked,
    openOffset, // Store the openOffset value
    state: {
      openAmount: 0,
      targetOpenAmount: 0,
      hasTriggeredOpen: false,
      hasTriggeredClose: false
    },
    setLocked: (v) => { doorGroup.userData.locked = v; },
    openDoor: () => { 
      doorGroup.userData.state.targetOpenAmount = 1; 
    },
    closeDoor: () => { doorGroup.userData.state.targetOpenAmount = 0; },
    toggle: () => {
      if (!doorGroup.userData.locked) {
        const target = doorGroup.userData.state.targetOpenAmount;
        doorGroup.userData.state.targetOpenAmount = target > 0.5 ? 0 : 1;
      }
    },
    tryUnlock: (hasKey) => {
      if (doorGroup.userData.locked && hasKey) {
        doorGroup.userData.locked = false;
        if (doorGroup.userData.onUnlock) doorGroup.userData.onUnlock();
        return true;
      } else if (doorGroup.userData.locked && !hasKey) {
        if (doorGroup.userData.onDenied) doorGroup.userData.onDenied();
        return false;
      }
      return true;
    },
    update: (dt) => updateDoor(doorGroup, dt),
    onOpen: undefined,
    onClose: undefined,
    onUnlock: undefined,
    onDenied: undefined
  };

  // Create door components
  createDoorFrame(doorGroup, width, height);
  createDoorPanels(doorGroup, width, height);
  createLEDStrips(doorGroup, width, height);
  createCenterSeam(doorGroup, width, height);
  createLockMechanism(doorGroup, width, height);
  createWarningLabel(doorGroup, width, height, labelText);

  // Position the door
  doorGroup.position.set(position.x, position.y, position.z);
  doorGroup.rotation.y = rotationY;

  return doorGroup;
}

function createDoorFrame(group, width, height) {
  const frameThickness = 0.02; // Even thinner frame
  const frameDepth = 0.02; // Even thinner depth
  
  // Outer rounded frame - much thinner
  const frameGeometry = new THREE.BoxGeometry(width + frameThickness, height + frameThickness, frameDepth);
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.3 // Make frame very transparent
  });
  
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.position.z = -frameDepth / 2 - 0.2; // Move much further back
  frame.castShadow = true;
  frame.receiveShadow = true;
  group.add(frame);
  
  // Inner bezel - much thinner and positioned further back
  const bezelGeometry = new THREE.BoxGeometry(width - 0.1, height - 0.1, 0.01);
  const bezelMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.2 // Make bezel very transparent
  });
  
  const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
  bezel.position.z = -0.15; // Move even further back to avoid blocking view
  group.add(bezel);
}

function createDoorPanels(group, width, height) {
  const panelThickness = 0.01; // Even thinner panels
  const panelWidth = width / 2 - 0.05;
  
  // Left panel
  const leftPanel = new THREE.Mesh(
    new THREE.BoxGeometry(panelWidth, height - 0.2, panelThickness),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.3
    })
  );
  leftPanel.position.set(-panelWidth / 2, 0, -0.01); // Move further back
  leftPanel.castShadow = true;
  leftPanel.receiveShadow = true;
  leftPanel.name = 'left-panel';
  group.add(leftPanel);
  
  // Right panel
  const rightPanel = new THREE.Mesh(
    new THREE.BoxGeometry(panelWidth, height - 0.2, panelThickness),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.3
    })
  );
  rightPanel.position.set(panelWidth / 2, 0, -0.01); // Move further back
  rightPanel.castShadow = true;
  rightPanel.receiveShadow = true;
  rightPanel.name = 'right-panel';
  group.add(rightPanel);
}

function createLEDStrips(group, width, height) {
  const stripThickness = 0.02;
  
  // Left LED strip - starts red when locked
  const leftLED = new THREE.Mesh(
    new THREE.BoxGeometry(stripThickness, height - 0.4, 0.01),
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    })
  );
  leftLED.position.set(-width / 2 + 0.1, 0, 0.03);
  leftLED.name = 'left-led';
  group.add(leftLED);
  
  // Right LED strip - starts red when locked
  const rightLED = new THREE.Mesh(
    new THREE.BoxGeometry(stripThickness, height - 0.4, 0.01),
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    })
  );
  rightLED.position.set(width / 2 - 0.1, 0, 0.03);
  rightLED.name = 'right-led';
  group.add(rightLED);
}

function createCenterSeam(group, width, height) {
  const seamGeometry = new THREE.BoxGeometry(0.02, height - 0.2, 0.01);
  const seamMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.8
  });
  
  const seam = new THREE.Mesh(seamGeometry, seamMaterial);
  seam.position.set(0, 0, 0.03);
  seam.name = 'center-seam';
  group.add(seam);
}

function createLockMechanism(group, width, height) {
  const lockRadius = 0.2;
  
  // Lock core (puck)
  const lockCore = new THREE.Mesh(
    new THREE.CylinderGeometry(lockRadius, lockRadius, 0.1, 16),
    new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.1
    })
  );
  lockCore.position.set(0, 0, 0.05);
  lockCore.rotation.x = Math.PI / 2;
  lockCore.name = 'lock-core';
  group.add(lockCore);
  
  // Rotating lock ring
  const lockRing = new THREE.Mesh(
    new THREE.TorusGeometry(lockRadius + 0.05, 0.02, 8, 16),
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    })
  );
  lockRing.position.set(0, 0, 0.05);
  lockRing.name = 'lock-ring';
  group.add(lockRing);
  
  // Scanner slit
  const scannerGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.01);
  const scannerMaterial = new THREE.MeshStandardMaterial({
    map: createScanBarTexture(),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  
  const scanner = new THREE.Mesh(scannerGeometry, scannerMaterial);
  scanner.position.set(0, 0, 0.06);
  scanner.name = 'scanner';
  group.add(scanner);
}

function createWarningLabel(group, width, height, labelText) {
  // Start with red "RESTRICTED SECTOR" text
  const labelTexture = createWarningLabelTexture("RESTRICTED SECTOR", 256, 64, true);
  const labelMaterial = new THREE.SpriteMaterial({
    map: labelTexture,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  
  const label = new THREE.Sprite(labelMaterial);
  label.scale.set(1.5, 0.4, 1);
  label.position.set(-width / 4, height / 2 - 0.5, 0.15);
  label.name = 'warning-label';
  group.add(label);
}

function updateDoor(doorGroup, dt) {
  const state = doorGroup.userData.state;
  const locked = doorGroup.userData.locked;
  
  // Simple animation: always update if target is different
  if (state.targetOpenAmount !== state.openAmount) {
    const speed = 2.0; // Much faster animation
    const direction = state.targetOpenAmount > state.openAmount ? 1 : -1;
    state.openAmount += direction * speed * dt;
    
    // Clamp to target
    if (direction > 0 && state.openAmount >= state.targetOpenAmount) {
      state.openAmount = state.targetOpenAmount;
    } else if (direction < 0 && state.openAmount <= state.targetOpenAmount) {
      state.openAmount = state.targetOpenAmount;
    }
    
    // Move panels
    const leftPanel = doorGroup.getObjectByName('left-panel');
    const rightPanel = doorGroup.getObjectByName('right-panel');
    const openOffset = doorGroup.userData.openOffset || 2.0;
    
    if (leftPanel) {
      leftPanel.position.x = -leftPanel.geometry.parameters.width / 2 - openOffset * state.openAmount;
      // Hide panels completely when door is fully open
      if (state.openAmount > 0.9) {
        leftPanel.visible = false;
      } else {
        leftPanel.visible = true;
        leftPanel.material.opacity = 1.0 - state.openAmount;
        leftPanel.material.transparent = true;
      }
    }
    if (rightPanel) {
      rightPanel.position.x = rightPanel.geometry.parameters.width / 2 + openOffset * state.openAmount;
      // Hide panels completely when door is fully open
      if (state.openAmount > 0.9) {
        rightPanel.visible = false;
      } else {
        rightPanel.visible = true;
        rightPanel.material.opacity = 1.0 - state.openAmount;
        rightPanel.material.transparent = true;
      }
    }
    
    console.log('Door animating:', {
      openAmount: state.openAmount,
      targetOpenAmount: state.targetOpenAmount,
      leftPanelPos: leftPanel ? leftPanel.position.x : 'N/A',
      rightPanelPos: rightPanel ? rightPanel.position.x : 'N/A'
    });
    
    // Fire events (prevent spamming with flags)
    if (state.openAmount > 0.9 && !state.hasTriggeredOpen && doorGroup.userData.onOpen) {
      state.hasTriggeredOpen = true;
      state.hasTriggeredClose = false;
      doorGroup.userData.onOpen();
    }
    if (state.openAmount < 0.1 && !state.hasTriggeredClose && doorGroup.userData.onClose) {
      state.hasTriggeredClose = true;
      state.hasTriggeredOpen = false;
      doorGroup.userData.onClose();
    }
  }
  
  // Update LED strips - change color based on lock state
  const leftLED = doorGroup.getObjectByName('left-led');
  const rightLED = doorGroup.getObjectByName('right-led');
  const time = Date.now() * 0.001;
  
  if (leftLED && rightLED) {
    const baseIntensity = locked ? LED_PULSE_BASE_LOCKED : LED_PULSE_BASE_UNLOCKED;
    const ampIntensity = locked ? LED_PULSE_AMP_LOCKED : LED_PULSE_AMP_UNLOCKED;
    const pulseSpeed = locked ? 1.0 : 2.0;
    const intensity = baseIntensity + ampIntensity * Math.sin(time * pulseSpeed);
    
    // Change color based on lock state
    if (locked) {
      leftLED.material.color.setHex(0xff0000);
      leftLED.material.emissive.setHex(0xff0000);
      rightLED.material.color.setHex(0xff0000);
      rightLED.material.emissive.setHex(0xff0000);
    } else {
      leftLED.material.color.setHex(0x00ff00);
      leftLED.material.emissive.setHex(0x00ff00);
      rightLED.material.color.setHex(0x00ff00);
      rightLED.material.emissive.setHex(0x00ff00);
    }
    
    leftLED.material.emissiveIntensity = intensity;
    rightLED.material.emissiveIntensity = intensity;
  }
  
  // Update center seam - change color based on lock state
  const centerSeam = doorGroup.getObjectByName('center-seam');
  if (centerSeam) {
    if (locked) {
      centerSeam.material.color.setHex(0xff0000);
      centerSeam.material.emissive.setHex(0xff0000);
    } else {
      centerSeam.material.color.setHex(0x00ff00);
      centerSeam.material.emissive.setHex(0x00ff00);
    }
    centerSeam.material.emissiveIntensity = SEAM_MAX_EMISSIVE * (1 - state.openAmount);
  }
  
  // Update lock ring rotation and color
  const lockRing = doorGroup.getObjectByName('lock-ring');
  if (lockRing) {
    const ringSpeed = locked ? LOCK_RING_SPEED_LOCKED : LOCK_RING_SPEED_UNLOCKED;
    lockRing.rotation.z += ringSpeed * dt;
    
    // Change color based on lock state
    if (locked) {
      lockRing.material.color.setHex(0xff0000);
      lockRing.material.emissive.setHex(0xff0000);
    } else {
      lockRing.material.color.setHex(0x00ff00);
      lockRing.material.emissive.setHex(0x00ff00);
    }
  }
  
  // Update scanner texture
  const scanner = doorGroup.getObjectByName('scanner');
  if (scanner && scanner.material.map) {
    const scanSpeed = locked ? SCAN_SPEED_LOCKED : SCAN_SPEED_UNLOCKED;
    scanner.material.map.offset.y += scanSpeed * dt;
    scanner.material.map.needsUpdate = true;
  }
  
  // Update warning label text and color based on lock state
  const warningLabel = doorGroup.getObjectByName('warning-label');
  if (warningLabel && warningLabel.material.map) {
    if (locked) {
      // When locked: show "RESTRICTED SECTOR" in red
      const redTexture = createWarningLabelTexture("RESTRICTED SECTOR", 256, 64, true);
      warningLabel.material.map = redTexture;
      warningLabel.material.needsUpdate = true;
    } else {
      // When unlocked: show "chmod Subject Delta" in green
      const greenTexture = createWarningLabelTexture("chmod Subject Delta", 256, 64, false);
      warningLabel.material.map = greenTexture;
      warningLabel.material.needsUpdate = true;
    }
  }
}