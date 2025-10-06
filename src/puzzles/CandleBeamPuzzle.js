// src/puzzles/CandleBeamPuzzle.js
// Candle + Mirrors beam alignment puzzle
// Place a candle on a stand to emit a beam. Rotate mirrors to hit the target glyph and unlock a case.

import * as THREE from 'three';
import { addToInventory, getPlayerInventory, removeFromInventory } from '../player.js';

function el(tag, opts = {}, children = []) {
  const e = document.createElement(tag);
  if (opts.className) e.className = opts.className;
  if (opts.id) e.id = opts.id;
  if (opts.text) e.textContent = opts.text;
  if (opts.html) e.innerHTML = opts.html;
  if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => e.setAttribute(k, v));
  children.forEach((c) => e.appendChild(c));
  return e;
}

function ensureStyles() {
  if (document.getElementById('candlebeam-ui-styles')) return;
  const style = document.createElement('style');
  style.id = 'candlebeam-ui-styles';
  style.textContent = `
    #candleBeamUI.modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 10000; }
    #candleBeamUI.hidden { display: none; }
    #candleBeamUI .panel { background: rgba(18,18,26,0.96); color: #e8ecff; border: 1px solid #2e3358; border-radius: 10px; width: 540px; max-width: 92vw; padding: 16px; box-shadow: 0 10px 24px rgba(0,0,0,0.55); }
    #candleBeamUI h2 { margin: 0 0 10px 0; font-size: 18px; }
    #candleBeamUI .row { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; margin: 8px 0; }
    #candleBeamUI input[type="range"] { width: 100%; }
    #candleBeamUI .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
    #candleBeamUI button { background: #2b2f4a; color: #fff; border: 1px solid #42486a; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
    #candleBeamUI button:hover { background: #384069; }
    #candleBeamUI .hint { margin-top: 8px; min-height: 18px; color: #ffd66b; font-size: 14px; }
  `;
  document.head.appendChild(style);
}

export class CandleBeamPuzzle {
  constructor({ roomGroup, origin = new THREE.Vector3(-4.2, 0.35, 2.2), target = new THREE.Vector3(5.7, 1.1, -1.0), onSolved } = {}) {
    this.roomGroup = roomGroup;
    this.origin = origin.clone();
    this.target = target.clone();
    this.onSolved = onSolved;
    this.ui = null;
    this.attached = false;
    this.solved = false;
    this.eventHandlers = [];

  this.objects = { stand: null, aimer: null, targetGlyph: null, caseFront: null };
  this.yawDeg = 10;   // left/right
  this.pitchDeg = 0;  // up/down
    this.beam = null; // THREE.Line
    this.candlePlaced = false;
    this.caseOpen = 0; // 0..1 animation
  }

  attach() {
    if (this.attached) return;
    this.createStandAndEmitter();
  this.createAimer();
    this.createTargetAndCase();
    this.createBeam();
    ensureStyles();
    this.buildUI();
    this.attached = true;
  }

  detach() {
    if (!this.attached) return;
    this.eventHandlers.forEach(({ target, type, fn }) => target.removeEventListener(type, fn));
    this.eventHandlers = [];
    if (this.ui?.parentNode) this.ui.parentNode.removeChild(this.ui);
    this.ui = null;
    // Cleanup 3D objects is skipped for now (room handles group lifetime)
    this.attached = false;
  }

