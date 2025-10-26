import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadingScreen } from '../loading.js';
import { gameStore } from '../state/gameStore.js';

export function createWirePanel(opts = {}) {
  const order = opts.order || ['R','G','B','Y'];
  const useGLBModel = opts.useGLBModel !== false; // Default to true, can be disabled

  // State management
  const state = {
    order: order,
    input: [],
    solved: false,
    holding: null,        // { id:'R', color:'R' }
    pulse: 0,             // status strip pulse
    sparkTimer: 0,
    isOpen: false
  };

  // Create popup UI
  function createPopupUI() {
    const overlay = document.createElement('div');
    overlay.id = 'wirePanelOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      z-index: 2000;
      display: none;
      justify-content: center;
      align-items: center;
      cursor: default;
    `;

    const panel = document.createElement('div');
    panel.id = 'wirePanel';
    panel.style.cssText = `
      background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
      border: 3px solid #4c535a;
      border-radius: 15px;
      padding: 30px;
      width: 600px;
      height: 400px;
      position: relative;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
      cursor: default;
    `;

    // Panel header
    const header = document.createElement('div');
    header.style.cssText = `
      text-align: center;
      color: #ffffff;
      font-family: 'Courier New', monospace;
      font-size: 24px;
      margin-bottom: 20px;
      text-shadow: 0 0 10px #00ff00;
    `;
    header.textContent = 'WIRE PANEL';
    panel.appendChild(header);

    // Status strip
    const statusStrip = document.createElement('div');
    statusStrip.id = 'statusStrip';
    statusStrip.style.cssText = `
      width: 100%;
      height: 8px;
      background: #001122;
      border-radius: 4px;
      margin-bottom: 20px;
      box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
    `;
    panel.appendChild(statusStrip);

    // Top row - colored sockets
    const topRow = document.createElement('div');
    topRow.style.cssText = `
      display: flex;
      justify-content: space-around;
      margin-bottom: 40px;
    `;

    // Randomize the visual layout but keep the same logical order
    const colors = [
      { id: 'R', color: '#ff3b30', name: 'Red' },
      { id: 'G', color: '#34c759', name: 'Green' },
      { id: 'B', color: '#0a84ff', name: 'Blue' },
      { id: 'Y', color: '#ffcc00', name: 'Yellow' }
    ];
    
    // Shuffle the visual order but keep track of the mapping
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);

    shuffledColors.forEach(colorData => {
      const socket = document.createElement('div');
      socket.className = 'top-socket';
      socket.dataset.color = colorData.id;
      socket.style.cssText = `
        width: 80px;
        height: 80px;
        background: ${colorData.color};
        border: 3px solid #4c535a;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        text-shadow: 0 0 5px rgba(0,0,0,0.8);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
        position: relative;
      `;
      socket.textContent = colorData.name;
      
      // Add hover effect
      socket.addEventListener('mouseenter', () => {
        if (!state.solved && !socket.classList.contains('used')) {
          socket.style.transform = 'scale(1.1)';
          socket.style.boxShadow = '0 6px 12px rgba(0,0,0,0.5)';
        }
      });
      
      socket.addEventListener('mouseleave', () => {
        socket.style.transform = 'scale(1)';
        socket.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      });

      // Click handler
      socket.addEventListener('click', () => handleSocketClick(colorData.id, socket));
      
      topRow.appendChild(socket);
    });

    panel.appendChild(topRow);

    // Bottom row - neutral sockets
    const bottomRow = document.createElement('div');
    bottomRow.style.cssText = `
      display: flex;
      justify-content: space-around;
    `;

    for (let i = 0; i < 4; i++) {
      const socket = document.createElement('div');
      socket.className = 'bottom-socket';
      socket.dataset.index = i;
      socket.style.cssText = `
        width: 80px;
        height: 80px;
        background: #6b6f74;
        border: 3px solid #4c535a;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        text-shadow: 0 0 5px rgba(0,0,0,0.8);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
        position: relative;
      `;
      socket.textContent = 'PORT';
      
      // Add hover effect
      socket.addEventListener('mouseenter', () => {
        if (!state.solved && !socket.classList.contains('occupied')) {
          socket.style.transform = 'scale(1.1)';
          socket.style.boxShadow = '0 6px 12px rgba(0,0,0,0.5)';
        }
      });
      
      socket.addEventListener('mouseleave', () => {
        socket.style.transform = 'scale(1)';
        socket.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      });

      // Click handler
      socket.addEventListener('click', () => handlePortClick(i, socket));
      
      bottomRow.appendChild(socket);
    }

    panel.appendChild(bottomRow);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'CLOSE';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #ff4444;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    `;
    closeBtn.addEventListener('click', closePanel);
    panel.appendChild(closeBtn);

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'RESET';
    resetBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 100px;
      background: #ff8800;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    `;
    resetBtn.addEventListener('click', resetPuzzle);
    panel.appendChild(resetBtn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Prevent game from taking control when popup is open
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closePanel();
      }
    });

    // Prevent event propagation to game
    panel.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Prevent pointer lock when popup is open
    overlay.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    overlay.addEventListener('mouseup', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    return overlay;
  }

  function handleSocketClick(colorId, socketElement) {
    if (state.solved || state.holding) return;
    
    // Allow picking up ANY color without feedback
    state.holding = { id: colorId, color: colorId };
    socketElement.classList.add('selected');
    socketElement.style.border = '3px solid #00ff00';
    socketElement.style.boxShadow = '0 0 15px #00ff00';
    
    console.log('Started holding:', colorId);
  }

  function handlePortClick(portIndex, portElement) {
    if (!state.holding) return;
    
    // Check if port is already occupied
    if (portElement.classList.contains('occupied')) return;
    
    // Check if this is the correct slot in the sequence
    const expectedSlotIndex = state.input.length; // Should be 0, 1, 2, 3 in order
    if (portIndex !== expectedSlotIndex) {
      // Wrong slot - show red light and reset everything
      console.log('Wrong slot! Expected slot', expectedSlotIndex, 'but got', portIndex);
      updateStatusStrip('#ff0000', 0.8);
      triggerSparkEffect();
      return;
    }
    
    // Check if the color is correct for this position
    const expectedColor = state.order[state.input.length];
    if (state.holding.color !== expectedColor) {
      // Wrong color for this position - show red light and reset everything
      console.log('Wrong color for this position! Expected:', expectedColor, 'Got:', state.holding.color);
      updateStatusStrip('#ff0000', 0.8);
      triggerSparkEffect();
      return;
    }
    
    // Accept connection
    state.input.push(state.holding.color);
    
    // Visual feedback
    portElement.style.background = getColorForId(state.holding.color);
    portElement.style.border = '3px solid #00ff00';
    portElement.style.boxShadow = '0 0 15px #00ff00';
    portElement.classList.add('occupied');
    portElement.textContent = state.holding.color;
    
    // Mark top socket as used
    const topSocket = document.querySelector(`[data-color="${state.holding.color}"]`);
    if (topSocket) {
      topSocket.classList.add('used');
      topSocket.style.opacity = '0.5';
    }
    
    // Clear holding
    state.holding = null;
    
    // Green flash for successful connection
    updateStatusStrip('#00ff00', 0.6);
    
    // Check if solved
    if (state.input.length === state.order.length) {
      state.solved = true;
      updateStatusStrip('#00ff00', 1.0);
      
      // Set wire puzzle complete in game store
      gameStore.setWireComplete(true);
      
      // Show success popup
      showValidationPopup('success', 'CIRCUIT COMPLETE', 'Congratulations! The wire panel has been successfully configured. The door is now unlocked.');
      
      // Success animation
      setTimeout(() => {
        if (window.AI) {
          window.AI.onWirePanelSuccess();
        }
        closePanel();
      }, 2000); // Give time to read the popup
    }
    
    console.log('Connected:', state.holding?.color, 'to port', portIndex, 'Input:', state.input);
  }

  function getColorForId(colorId) {
    const colors = {
      'R': '#ff3b30',
      'G': '#34c759', 
      'B': '#0a84ff',
      'Y': '#ffcc00'
    };
    return colors[colorId] || '#6b6f74';
  }

  function updateStatusStrip(color, intensity) {
    const statusStrip = document.getElementById('statusStrip');
    if (statusStrip) {
      statusStrip.style.background = color;
      statusStrip.style.boxShadow = `0 0 10px ${color}`;
    }
  }

  function showValidationPopup(type, title, message) {
    // Remove existing popup if any
    const existingPopup = document.getElementById('validationPopup');
    if (existingPopup) {
      existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.id = 'validationPopup';
    
    const bgColor = type === 'success' ? '#00ff00' : '#ff0000';
    const textColor = type === 'success' ? '#000000' : '#ffffff';
    
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${bgColor};
      color: ${textColor};
      padding: 20px 30px;
      border-radius: 10px;
      border: 3px solid #ffffff;
      box-shadow: 0 0 20px rgba(0,0,0,0.8);
      z-index: 3000;
      text-align: center;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      max-width: 400px;
      animation: popupPulse 0.5s ease-in-out;
    `;

    popup.innerHTML = `
      <div style="font-size: 18px; margin-bottom: 10px; text-shadow: 0 0 5px rgba(0,0,0,0.5);">
        ${title}
      </div>
      <div style="font-size: 14px; line-height: 1.4;">
        ${message}
      </div>
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes popupPulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(popup);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (popup && popup.parentNode) {
        popup.style.animation = 'popupPulse 0.3s ease-in-out reverse';
        setTimeout(() => {
          if (popup && popup.parentNode) {
            popup.remove();
          }
        }, 300);
      }
    }, 3000);
  }

  function triggerSparkEffect() {
    // Red pulse on status strip
    updateStatusStrip('#ff0000', 0.8);
    state.sparkTimer = 0.5;
    
    // Show validation popup for mistake
    showValidationPopup('error', 'INCORRECT CONNECTION', 'The circuit sequence is wrong. All connections have been reset.');
    
    // Reset puzzle state
    state.input = [];
    state.holding = null;
    state.solved = false;
    
    // Reset visual state
    document.querySelectorAll('.top-socket').forEach(socket => {
      socket.classList.remove('selected', 'used');
      socket.style.opacity = '1';
      socket.style.border = '3px solid #4c535a';
      socket.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    });
    
    document.querySelectorAll('.bottom-socket').forEach(socket => {
      socket.classList.remove('occupied');
      socket.style.background = '#6b6f74';
      socket.style.border = '3px solid #4c535a';
      socket.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      socket.textContent = 'PORT';
    });
    
    if (window.AI) {
      window.AI.onWirePanelFailure();
    }
  }

  function resetPuzzle() {
    // Reset puzzle state
    state.input = [];
    state.holding = null;
    state.solved = false;
    
    // Reset visual state
    document.querySelectorAll('.top-socket').forEach(socket => {
      socket.classList.remove('selected', 'used');
      socket.style.opacity = '1';
      socket.style.border = '3px solid #4c535a';
      socket.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    });
    
    document.querySelectorAll('.bottom-socket').forEach(socket => {
      socket.classList.remove('occupied');
      socket.style.background = '#6b6f74';
      socket.style.border = '3px solid #4c535a';
      socket.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      socket.textContent = 'PORT';
    });
    
    // Reset status strip
    updateStatusStrip('#001122', 0.2);
    
    console.log('Puzzle reset manually');
  }

  function openPanel() {
    const overlay = document.getElementById('wirePanelOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      state.isOpen = true;
      
      // Disable pointer lock and game controls
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      
      // Disable player movement
      window.disablePlayerControls = true;
      
      // Show cursor
      document.body.style.cursor = 'default';
    }
  }

  function closePanel() {
    const overlay = document.getElementById('wirePanelOverlay');
    if (overlay) {
      overlay.style.display = 'none';
      state.isOpen = false;
      
      // Re-enable player controls
      window.disablePlayerControls = false;
      
      // Reset cursor
      document.body.style.cursor = 'auto';
    }
  }

  // Create industrial distribution box
  function createDistributionBox() {
    const group = new THREE.Group();
    const textureLoader = new THREE.TextureLoader();
    
    // Load metal textures
    const metalTextures = {
      color: textureLoader.load('/textures/metal030/Metal030_2K-JPG_Color.jpg'),
      normal: textureLoader.load('/textures/metal030/Metal030_2K-JPG_NormalDX.jpg'),
      roughness: textureLoader.load('/textures/metal030/Metal030_2K-JPG_Roughness.jpg'),
      metalness: textureLoader.load('/textures/metal030/Metal030_2K-JPG_Metalness.jpg')
    };
    
    // Main distribution box body (deeper, more industrial)
    const mainBoxGeometry = new THREE.BoxGeometry(2.2, 1.8, 0.4);
    const mainBoxMaterial = new THREE.MeshStandardMaterial({
      map: metalTextures.color,
      normalMap: metalTextures.normal,
      roughnessMap: metalTextures.roughness,
      metalnessMap: metalTextures.metalness,
      metalness: 0.8,
      roughness: 0.3
    });
    const mainBox = new THREE.Mesh(mainBoxGeometry, mainBoxMaterial);
    mainBox.position.set(0, 0, 0);
    mainBox.castShadow = true;
    mainBox.receiveShadow = true;
    group.add(mainBox);
    
    // Front panel (removable cover)
    const frontPanelGeometry = new THREE.BoxGeometry(2.0, 1.6, 0.05);
    const frontPanelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.2
    });
    const frontPanel = new THREE.Mesh(frontPanelGeometry, frontPanelMaterial);
    frontPanel.position.set(0, 0, 0.225);
    frontPanel.castShadow = true;
    frontPanel.receiveShadow = true;
    group.add(frontPanel);
    
    // Corner bolts/rivets
    const boltGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8);
    const boltMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.1
    });
    
    const boltPositions = [
      [-0.9, 0.7, 0.25],   // Top-left
      [0.9, 0.7, 0.25],    // Top-right
      [-0.9, -0.7, 0.25],  // Bottom-left
      [0.9, -0.7, 0.25]    // Bottom-right
    ];
    
    boltPositions.forEach(pos => {
      const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
      bolt.position.set(pos[0], pos[1], pos[2]);
      bolt.rotation.z = Math.PI / 2;
      bolt.castShadow = true;
      bolt.receiveShadow = true;
      group.add(bolt);
    });
    
    // Status LEDs (replace single red octagon)
    const ledGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    
    const statusLeds = [
      { color: 0x00ff00, emissive: 0x00ff00, position: [-0.3, 0.2, 0.26] }, // Power LED (green)
      { color: 0xff0000, emissive: 0xff0000, position: [0, 0.2, 0.26] },    // Fault LED (red)
      { color: 0xffff00, emissive: 0xffff00, position: [0.3, 0.2, 0.26] }   // Maintenance LED (yellow)
    ];
    
    statusLeds.forEach(ledData => {
      const ledMaterial = new THREE.MeshBasicMaterial({
        color: ledData.color,
        emissive: ledData.emissive,
        emissiveIntensity: 0.5
      });
      const led = new THREE.Mesh(ledGeometry, ledMaterial);
      led.position.set(ledData.position[0], ledData.position[1], ledData.position[2]);
      group.add(led);
    });
    
    // Warning labels
    const labelGeometry = new THREE.PlaneGeometry(0.3, 0.15);
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8
    });
    
    const warningLabel = new THREE.Mesh(labelGeometry, labelMaterial);
    warningLabel.position.set(0, -0.3, 0.26);
    warningLabel.rotation.x = Math.PI / 2;
    group.add(warningLabel);
    
    // Cable management holes
    const cableHoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12);
    const cableHoleMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0.1,
      roughness: 0.9
    });
    
    const cableHolePositions = [
      [-0.8, -0.8, 0.21],  // Bottom-left
      [0.8, -0.8, 0.21]    // Bottom-right
    ];
    
    cableHolePositions.forEach(pos => {
      const cableHole = new THREE.Mesh(cableHoleGeometry, cableHoleMaterial);
      cableHole.position.set(pos[0], pos[1], pos[2]);
      cableHole.rotation.x = Math.PI / 2;
      cableHole.castShadow = true;
      cableHole.receiveShadow = true;
      group.add(cableHole);
    });
    
    // Ventilation grilles
    const ventGeometry = new THREE.PlaneGeometry(0.4, 0.2);
    const ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.7
    });
    
    const ventPositions = [
      [-0.6, 0.6, 0.21],   // Top-left vent
      [0.6, 0.6, 0.21]      // Top-right vent
    ];
    
    ventPositions.forEach(pos => {
      const vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(pos[0], pos[1], pos[2]);
      vent.rotation.x = Math.PI / 2;
      group.add(vent);
    });
    
    // Power switch/button
    const switchGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
    const switchMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.8,
      roughness: 0.2
    });
    const powerSwitch = new THREE.Mesh(switchGeometry, switchMaterial);
    powerSwitch.position.set(0, -0.6, 0.26);
    powerSwitch.castShadow = true;
    powerSwitch.receiveShadow = true;
    group.add(powerSwitch);
    
    return group;
  }

  // Create the popup UI
  const popupUI = createPopupUI();

  // Create the 3D panel group
  const group = new THREE.Group();
  
  // Create fallback panel immediately for better performance
  const panelGeometry = new THREE.PlaneGeometry(2, 1.5);
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  const fallbackPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  fallbackPanel.userData = { type: 'wire-panel-trigger' };
  group.add(fallbackPanel);
  
  // Create industrial distribution box
  const distributionBox = createDistributionBox();
  distributionBox.userData = { type: 'wire-panel-trigger' };
  
  // Replace fallback panel with distribution box
  group.remove(fallbackPanel);
  group.add(distributionBox);
  
  console.log('Electric box replaced with industrial distribution box');

  // Visual indicators removed - using proper 3D model instead

  function update(dt) {
    // Update any animations if needed
    if (state.pulse > 0) {
      state.pulse -= dt;
    }
    
    if (state.sparkTimer > 0) {
      state.sparkTimer -= dt;
    }
    
    // Performance optimization: LOD culling
    if (group.children.length > 0) {
      const electricBoxModel = group.children.find(child => child.userData && child.userData.performanceOptimized);
      if (electricBoxModel && electricBoxModel.userData.lodDistance) {
        // Check if player is far away and hide model for performance
        if (window.leonardModel || window.player) {
          const activePlayer = window.leonardModel || window.player;
          if (activePlayer && activePlayer.position) {
            const distance = activePlayer.position.distanceTo(electricBoxModel.position);
            if (distance > electricBoxModel.userData.lodDistance) {
              electricBoxModel.visible = false;
            } else {
              electricBoxModel.visible = electricBoxModel.userData.originalVisible;
            }
          }
        }
      }
    }
  }

  function dispose() {
    // Remove popup UI
    const overlay = document.getElementById('wirePanelOverlay');
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  return {
    group,
    state,
    openPanel,
    closePanel,
    update,
    dispose
  };
}
