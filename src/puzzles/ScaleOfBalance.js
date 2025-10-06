// src/puzzles/ScaleOfBalance.js
// Controller for the Scale of Balance puzzle (Room 2)
// UI is vanilla DOM with simple drag-and-drop; blocks player controls while open.

import * as THREE from 'three';
import { getPlayerInventory, getInventorySnapshot, addToInventory, removeFromInventory } from '../player.js';

const ITEM_WEIGHTS = {
  book: 3,
  liberty: 5,
  bowling_ball: 12,
  bowling_pin: 4,
  'stage0-key': 1
};

// Only these four belong on the pans; key is not used for this puzzle
const PAN_ITEM_IDS = ['book', 'liberty', 'bowling_ball', 'bowling_pin'];
const REQUIRED_IDS = PAN_ITEM_IDS;

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
  if (document.getElementById('scale-ui-styles')) return;
  const style = document.createElement('style');
  style.id = 'scale-ui-styles';
  style.textContent = `
    #scaleUI.modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 10000; }
    #scaleUI.hidden { display: none; }
    #scaleUI .panel { background: rgba(20,20,28,0.95); color: #e8e8f0; border: 1px solid #333; border-radius: 8px; width: 720px; max-width: 90vw; padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    #scaleUI h2 { margin: 0 0 8px 0; font-size: 20px; }
    #scaleUI .pans { display: flex; gap: 16px; }
    #scaleUI .pan { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid #444; border-radius: 6px; padding: 8px; }
    #scaleUI .pan h3 { margin: 0 0 6px 0; font-size: 16px; }
    #scaleUI .slots { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; min-height: 60px; }
    #scaleUI .slot { height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.06); border: 1px dashed #555; border-radius: 4px; }
    #scaleUI .inventory { margin-top: 10px; background: rgba(255,255,255,0.04); border: 1px solid #444; border-radius: 6px; padding: 8px; }
    #scaleUI .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
    #scaleUI button { background: #2b2f4a; color: #fff; border: 1px solid #42486a; border-radius: 4px; padding: 6px 10px; cursor: pointer; }
    #scaleUI button:hover { background: #384069; }
    #scaleUI .item { user-select: none; cursor: grab; padding: 4px 6px; border-radius: 4px; background: #1f2236; border: 1px solid #3b4061; display: inline-flex; gap: 6px; align-items: center; }
    #scaleUI .item[data-invalid="true"] { filter: grayscale(1); opacity: 0.6; }
    #scaleUI .sum { margin-top: 6px; font-size: 14px; color: #9fb3ff; }
    #scaleUI .hint { margin-top: 8px; min-height: 18px; color: #ffd66b; font-size: 14px; }
  `;
  document.head.appendChild(style);
}

function getIconFor(id) {
  switch (id) {
    case 'book': return '📖';
    case 'liberty': return '🗽';
    case 'bowling_ball': return '🎳';
    case 'bowling_pin': return '📍';
    case 'stage0-key': return '🗝️';
    default: return '📦';
  }
}

export class ScaleOfBalance {
  constructor({ scene, roomGroup, scaleObject3D, onSolved } = {}) {
    this.scene = scene;
    this.roomGroup = roomGroup;
    this.scale = scaleObject3D;
    this.onSolved = onSolved;
    this.ui = null;
    this.attached = false;
    this.solved = false;
    this.rotationTarget = 0; // radians, tilt of scale (positive => right heavier)
    this.openCompartment = false;
    this.panState = { left: [], right: [] }; // arrays of item ids
    this.eventHandlers = [];
  }

  attach() {
    if (this.attached) return;
    ensureStyles();
    this.buildUI();
    this.attached = true;
  }

  detach() {
    if (!this.attached) return;
    this.eventHandlers.forEach(({ target, type, fn }) => target.removeEventListener(type, fn));
    this.eventHandlers = [];
    if (this.ui && this.ui.parentNode) this.ui.parentNode.removeChild(this.ui);
    this.ui = null;
    this.attached = false;
  }