  // --- 3D scene parts ---
  createStandAndEmitter() {
    const g = new THREE.Group();
    g.name = 'candle-stand';

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.26, 16),
      new THREE.MeshStandardMaterial({ color: 0x444654, metalness: 0.3, roughness: 0.6 })
    );
    base.position.y = 0.13;
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0x656a82, metalness: 0.5, roughness: 0.35 })
    );
    plate.position.y = 0.26;
    const decal = new THREE.Mesh(
      new THREE.CircleGeometry(0.19, 24),
      new THREE.MeshStandardMaterial({ color: 0x24283f, emissive: 0x222844, emissiveIntensity: 0.3 })
    );
    decal.rotation.x = -Math.PI / 2;
    decal.position.y = 0.28;
    g.add(base, plate, decal);

    g.position.copy(this.origin);
    if (this.roomGroup) this.roomGroup.add(g);
    this.objects.stand = g;
  }

  createAimer() {
    // Simple adjustable bracket with a lens ring
    const grp = new THREE.Group();
    grp.name = 'beam-aimer';
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5, 10),
      new THREE.MeshStandardMaterial({ color: 0x4a4a5c, metalness: 0.5, roughness: 0.4 })
    );
    stem.position.y = 0.25;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.02, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0x8aa0c8, metalness: 0.2, roughness: 0.4 })
    );
    ring.position.y = 0.52;
    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 24),
      new THREE.MeshStandardMaterial({ color: 0xaad0ff, opacity: 0.35, transparent: true, roughness: 0.9, metalness: 0.05 })
    );
    lens.position.set(0, 0.52, 0);
    lens.rotation.x = -Math.PI / 2;
    grp.add(stem, ring, lens);
    grp.position.copy(this.origin.clone().add(new THREE.Vector3(0.9, 0, 0))); // slightly ahead of stand
    if (this.roomGroup) this.roomGroup.add(grp);
    this.objects.aimer = grp;
  }

  createTargetAndCase() {
    // Target glyph on east wall (x ~ +6)
    const glyph = new THREE.Mesh(
      new THREE.CircleGeometry(0.35, 32),
      new THREE.MeshStandardMaterial({ color: 0x224466, emissive: 0x2d8cff, emissiveIntensity: 0.0 })
    );
    glyph.position.copy(this.target);
    glyph.rotation.y = -Math.PI / 2; // face west (-x)
    glyph.name = 'beam-target-glyph';
    if (this.roomGroup) this.roomGroup.add(glyph);
    this.objects.targetGlyph = glyph;

    // A small wall-mounted case near the target that opens when solved
    const caseGrp = new THREE.Group();
    caseGrp.name = 'beam-case';
    caseGrp.position.copy(this.target).add(new THREE.Vector3(-0.6, -0.2, 0));
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.4, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x303344, metalness: 0.2, roughness: 0.8 })
    );
    box.position.set(0, 0.2, 0);
    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x1e2238, metalness: 0.1, roughness: 0.9 })
    );
    front.position.set(0, 0.2, 0.155);
    front.name = 'beam-case-front';
    caseGrp.add(box, front);
    if (this.roomGroup) this.roomGroup.add(caseGrp);
    this.objects.caseFront = front;
  }

  createBeam() {
    const geom = new THREE.BufferGeometry().setFromPoints([
      this.origin.clone(),
      this.origin.clone().add(new THREE.Vector3(1, 0, 0))
    ]);
    const mat = new THREE.LineBasicMaterial({ color: 0xffe066, linewidth: 2, transparent: true, opacity: 0.9 });
    const line = new THREE.Line(geom, mat);
    line.name = 'candle-beam';
    if (this.roomGroup) this.roomGroup.add(line);
    this.beam = line;
  }

  // --- UI ---
  buildUI() {
    const panel = el('div', { className: 'panel' }, [
  el('h2', { text: 'Beam Aimer' }),
  el('div', { className: 'row' }, [ el('label', { text: 'Yaw' }), this.makeYawSlider() ]),
  el('div', { className: 'row' }, [ el('label', { text: 'Pitch' }), this.makePitchSlider() ]),
      el('div', { className: 'row' }, [
        el('label', { text: 'Candle' }),
        el('button', { id: 'btnPlaceCandle', text: 'Place Candle' })
      ]),
      el('div', { className: 'actions' }, [
        el('button', { id: 'btnClose', text: 'Close' })
      ]),
  el('div', { className: 'hint', id: 'beamHint', text: 'Place the candle, then aim the beam into the glowing glyph.' })
    ]);
    const modal = el('div', { id: 'candleBeamUI', className: 'modal hidden' }, [panel]);
    document.body.appendChild(modal);
    this.ui = modal;

  const btnPlace = this.ui.querySelector('#btnPlaceCandle');
  const btnClose = this.ui.querySelector('#btnClose');
    const register = (target, type, fn) => { target.addEventListener(type, fn); this.eventHandlers.push({ target, type, fn }); };
    register(btnPlace, 'click', () => {
      this.placeCandleFromInventory();
      this.refreshUIState();
    });
    register(btnClose, 'click', () => this.close());

    this.refreshUIState();
  }

  makeYawSlider() {
    const wrap = el('div');
    const r = el('input', { attrs: { type: 'range', min: '-80', max: '80', step: '1', value: String(this.yawDeg) } });
    const val = el('span', { text: `${this.yawDeg}°` });
    r.addEventListener('input', () => { this.yawDeg = parseFloat(r.value); val.textContent = `${r.value}°`; });
    wrap.appendChild(r); wrap.appendChild(val); return wrap;
  }

  makePitchSlider() {
    const wrap = el('div');
    const r = el('input', { attrs: { type: 'range', min: '-30', max: '30', step: '1', value: String(this.pitchDeg) } });
    const val = el('span', { text: `${this.pitchDeg}°` });
    r.addEventListener('input', () => { this.pitchDeg = parseFloat(r.value); val.textContent = `${r.value}°`; });
    wrap.appendChild(r); wrap.appendChild(val); return wrap;
  }

  refreshUIState() {
    const btnPlace = this.ui?.querySelector('#btnPlaceCandle');
    if (btnPlace) {
      btnPlace.disabled = !!this.candlePlaced;
      btnPlace.textContent = this.candlePlaced ? 'Candle Placed' : 'Place Candle';
    }
  }

  open() {
    if (!this.ui) this.buildUI();
    this.refreshUIState();
    this.ui.classList.remove('hidden');
    window.disablePlayerControls = true;
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
    if (document.pointerLockElement) document.exitPointerLock();
    document.body.style.cursor = 'default';
  }

  close() {
    if (!this.ui) return;
    this.ui.classList.add('hidden');
    window.disablePlayerControls = false;
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = '';
  }

  setHint(msg) {
    const hint = this.ui?.querySelector('#beamHint');
    if (hint) hint.textContent = msg || '';
  }

  // --- Gameplay actions ---
  tryOpenUI(player) {
    if (!player) return false;
    const stand = this.objects.stand;
    if (!stand) return false;
    const world = new THREE.Vector3();
    stand.getWorldPosition(world);
    if (player.position.distanceTo(world) <= 1.8) {
      this.open();
      return true;
    }
    // Also allow near the aimer bracket
    if (this.objects.aimer) {
      this.objects.aimer.getWorldPosition(world);
      if (player.position.distanceTo(world) <= 1.8) { this.open(); return true; }
    }
    return false;
  }

  placeCandleFromInventory() {
    if (this.candlePlaced) return true;
    const inv = getPlayerInventory();
    const has = inv.slots.some((it) => it && it.name === 'candle');
    if (!has) {
      if (window.AI) window.AI.say('I need a candle to power this lens.');
      this.setHint('You need a candle in your inventory.');
      return false;
    }
    // Remove from inventory and add a visible candle on the stand
    removeFromInventory('candle');
    const candle = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0xffcc55, emissive: 0xffaa33, emissiveIntensity: 0.9 }));
    body.position.y = 0.125;
    flame.position.y = 0.25;
    candle.add(body, flame);
    candle.position.copy(this.origin.clone().add(new THREE.Vector3(0, 0.28, 0)));
    candle.name = 'placed-candle';
    if (this.roomGroup) this.roomGroup.add(candle);
    this.candlePlaced = true;
    this.setHint('Candle placed. Adjust the mirrors.');
    return true;
  }

  // --- Beam tracing: single ray with yaw/pitch aiming, no reflections ---
  updateBeam() {
    if (!this.beam) return;

    const points = [];
    let origin = this.origin.clone().add(new THREE.Vector3(0.0, 0.28, 0));
    // Build direction from yaw (Y axis) and pitch (Z axis) starting from +X
    let dir = new THREE.Vector3(1, 0, 0);
    const yaw = THREE.MathUtils.degToRad(this.yawDeg);
    const pitch = THREE.MathUtils.degToRad(this.pitchDeg);
    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    dir.applyQuaternion(qYaw);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), pitch);
    dir.applyQuaternion(qPitch);
    dir.normalize();

    const addPoint = (p) => points.push(p.clone());
    addPoint(origin);
    let hitTarget = false;
    const targetNormal = new THREE.Vector3(-1, 0, 0); // glyph faces -X
    const targetPos = this.objects.targetGlyph?.getWorldPosition(new THREE.Vector3()) || this.target.clone();
    const denom = targetNormal.dot(dir);
    if (Math.abs(denom) > 1e-4) {
      const tHit = targetNormal.dot(targetPos.clone().sub(origin)) / denom;
      if (tHit > 0) {
        const pHit = origin.clone().add(dir.clone().multiplyScalar(tHit));
        addPoint(pHit);
        hitTarget = pHit.distanceTo(targetPos) <= 0.28;
      } else {
        addPoint(origin.clone().add(dir.clone().multiplyScalar(6)));
      }
    } else {
      addPoint(origin.clone().add(dir.clone().multiplyScalar(6)));
    }

    // Update beam geometry
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    this.beam.geometry.dispose();
    this.beam.geometry = geom;

    // Visual feedback on glyph
    if (this.objects.targetGlyph) {
      this.objects.targetGlyph.material.emissiveIntensity = hitTarget ? 1.2 : 0.0;
      this.objects.targetGlyph.material.needsUpdate = true;
    }

    if (hitTarget && !this.solved) {
      this.solved = true;
      if (window.AI) window.AI.say('The beam ignites the glyph, and the case unlocks.');
      try { if (this.onSolved) this.onSolved(); } catch (e) { console.warn('[CandleBeamPuzzle] onSolved error:', e); }
    }
  }

  update(dt) {
    // Open case animation once solved
    if (this.solved && this.objects.caseFront) {
      this.caseOpen = Math.min(1, this.caseOpen + dt * 0.6);
      // Slide the front panel up as it opens
      this.objects.caseFront.position.y = 0.2 + this.caseOpen * 0.5;
      this.objects.caseFront.material.opacity = 1 - this.caseOpen;
      this.objects.caseFront.material.transparent = true;
      this.objects.caseFront.material.needsUpdate = true;
    }

    // Only draw bright beam if candle is placed
    if (this.candlePlaced) {
      this.beam.visible = true;
      this.updateBeam();
    } else {
      if (this.beam) this.beam.visible = false;
    }
  }
}
