// src/rooms/Room3/FinalChoiceConsoles.js

import * as THREE from 'three';
import { gameStore } from '../../state/gameStore.js';
import { AI } from '../../ai.js';

export class FinalChoiceConsoles {
  constructor({ onChoice } = {}) {
    this.group = new THREE.Group();
    this.group.name = 'r3-final-choice';
    this.onChoice = onChoice;
    this._active = false;
    this._madeChoice = false;
    this._buildConsoles();
  }

  _buildConsoles() {
    const mk = (label, x) => {
      const mat = new THREE.MeshStandardMaterial({ color: 0x22272e, metalness: 0.7, roughness: 0.35, emissive: 0x11131a, emissiveIntensity: 0.25 });
      const consoleMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.3), mat);
      consoleMesh.position.set(x, 0.6, 1.0);
      consoleMesh.lookAt(0, 0.6, 0);
      consoleMesh.userData.label = label;
      // Label sprite
      const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF'; ctx.font = '24px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, 128, 32);
      const tex = new THREE.CanvasTexture(canvas);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.9 }));
      s.scale.set(1.8, 0.45, 1); s.position.set(0, 0.55, -0.2);
      consoleMesh.add(s);
      return consoleMesh;
    };
    this.left = mk('PURGE CORE', -2.0);
    this.right = mk('REBOOT PROTOCOL', 2.0);
    this.group.add(this.left, this.right);
  }

  mount(parentGroup) { parentGroup.add(this.group); }
  unmount() { if (this.group.parent) this.group.parent.remove(this.group); }

  update(delta) {
    // Become active once coreUnlocked
    this._active = !!(gameStore.flags?.room3?.coreUnlocked);
    const glow = this._active ? 0.7 : 0.1;
    [this.left, this.right].forEach(m => { if (m?.material) m.material.emissiveIntensity = glow; });
  }

  canInteract(player) {
    if (!this._active || this._madeChoice || !player) return false;
    // Within radius in front of consoles
    const p = player.position.clone();
    const local = this.group.worldToLocal(p);
    return Math.abs(local.z - 1.0) < 1.2 && Math.abs(local.x) < 3.5;
  }

  handleChoice(type) {
    if (!this._active || this._madeChoice) return;
    this._madeChoice = true;
    gameStore.setRoom3Flag('finalChoice', type);
    if (type === 'purge') {
      AI.onEnding('PURGE_CORE');
      // TODO: open exit door + trigger credits overlay
    } else {
      AI.onEnding('REBOOT_PROTOCOL');
      // TODO: lock exit + fade to black + credits
    }
    if (typeof this.onChoice === 'function') this.onChoice(type);
  }
}
