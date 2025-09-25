import * as THREE from 'three';

export function createWirePanel(opts = {}) {
  const order = opts.order || ['R','G','B','Y'];

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
      
      // Success animation
      setTimeout(() => {
        if (window.AI) {
          window.AI.say("Excellent! The circuit is complete. The door should now be unlocked.");
        }
        closePanel();
      }, 1000);
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

  function triggerSparkEffect() {
    // Red pulse on status strip
    updateStatusStrip('#ff0000', 0.8);
    state.sparkTimer = 0.5;
    
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
      window.AI.say("Wrong sequence! The circuit has reset. Try again.");
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

  // Create the popup UI
  const popupUI = createPopupUI();

  // Create a simple 3D panel trigger (just a clickable surface)
  const group = new THREE.Group();
  const panelGeometry = new THREE.PlaneGeometry(2, 1.5);
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);
  panel.userData = { type: 'wire-panel-trigger' };
  group.add(panel);

  // Add some visual indicators
  const indicatorGeometry = new THREE.SphereGeometry(0.05, 8, 6);
  const indicatorMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,
    emissiveIntensity: 0.5
  });
  
  // Add corner indicators
  const positions = [
    [-0.9, 0.6, 0.01],
    [0.9, 0.6, 0.01],
    [-0.9, -0.6, 0.01],
    [0.9, -0.6, 0.01]
  ];
  
  positions.forEach(pos => {
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.set(...pos);
    group.add(indicator);
  });

  function update(dt) {
    // Update any animations if needed
    if (state.pulse > 0) {
      state.pulse -= dt;
    }
    
    if (state.sparkTimer > 0) {
      state.sparkTimer -= dt;
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
