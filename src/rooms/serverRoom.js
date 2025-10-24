// src/rooms/serverRoom.js

import * as THREE from 'three';
import { AI } from '../ai.js';
import { gameStore } from '../state/gameStore.js';
import { buildStandardLightRig, removeExistingLights } from '../lighting/standardLighting.js';
import { DataStormPuzzle } from './Room3/DataStormPuzzle.js';
import { PurgeMinigame } from './Room3/PurgeMinigame.js';
import { getPlayerInventory } from '../player.js';
import { room3Audio } from '../audio/room3Audio.js';

// Server Room – The Core
// Controller responsible for assembling the chamber, mounting puzzles, and handling per-frame updates.
export class ServerRoom {
  constructor({ scene, loader, player, materials, assets, renderer } = {}) {
    this.scene = scene;
    this.loader = loader;
    this.player = player;
    this.materials = materials;
    this.assets = assets;
    this.renderer = renderer;

    // Root group
    const group = new THREE.Group();
    group.name = 'server-room-core-chamber';
    this.group = group;

    // Prompt system
    this.lastPromptText = '';

    // Layout parameters
    this.dim = { radius: 10, height: 8 };
    this.spawn = new THREE.Vector3(0, 1, this.dim.radius + 4); // catwalk start outside the ring

    // Subgroups
    this.catwalk = new THREE.Group(); this.catwalk.name = 'catwalk-entry';
    this.centerPlatform = new THREE.Group(); this.centerPlatform.name = 'central-platform';
    group.add(this.catwalk, this.centerPlatform);

    // Geometry: cylindrical pit with central platform
    this._buildShell();
    this._buildCatwalk();
    this._buildCenterPlatform();
    this._buildLaptopWorkstation();

    // Local lighting
    this._initLights();

    // Puzzles
    this.dataStormPuzzle = new DataStormPuzzle();
    this.dataStormPuzzle.mount(this.centerPlatform);
    
    // Purge Protocol Minigame
    this.purgeMinigame = new PurgeMinigame();

    // Drive insertion state
    this.driveInserted = false;

    // Create laptop UI
    this._createLaptopUI();

    // Entry/Exit anchors
    this.anchors = {
      entry: new THREE.Object3D(),
      exit: new THREE.Object3D()
    };
    this.anchors.entry.position.copy(new THREE.Vector3(0, 0, this.dim.radius + 6));
    this.anchors.exit.position.copy(new THREE.Vector3(0, 0, -this.dim.radius - 6));
    group.add(this.anchors.entry, this.anchors.exit);
    
    // Add visual exit indicator
    this._buildExitIndicator();

    // State
    this._entered = false;
    this._alarm = { on: false, t: 0 };
    this._tmpVec = new THREE.Vector3();
    this._hiddenExternalLights = [];
    this._previousEnvironment = null;

    // --- DEBUG TRIGGER ---
    window.addEventListener('keydown', (e) => {
      // Use 'p' to trigger the alarm for testing
      if (e.key.toLowerCase() === 'p') {
        // Check if the player is currently considered to be in server room
        if (gameStore.stage === 3) {
          console.log("DEBUG: Manually triggering Server Room alarm!");
          this._enableAlarmState();
        }
      }
    });
  }

