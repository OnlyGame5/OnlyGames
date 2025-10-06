// src/rooms/serverRoom.js

import * as THREE from 'three';
import { AI } from '../ai.js';
import { gameStore } from '../state/gameStore.js';
import { buildStandardLightRig, removeExistingLights } from '../lighting/standardLighting.js';
import { DataStormPuzzle } from './Room3/DataStormPuzzle.js';
import { room3Audio } from '../audio/room3Audio.js';

// Server Room – The Core
// Controller responsible for assembling the chamber, mounting puzzles, and handling per-frame updates.
export class ServerRoom {
  constructor({ scene, loader, player, materials, assets } = {}) {
    this.scene = scene;
    this.loader = loader;
    this.player = player;
    this.materials = materials;
    this.assets = assets;

    // Root group
    const group = new THREE.Group();
    group.name = 'server-room-core-chamber';
    this.group = group;

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

    // Local lighting
    this._initLights();

    // Puzzles
    this.dataStormPuzzle = new DataStormPuzzle();
    this.dataStormPuzzle.mount(this.centerPlatform);

    // Entry/Exit anchors
    this.anchors = {
      entry: new THREE.Object3D(),
      exit: new THREE.Object3D()
    };
    this.anchors.entry.position.copy(new THREE.Vector3(0, 0, this.dim.radius + 6));
    this.anchors.exit.position.copy(new THREE.Vector3(0, 0, -this.dim.radius - 6));
    group.add(this.anchors.entry, this.anchors.exit);

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

    // Ceiling cap for the chamber (now a thin cylinder for thickness)
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.6, roughness: 0.35 });
    // Replace CircleGeometry with a thin CylinderGeometry
    const ceiling = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.2, 48), ceilingMat);
    // No rotation is needed for a cylinder
    ceiling.position.set(0, height - 0.1, 0); // Position it at the top
    ceiling.receiveShadow = true;
    this.group.add(ceiling);

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

  _buildCenterPlatform() {
    const platR = 3.5;
    const mat = new THREE.MeshStandardMaterial({ color: 0xf3f7fb, metalness: 0.25, roughness: 0.6, emissive: new THREE.Color(0x66aaff), emissiveIntensity: 0.2 });
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(platR, platR, 0.4, 32), mat);
    platform.position.set(0, 0.2, 0);
    platform.castShadow = true; platform.receiveShadow = true;
    this.centerPlatform.add(platform);

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

  enter(fromRoomIndex) {
    if (this._entered) return;
    this._entered = true;
    gameStore.setStage(3);
    if (window && window.gameState) {
      window.gameState.stage = 3;
    }

    // --- HIDE EXTERNAL LIGHTS ---
    const scene = this.group.parent;
    if (scene) {
      scene.traverse((object) => {
        // If the object is a light AND it's not a child of this room's group...
        if (object.isLight && !object.parent.name.includes('room3')) {
          this._hiddenExternalLights.push(object); // Store it
          object.visible = false; // Hide it
        }
      });
    }
    console.log(`[Server Room] Entered. Hid ${this._hiddenExternalLights.length} external lights.`);
    // --- END OF BLOCK ---

    // --- DISABLE THE ENVIRONMENT MAP ---
    if (scene) {
      // Save the current environment map before changing it
      this._previousEnvironment = scene.environment;
      // Disable it to achieve true darkness
      scene.environment = null;
    }
    console.log(`[Server Room] Disabled scene.environment.`);
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
      light.visible = true; // Restore visibility
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
    if (this.dataStormPuzzle) this.dataStormPuzzle.update(delta);
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
    // Compute local position
    const local = this.group.worldToLocal(this._tmpVec.copy(player.position));
    const radius = this.dim.radius;

    // If inside ring radius+small, allow. Outside, clamp lightly.
    const dist = Math.hypot(local.x, local.z);
    if (dist > radius + 6) {
      const k = (radius + 6 - 0.01) / dist;
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

  handleEKeyInteraction(player) {
    if (!player) return false;
    
    // Check for data storm fragment interactions
    if (this.dataStormPuzzle && this.dataStormPuzzle.sprites) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(0, 0); // center of screen
      raycaster.setFromCamera(mouse, window.camera);
      const intersects = raycaster.intersectObjects(this.dataStormPuzzle.sprites, true);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData.interactionId === 'data_storm_fragment') {
          this.dataStormPuzzle.handleInteraction(hit);
          return true;
        }
      }
    }
    
    return false;
  }

  dispose() {
    // Clean up groups and references
    try { if (this._alarmAudio) { this._alarmAudio.pause(); this._alarmAudio = null; } } catch {}
    this.scene = null; this.loader = null; this.player = null;
  }
}

// Factory for compatibility with existing main.js import style
export function createServerRoom(ctx = {}) {
  const r = new ServerRoom(ctx);
  return r;
}
