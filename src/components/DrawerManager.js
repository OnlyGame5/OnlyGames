import * as THREE from 'three';

export class DrawerManager {
  constructor({ scene, animations, mixer = null, drawers = [] } = {}) {
    this.scene = scene;
    this.mixer = mixer || new THREE.AnimationMixer(scene);
    this._byName = new Map();
    this._activeActions = new Set();

    this._onFinished = (e) => {
      const entry = [...this._byName.values()].find(d => d.action === e.action);
      if (!entry) return;
      entry.isMoving = false;
      if (entry._pendingFlip) {
        entry.isOpen = !entry.isOpen;
        entry._pendingFlip = false;
        if (entry.isOpen && !entry.hasOpenedOnce) {
          entry.hasOpenedOnce = true;
          if (typeof entry.onFirstOpen === 'function') entry.onFirstOpen();
        }
      }
      this._activeActions.delete(e.action);
    };
    this.mixer.addEventListener('finished', this._onFinished);

    drawers.forEach(cfg => {
      const obj = this.scene.getObjectByName(cfg.objectName);
      const clip = THREE.AnimationClip.findByName(animations || [], cfg.clipName);
      const action = clip ? this.mixer.clipAction(clip) : null;
      if (!obj || !clip || !action) {
        console.warn('[DrawerManager] Missing parts:', { object: !!obj, clip: !!clip, action: !!action, cfg });
        return;
      }
      action.clampWhenFinished = true;
      action.setLoop(THREE.LoopOnce, 0);
      action.enabled = true;
      action.paused = true;

      this._byName.set(cfg.objectName, {
        objectName: cfg.objectName,
        object3D: obj,
        action,
        isOpen: false,
        isMoving: false,
        hasOpenedOnce: false,
        locked: !!cfg.locked,
        requiresItemId: cfg.requiresItemId || null,
        onFirstOpen: cfg.onFirstOpen || null,
        _pendingFlip: false,
      });
    });
  }

  dispose() {
    if (this.mixer && this._onFinished) {
      this.mixer.removeEventListener('finished', this._onFinished);
    }
    this._activeActions.clear();
    this._byName.clear();
  }

  update(dt) {
    if (dt > 0 && this.mixer) this.mixer.update(dt);
  }

  lock(objectName, value = true) {
    const d = this._byName.get(objectName);
    if (d) d.locked = !!value;
  }

  getOpenState(objectName) {
    const d = this._byName.get(objectName);
    return d ? d.isOpen : false;
  }

  tryToggle(target) {
    const entry = this._findDrawerFromObject(target);
    if (!entry) return false;
    if (entry.isMoving) return false;
    if (entry.locked) {
      window.AI?.showInteractionFeedback?.('It seems locked.');
      return false;
    }

    const { action, isOpen } = entry;
    const duration = action.getClip().duration;
    entry.isMoving = true;
    entry._pendingFlip = true;

    action.paused = false;
    action.reset();
    if (!isOpen) {
      action.time = 0;
      action.timeScale = +1;
      action.play();
    } else {
      action.time = duration;
      action.timeScale = -1;
      action.play();
    }
    this._activeActions.add(action);
    return true;
  }

  _findDrawerFromObject(obj) {
    let cur = obj;
    while (cur) {
      for (const d of this._byName.values()) {
        if (d.object3D === cur) return d;
      }
      cur = cur.parent;
    }
    return null;
  }
}


