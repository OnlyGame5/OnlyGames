// src/rooms/Room3/BridgeOfLies.js

import * as THREE from 'three';
import { gameStore } from '../../state/gameStore.js';
import { room3Audio } from '../../audio/room3Audio.js';

export class BridgeOfLies {
  constructor(config = {}) {
    const {
      rows = 3, cols = 5, patternSeed = 713,
      respawnPosition = new THREE.Vector3(), stepSfx = { ok: 'chime1', fail: 'buzz1' }
    } = config;
    this.rows = rows; this.cols = cols; this.patternSeed = patternSeed;
    this.respawnPosition = respawnPosition.clone();
    this.stepSfx = stepSfx;
    this.group = new THREE.Group();
    this.group.name = 'r3-bridge-of-lies';

    this._panelSize = new THREE.Vector2(1.4, 1.4);
    this._gap = 0.2;
    this._safeMap = this._generatePattern(rows, cols, patternSeed);
    this._panelStates = new Array(rows * cols).fill('idle'); // idle|stepped|failed|gone
    this._solved = false;

    this._buildInstancedPanels();
  }

  _rng(seed) { return () => (seed = (seed * 9301 + 49297) % 233280) / 233280; }

  _generatePattern(r, c, seed) {
    // Deterministic: choose a single safe path that snakes across columns
    const rand = this._rng(seed);
    const map = new Array(r * c).fill(false);
    let row = Math.floor(rand() * r);
    for (let x = 0; x < c; x++) {
      const idx = row * c + x; map[idx] = true;
      // drift up/down occasionally
      if (rand() < 0.5) row += rand() < 0.5 ? -1 : 1;
      row = Math.max(0, Math.min(r - 1, row));
    }
    return map;
  }

  _buildInstancedPanels() {
    const total = this.rows * this.cols;
  const geo = new THREE.BoxGeometry(this._panelSize.x, 0.08, this._panelSize.y);
  const mat = new THREE.MeshStandardMaterial({ color: 0x88aadd, transparent: true, opacity: 0.85, emissive: 0x224466, emissiveIntensity: 0.2 });
    const inst = new THREE.InstancedMesh(geo, mat, total);
    inst.castShadow = false; inst.receiveShadow = true;

    const startZ = -((this.cols - 1) * (this._panelSize.y + this._gap)) / 2;
    const startX = -((this.rows - 1) * (this._panelSize.x + this._gap)) / 2;
    const m = new THREE.Matrix4();
    const color = new THREE.Color(0x88aadd); // neutral; TF will reveal states
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = r * this.cols + c;
        const x = startX + r * (this._panelSize.x + this._gap);
        const z = startZ + c * (this._panelSize.y + this._gap);
        m.makeTranslation(x, 0.04, z);
        inst.setMatrixAt(i, m);
        inst.setColorAt(i, color);
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    this.inst = inst;
    this.group.add(inst);

    // Cache grid dimensions for fall detection and positioning queries
    this._width = this.rows * this._panelSize.x + (this.rows - 1) * this._gap;
    this._depth = this.cols * this._panelSize.y + (this.cols - 1) * this._gap;
  }

  mount(parentGroup) { parentGroup.add(this.group); }
  unmount() { if (this.group.parent) this.group.parent.remove(this.group); }

  update(delta, isTruthFilterOn, player) {
    // Visual: truth filter aura via per-instance color and emissive tweak
    if (this.inst && this.inst.material) {
      const mat = this.inst.material;
      mat.emissiveIntensity = isTruthFilterOn ? 0.7 : 0.2;
      mat.opacity = isTruthFilterOn ? 0.95 : 0.85;
      if (isTruthFilterOn !== this._lastTFState) {
        this._lastTFState = isTruthFilterOn;
        const color = new THREE.Color();
        for (let i = 0; i < this.rows * this.cols; i++) {
          color.setHex(isTruthFilterOn ? (this._safeMap[i] ? 0x22ff66 : 0xff3344) : 0x88aadd);
          this.inst.setColorAt(i, color);
        }
        this.inst.instanceColor.needsUpdate = true;
      }
    }

    if (!player) return;
    // Determine which panel under player feet (project player's local to bridge local)
    const world = player.position.clone();
    const local = this.group.worldToLocal(world);

    const width = this._width; const depth = this._depth;
    const insideRect = !(local.x < -width / 2 || local.x > width / 2 || local.z < -depth / 2 || local.z > depth / 2);
    const withinPitCorridor = (Math.abs(local.z) <= depth / 2 + 0.6) && (Math.abs(local.x) <= width / 2 + 0.6);

    if (!insideRect) {
      // If within pit corridor but not above a panel, treat as fall
      if (withinPitCorridor) {
        this._doFail(player);
      }
      return;
    }

    // Compute indices
    const relX = local.x + width / 2;
    const relZ = local.z + depth / 2;
    const cellX = Math.floor(relX / (this._panelSize.x + this._gap));
    const cellZ = Math.floor(relZ / (this._panelSize.y + this._gap));
    const idx = cellX * this.cols + cellZ;
    if (idx < 0 || idx >= this._panelStates.length) return;

    // Debounce repeated stepping
    if (this._lastIdx === idx) return;
    this._lastIdx = idx;

    const isSafe = !!this._safeMap[idx];
    if (!isSafe) {
      this._doFail(player, idx);
      return;
    } else {
      // Safe step
      if (this.inst) {
        const c = new THREE.Color(0xa7ffd0);
        this.inst.setColorAt(idx, c);
        this.inst.instanceColor.needsUpdate = true;
      }
      // SFX
      try { room3Audio.chime(); } catch {}
      // If reached last column, puzzle solved
      const col = idx % this.cols;
      if (col === this.cols - 1) {
        this._solved = true;
      }
    }
  }

  isSolved() { return this._solved; }

  handleFallReset(player) {
    if (player && player.position) {
      const worldRespawn = this.group.parent ? this.group.parent.localToWorld(this.respawnPosition.clone()) : this.respawnPosition.clone();
      player.position.copy(worldRespawn);
    }
    // Restore all colors
    if (this.inst) {
      const color = new THREE.Color(0x88aadd);
      for (let i = 0; i < this.rows * this.cols; i++) {
        this.inst.setColorAt(i, color);
      }
      this.inst.instanceColor.needsUpdate = true;
    }
  }

  _doFail(player, idx = -1) {
    if (this.inst && idx >= 0) {
      const c = new THREE.Color(0x222222);
      this.inst.setColorAt(idx, c);
      this.inst.instanceColor.needsUpdate = true;
    }
    try { room3Audio.buzz(); } catch {}
    // Reset player
    if (player && player.position) {
      const worldRespawn = this.group.parent ? this.group.parent.localToWorld(this.respawnPosition.clone()) : this.respawnPosition.clone();
      player.position.copy(worldRespawn);
    }
    this._panelStates.fill('idle');
  }

  getDimensions() { return { width: this._width, depth: this._depth }; }
}
