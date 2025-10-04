import * as THREE from 'three';
import { AI } from '../ai.js';
import { gameStore } from '../state/gameStore.js';
import { buildStandardLightRig, removeExistingLights } from '../lighting/standardLighting.js';
import { BridgeOfLies } from './Room3/BridgeOfLies.js';
import { SystemOverrideTerminal } from './Room3/SystemOverrideTerminal.js';
import { FinalChoiceConsoles } from './Room3/FinalChoiceConsoles.js';
import { room3Audio } from '../audio/room3Audio.js';

// Room 3 – The Core
// Controller responsible for assembling the chamber, mounting puzzles, and handling per-frame updates.
export class Room3 {
  constructor({ scene, loader, player, materials, assets } = {}) {
    this.scene = scene;
    this.loader = loader;
    this.player = player;
    this.materials = materials;
    this.assets = assets;

    // Root group
    const group = new THREE.Group();
    group.name = 'room3-core-chamber';
    this.group = group;

    // Layout parameters
    this.dim = { radius: 10, height: 8 };
    this.spawn = new THREE.Vector3(0, 1, this.dim.radius + 4); // catwalk start outside the ring

    // Subgroups
    this.catwalk = new THREE.Group(); this.catwalk.name = 'catwalk-entry';
    this.bridgeMount = new THREE.Group(); this.bridgeMount.name = 'bridge-mount';
    this.centerPlatform = new THREE.Group(); this.centerPlatform.name = 'central-platform';
    group.add(this.catwalk, this.bridgeMount, this.centerPlatform);

    // Geometry: cylindrical pit with central platform
    this._buildShell();
    this._buildCatwalk();
    this._buildCenterPlatform();

    // Local lighting
    this._initLights();

    // Puzzles
    this.bridge = new BridgeOfLies({
      rows: 3, cols: 5,
      patternSeed: 713,
      respawnPosition: this.spawn.clone(),
      stepSfx: { ok: 'chime1', fail: 'buzz1' }
    });
    this.bridge.mount(this.bridgeMount);

    this.override = new SystemOverrideTerminal();
    this.override.mount(this.centerPlatform);

    this.choices = new FinalChoiceConsoles({ onChoice: (type) => this._handleFinalChoice(type) });
    this.choices.mount(this.centerPlatform);

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
  }