  // Build cylindrical chamber shell and fog suggestion
  _buildShell() {
    const { radius, height } = this.dim;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xbbc1c9, metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xe9eef5, metalness: 0.2, roughness: 0.8 });

    // Outer ring floor
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(radius + 6, radius + 6, 0.25, 48), floorMat);
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling removed - now using global skybox

    // Inner pit wall with doorway gap aligned to hallway (visible from both sides)
    const doorwayThetaStart = 1.67;          // start angle of the solid arc
    const doorwayThetaLength = Math.PI * 1.94; // leaves ~0.1π gap for doorway
    const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 48, 1, true, doorwayThetaStart, doorwayThetaLength), wallMat);
    innerWall.position.y = height / 2;
    innerWall.receiveShadow = true; innerWall.castShadow = true;
    this.group.add(innerWall);

    // Removed header segment that created a floating sliver

    // Simple fog hint via large transparent disc with matching doorway gap
    const fogMat = new THREE.MeshBasicMaterial({ color: 0x99aacc, transparent: true, opacity: 0.06 });
    const fogDisc = new THREE.Mesh(new THREE.CylinderGeometry(radius - 0.2, radius - 0.2, 0.05, 48, 1, true, doorwayThetaStart, doorwayThetaLength), fogMat);
    fogDisc.position.set(0, -0.02, 0);
    this.group.add(fogDisc);
  }

  _buildCatwalk() {
    const w = 2.0, l = 8.0;
    const mat = new THREE.MeshStandardMaterial({ color: 0xdfe6ee, metalness: 0.3, roughness: 0.7 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, l), mat);
    mesh.position.set(0, 0.1, this.dim.radius + l / 2 - 2);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.catwalk.add(mesh);
  }

  _createPlatformTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    // Background
    ctx.fillStyle = '#f3f7fb'; // Match platform color
    ctx.fillRect(0, 0, size, size);

    // Concentric rings
    ctx.strokeStyle = 'rgba(102, 170, 255, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(center, center, (size / 2) * (i / 5), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Sweeping lines
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(102, 170, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(center, center, size * 0.3, 0, Math.PI * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(center, center, size * 0.4, Math.PI, Math.PI * 1.3);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  _createLaptopUI() {
    if (document.getElementById('laptop-ui')) return; // Don't create duplicates

    const uiContainer = document.createElement('div');
    uiContainer.id = 'laptop-ui';
    
    const style = document.createElement('style');
    style.textContent = `
      #laptop-ui {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #0a192f;
        z-index: 10000;
        display: none;
        font-family: 'Courier New', 'Consolas', monospace;
        overflow: hidden;
      }

      /* The application window that holds the puzzle */
      .laptop-window {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 500px;
        background: rgba(15, 30, 50, 0.9);
        border: 2px solid #00ff7f;
        border-radius: 8px;
        box-shadow: 0 0 25px rgba(0, 255, 127, 0.3);
        color: #00ff7f;
      }

      .window-titlebar {
        padding: 10px;
        background: #00ff7f;
        color: #051018;
        font-weight: bold;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        cursor: default;
      }

      .window-content {
        padding: 25px;
      }

      .window-content h3 { text-align: center; margin-top: 0; }
      .laptop-input-row { margin: 20px 0; }
      .laptop-input-row label { display: block; margin-bottom: 8px; color: #8899aa; }
      .laptop-input-row select {
        width: 100%;
        padding: 10px;
        background-color: #051018;
        color: #00ff7f;
        border: 1px solid #00ff7f;
        font-family: inherit;
        font-size: 1rem;
        cursor: pointer;
        
        /* Hide default browser styling */
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        
        /* Custom green arrow */
        background-image: url('data:image/svg+xml;utf8,<svg fill="%2300ff7f" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
        background-repeat: no-repeat;
        background-position: right 10px center;
      }
      .laptop-buttons { display: flex; justify-content: space-between; margin-top: 30px; }
      .laptop-btn {
        padding: 10px 20px; background: transparent; border: 1px solid #00ff7f;
        color: #00ff7f; font-size: 1rem; cursor: pointer; transition: all 0.2s;
      }
      .laptop-btn:hover { background: #00ff7f; color: #051018; }

      /* A simple, cosmetic taskbar at the bottom */
      .laptop-taskbar {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 40px;
        background: rgba(5, 15, 30, 0.9);
        border-top: 1px solid #00ff7f;
      }
      
      /* Custom cursor styling for UI */
      .laptop-ui-active {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%2300ff7f" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%2300ff7f"/></svg>'), auto !important;
      }
      .laptop-ui-active * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%2300ff7f" stroke-width="2"/><circle cx="10" cy="10" r="2" fill="%2300ff7f"/></svg>'), auto !important;
      }
      
      /* New styles for locked screen and riddle sticky note */
      .sticky-note-riddle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-5deg);
        width: 250px;
        padding: 20px;
        background: #ffc;
        color: #333;
        font-family: 'Comic Sans MS', 'Chalkduster', 'cursive';
        font-size: 18px;
        text-align: center;
        box-shadow: 5px 5px 10px rgba(0,0,0,0.3);
        z-index: 1002;
      }
      
      /* Styles for Gamma's Decryptor (from previous implementation) */
      .input-wrapper {
        display: flex;
        align-items: center;
        flex-grow: 1;
      }
      
      .laptop-input-row select {
        flex-grow: 1;
      }
      
      .decrypted-output {
        margin-left: 15px;
        width: 120px;
        height: 20px;
        font-size: 0.9rem;
        color: #ff4d4d; /* Red for 'LOCKED' initially */
        border: 1px solid #444;
        background: #051018;
        padding: 5px;
        text-align: center;
        font-family: 'Courier New', monospace;
      }
      
      .sticky-note {
        position: absolute;
        top: 40px;
        right: 40px;
        width: 200px;
        height: 150px;
        padding: 15px;
        background: #ffc;
        color: #333;
        font-family: 'Comic Sans MS', 'Chalkduster', 'cursive';
        font-size: 16px;
        box-shadow: 5px 5px 10px rgba(0,0,0,0.3);
        transform: rotate(4deg);
        z-index: 1001;
      }

      /* Desktop icons styles */
      #desktop-icons {
        position: absolute;
        top: 40px;
        left: 40px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
        z-index: 1; /* Below the window */
      }

      .icon {
        width: 90px;
        color: #fff;
        text-align: center;
        font-size: 12px;
        font-family: 'Courier New', 'Consolas', monospace;
        word-wrap: break-word;
      }

      .icon img {
        width: 50px;
        height: 50px;
        margin-bottom: 5px;
        opacity: 0.7;
      }
    `;

    uiContainer.innerHTML = `
      <div id="desktop-icons">
        <div class="icon" id="drive_truth_filter_icon" style="display: none;">
          <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><path d='M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10z'/></svg>" alt="Drive Icon">
          <span>gamma_decryptor</span>
        </div>
        <div class="icon">
          <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><path d='M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z'/></svg>" alt="Log Icon">
          <span>system_logs</span>
        </div>
        <div class="icon">
          <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><path d='M6 18h12v-2H6v2zM6 9v2h12V9H6zm0-5v2h12V4H6z'/></svg>" alt="Network Icon">
          <span>network_status</span>
        </div>
        <div class="icon">
          <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><path d='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'/></svg>" alt="Trash Icon">
          <span>recycle_bin</span>
        </div>
      </div>

      <div class="laptop-window" style="display: none;">
        <div class="window-titlebar">GAMMA_DECRYPTOR_V2.EXE</div>
        <div class="window-content">
          <h3>SYSTEM OVERRIDE</h3>
          <div class="laptop-input-row">
            <label for="phrase-1">DECRYPTION KEY 1:</label>
            <div class="input-wrapper">
              <select id="phrase-1"></select>
              <span class="decrypted-output" id="output-1"></span>
            </div>
          </div>
          <div class="laptop-input-row">
            <label for="phrase-2">DECRYPTION KEY 2:</label>
            <div class="input-wrapper">
              <select id="phrase-2"></select>
              <span class="decrypted-output" id="output-2"></span>
            </div>
          </div>
          <div class="laptop-input-row">
            <label for="phrase-3">DECRYPTION KEY 3:</label>
            <div class="input-wrapper">
              <select id="phrase-3"></select>
              <span class="decrypted-output" id="output-3"></span>
            </div>
          </div>
          <div class="laptop-buttons">
            <button id="laptop-cancel" class="laptop-btn">CANCEL</button>
            <button id="laptop-submit" class="laptop-btn">SUBMIT</button>
          </div>
        </div>
      </div>
      
      <div id="laptop-locked-screen" style="display: none;">
        <div class="sticky-note-riddle">
          "Nexus sees the surface, but the key to my work is in the *lens*. You need my eyes to see my truth." - G
        </div>
      </div>

      <div class="laptop-taskbar"></div>
      <div class="sticky-note">
        Nexus scrambles the data stream, but the truths are always there. Use them to unlock my protocol.<br>- G
      </div>
    `;
    
    document.body.appendChild(style);
    document.body.appendChild(uiContainer);
  }

  openUnlockedUI(launchMinigameImmediately = false) {
    const ui = document.getElementById('laptop-ui');
    const decryptorWindow = ui.querySelector('.laptop-window');
    const driveIcon = ui.querySelector('#drive_truth_filter_icon');
    if (!ui || !decryptorWindow || !driveIcon) return;

    // Standard setup for opening the UI
    window.isUIVisible = true;
    document.exitPointerLock();
    window.disablePlayerControls = true;
    
    // Show mouse cursor and unlock it for UI interaction
    document.body.style.cursor = 'default';
    document.body.classList.add('laptop-ui-active'); // Add custom cursor styling
    if (window.camera && window.camera.controls) {
      window.camera.controls.enabled = false; // Disable camera controls
    }
    
    ui.style.display = 'block';
    
    // Hide the interaction prompt when UI is open
    this.showPrompt('');
    this.showDrivePrompt(false);

    if (launchMinigameImmediately) {
      // Bypass everything and start the minigame
      ui.querySelectorAll('.laptop-input-row, .laptop-buttons, h3').forEach(el => el.style.display = 'none');
      driveIcon.style.display = 'none';
      this.purgeMinigame.start();
    } else {
      // Show the desktop with the clickable icon
      driveIcon.style.display = 'block';
      decryptorWindow.style.display = 'none'; // Keep the decryptor hidden initially

      // This function will be called when the icon is clicked
      const openDecryptor = () => {
        decryptorWindow.style.display = 'block';
        // Populate dropdowns with shuffled phrases
        const selects = [ui.querySelector('#phrase-1'), ui.querySelector('#phrase-2'), ui.querySelector('#phrase-3')];
        const shuffledPhrases = this.dataStormPuzzle.getDropdownPhrases();
        selects.forEach(select => {
          select.innerHTML = '<option value="">-- SELECT PHRASE --</option>';
          shuffledPhrases.forEach(phrase => {
            const option = document.createElement('option');
            option.value = phrase;
            option.textContent = phrase;
            select.appendChild(option);
          });
        });

        // --- ADD DECRYPTION LOGIC ---
        const correctPhrases = new Set(this.dataStormPuzzle.correctPhrases);
        const outputs = [ui.querySelector('#output-1'), ui.querySelector('#output-2'), ui.querySelector('#output-3')];
        
        // Set initial state
        outputs.forEach(o => o.textContent = 'LOCKED');

        // Helper function for decryption animation
        const runDecryptionEffect = (outputElement) => {
          let i = 0;
          const chars = 'ABCDEF1234567890';
          const finalCode = '0x' + Array(6).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');

          const interval = setInterval(() => {
            let scramble = '0x' + Array(6).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
            outputElement.textContent = scramble;
            outputElement.style.color = '#00ff7f'; // Turn green
            i++;
            if (i > 10) { // Run for 10 iterations
              clearInterval(interval);
              outputElement.textContent = finalCode; // Set the final "decrypted" code
            }
          }, 50);
        };

        // Add event listeners to each dropdown
        selects.forEach((select, index) => {
          select.addEventListener('change', () => {
            const output = outputs[index];
            if (correctPhrases.has(select.value)) {
              runDecryptionEffect(output);
            } else {
              output.textContent = 'ERROR';
              output.style.color = '#ff4d4d'; // Red for error
            }
          });
        });
        // --- END OF DECRYPTION LOGIC ---

        driveIcon.removeEventListener('click', openDecryptor); // Prevent multiple listeners
      };

      // Add a one-time click listener to the icon
      driveIcon.addEventListener('click', openDecryptor);
    }

    // Your existing submit/cancel button logic remains the same
    document.getElementById('laptop-submit').onclick = () => {
      const selects = [ui.querySelector('#phrase-1'), ui.querySelector('#phrase-2'), ui.querySelector('#phrase-3')];
      const submission = selects.map(s => s.value);
      const success = this.dataStormPuzzle.submitAttempt(submission);
      if (success) {
        console.log('[Server Room] Phrase puzzle solved! Minigame will start automatically...');
      } else {
        AI.say("Access denied. Sequence incorrect.");
      }
    };
    document.getElementById('laptop-cancel').onclick = () => this.closeLaptopUI();
  }

  openLockedUI() {
    const ui = document.getElementById('laptop-ui');
    const lockedEl = document.getElementById('laptop-locked-screen');
    if (!ui || !lockedEl) return;

    window.isUIVisible = true;
    document.exitPointerLock();
    window.disablePlayerControls = true; // Still disable controls
    
    // Show mouse cursor and unlock it for UI interaction
    document.body.style.cursor = 'default';
    document.body.classList.add('laptop-ui-active');
    if (window.camera && window.camera.controls) {
      window.camera.controls.enabled = false;
    }
    
    ui.style.display = 'block';
    lockedEl.style.display = 'block';
    ui.querySelector('.laptop-window').style.display = 'none';
    
    // Hide the interaction prompt when UI is open
    this.showPrompt('');
    this.showDrivePrompt(false);

    // Add a click listener to the whole screen to close it
    const closeHandler = () => {
      this.closeLaptopUI();
      ui.removeEventListener('click', closeHandler);
    };
    ui.addEventListener('click', closeHandler);
  }

  closeLaptopUI() {
    const ui = document.getElementById('laptop-ui');
    if (ui) {
      ui.style.display = 'none';
      // Hide both potential screens
      const windowEl = ui.querySelector('.laptop-window');
      const lockedEl = document.getElementById('laptop-locked-screen');
      if (windowEl) windowEl.style.display = 'none';
      if (lockedEl) lockedEl.style.display = 'none';
    }
    
    // Set global UI visibility flag to false
    window.isUIVisible = false;
    
    window.disablePlayerControls = false; // Re-enable player movement
    
    // Hide mouse cursor and restore camera controls
    document.body.style.cursor = 'none';
    document.body.classList.remove('laptop-ui-active'); // Remove custom cursor styling
    if (window.camera && window.camera.controls) {
      window.camera.controls.enabled = true; // Re-enable camera controls
    }
  }

  _buildCenterPlatform() {
    // Platform removed - no white circular base

    // CPU Core (visual)
    const coreGroup = new THREE.Group();
    coreGroup.name = 'cpu-core';
    coreGroup.position.set(0, 2.2, 0);

    // Central processor die (cube) with scrolling emissive "circuit" texture
    const dieSize = 1.2;
    const dieGeo = new THREE.BoxGeometry(dieSize, dieSize, dieSize);
    const circuitTex = this._makeCircuitTexture();
    circuitTex.wrapS = THREE.RepeatWrapping;
    circuitTex.wrapT = THREE.RepeatWrapping;
    circuitTex.repeat.set(1, 1);
    circuitTex.offset.set(0, 0);

    const dieMat = new THREE.MeshStandardMaterial({
      color: 0x441111,
      metalness: 0.4,
      roughness: 0.45,
      emissive: new THREE.Color(0xff3333),
      emissiveIntensity: 1.5,
      emissiveMap: circuitTex
    });
    const die = new THREE.Mesh(dieGeo, dieMat);
    die.name = 'cpu-core-cube';
    die.castShadow = true;
    coreGroup.add(die);

    // Gyroscopic rings (torii) rotating on different axes
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xaec7ff,
      metalness: 0.85,
      roughness: 0.3,
      emissive: new THREE.Color(0x224466),
      emissiveIntensity: 0.25
    });
    const rings = [];
    const ringR = 1.2; // major radius
    const tube = 0.05; // thickness

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(ringR, tube, 16, 64), ringMat.clone());
    ring1.rotation.x = Math.PI * 0.25;
    ring1.name = 'cpu-ring-1';
    ring1.castShadow = true; ring1.receiveShadow = true;
    rings.push(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(ringR + 0.15, tube, 16, 64), ringMat.clone());
    ring2.rotation.y = Math.PI * 0.25;
    ring2.name = 'cpu-ring-2';
    ring2.castShadow = true; ring2.receiveShadow = true;
    rings.push(ring2);

    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(ringR + 0.3, tube, 16, 64), ringMat.clone());
    ring3.rotation.z = Math.PI * 0.15;
    ring3.name = 'cpu-ring-3';
    ring3.castShadow = true; ring3.receiveShadow = true;
    rings.push(ring3);

    rings.forEach(r => coreGroup.add(r));

    // Vertical heat sinks around outside
    const heatsinks = new THREE.Group();
    heatsinks.name = 'cpu-heatsinks';
    const hsMat = new THREE.MeshStandardMaterial({
      color: 0xabb3bd,
      metalness: 0.9,
      roughness: 0.25,
      emissive: new THREE.Color(0x0b1a24),
      emissiveIntensity: 0.05
    });
    const hsCount = 12;
    const hsRad = ringR + 0.55;
    const hsW = 0.08, hsH = 1.8, hsD = 0.24;
    for (let i = 0; i < hsCount; i++) {
      const a = (i / hsCount) * Math.PI * 2;
      const x = Math.cos(a) * hsRad;
      const z = Math.sin(a) * hsRad;
      const hs = new THREE.Mesh(new THREE.BoxGeometry(hsW, hsH, hsD), hsMat);
      hs.position.set(x, 0, z);
      hs.rotation.y = -a;
      hs.castShadow = true; hs.receiveShadow = true;
      heatsinks.add(hs);
    }
    coreGroup.add(heatsinks);

    this.centerPlatform.add(coreGroup);


    // Keep references for animation
    this.cpuCore = {
      group: coreGroup,
      die,
      rings,
      heatsinks,
      circuitTex
    };
  }

  _buildLaptopWorkstation() {
    const workstation = new THREE.Group();
    workstation.name = 'laptop-workstation';
    const sidePosition = this.dim.radius * 0.7;
    workstation.position.set(-sidePosition, 0, 0);

    const tableMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.3, roughness: 0.7 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), tableMat);
    table.position.y = 0.4;
    table.castShadow = true;
    table.receiveShadow = true;
    workstation.add(table);

    const laptopGroup = new THREE.Group();
    laptopGroup.position.y = 0.8; // Set base height of the laptop on the table
    workstation.add(laptopGroup);

    // --- LAPTOP BASE (KEYBOARD) ---
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.4 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), baseMat);
    laptopGroup.add(base);

    // --- NEW HINGE MECHANISM ---
    // 1. Create an invisible Hinge group and position it at the back of the base
    const hingeGroup = new THREE.Group();
    hingeGroup.position.z = -0.2; // Position at the back edge of the base
    laptopGroup.add(hingeGroup);
    
    // 2. Create the Screen with correct dimensions
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9, roughness: 0.3 });
    const screenHeight = 0.4;
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.6, screenHeight, 0.05), screenMat);
    
    // 3. Position the screen *locally* inside the hinge.
    // Move it up by half its height so its bottom edge is at the hinge's pivot point.
    screen.position.y = screenHeight / 2;
    
    // 4. Create and attach the display texture to the screen
    const textureLoader = new THREE.TextureLoader();
    const previewTexture = textureLoader.load('/textures/laptop_preview.png');
    previewTexture.colorSpace = THREE.SRGBColorSpace;
    const displayMat = new THREE.MeshStandardMaterial({
      map: previewTexture,
      emissive: 0xffffff,
      emissiveMap: previewTexture,
      emissiveIntensity: 0.8,
      toneMapped: false
    });
    const display = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.35), displayMat);
    display.position.z = 0.026; // Tiny offset forward from the screen's front face
    screen.add(display);

    // 5. Add the screen to the HINGE, not the main laptop group
    hingeGroup.add(screen);
    
    // 6. HINGE ROTATION
    hingeGroup.rotation.x = Math.PI * -0.15;

    // --- END OF HINGE MECHANISM ---

    // Make the entire laptop (which is inside the workstation group) interactable
    laptopGroup.userData.isInteractable = true;
    laptopGroup.userData.interactionId = 'room3_laptop_terminal';
    this.laptopObject = laptopGroup;
    
    this.group.add(workstation);
  }


  _makeCircuitTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#061018';
    ctx.fillRect(0, 0, size, size);

    // Subtle grid
    ctx.strokeStyle = '#0a2230';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 16) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    // Glowing circuit traces
    const drawTrace = (x0, y0, x1, y1, color, w) => {
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      // orthogonal L-shaped segments
      const midX = (x0 + x1) / 2;
      ctx.lineTo(midX, y0);
      ctx.lineTo(midX, y1);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    };

    const colors = ['#1ae0ff', '#39ff98', '#1a9bff'];
    for (let i = 0; i < 10; i++) {
      const x0 = Math.random() * size * 0.8 + size * 0.1;
      const y0 = Math.random() * size * 0.8 + size * 0.1;
      const x1 = Math.random() * size * 0.8 + size * 0.1;
      const y1 = Math.random() * size * 0.8 + size * 0.1;
      const c = colors[i % colors.length];
      drawTrace(x0, y0, x1, y1, c, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 2;
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }

  _initLights() {
    removeExistingLights(this.group);
    // Standard lighting removed - only red emergency lights remain

    // Add a dark ambient light to counteract the white ambient light from Room 0
    const darkAmbient = new THREE.AmbientLight(0x000000, 0.0); // Completely dark ambient
    darkAmbient.name = 'dark-ambient-override';
    this.group.add(darkAmbient);

    // Perimeter red alarm lights (N, E, S, W) - always on
    const y = this.dim.height - 0.5;
    const r = this.dim.radius - 1.0;
    const mk = (name, x, z) => {
      const p = new THREE.PointLight(0xff3333, 2.6, 30, 2.0);
      p.position.set(x, y, z);
      p.castShadow = false;
      p.visible = true;
      p.name = name;
      this.group.add(p);
      return p;
    };
    this.alarmLightN = mk('alarmLightN', 0, -r);
    this.alarmLightS = mk('alarmLightS', 0, r);
    this.alarmLightE = mk('alarmLightE', r, 0);
    this.alarmLightW = mk('alarmLightW', -r, 0);
  }

  _buildExitIndicator() {
    // Create a glowing exit sign
    const exitGroup = new THREE.Group();
    exitGroup.name = 'exit-indicator';
    
    // Exit sign geometry (larger and more visible)
    const signGeo = new THREE.PlaneGeometry(4, 2);
    const signMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 3, 0);
    exitGroup.add(sign);
    
    // Add text to the sign
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#00ff00';
    context.font = 'bold 64px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('EXIT', 256, 128);
    context.fillText('TO HUB', 256, 180);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const textMesh = new THREE.Mesh(signGeo, textMat);
    textMesh.position.set(0, 3, 0.01);
    exitGroup.add(textMesh);
    
    // Add a glowing light at the exit
    const exitLight = new THREE.PointLight(0x00ff00, 2, 10);
    exitLight.position.set(0, 2, 0);
    exitGroup.add(exitLight);
    
    // Position at exit anchor
    exitGroup.position.copy(this.anchors.exit.position);
    exitGroup.position.y += 1;
    
    this.group.add(exitGroup);
    this.exitIndicator = exitGroup;
    
    console.log('[Server Room] Exit indicator created at position:', exitGroup.position);
  }

  // UI prompt helper
  ensurePrompt() {
    let prompt = document.getElementById('interactPrompt');
    if (!prompt) {
      prompt = document.createElement('div');
      prompt.id = 'interactPrompt';
      prompt.style.cssText = 'position:fixed;left:50%;bottom:10%;transform:translateX(-50%);color:#fff;background:rgba(0,0,0,0.55);padding:6px 10px;border-radius:6px;z-index:9999;font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px;pointer-events:none;';
      document.body.appendChild(prompt);
    }
    return prompt;
  }

  showPrompt(text) {
    const prompt = this.ensurePrompt();
    if (text !== this.lastPromptText) {
      prompt.textContent = text || '';
      this.lastPromptText = text || '';
    }
    prompt.style.display = text ? 'block' : 'none';
  }

  // Dedicated drive insertion prompt
  ensureDrivePrompt() {
    let prompt = document.getElementById('driveInsertPrompt');
    if (!prompt) {
      prompt = document.createElement('div');
      prompt.id = 'driveInsertPrompt';
      prompt.style.cssText = 'position:fixed;left:50%;bottom:20%;transform:translateX(-50%);color:#00ff7f;background:rgba(0,0,0,0.8);padding:8px 16px;border-radius:8px;z-index:10000;font-family:monospace;font-size:16px;pointer-events:none;border:1px solid #00ff7f;box-shadow:0 0 10px rgba(0,255,127,0.3);';
      document.body.appendChild(prompt);
    }
    return prompt;
  }

  showDrivePrompt(show) {
    const prompt = this.ensureDrivePrompt();
    if (show) {
      prompt.textContent = 'E to insert the drive';
      prompt.style.display = 'block';
    } else {
      prompt.style.display = 'none';
    }
  }

  enter(fromRoomIndex) {
    if (this._entered) return;
    this._entered = true;
    gameStore.setStage(3);
    if (window && window.gameState) {
      window.gameState.stage = 3;
    }

    // --- DIM EXTERNAL LIGHTS (instead of hiding completely) ---
    const scene = this.group.parent;
    if (scene) {
      scene.traverse((object) => {
        // If the object is a light AND it's not a child of this room's group...
        if (object.isLight && !object.parent.name.includes('server-room')) {
          this._hiddenExternalLights.push(object); // Store it
          object.intensity *= 0.1; // Dim instead of hide
        }
      });
    }
    console.log(`[Server Room] Entered. Dimmed ${this._hiddenExternalLights.length} external lights.`);
    // --- END OF BLOCK ---

    // --- KEEP ENVIRONMENT MAP (but dim it) ---
    if (scene) {
      // Save the current environment map before changing it
      this._previousEnvironment = scene.environment;
      // Keep environment but make it darker
      // scene.environment = null; // REMOVED - keep environment visible
    }
    console.log(`[Server Room] Kept scene.environment for visibility.`);
    // --- END OF BLOCK ---

    // Place the player at catwalk start if available
    // Optional snap to spawn if player reference provided to constructor
    if (this.player && this.player.position) {
      this.player.position.copy(this.group.localToWorld(this.spawn.clone()));
    }

    // Door close SFX placeholder (TODO: integrate audio helper)
    AI.onCoreChamberEntry();
  }

  exit() {
    this._entered = false; // Allow re-entry logic to run

    // --- RESTORE EXTERNAL LIGHTS ---
    console.log(`[Server Room] Exiting. Restoring ${this._hiddenExternalLights.length} external lights.`);
    this._hiddenExternalLights.forEach(light => {
      light.intensity *= 10; // Restore original intensity
    });
    this._hiddenExternalLights = []; // Clear the list
    // --- END OF BLOCK ---

    // --- RESTORE THE ENVIRONMENT MAP ---
    const scene = this.group.parent;
    if (scene) {
      // Restore the original environment map
      scene.environment = this._previousEnvironment;
    }
    console.log(`[Server Room] Restored scene.environment.`);
    // --- END OF BLOCK ---
  }

  update(delta) {
    // Check for laptop interaction prompts
    if (this.player && this.laptopObject) {
      const dist = this.laptopObject.getWorldPosition(new THREE.Vector3()).distanceTo(this.player.position);
      if (dist <= 2.5) {
        // Player is near laptop - show appropriate prompt
        const inventory = getPlayerInventory();
        const selectedItem = inventory ? inventory.getSelectedItem() : null;
        
        if (this.driveInserted) {
          this.showPrompt("Press E to access laptop");
          this.showDrivePrompt(false); // Hide drive prompt
        } else if (selectedItem && selectedItem.name === 'glasses') {
          this.showPrompt(''); // Hide general prompt
          this.showDrivePrompt(true); // Show dedicated drive prompt
        } else {
          this.showPrompt("Press E to access laptop (drive required)");
          this.showDrivePrompt(false); // Hide drive prompt
        }
      } else {
        this.showPrompt(''); // Hide prompt when not near laptop
        this.showDrivePrompt(false); // Hide drive prompt
      }
    }

    // Animate CPU Core (rings + emissive scroll)
    if (this.cpuCore) {
      const rings = this.cpuCore.rings || [];
      const r1 = rings[0], r2 = rings[1], r3 = rings[2];
      if (r1) r1.rotation.x += delta * 0.8;
      if (r2) r2.rotation.y -= delta * 0.6;
      if (r3) r3.rotation.z += delta * 0.4;

      const tex = this.cpuCore.circuitTex;
      if (tex) {
        tex.offset.y = (tex.offset.y + delta * 0.2) % 1.0;
        tex.needsUpdate = true;
      }
    }

    // Alarm lighting: pulse and strobe when active
    if (this._alarm.on) {
      this._alarm.t += delta;
      const s = 0.5 + 0.5 * Math.sin(this._alarm.t * 6.0);
      
      // Tint CPU core die material
      if (this.cpuCore?.die?.material) {
        const m = this.cpuCore.die.material;
        m.emissive.setHex(0xaa1111);
        m.color.setHex(0xff5555);
        m.emissiveIntensity = 1.4 + s * 0.6;
      }

      // Alternating strobe: NS vs EW every 0.5s
      const phase = Math.floor(this._alarm.t * 2) % 2; // 0/1 toggle
      const showNS = phase === 0;
      if (this.alarmLightN) this.alarmLightN.visible = showNS;
      if (this.alarmLightS) this.alarmLightS.visible = showNS;
      if (this.alarmLightE) this.alarmLightE.visible = !showNS;
      if (this.alarmLightW) this.alarmLightW.visible = !showNS;
    }

    // Subsystems
    // Check if glasses are active (with fallback)
    let isGlassesActive = false;
    try {
      const inv = getPlayerInventory ? getPlayerInventory() : null;
      const selected = inv && inv.getSelectedItem ? inv.getSelectedItem() : null;
      isGlassesActive = !!(selected && selected.name === 'glasses');
    } catch (e) {
      console.warn('Could not check glasses state:', e);
    }
    
    // Update data storm puzzle with glasses state
    if (this.dataStormPuzzle) {
      this.dataStormPuzzle.update(delta, isGlassesActive);
      
      // Check if Data Storm puzzle is solved and start the minigame
      if (this.dataStormPuzzle.isSolved && this.purgeMinigame && !this.purgeMinigame.isActive) {
        // Use a flag to ensure this block only runs once
        if (!this.purgeMinigame.isStarting) { 
          this.purgeMinigame.isStarting = true; 
          
          console.log('[Server Room] Data Storm solved! Starting Purge Protocol minigame...');
          
          // Simply start the minigame - it will handle UI switching internally
          this.purgeMinigame.start();
        }
      }
    }
    
    // Update Purge Protocol minigame
    if (this.purgeMinigame && this.purgeMinigame.isActive) {
      this.purgeMinigame.update(delta);
      
      // Add glowing effect to terminal screen when minigame is active
      if (this.terminalScreen && this.terminalScreen.material) {
        const pulse = 0.8 + 0.2 * Math.sin(this._alarm.t * 4);
        this.terminalScreen.material.opacity = pulse;
      }
      
      // Check if minigame is completed
      if (this.purgeMinigame.isSolved) {
        console.log('[Server Room] Purge Protocol completed!');
        // Could trigger additional game events here
      }
    }
    
    // Animate exit indicator
    if (this.exitIndicator) {
      this.exitIndicator.rotation.y += delta * 0.5;
      const pulse = 0.8 + 0.2 * Math.sin(this._alarm.t * 4);
      this.exitIndicator.children.forEach(child => {
        if (child.material && child.material.opacity !== undefined) {
          child.material.opacity = pulse;
        }
      });
    }
  }

  _enableAlarmState() {
    this._alarm.on = true;
    try { room3Audio.staticBurst(); } catch {}
    try { this._alarmAudio = room3Audio.alarm(); } catch {}

    // Red emergency lights are already always on
    // No other lighting to disable since only red lights remain
  }

  checkWallCollisions(player) {
    // Constrain within catwalk and platforms; allow gaps to fall. If fallen, respawn via bridge logic.
    if (!player || !player.position) return;
    
    // Check for exit collision first
    this._checkExitCollisions(player);
    
    // Debug: Log player position occasionally
    if (Math.random() < 0.01) { // 1% chance per frame
      console.log('[Server Room] Player position:', player.position);
    }
    
    // Compute local position
    const local = this.group.worldToLocal(this._tmpVec.copy(player.position));
    const radius = this.dim.radius;

    // Allow player to reach exit area - disable collision clamping entirely
    // The exit collision detection will handle the transition
    const dist = Math.hypot(local.x, local.z);
    const maxDistance = radius + 20; // Very large boundary to allow free movement
    
    // Only clamp if player is trying to go extremely far (safety net)
    if (dist > maxDistance) {
      const k = (maxDistance - 0.01) / dist;
      local.x *= k; local.z *= k;
    }

    // Vertical pits: if leaving walkable surfaces (y below -1), respawn
    if (player && player.position && player.position.y < -1) {
      // Snap to spawn
      player.position.copy(this.group.localToWorld(this.spawn.clone()));
    }

    const newWorld = this.group.localToWorld(local);
    player.position.copy(newWorld);
  }

  _checkExitCollisions(player) {
    if (!player || !player.position) return;
    
    // Check exit anchor collision (back to hub)
    const exitWorld = this.anchors.exit.getWorldPosition(new THREE.Vector3());
    const distanceToExit = player.position.distanceTo(exitWorld);
    
    // Debug logging - show exit position and distance
    if (distanceToExit < 10.0) {
      console.log(`[Server Room] Player at (${player.position.x.toFixed(2)}, ${player.position.y.toFixed(2)}, ${player.position.z.toFixed(2)})`);
      console.log(`[Server Room] Exit at (${exitWorld.x.toFixed(2)}, ${exitWorld.y.toFixed(2)}, ${exitWorld.z.toFixed(2)})`);
      console.log(`[Server Room] Distance to exit: ${distanceToExit.toFixed(2)}`);
    }
    
    if (distanceToExit < 3.0) {
      // Player is near exit - transition back to hub
      console.log('[Server Room] Player reached exit, transitioning to hub');
      
      // Direct transition to Room 0 (hub) - bypass LevelManager for now
      const hubEntry = new THREE.Vector3(-9, 1, 0); // Room 0 entry_from_room3 position
      player.position.copy(hubEntry);
      
      // Update game state
      if (window.gameStore && window.gameStore.setCurrentRoom) {
        window.gameStore.setCurrentRoom('hub');
        console.log('[Server Room] Updated currentRoom to hub');
      }
      if (window.gameStore && window.gameStore.setStage) {
        window.gameStore.setStage(0);
        console.log('[Server Room] Updated stage to 0');
      }
      
      // Also update window.gameState for compatibility
      if (window.gameState) {
        window.gameState.stage = 0;
        console.log('[Server Room] Updated window.gameState.stage to 0');
      }
      
      // Ensure dropped items persist during room transition
      if (window.ensureDroppedItemsInScene) {
        window.ensureDroppedItemsInScene();
        console.log('[Server Room] Ensured dropped items persist during transition');
      }
    }
  }

  handleEKeyInteraction(player) {
    if (!player || !this.laptopObject) return false;

    const dist = this.laptopObject.getWorldPosition(new THREE.Vector3()).distanceTo(player.position);
    if (dist > 2.5) return false; // Slightly larger interaction radius

    // --- NEW MULTI-STATE LOGIC ---

    // Priority 1: If Data Storm is already solved, launch the minigame.
    if (gameStore.flags.room3.dataStormSolved) {
      console.log("Data Storm solved. Launching Purge Protocol.");
      this.openUnlockedUI(true); // Open in minigame mode
      return true;
    }

    // Priority 2: If drive is already inserted, show the desktop.
    if (this.driveInserted) {
      console.log("Drive is inserted. Opening desktop UI.");
      this.openUnlockedUI(false); // Open in decryptor mode
      return true;
    }

    // Priority 3: If drive is NOT inserted, check if player is "holding" the glasses.
    const inventory = getPlayerInventory();
    const selectedItem = inventory ? inventory.getSelectedItem() : null;

    if (selectedItem && selectedItem.name === 'glasses') {
      // This is the "insert drive" action.
      this.driveInserted = true;
      console.log("Drive 'truth_filter' inserted!");
      AI.say("DRIVE DETECTED. GAMMA_PROTOCOL ACCESSIBLE.", { tone: 'neutral' });
      return true; // Don't open the UI yet, let player interact again.
    }
    
    // Default Action: If none of the above, show the locked screen.
    console.log("Drive not inserted and glasses not selected. Showing locked screen.");
    this.openLockedUI();
    AI.say("ACCESS DENIED. INSERT REQUIRED DRIVE.", { tone: 'warning' });
    return true;
  }

  dispose() {
    // Clean up groups and references
    try { if (this._alarmAudio) { this._alarmAudio.pause(); this._alarmAudio = null; } } catch {}
    
    // Clean up prompts
    this.showPrompt('');
    this.showDrivePrompt(false);
    const prompt = document.getElementById('interactPrompt');
    const drivePrompt = document.getElementById('driveInsertPrompt');
    if (prompt) {
      prompt.remove();
    }
    if (drivePrompt) {
      drivePrompt.remove();
    }
    
    this.scene = null; this.loader = null; this.player = null;
  }

}// Factory for compatibility with existing main.js import style
export function createServerRoom(ctx = {}) {
  const r = new ServerRoom(ctx);
  return r;
}