  isSolved() { return !!this.solved; }

  tryOpenUI(player) {
    if (this.solved) return false;
    if (!this.scale || !player) return false;
    const scaleWorld = new THREE.Vector3();
    this.scale.getWorldPosition(scaleWorld);
    const dist = player.position.distanceTo(scaleWorld);
    if (dist <= 1.6) {
      this.open();
      return true;
    }
    return false;
  }

  open() {
    if (!this.ui) this.buildUI();
    // Refresh inventory view on open
    this.refreshInventoryStrip();
    this.updateSums();
    this.setHint('Place the four objects on the pans and balance them.');
    this.ui.classList.remove('hidden');
    window.disablePlayerControls = true;
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
    // Ensure mouse cursor is visible (exit pointer lock if active)
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    document.body.style.cursor = 'default';
  }

  close() {
    if (!this.ui) return;
    this.ui.classList.add('hidden');
    window.disablePlayerControls = false;
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = '';
    // Do not auto-return items; they remain stored on the scale until dragged back
    this.refreshInventoryStrip();
    this.updateSums();
  }

  update(dt) {
    // Smoothly lerp scale rotation toward target
    if (this.scale) {
      const current = this.scale.rotation.z;
      const t = Math.min(1, dt * 5);
      this.scale.rotation.z = current + (this.rotationTarget - current) * t;
    }
    // Open compartment animation if flagged
    if (this.openCompartment && this.roomGroup) {
      const comp = this.roomGroup.getObjectByName('scale-secret-compartment');
      if (comp) {
        comp.position.y = Math.min(comp.position.y + dt * 0.25, comp.userData.openY || 0.25);
      }
    }
  }

  setHint(msg) {
    const hint = this.ui?.querySelector('#scaleHint');
    if (hint) hint.textContent = msg || '';
  }

  updateSums() {
    const sumLeft = this.panState.left.reduce((a, id) => a + (ITEM_WEIGHTS[id] || 0), 0);
    const sumRight = this.panState.right.reduce((a, id) => a + (ITEM_WEIGHTS[id] || 0), 0);
    const leftEl = this.ui?.querySelector('#leftSum');
    const rightEl = this.ui?.querySelector('#rightSum');
    if (leftEl) leftEl.textContent = String(sumLeft);
    if (rightEl) rightEl.textContent = String(sumRight);
  }