  // Build cylindrical chamber shell and fog suggestion
  _buildShell() {
    const { radius, height } = this.dim;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xbbc1c9, metalness: 0.6, roughness: 0.35 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xe9eef5, metalness: 0.2, roughness: 0.8 });

    // Outer ring floor
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(radius + 6, radius + 6, 0.25, 48), floorMat);
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Inner pit wall with opening for hub hallway (East side)
    const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 48, 1, true, 0.3, Math.PI * 1.9), wallMat);
    innerWall.position.y = height / 2;
    innerWall.receiveShadow = true; innerWall.castShadow = true;
    this.group.add(innerWall);

    // Simple fog hint via large transparent disc with matching opening
    const fogMat = new THREE.MeshBasicMaterial({ color: 0x99aacc, transparent: true, opacity: 0.06 });
    const fogDisc = new THREE.Mesh(new THREE.CylinderGeometry(radius - 0.2, radius - 0.2, 0.05, 48, 1, true, 0.3, Math.PI * 1.9), fogMat);
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

    // Suspended core (visual)
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 16), new THREE.MeshStandardMaterial({ color: 0x77bbff, emissive: 0x2266ff, emissiveIntensity: 1.2, metalness: 0.1, roughness: 0.3 }));
    core.position.set(0, 2.2, 0);
    core.name = 'core-sphere';
    core.castShadow = true;
    this.centerPlatform.add(core);
  }

  _initLights() {
    removeExistingLights(this.group);
    const rig = buildStandardLightRig({
      keyPosition: new THREE.Vector3(0, 10, 10),
      keyIntensity: 1.0,
      hemiIntensity: 0.4,
      shadowMap: 1024,
      shadowBounds: 16,
      enableAccents: true,
    });
    this.group.add(rig);

    // Local spot on core, controllable for alarm state
    const spot = new THREE.SpotLight(0x88bbff, 2.2, 20, Math.PI / 4, 0.3, 1);
    spot.position.set(0, 7, 0);
    spot.target.position.set(0, 2.2, 0);
    spot.castShadow = true;
    this.group.add(spot, spot.target);
    this.coreSpot = spot;
  }

  enter(fromRoomIndex) {
    if (this._entered) return;
    this._entered = true;
    gameStore.setStage(3);
    if (window && window.gameState) {
      window.gameState.stage = 3;
    }

    // Place the player at catwalk start if available
    // Optional snap to spawn if player reference provided to constructor
    if (this.player && this.player.position) {
      this.player.position.copy(this.group.localToWorld(this.spawn.clone()));
    }

    // Door close SFX placeholder (TODO: integrate audio helper)
    AI.onCoreChamberEntry();
  }

  exit() {}

  update(delta) {
    // Alarm light pulse after override success
    if (this._alarm.on) {
      this._alarm.t += delta;
      const s = 0.5 + 0.5 * Math.sin(this._alarm.t * 6.0);
      if (this.coreSpot) {
        this.coreSpot.color.setHex(0xff3333);
        this.coreSpot.intensity = 2.2 + s * 0.6;
      }
      // Also tint core material
      const core = this.centerPlatform.getObjectByName('core-sphere');
      if (core && core.material) {
        core.material.emissive.setHex(0xaa1111);
        core.material.color.setHex(0xff5555);
        core.material.emissiveIntensity = 1.4 + s * 0.6;
      }
    }

    // Subsystems
    const tfOn = !!gameStore.isTruthFilterOn;
    if (this.bridge) this.bridge.update(delta, tfOn, this.player);
    if (this.override) this.override.update(delta, tfOn);
    if (this.choices) this.choices.update(delta);

    // Flag wiring
    if (!gameStore.flags.room3.bridgeSolved && this.bridge?.isSolved?.()) {
      gameStore.setRoom3Flag('bridgeSolved', true);
      AI.onBridgePuzzleDefiance(); // reflective bark as player succeeded without following orders
    }

    // Unlock choices after override
    if (!gameStore.flags.room3.overrideSolved && this.override?.isSolved?.()) {
      gameStore.setRoom3Flag('overrideSolved', true);
      gameStore.setRoom3Flag('coreUnlocked', true);
      this._enableAlarmState();
      AI.onSystemOverrideSuccess();
    }
  }

  _enableAlarmState() {
    this._alarm.on = true;
    try { room3Audio.staticBurst(); } catch {}
    try { this._alarmAudio = room3Audio.alarm(); } catch {}
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
      // Bridge handles a clean reset when present
      if (this.bridge && this.bridge.handleFallReset) {
        this.bridge.handleFallReset(player);
      } else {
        // fallback: snap to spawn
        player.position.copy(this.group.localToWorld(this.spawn.clone()));
      }
    }

    const newWorld = this.group.localToWorld(local);
    player.position.copy(newWorld);
  }

  handleEKeyInteraction(player) {
    if (!player) return false;
    // Interact with main terminal if nearby
    if (this.override?.mainTerminal) {
      const termWorld = this.override.mainTerminal.getWorldPosition(new THREE.Vector3());
      const dist = termWorld.distanceTo(player.position);
      if (dist < 2.0 && !gameStore.flags.room3.overrideSolved) {
        this.override.openUI();
        return true;
      }
    }
    // Interact with final choice consoles if unlocked
    if (gameStore.flags.room3.coreUnlocked && this.choices?.group) {
      const local = this.choices.group.worldToLocal(player.position.clone());
      // In front of consoles and within X span
      const near = Math.abs(local.z - 1.0) < 1.2 && Math.abs(local.x) < 3.5;
      if (near) {
        // Left or right
        const type = local.x < 0 ? 'purge' : 'reboot';
        AI.onFinalChoice();
        this.choices.handleChoice(type);
        return true;
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
export function createRoom3(ctx = {}) {
  const r = new Room3(ctx);
  return r;
}
