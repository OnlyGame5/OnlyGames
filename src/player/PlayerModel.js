import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EventEmitter } from '../utils/EventEmitter.js';

export class PlayerModel extends EventEmitter {
  constructor(scene) {
    super();
    this.scene = scene;
    this.model = null;
    this.animationMixer = null;
    this.animations = {};
    this.currentAnimation = null;
    this.isMoving = false;
  }

  async loadModel() {
    const loader = new GLTFLoader();
    
    try {
      console.log('Loading Leonard model from /models/leonard.glb');
      
      // Load base model
      const base = await loader.loadAsync('/models/leonard.glb');
      this.model = base.scene;
      this.model.visible = true;
      this.model.scale.set(1, 1, 1);
      this.model.position.set(0, 0, 0);
      
      // Enable shadows
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Setup animation mixer
      this.animationMixer = new THREE.AnimationMixer(this.model);
      
      // Load animations
      await this.loadAnimations(base);
      
      // Add to scene
      this.scene.add(this.model);
      
      // Hide fallback player box
      const fallbackPlayer = this.scene.getObjectByName('player-box');
      if (fallbackPlayer) {
        fallbackPlayer.visible = false;
      }
      
      this.emit('modelLoaded', this.model);
      console.log('Leonard model loaded successfully!');
      
    } catch (error) {
      console.error('Failed to load Leonard model:', error);
      this.emit('modelLoadError', error);
    }
  }

  async loadAnimations(base) {
    // Find idle and walk clips in base file
    let idleClip = base.animations?.find(c => /idle/i.test(c.name)) || null;
    let walkClip = base.animations?.find(c => /walk/i.test(c.name)) || null;
    
    // Load external animation clips if not found
    if (!idleClip) {
      try {
        idleClip = await this.loadAnimationClip('/models/idle.glb');
      } catch (e) {
        console.warn('No idle.glb found:', e.message);
      }
    }
    
    if (!walkClip) {
      try {
        walkClip = await this.loadAnimationClip('/models/walking.glb');
      } catch (e) {
        console.warn('No walking.glb found:', e.message);
      }
    }
    
    // Create animation actions
    if (idleClip) {
      this.animations.idle = this.animationMixer.clipAction(idleClip, this.model);
      this.animations.idle.setLoop(THREE.LoopOnce, 1);
      this.animations.idle.clampWhenFinished = true;
      console.log('Created IDLE animation from:', idleClip.name);
    }
    
    if (walkClip) {
      this.animations.walk = this.animationMixer.clipAction(walkClip, this.model);
      this.animations.walk.setLoop(THREE.LoopRepeat, Infinity);
      console.log('Created WALK animation from:', walkClip.name);
    }
    
    // Start with idle animation
    if (this.animations.idle) {
      this.currentAnimation = this.animations.idle;
      this.currentAnimation.reset().play();
    }
  }

  async loadAnimationClip(url) {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    if (gltf.animations && gltf.animations.length > 0) {
      console.log(`Loaded animation from ${url}:`, gltf.animations[0].name);
      return gltf.animations[0];
    }
    throw new Error(`No animations found in ${url}`);
  }

  fadeTo(nextAction, duration = 0.25) {
    if (!nextAction || this.currentAnimation === nextAction) return;
    
    // Prepare the next action with correct loop settings
    nextAction.reset();
    if (nextAction === this.animations.idle) {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    } else if (nextAction === this.animations.walk) {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
    }
    
    if (this.currentAnimation) {
      this.currentAnimation.crossFadeTo(nextAction, duration, false);
    } else {
      nextAction.play();
    }
    this.currentAnimation = nextAction;
  }

  update(deltaTime, isMoving) {
    if (!this.animationMixer) return;
    
    // Update movement state
    if (isMoving !== this.isMoving) {
      this.isMoving = isMoving;
      this.updateAnimation();
    }
    
    // Update animation mixer
    this.animationMixer.update(deltaTime);
  }

  updateAnimation() {
    if (this.isMoving) {
      if (this.animations.walk && !this.animations.walk.isRunning()) {
        this.animations.walk.reset();
        this.animations.walk.setLoop(THREE.LoopRepeat, Infinity);
        this.animations.walk.play();
        this.currentAnimation = this.animations.walk;
      }
      
      // Match animation speed to movement speed
      if (this.animations.walk) {
        const baseWalkSpeed = 1.8;
        const gameSpeed = 2.2;
        this.animations.walk.timeScale = gameSpeed / baseWalkSpeed;
      }
    } else {
      if (this.animations.walk && this.animations.walk.isRunning()) {
        this.animations.walk.stop();
        this.currentAnimation = null;
      }
    }
  }

  setPosition(position) {
    if (this.model) {
      this.model.position.copy(position);
    }
  }

  setRotation(rotation) {
    if (this.model) {
      this.model.rotation.copy(rotation);
    }
  }

  setVisible(visible) {
    if (this.model) {
      this.model.visible = visible;
    }
  }

  getModel() {
    return this.model;
  }

  destroy() {
    if (this.model && this.scene) {
      this.scene.remove(this.model);
    }
    this.animationMixer = null;
    this.animations = {};
    this.currentAnimation = null;
  }
}
