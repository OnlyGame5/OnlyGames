import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadingScreen } from '../loading.js';
import { gameStore } from '../state/gameStore.js';
import { sayKey } from '../ai.js';

export function createWirePanel(opts = {}) {
  const order = opts.order || ['R','G','B','Y'];
  const useGLBModel = opts.useGLBModel !== false; // Default to true, can be disabled

  // State management
  const state = {
    order: order,
    input: [],            // Array of connections: [{color: 'R', port: 0}, ...]
    solved: false,
    holding: null,        // { id:'R', color:'R' }
    pulse: 0,             // status strip pulse
    sparkTimer: 0,
    isOpen: false,
    isDragging: false,   // Track if currently dragging a wire
    dragElement: null,   // Reference to the wire being dragged
    firstMistakeMade: false, // Track if first mistake has occurred
    timeoutActive: false,    // Track if timeout is active
    timeoutDuration: 30,      // Timeout duration in seconds
    timeoutRemaining: 0,     // Remaining timeout time
    audioContext: null,      // Web Audio API context
    sounds: {}               // Sound effect references
  };

  // Create shuffling animation function (global scope)
  function createShufflingAnimation() {
    const colors = [
      { id: 'R', color: '#ff3b30', name: 'Red', label: 'R' },
      { id: 'G', color: '#34c759', name: 'Green', label: 'G' },
      { id: 'B', color: '#0a84ff', name: 'Blue', label: 'B' },
      { id: 'Y', color: '#ffcc00', name: 'Yellow', label: 'Y' },
      { id: 'P', color: '#af52de', name: 'Purple', label: 'P' },
      { id: 'O', color: '#ff9500', name: 'Orange', label: 'O' }
    ];
    
    const animationDuration = 2000; // 2 seconds
    const shuffleSteps = 8;
    const stepDuration = animationDuration / shuffleSteps;
    
    let currentStep = 0;
    
    const shuffleInterval = setInterval(() => {
      // Randomly rearrange the sockets
      colors.forEach((colorData, index) => {
        const socket = document.querySelector(`[data-color="${colorData.id}"]`);
        if (socket) {
          // Add slight rotation and scale for shuffle effect
          const rotation = (Math.random() - 0.5) * 20;
          const scale = 0.8 + Math.random() * 0.4;
          socket.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
          socket.style.transition = 'all 0.1s ease';
        }
      });
      
      currentStep++;
      if (currentStep >= shuffleSteps) {
        clearInterval(shuffleInterval);
        // Final positioning
        colors.forEach((colorData, index) => {
          const socket = document.querySelector(`[data-color="${colorData.id}"]`);
          if (socket) {
            socket.style.transform = 'scale(1) rotate(0deg)';
            socket.style.transition = 'all 0.3s ease';
          }
        });
      }
    }, stepDuration);
  }

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
      width: 700px;
      height: 450px;
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

    // Define colors array - logical order (for validation)
    const colors = [
      { id: 'R', color: '#ff3b30', name: 'Red', label: 'R' },
      { id: 'G', color: '#34c759', name: 'Green', label: 'G' },
      { id: 'B', color: '#0a84ff', name: 'Blue', label: 'B' },
      { id: 'Y', color: '#ffcc00', name: 'Yellow', label: 'Y' },
      { id: 'P', color: '#af52de', name: 'Purple', label: 'P' },
      { id: 'O', color: '#ff9500', name: 'Orange', label: 'O' }
    ];
    
    // Shuffle visual order to hide the answer, but keep logical order for validation
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);

    // Note: createShufflingAnimation function moved to global scope

    shuffledColors.forEach((colorData, index) => {
      const socket = document.createElement('div');
      socket.className = 'top-socket';
      socket.dataset.color = colorData.id;
      socket.dataset.label = colorData.label;
      socket.dataset.colorName = colorData.name;
      socket.style.cssText = `
        width: 80px;
        height: 80px;
        background: #6b6f74;
        border: 3px solid #4c535a;
        border-radius: 50%;
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 18px;
        text-shadow: 0 0 5px rgba(0,0,0,0.8);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
        position: relative;
        user-select: none;
      `;
      socket.textContent = colorData.label; // Show color letter directly (R, G, B, Y, P, O)
      
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

      // Drag and drop handlers
      socket.addEventListener('mousedown', (e) => handleSocketMouseDown(e, colorData, socket));
      socket.addEventListener('dragstart', (e) => e.preventDefault()); // Prevent default drag
      
      topRow.appendChild(socket);
    });

    // Add SOURCE label above top row
    const sourceLabel = document.createElement('div');
    sourceLabel.style.cssText = `
      text-align: center;
      color: #ffffff;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      margin-bottom: 10px;
      font-weight: bold;
    `;
    sourceLabel.textContent = 'SOURCE';
    panel.appendChild(sourceLabel);
    panel.appendChild(topRow);

    // Bottom row - neutral sockets
    const bottomRow = document.createElement('div');
    bottomRow.style.cssText = `
      display: flex;
      justify-content: space-around;
    `;

    for (let i = 0; i < 6; i++) {
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
        user-select: none;
      `;
      socket.textContent = i.toString(); // Show port number
      
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

      // Drag and drop handlers
      socket.addEventListener('mouseup', (e) => handlePortMouseUp(e, i, socket));
      socket.addEventListener('dragover', (e) => e.preventDefault());
      socket.addEventListener('drop', (e) => e.preventDefault());
      
      bottomRow.appendChild(socket);
    }

    // Add TARGET label above bottom row
    const targetLabel = document.createElement('div');
    targetLabel.style.cssText = `
      text-align: center;
      color: #ffffff;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      margin-bottom: 10px;
      margin-top: 20px;
      font-weight: bold;
    `;
    targetLabel.textContent = 'TARGET';
    panel.appendChild(targetLabel);

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
    closeBtn.addEventListener('click', () => {
      forceCleanupDrag();
      closePanel();
    });
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
    resetBtn.addEventListener('click', () => {
      forceCleanupDrag();
      resetPuzzle();
    });
    panel.appendChild(resetBtn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Prevent game from taking control when popup is open
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        forceCleanupDrag();
        closePanel();
      }
    });

    // Prevent event propagation to game
    panel.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Prevent pointer lock when popup is open
    overlay.addEventListener('mousedown', (e) => {
      // Don't prevent if clicking on a socket (let drag handler work)
      if (!e.target.closest('.top-socket') && !e.target.closest('.bottom-socket')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    overlay.addEventListener('mouseup', (e) => {
      // Handle drag cleanup if we're dragging
      if (state.isDragging) {
        // Find the target port under the mouse
        const targetPort = document.elementFromPoint(e.clientX, e.clientY);
        
        // Check if dropping on a valid bottom socket
        if (targetPort && targetPort.classList.contains('bottom-socket') && !targetPort.classList.contains('occupied')) {
          const portIndex = parseInt(targetPort.dataset.index);
          // Try to connect - cleanup will happen in handlePortConnection success or handleMistake
          handlePortConnection(portIndex, targetPort);
          
          // Always clean up drag state after connection attempt
          // (handleMistake calls resetPuzzle which cleans up, but we need to clean up here too for success case)
          if (state.isDragging) {
            cleanupDrag();
          }
        } else {
          // Not dropping on a valid port - just cancel and clean up
          console.log('Mouse up outside valid port, cancelling drag');
          cleanupDrag();
        }
        
        // Prevent event from propagating to document handler (which would also try to clean up)
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // Only prevent propagation if not dragging and not clicking on sockets
      if (!e.target.closest('.top-socket') && !e.target.closest('.bottom-socket')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Add keyboard accessibility
    overlay.addEventListener('keydown', handleKeyboardInput);

    return overlay;
    }

    // Create drag wire visualization element
    function createDragWire(colorData) {
      const dragWire = document.createElement('div');
      dragWire.id = 'dragWire';
      dragWire.style.cssText = `
        position: fixed;
        width: 60px;
        height: 60px;
        background: ${colorData.color};
        border: 3px solid #00ff00;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 16px;
        text-shadow: 0 0 5px rgba(0,0,0,0.8);
        box-shadow: 0 0 20px ${colorData.color};
        z-index: 3000;
        pointer-events: none;
        opacity: 0.9;
        left: -9999px;
        top: -9999px;
      `;
      dragWire.textContent = colorData.name || colorData.id;
      document.body.appendChild(dragWire);
      return dragWire;
    }

    // Remove drag wire element if present
    function removeDragWire() {
      const dragWire = document.getElementById('dragWire');
      if (dragWire) {
        dragWire.remove();
      }
    }
  // Handle mouse down on source socket (start drag)
  function handleSocketMouseDown(e, colorData, socketElement) {
    if (state.solved || socketElement.classList.contains('used')) return;
    
    // Prevent multiple simultaneous drags
    if (state.isDragging) {
      console.log('Already dragging, ignoring new drag attempt for:', colorData.id);
      return;
    }
    
    // Safety cleanup: ensure no orphaned drag wires exist
    const existingDragWire = document.getElementById('dragWire');
    if (existingDragWire) {
      console.log('Found orphaned drag wire, cleaning up before starting new drag');
      existingDragWire.remove();
    }
    
    e.preventDefault();
    
    console.log('=== DRAG START DEBUG ===');
    console.log('Color Data:', colorData);
    console.log('Socket Element:', socketElement);
    console.log('Current state:', {
      isDragging: state.isDragging,
      holding: state.holding,
      dragElement: state.dragElement,
      existingDragWire: document.getElementById('dragWire')
    });
    
    // Create drag wire visualization
    const dragWire = createDragWire(colorData);
    state.dragElement = dragWire;
    state.isDragging = true;
    state.holding = { id: colorData.id, color: colorData.id };
    
    console.log('After drag start:', {
      isDragging: state.isDragging,
      holding: state.holding,
      dragElement: state.dragElement,
      dragWireId: dragWire.id
    });
    
    // Update socket visual state
    socketElement.style.border = '3px solid #00ff00';
    socketElement.style.boxShadow = '0 0 15px #00ff00';
    socketElement.style.cursor = 'grabbing';
    
    // Reveal color on drag start
    socketElement.style.background = colorData.color;
    socketElement.textContent = colorData.name;
    
    // Add global mouse move and mouse up handlers
    // Remove any existing listeners first to prevent duplicates
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Pulse maintenance LED while dragging
    setMaintenanceLED(0.6);
    
    // Play drag start sound
    playSound('dragStart');
    
    // Trigger haptic feedback
    triggerHapticFeedback('light');
    
    console.log('Started dragging:', colorData.id);
  }

  // Handle mouse move during drag
  function handleMouseMove(e) {
    if (!state.isDragging || !state.dragElement) return;
    
    // Update drag wire position
    state.dragElement.style.left = e.clientX + 'px';
    state.dragElement.style.top = e.clientY + 'px';
    
    // Update connection preview
    updateConnectionPreview(e.clientX, e.clientY);
  }

  // Handle mouse up (end drag)
  function handleMouseUp(e) {
    console.log('=== MOUSE UP DEBUG ===');
    console.log('Mouse up event:', e);
    console.log('Current state:', {
      isDragging: state.isDragging,
      holding: state.holding,
      dragElement: state.dragElement,
      existingDragWire: document.getElementById('dragWire')
    });
    
    if (!state.isDragging) {
      console.log('Not dragging, ignoring mouse up');
      return;
    }
    
    // Find the target port under the mouse
    const targetPort = document.elementFromPoint(e.clientX, e.clientY);
    console.log('Target port under mouse:', targetPort);
    
    if (targetPort && targetPort.classList.contains('bottom-socket')) {
      const portIndex = parseInt(targetPort.dataset.index);
      console.log('Attempting connection to port:', portIndex);
      handlePortConnection(portIndex, targetPort);
    } else {
      console.log('No valid target port found, cleaning up drag');
    }
    
    // ALWAYS clean up drag state, regardless of connection success
    console.log('Calling cleanupDrag()');
    cleanupDrag();
  }

  // Clean up drag state
  function cleanupDrag() {
    console.log('=== CLEANUP DRAG DEBUG ===');
    console.log('Before cleanup:', {
      isDragging: state.isDragging,
      holding: state.holding,
      dragElement: state.dragElement,
      existingDragWire: document.getElementById('dragWire')
    });
    
    state.isDragging = false;
    state.holding = null;
    removeDragWire();
    
    console.log('After cleanup:', {
      isDragging: state.isDragging,
      holding: state.holding,
      dragElement: state.dragElement,
      existingDragWire: document.getElementById('dragWire')
    });
    
    // Reset source socket visual state
    document.querySelectorAll('.top-socket').forEach(socket => {
      socket.style.border = '3px solid #4c535a';
      socket.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      socket.style.cursor = 'grab';
    });
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Turn off maintenance LED
    setMaintenanceLED(0.1);
    
    // Play drag end sound
    playSound('dragEnd');
    
    // Clear connection preview
    clearConnectionPreview();
    
    console.log('Cleanup completed');
  }

  // Safety cleanup function that can be called from anywhere
  function forceCleanupDrag() {
    console.log('=== FORCE CLEANUP DEBUG ===');
    console.log('Checking for stuck drag wire:', {
      isDragging: state.isDragging,
      holding: state.holding,
      existingDragWire: document.getElementById('dragWire')
    });
    
    // More aggressive cleanup - remove ALL drag wires from DOM
    const allDragWires = document.querySelectorAll('#dragWire');
    console.log('Found drag wires in DOM:', allDragWires.length);
    
    allDragWires.forEach((wire, index) => {
      console.log(`Removing drag wire ${index}:`, wire);
      wire.remove();
    });
    
    if (state.isDragging || state.holding || document.getElementById('dragWire')) {
      console.log('Force cleaning up stuck drag wire');
      cleanupDrag();
    } else {
      console.log('No stuck drag wire found');
    }
    
    // Final check - ensure no drag wires remain
    const remainingWires = document.querySelectorAll('#dragWire');
    if (remainingWires.length > 0) {
      console.error('ERROR: Drag wires still exist after cleanup!', remainingWires);
    } else {
      console.log('All drag wires successfully removed');
    }
  }

  // Debug helpers removed for production: no debug UI or state dump button

  // Handle port mouse up (for rewiring)
  function handlePortMouseUp(e, portIndex, portElement) {
    if (state.isDragging) return; // Don't handle if we're dragging
    
    // Check if this port has a connection that can be rewired
    const existingConnection = state.input.find(conn => conn.port === portIndex);
    if (existingConnection) {
      disconnectWire(portIndex, portElement);
    }
  }

  // Disconnect a wire (rewiring functionality)
  function disconnectWire(portIndex, portElement) {
    // Remove from state
    state.input = state.input.filter(conn => conn.port !== portIndex);
    
    // Reset port visual state
    portElement.classList.remove('occupied');
    portElement.style.background = '#6b6f74';
    portElement.style.border = '3px solid #4c535a';
    portElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    portElement.textContent = portIndex.toString();
    
    // Reset corresponding source socket
    const colorId = state.input.find(conn => conn.port === portIndex)?.color;
    if (colorId) {
      const sourceSocket = document.querySelector(`[data-color="${colorId}"]`);
      if (sourceSocket) {
        sourceSocket.classList.remove('used');
        sourceSocket.style.opacity = '1';
        sourceSocket.style.background = '#6b6f74';
        sourceSocket.textContent = sourceSocket.dataset.label;
      }
    }
    
    console.log('Disconnected wire from port', portIndex);
  }

  // Handle port connection (simplified logic - no port sequence requirement)
  function handlePortConnection(portIndex, portElement) {
    if (!state.holding) return;
    
    // Check if port is already occupied
    if (portElement.classList.contains('occupied')) return;
    
    // Simplified: Only check if the color is correct for the next position in sequence
    // Players can connect to any port in any order
    const expectedColor = state.order[state.input.length];
    if (state.holding.color !== expectedColor) {
      // Wrong color for this position - handle mistake
      handleMistake('Wrong color! Expected: ' + expectedColor);
      return;
    }
    
    // Accept connection
    state.input.push({ color: state.holding.color, port: portIndex });
    
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
    
    // Green flash for successful connection
    updateStatusStrip('#00ff00', 0.6);
    
    // Play connection sound
    playSound('connection');
    
    // Trigger haptic feedback
    triggerHapticFeedback('medium');
    
    // Check if solved
    if (state.input.length === state.order.length) {
      state.solved = true;
      updateStatusStrip('#00ff00', 1.0);
      
      // Set wire puzzle complete in game store
      gameStore.setWireComplete(true);
      
      // Turn on power LED bright green for success
      setPowerLED(1.0);
      setFaultLED(0.1); // Turn off fault LED
      
      // Play success sound
      playSound('success');
      
      // Trigger success haptic feedback
      triggerHapticFeedback('success');
      
      // Show success popup
      showValidationPopup('success', 'CIRCUIT COMPLETE', 'Congratulations! The wire panel has been successfully configured. The door is now unlocked.');
      
      // Success animation
      setTimeout(() => {
        if (window.AI) {
          sayKey('ACT_I.ROOM1.WIRE_SUCCESS_GRUDGING', { tone: 'flat' });
        }
        closePanel();
      }, 2000);
    }
    
    console.log('Connected:', state.holding.color, 'to port', portIndex, 'Input:', state.input);
  }

  // Handle mistakes (simplified - just reset on any mistake)
  function handleMistake(message) {
    console.log('Mistake:', message);
    
    // Simplified: Just reset the puzzle on any mistake
    updateStatusStrip('#ff0000', 0.8);
    resetPuzzle();
    
    // Brief fault LED flash
    setFaultLED(0.6);
    setTimeout(() => setFaultLED(0.1), 500);
    
    // Play error sound
    playSound('error');
    
    // Trigger error haptic feedback
    triggerHapticFeedback('error');
    
    if (window.AI) {
      sayKey('ACT_I.ROOM1.WIRE_FAIL_IMPATIENT', { tone: 'stern' });
    }
  }

  // Show timeout message
  function showTimeoutMessage() {
    const timeoutMsg = document.createElement('div');
    timeoutMsg.id = 'timeoutMessage';
    timeoutMsg.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff4444;
      color: white;
      padding: 15px 30px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      z-index: 3000;
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
    `;
    timeoutMsg.textContent = `System recalibrating... ${state.timeoutRemaining}s timeout.`;
    document.body.appendChild(timeoutMsg);
  }

  // Update timeout message
  function updateTimeoutMessage() {
    const timeoutMsg = document.getElementById('timeoutMessage');
    if (timeoutMsg) {
      timeoutMsg.textContent = `System recalibrating... ${state.timeoutRemaining}s timeout.`;
    }
  }

  // End timeout
  function endTimeout() {
    state.timeoutActive = false;
    const timeoutMsg = document.getElementById('timeoutMessage');
    if (timeoutMsg) {
      timeoutMsg.remove();
    }
  }

  // Reset single connection (instead of full reset)
  function resetSingleConnection() {
    // Remove the last (incorrect) connection
    if (state.input.length > 0) {
      const lastConnection = state.input[state.input.length - 1];
      state.input.pop();
      
      // Reset the port
      const portElement = document.querySelector(`[data-index="${lastConnection.port}"]`);
      if (portElement) {
        portElement.classList.remove('occupied');
        portElement.style.background = '#6b6f74';
        portElement.style.border = '3px solid #4c535a';
        portElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        portElement.textContent = lastConnection.port.toString();
      }
      
      // Reset the source socket
      const sourceSocket = document.querySelector(`[data-color="${lastConnection.color}"]`);
      if (sourceSocket) {
        sourceSocket.classList.remove('used');
        sourceSocket.style.opacity = '1';
        sourceSocket.style.background = '#6b6f74';
        sourceSocket.textContent = sourceSocket.dataset.label;
      }
    }
  }

  // LED Control Functions
  function updateLED(ledName, intensity, flicker = false) {
    if (state.leds && state.leds[ledName]) {
      const led = state.leds[ledName];
      led.material.emissiveIntensity = intensity;
      
      if (flicker) {
        // Add flickering effect
        led.material.emissiveIntensity = intensity * (0.5 + Math.random() * 0.5);
      }
    }
  }

  function setPowerLED(intensity) {
    updateLED('powerLed', intensity);
  }

  function setFaultLED(intensity, flicker = false) {
    updateLED('faultLed', intensity, flicker);
  }

  function setMaintenanceLED(intensity) {
    updateLED('maintenanceLed', intensity);
  }

  function resetAllLEDs() {
    setPowerLED(0.1);
    setFaultLED(0.1);
    setMaintenanceLED(0.1);
  }

  // Audio System Functions
  function initAudioSystem() {
    try {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      createSoundEffects();
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  }

  function createSoundEffects() {
    if (!state.audioContext) return;

    // Create different sound effects using Web Audio API
    state.sounds = {
      dragStart: () => playTone(800, 0.1, 'sine'),      // High beep for drag start
      dragEnd: () => playTone(400, 0.15, 'sine'),       // Lower beep for drag end
      success: () => playTone(600, 0.3, 'sine'),        // Success tone
      error: () => playTone(200, 0.4, 'sawtooth'),      // Error buzz
      timeout: () => playTone(150, 0.5, 'square'),      // Timeout warning
      connection: () => playTone(500, 0.2, 'triangle')  // Connection made
    };
  }

  function playTone(frequency, duration, waveType = 'sine') {
    if (!state.audioContext) return;

    const oscillator = state.audioContext.createOscillator();
    const gainNode = state.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(state.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, state.audioContext.currentTime);
    oscillator.type = waveType;

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, state.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, state.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, state.audioContext.currentTime + duration);

    oscillator.start(state.audioContext.currentTime);
    oscillator.stop(state.audioContext.currentTime + duration);
  }

  function playSound(soundName) {
    if (state.sounds && state.sounds[soundName]) {
      state.sounds[soundName]();
    }
  }

  // Keyboard Accessibility Functions
  function handleKeyboardInput(e) {

    switch(e.key) {
      case 'Escape':
        closePanel();
        break;
      case 'r':
      case 'R':
        // Reset puzzle (use Ctrl+R for reset, R alone selects Red wire)
        if (e.ctrlKey || e.metaKey) {
          resetPuzzle();
        } else {
          // Select wire R (Red)
          selectWireByKeyboard('R');
        }
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
        // Connect to port (0-5)
        const portIndex = parseInt(e.key) - 1;
        const portElement = document.querySelector(`[data-index="${portIndex}"]`);
        if (portElement && !portElement.classList.contains('occupied')) {
          // Simulate connection with currently held wire
          if (state.holding) {
            handlePortConnection(portIndex, portElement);
          }
        }
        break;
      case 'g':
      case 'G':
        // Select wire G (Green)
        selectWireByKeyboard('G');
        break;
      case 'b':
      case 'B':
        // Select wire B (Blue)
        selectWireByKeyboard('B');
        break;
      case 'y':
      case 'Y':
        // Select wire Y (Yellow)
        selectWireByKeyboard('Y');
        break;
      case 'p':
      case 'P':
        // Select wire P (Purple)
        selectWireByKeyboard('P');
        break;
      case 'o':
      case 'O':
        // Select wire O (Orange)
        selectWireByKeyboard('O');
        break;
    }
  }

  function selectWireByKeyboard(colorId) {
    const socket = document.querySelector(`[data-color="${colorId}"]`);
    if (socket && !socket.classList.contains('used')) {
      // Simulate mouse down event
      const colorData = {
        id: colorId,
        color: colorId,
        name: socket.dataset.colorName
      };
      handleSocketMouseDown({ preventDefault: () => {} }, colorData, socket);
    }
  }

  // Connection Preview Functions
  function updateConnectionPreview(mouseX, mouseY) {
    // Clear previous previews
    clearConnectionPreview();
    
    // Find valid drop zones
    const validPorts = getValidDropZones();
    
    validPorts.forEach(portIndex => {
      const portElement = document.querySelector(`[data-index="${portIndex}"]`);
      if (portElement) {
        // Add preview highlight
        portElement.style.border = '3px solid #00ff00';
        portElement.style.boxShadow = '0 0 15px #00ff00';
        portElement.style.transform = 'scale(1.1)';
      }
    });
  }

  function getValidDropZones() {
    // Simplified: Allow any empty port to be connected to
    const validPorts = [];
    for (let i = 0; i < 6; i++) {
      const portElement = document.querySelector(`[data-index="${i}"]`);
      if (portElement && !portElement.classList.contains('occupied')) {
        validPorts.push(i);
      }
    }
    return validPorts;
  }

  function clearConnectionPreview() {
    document.querySelectorAll('.bottom-socket').forEach(socket => {
      if (!socket.classList.contains('occupied')) {
        socket.style.border = '3px solid #4c535a';
        socket.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        socket.style.transform = 'scale(1)';
      }
    });
  }

  // Haptic Feedback Functions
  function triggerHapticFeedback(type = 'light') {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [50],           // Light tap
        medium: [100],         // Medium tap
        heavy: [200],         // Heavy tap
        success: [100, 50, 100], // Success pattern
        error: [200, 100, 200]   // Error pattern
      };
      
      navigator.vibrate(patterns[type] || patterns.light);
    }
  }

  function getColorForId(colorId) {
    const colors = {
      'R': '#ff3b30',
      'G': '#34c759', 
      'B': '#0a84ff',
      'Y': '#ffcc00',
      'P': '#af52de',
      'O': '#ff9500'
    };
    return colors[colorId] || '#6b6f74';
  }

  function updateStatusStrip(color, intensity) {
    const statusStrip = document.getElementById('statusStrip');
    if (statusStrip) {
      // Enhanced visual feedback
      statusStrip.style.background = color;
      statusStrip.style.boxShadow = `0 0 ${20 * intensity}px ${color}`;
      statusStrip.style.transition = 'all 0.3s ease';
      
      // Add pulsing effect for high intensity
      if (intensity > 0.7) {
        statusStrip.style.animation = `statusPulse 0.5s ease-in-out ${intensity > 0.9 ? '3' : '1'}`;
        
        // Add CSS animation if not already added
        if (!document.getElementById('statusStripAnimation')) {
          const style = document.createElement('style');
          style.id = 'statusStripAnimation';
          style.textContent = `
            @keyframes statusPulse {
              0% { transform: scaleY(1); opacity: 1; }
              50% { transform: scaleY(1.2); opacity: 0.8; }
              100% { transform: scaleY(1); opacity: 1; }
            }
          `;
          document.head.appendChild(style);
        }
      } else {
        statusStrip.style.animation = 'none';
      }
      
      // Reset to default after animation
      if (intensity < 1.0) {
        setTimeout(() => {
          if (statusStrip) {
            statusStrip.style.background = '#001122';
            statusStrip.style.boxShadow = 'inset 0 0 5px rgba(0, 0, 0, 0.5)';
            statusStrip.style.animation = 'none';
          }
        }, 1000);
      }
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

    
  function resetPuzzle() {
    // Reset puzzle state
    state.input = [];
    state.holding = null;
    state.solved = false;
    state.isDragging = false;
    state.firstMistakeMade = false;
    state.timeoutActive = false;
    state.timeoutRemaining = 0;
    
    // Clean up any drag wire
    removeDragWire();
    
    // Reset visual state
    document.querySelectorAll('.top-socket').forEach(socket => {
      socket.classList.remove('selected', 'used');
      socket.style.opacity = '1';
      socket.style.background = '#6b6f74';
      socket.style.border = '3px solid #4c535a';
      socket.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      socket.style.cursor = 'grab';
      socket.textContent = socket.dataset.label; // Reset to color letter
    });
    
    document.querySelectorAll('.bottom-socket').forEach(socket => {
      socket.classList.remove('occupied');
      socket.style.background = '#6b6f74';
      socket.style.border = '3px solid #4c535a';
      socket.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      socket.textContent = socket.dataset.index; // Show port number
    });
    
    // Reset status strip
    updateStatusStrip('#001122', 0.2);
    
    // Remove timeout message if exists
    const timeoutMsg = document.getElementById('timeoutMessage');
    if (timeoutMsg) {
      timeoutMsg.remove();
    }
    
    // Reset all LEDs
    resetAllLEDs();
    
    console.log('Puzzle reset manually');
  }

  function openPanel() {
    const overlay = document.getElementById('wirePanelOverlay');
    if (overlay) {
      // Safety cleanup: clear any existing stuck drag wires
      console.log('=== PANEL OPEN - SAFETY CLEANUP ===');
      forceCleanupDrag();
      
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
      
      // Shuffling animation removed for simplification
      
      // Turn on power LED dimly when panel opens
      setPowerLED(0.3);
      
      // Initialize audio system
      initAudioSystem();
    }
  }

  function closePanel() {
    const overlay = document.getElementById('wirePanelOverlay');
    if (overlay) {
      // Always cleanup any stuck drag wires when closing
      forceCleanupDrag();
      
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
  color: textureLoader.load('./textures/metal030/Metal030_2K-JPG_Color.jpg'),
  normal: textureLoader.load('./textures/metal030/Metal030_2K-JPG_NormalDX.jpg'),
  roughness: textureLoader.load('./textures/metal030/Metal030_2K-JPG_Roughness.jpg'),
  metalness: textureLoader.load('./textures/metal030/Metal030_2K-JPG_Metalness.jpg')
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
      { color: 0x00ff00, emissive: 0x00ff00, position: [-0.3, 0.2, 0.26], name: 'powerLed' }, // Power LED (green)
      { color: 0xff0000, emissive: 0xff0000, position: [0, 0.2, 0.26], name: 'faultLed' },    // Fault LED (red)
      { color: 0xffff00, emissive: 0xffff00, position: [0.3, 0.2, 0.26], name: 'maintenanceLed' }   // Maintenance LED (yellow)
    ];
    
    // Store LED references for dynamic control
    state.leds = {};
    
    statusLeds.forEach(ledData => {
      const ledMaterial = new THREE.MeshBasicMaterial({
        color: ledData.color,
        emissive: ledData.emissive,
        emissiveIntensity: 0.1 // Start dim
      });
      const led = new THREE.Mesh(ledGeometry, ledMaterial);
      led.position.set(ledData.position[0], ledData.position[1], ledData.position[2]);
      led.name = ledData.name;
      group.add(led);
      
      // Store reference for dynamic control
      state.leds[ledData.name] = {
        mesh: led,
        material: ledMaterial,
        originalColor: ledData.color,
        originalEmissive: ledData.emissive
      };
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
    
    // Handle timeout countdown
    if (state.timeoutActive && state.timeoutRemaining > 0) {
      state.timeoutRemaining -= dt;
      if (state.timeoutRemaining <= 0) {
        state.timeoutActive = false;
        const timeoutMsg = document.getElementById('timeoutMessage');
        if (timeoutMsg) {
          timeoutMsg.remove();
        }
      }
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
    
    // Clean up drag wire
    removeDragWire();
    
    // Remove timeout message
    const timeoutMsg = document.getElementById('timeoutMessage');
    if (timeoutMsg) {
      timeoutMsg.remove();
    }
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
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