  buildUI() {
    const invSlots = el('div', { className: 'slots', id: 'invSlots' });
    const leftSlots = el('div', { className: 'slots', id: 'leftSlots' });
    const rightSlots = el('div', { className: 'slots', id: 'rightSlots' });

    // Build fixed 5 slots for each pan and inventory strip will flow items
    for (let i = 0; i < 5; i++) leftSlots.appendChild(el('div', { className: 'slot', attrs: { 'data-slot': i } }));
    for (let i = 0; i < 5; i++) rightSlots.appendChild(el('div', { className: 'slot', attrs: { 'data-slot': i } }));

    const panel = el('div', { className: 'panel' }, [
      el('h2', { text: 'Scale of Balance' }),
      el('div', { className: 'pans' }, [
        el('div', { className: 'pan', attrs: { 'data-side': 'left' } }, [
          el('h3', { text: 'Left Pan' }),
          leftSlots,
          el('div', { className: 'sum', id: 'leftSum', text: '0' })
        ]),
        el('div', { className: 'pan', attrs: { 'data-side': 'right' } }, [
          el('h3', { text: 'Right Pan' }),
          rightSlots,
          el('div', { className: 'sum', id: 'rightSum', text: '0' })
        ]),
      ]),
      el('div', { className: 'inventory' }, [
        el('h3', { text: 'Your Inventory' }),
        invSlots
      ]),
      el('div', { className: 'actions' }, [
        el('button', { id: 'btnBalance', text: 'Balance' }),
        el('button', { id: 'btnClear', text: 'Clear' }),
        el('button', { id: 'btnClose', text: 'Close' })
      ]),
      el('div', { className: 'hint', id: 'scaleHint' })
    ]);

    const modal = el('div', { id: 'scaleUI', className: 'modal hidden' }, [panel]);
    document.body.appendChild(modal);
    this.ui = modal;

    // Drag-and-drop handlers
    const onDragStart = (e) => {
      const target = e.target.closest('.item');
      if (!target) return;
      e.dataTransfer.setData('text/plain', target.getAttribute('data-item-id'));
      e.dataTransfer.setData('text/source', target.getAttribute('data-source'));
    };
    const onDragOver = (e) => {
      // Allow dropping on any slot container
      if (e.target.closest('#invSlots') || e.target.closest('#leftSlots') || e.target.closest('#rightSlots')) {
        e.preventDefault();
      }
    };
    const onDrop = (e) => {
      const dropLeft = e.target.closest('#leftSlots');
      const dropRight = e.target.closest('#rightSlots');
      const dropInv = e.target.closest('#invSlots');
      if (!dropLeft && !dropRight && !dropInv) return;
      e.preventDefault();

      const id = e.dataTransfer.getData('text/plain');
      const source = e.dataTransfer.getData('text/source');

      if (!id) return;

      if (dropInv) {
        // Move from pan back to inventory
        if (source === 'left') this.removeFromPan('left', id);
        else if (source === 'right') this.removeFromPan('right', id);
        // Add back to inventory
        addToInventory({ name: id, description: this.prettyName(id) });
        this.refreshInventoryStrip();
        this.updateSums();
        this.setHint('');
        return;
      }

      // Dropping to a pan
      const side = dropLeft ? 'left' : 'right';
      if (!PAN_ITEM_IDS.includes(id)) {
        this.setHint("This item doesn't belong on the scale.");
        return;
      }

      // Can't place same item twice; ensure it exists in inventory and not already placed
      const inv = getInventorySnapshot();
      const hasInInv = inv.some((it) => it && it.name === id);
      const alreadyPlaced = this.panState.left.includes(id) || this.panState.right.includes(id);
      // If dragging from the opposite pan, move it
      // If dragging from the opposite pan, move it
      if (source === 'left' && side === 'right') {
        this.removeFromPan('left', id);
      } else if (source === 'right' && side === 'left') {
        this.removeFromPan('right', id);
      } else if (alreadyPlaced) {
        // If already placed on the same side, do nothing
        this.setHint('');
        return;
      }

      // If coming from inventory: remove from inventory now
      if (source === 'inventory') {
        const removed = removeFromInventory(id);
        if (!removed && !hasInInv) {
          this.setHint('That item is not in your inventory.');
          return;
        }
      }

      this.panState[side].push(id);
      this.refreshInventoryStrip();
      this.renderPanContents();
      this.updateSums();
      this.setHint('');
    };

    // Register handlers and targets
    const register = (target, type, fn) => { target.addEventListener(type, fn); this.eventHandlers.push({ target, type, fn }); };
    register(this.ui, 'dragstart', onDragStart);
    register(this.ui, 'dragover', onDragOver);
    register(this.ui, 'drop', onDrop);

    // Buttons
    const btnBalance = this.ui.querySelector('#btnBalance');
    const btnClear = this.ui.querySelector('#btnClear');
    const btnClose = this.ui.querySelector('#btnClose');
    register(btnBalance, 'click', () => this.onBalance());
    register(btnClear, 'click', () => this.onClear());
    register(btnClose, 'click', () => this.close());

    // Initial content
    this.refreshInventoryStrip();
    this.renderPanContents();
  }

  refreshInventoryStrip() {
    const invContainer = this.ui?.querySelector('#invSlots');
    if (!invContainer) return;
    invContainer.innerHTML = '';
    const inv = getInventorySnapshot();

    // Render only actual inventory contents (items on pans have been removed from inventory)
    inv.forEach((it) => {
      if (!it) return; // empty slot
      const div = el('div', {
        className: 'item',
        attrs: {
          draggable: 'true',
          'data-item-id': it.name,
          'data-source': 'inventory',
          title: it.description || it.name
        }
      });
      div.textContent = `${getIconFor(it.name)} ${it.description || it.name}`;
      invContainer.appendChild(div);
    });
  }

