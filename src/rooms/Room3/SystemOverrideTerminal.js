import * as THREE from 'three';
import { gameStore } from '../../state/gameStore.js';
import { AI } from '../../ai.js';

const CORRECT_SEQUENCE = ["DON'T TRUST IT", 'IT LIES', 'SUBJECT FAILED'];

export class SystemOverrideTerminal {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'r3-system-override';
    this._phrases = [
      "DON'T TRUST IT", 'IT LIES', 'SUBJECT FAILED',
      'POWER DIVERTED', 'ACCESS DENIED', 'RETRY', 'SUBJECT GAMMA'
    ];
    this._selected = [];
    this._solved = false;

    this._buildTerminals();
    this._buildGhostText();
  }

  mount(parentGroup) { parentGroup.add(this.group); }
  unmount() { if (this.group.parent) this.group.parent.remove(this.group); }

  _buildTerminals() {
    const ringR = 2.6;
    const termMat = new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.6, roughness: 0.4, emissive: 0x334455, emissiveIntensity: 0.2 });
    for (let i = 0; i < 3; i++) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.2), termMat.clone());
      const ang = (i / 3) * Math.PI * 2;
      t.position.set(Math.cos(ang) * ringR, 0.6, Math.sin(ang) * ringR);
      t.lookAt(0, 0.6, 0);
      t.userData.type = 'terminal';
      this.group.add(t);
    }

    // Main terminal in front
    const main = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.25), new THREE.MeshStandardMaterial({ color: 0x88aadd, emissive: 0x224466, emissiveIntensity: 0.8, metalness: 0.2, roughness: 0.6 }));
    main.position.set(0, 0.7, 2.2);
    main.lookAt(0, 0.7, 0);
    main.userData.type = 'main-terminal';
    this.group.add(main);
    this.mainTerminal = main;
  }

  _buildGhostText() {
    // Simple sprites with text using canvas textures; orbiting slowly
    const makeSprite = (text) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '28px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 32);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.25 });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(1.6, 0.4, 1);
      sp.userData.phrase = text;
      return sp;
    };

    this.sprites = this._phrases.map(makeSprite);
    this.sprites.forEach((sp, i) => {
      const ang = (i / this.sprites.length) * Math.PI * 2;
      sp.position.set(Math.cos(ang) * 2.8, 1.6 + 0.2 * Math.sin(i), Math.sin(ang) * 2.8);
      this.group.add(sp);
    });
  }

  update(delta, isTruthFilterOn) {
    // Orbit sprites and adjust opacity depending on TF
    const t = (this._t = (this._t || 0) + delta);
    this.sprites?.forEach((sp, i) => {
      const r = 2.8;
      const ang = (i / this.sprites.length) * Math.PI * 2 + t * 0.2;
      sp.position.x = Math.cos(ang) * r;
      sp.position.z = Math.sin(ang) * r;
      if (sp.material) {
        sp.material.opacity = isTruthFilterOn ? 0.9 : 0.25;
      }
    });
  }

  openUI() {
    // Minimal text-based prompt via AI box and selections via prompt() for placeholder
    // TODO: Replace with proper overlay UI that locks cursor, following existing pattern
    if (this._solved) return;
    AI.onSystemOverrideInitial();
    const pick = (label) => window.prompt(`${label} Choose phrase 1/3 (type exactly):\n${this._phrases.join(' | ')}`);
    const a = pick('Override'); if (!a) return this._failFeedback();
    const b = window.prompt(`Choose phrase 2/3:`); if (!b) return this._failFeedback();
    const c = window.prompt(`Choose phrase 3/3:`); if (!c) return this._failFeedback();
    this._selected = [a, b, c];
    if (this._isCorrect()) {
      this._solved = true;
      // Alarm flip handled by room; set flags now
      gameStore.setRoom3Flag('overrideSolved', true);
      gameStore.setRoom3Flag('coreUnlocked', true);
      AI.onSystemOverrideSuccess();
    } else {
      AI.say("Access denied. Sequence incorrect.", { effect: 'glitch', tone: 'error' });
      this._failFeedback();
    }
  }

  _isCorrect() {
    return (
      this._selected.length === 3 &&
      this._selected[0] === CORRECT_SEQUENCE[0] &&
      this._selected[1] === CORRECT_SEQUENCE[1] &&
      this._selected[2] === CORRECT_SEQUENCE[2]
    );
  }

  _failFeedback() {
    AI.say('Try again. You do not understand this system.', { tone: 'cold' });
  }

  isSolved() { return this._solved; }
}
