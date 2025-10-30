import * as THREE from 'three';

/**
 * HologramDisplay - cone-shaped hologram with animated binary particles
 * and letter reveal flashes. Designed to sit above the decoder table.
 */
export class HologramDisplay {
  constructor({ position = new THREE.Vector3(0, 0.9, -8.6) } = {}) {
    this.group = new THREE.Group();
    this.group.name = 'room4-hologram-display';
    this.group.position.copy(position);

    this.animationTime = 0;
    this.revealed = { N: false, E: false, X: false, U: false, S: false };

    // Layout constants (tweakable)
    this.baseOffset = 0.2; // raise cone base slightly above the table
    this.height = 1.8;     // decrease height
    this.radiusTop = 1.6;  // widen top to fit all slots comfortably

    this._buildCone();
    this._buildParticles();
    this._buildLetterSprite();
    this._buildSlots();
  }

  _buildCone() {
    // Inverted cone: point emerges from table (y=baseOffset), wide top at y=baseOffset+height
    const height = this.height;
    const radiusTop = this.radiusTop;      // wide top
    const radiusBottom = 0.0;              // point at the bottom (table)
    const radialSeg = 48;
    const heightSeg = 1;
    const coneGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSeg, heightSeg, true);
    // CylinderGeometry is centered; move bottom to y=baseOffset (apex) and top to y=baseOffset+height
    coneGeo.translate(0, this.baseOffset + height / 2, 0);

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x00ffc8,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      wireframe: false,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.name = 'holo-cone';
    this.group.add(cone);
    this.cone = cone;
  }

  _buildParticles() {
    // Floating binary points inside the cone volume
    const count = 600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color(0x00ff88);

    const height = this.height;
    const radiusTop = this.radiusTop;

    for (let i = 0; i < count; i++) {
      const h = Math.random() * height; // 0..height
      const r = (h / height) * radiusTop * Math.random(); // shrink to the apex
      const a = Math.random() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = this.baseOffset + h;
      const idx = i * 3;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.02,
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    points.name = 'holo-particles';
    this.group.add(points);
    this.particles = points;
  }

  _buildLetterSprite() {
    // Canvas-based sprite to show the most recent revealed letter
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;

    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.0, // hidden until reveal
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.8, 0.8, 1); // reasonable size inside cone
    sprite.position.set(0, this.baseOffset + this.height * 0.65, 0);
    this.group.add(sprite);

    this.letterCanvas = canvas;
    this.letterCtx = ctx;
    this.letterTexture = tex;
    this.letterSprite = sprite;
    this.letterFade = 0;
  }

  _buildSlots() {
    // Five holographic slots positioned near the cone's top rim
    this.letterOrder = ['N', 'E', 'X', 'U', 'S'];
    const makeTexture = (ch) => {
      const s = 128;
      const c = document.createElement('canvas');
      c.width = s; c.height = s;
      const x = c.getContext('2d');
      // rounded rect background
      x.fillStyle = 'rgba(0, 255, 136, 0.10)';
      x.strokeStyle = 'rgba(0, 255, 136, 0.65)';
      x.lineWidth = 6;
      x.beginPath();
      const r = 16; x.moveTo(r,0); x.arcTo(s,0,s,s,r); x.arcTo(s,s,0,s,r); x.arcTo(0,s,0,0,r); x.arcTo(0,0,s,0,r); x.closePath();
      x.fill(); x.stroke();
      // glyph
      x.fillStyle = ch === '?' ? 'rgba(255,255,255,0.9)' : '#ffffcc';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = 'bold 80px monospace';
      x.fillText(ch, s/2, s/2);
      const t = new THREE.CanvasTexture(c);
      t.needsUpdate = true;
      return t;
    };

    this.slotSprites = [];
    const spacing = 0.55;
    const y = this.baseOffset + this.height - 0.15; // near top of cone
    const startX = -spacing * 2;
    this.letterOrder.forEach((ch, i) => {
      const tex = makeTexture('?');
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(0.45, 0.45, 1);
      sp.position.set(startX + i * spacing, y, 0);
      this.group.add(sp);
      this.slotSprites.push({ sprite: sp, makeTexture });
    });
  }

  mount(parent) { parent.add(this.group); }
  unmount() { if (this.group.parent) this.group.parent.remove(this.group); }

  onRevealLetter(letter) {
    // Draw bright letter with glow on the canvas and fade it out slowly
    const ctx = this.letterCtx;
    const size = this.letterCanvas.width;
    ctx.clearRect(0, 0, size, size);

    // glow background
    ctx.fillStyle = 'rgba(0,255,136,0.15)';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size*0.45, 0, Math.PI*2);
    ctx.fill();

    // main letter
    ctx.fillStyle = '#ffffcc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 160px monospace';
    ctx.fillText(letter, size/2, size/2);

    this.letterTexture.needsUpdate = true;
    this.letterFade = 1.0; // start fully visible
    this.letterSprite.material.opacity = 1.0;

    // Update appropriate slot sprite texture
    if (this.slotSprites && this.letterOrder) {
      const idx = this.letterOrder.indexOf(letter);
      if (idx !== -1) {
        const entry = this.slotSprites[idx];
        const newTex = entry.makeTexture(letter);
        if (entry.sprite.material.map) entry.sprite.material.map.dispose();
        entry.sprite.material.map = newTex;
        entry.sprite.material.needsUpdate = true;
      }
    }

    // radial burst ring
    if (!this.burst) {
      const ringGeo = new THREE.RingGeometry(0.05, 0.06, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 1.2, 0);
      this.group.add(ring);
      this.burst = ring;
      this.burstAge = 0;
    } else {
      this.burst.scale.set(1,1,1);
      this.burst.material.opacity = 0.9;
      this.burstAge = 0;
    }
  }

  update(delta) {
    this.animationTime += delta;

    // Pulse cone opacity
    if (this.cone && this.cone.material) {
      this.cone.material.opacity = 0.12 + 0.06 * (0.5 + 0.5 * Math.sin(this.animationTime * 2.0));
    }

    // Scroll particles slightly upwards and rotate
    if (this.particles) {
      this.particles.rotation.y += delta * 0.3;
      const pos = this.particles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + delta * 0.25; // upward drift
        if (y > this.baseOffset + this.height) y = this.baseOffset; // loop to base
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // Fade letter sprite
    if (this.letterSprite) {
      if (this.letterFade > 0) {
        this.letterFade -= delta * 0.35; // fade speed
        if (this.letterFade < 0) this.letterFade = 0;
        this.letterSprite.material.opacity = this.letterFade;
      }
    }

    // Animate burst ring (expand and fade)
    if (this.burst) {
      this.burstAge += delta;
      const s = 1 + this.burstAge * 6.0;
      this.burst.scale.set(s, s, s);
      this.burst.material.opacity = Math.max(0, 0.9 - this.burstAge * 1.8);
      if (this.burst.material.opacity <= 0) {
        this.group.remove(this.burst);
        this.burst.geometry.dispose();
        this.burst.material.dispose();
        this.burst = null;
      }
    }
  }
}