  renderPanContents() {
    const leftSlots = this.ui?.querySelector('#leftSlots');
    const rightSlots = this.ui?.querySelector('#rightSlots');
    if (!leftSlots || !rightSlots) return;

    // Clear slot contents
    Array.from(leftSlots.children).forEach((slot) => (slot.innerHTML = ''));
    Array.from(rightSlots.children).forEach((slot) => (slot.innerHTML = ''));

    const renderSide = (side, container) => {
      this.panState[side].forEach((id, idx) => {
        const slot = container.children[idx];
        if (!slot) return;
        const div = el('div', {
          className: 'item',
          attrs: { draggable: 'true', 'data-item-id': id, 'data-source': side, title: id }
        });
        div.textContent = `${getIconFor(id)} ${id.replace(/_/g, ' ')}`;
        slot.appendChild(div);
      });
    };

    renderSide('left', leftSlots);
    renderSide('right', rightSlots);
  }

  removeFromPan(side, id) {
    const arr = this.panState[side];
    const idx = arr.indexOf(id);
    if (idx >= 0) arr.splice(idx, 1);
    this.renderPanContents();
  }

  onClear() {
    // Return all items from pans back to inventory
    [...this.panState.left, ...this.panState.right].forEach((id) => {
      addToInventory({ name: id, description: this.prettyName(id) });
    });
    this.panState.left = [];
    this.panState.right = [];
    this.renderPanContents();
    this.refreshInventoryStrip();
    this.updateSums();
    this.setHint('Cleared the pans.');
    // Reset tilt animation
    this.rotationTarget = 0;
  }

  onBalance() {
    // Validate required items presence across both pans (four objects only)
    const placedSet = new Set([...this.panState.left, ...this.panState.right]);
    const allPlaced = REQUIRED_IDS.every((id) => placedSet.has(id));

    // Check sums
    const leftSum = this.panState.left.reduce((a, id) => a + (ITEM_WEIGHTS[id] || 0), 0);
    const rightSum = this.panState.right.reduce((a, id) => a + (ITEM_WEIGHTS[id] || 0), 0);

    if (!allPlaced) {
      this.setHint('Place all four objects on the pans.');
      this.previewTilt(leftSum, rightSum);
      return;
    }

    if (leftSum !== rightSum) {
      const delta = Math.abs(leftSum - rightSum);
      const heavier = leftSum > rightSum ? 'Left' : 'Right';
      this.setHint(`${heavier} heavier by ${delta} units.`);
      this.previewTilt(leftSum, rightSum);
      return;
    }

    // Success
    this.setHint('Perfect equilibrium.');
    this.rotationTarget = 0; // Level
    this.solved = true;
    this.openCompartment = true;
    // Trigger secret compartment animation
    const comp = this.roomGroup?.getObjectByName('scale-secret-compartment');
    if (comp) comp.userData.openY = comp.userData.openY || 0.25;
    try { if (this.onSolved) this.onSolved(); } catch (e) { console.warn('[ScaleOfBalance] onSolved error:', e); }
    // Auto-close after a short delay
    setTimeout(() => this.close(), 600);
  }

  previewTilt(leftSum, rightSum) {
    const maxTilt = 0.18; // radians
    const sign = rightSum > leftSum ? 1 : (rightSum < leftSum ? -1 : 0);
    this.rotationTarget = maxTilt * sign;
  }

  prettyName(id) {
    switch (id) {
      case 'book': return 'Book';
      case 'liberty': return 'Statue of Liberty';
      case 'bowling_ball': return 'Bowling Ball';
      case 'bowling_pin': return 'Bowling Pin';
      default: return id;
    }
  }
}
