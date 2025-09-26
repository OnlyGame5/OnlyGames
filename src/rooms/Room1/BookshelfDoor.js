import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gameStore } from '../../state/gameStore.js';

/**
 * Creates a sliding bookshelf door for Room 1 using GLB model
 * - Reads bookshelfDoorOpen from gameStore
 * - Slides to +X when open
 * - Visual: loaded shelf.glb model
 */
export function createBookshelfDoor() {
  const group = new THREE.Group();
  group.name = 'bookshelfDoor';
  
  // Configuration
  const slideDistance = 1.6;
  const scale = 1.0;
  
  // Sliding group (moves on local +X when open)
  const slidingGroup = new THREE.Group();
  slidingGroup.position.set(0, 0, 0);
  slidingGroup.scale.set(scale, scale, scale);
  group.add(slidingGroup);
  
  // Load GLB model
  const loader = new GLTFLoader();
  let modelLoaded = false;
  
  loader.load('/models/shelf.glb', (gltf) => {
    const model = gltf.scene;
    
    // Enable shadows for the model
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    slidingGroup.add(model);
    modelLoaded = true;
    console.log('BookshelfDoor GLB model loaded successfully');
  }, undefined, (error) => {
    console.error('Error loading BookshelfDoor GLB model:', error);
  });
  
  // Animation state
  let targetX = 0;
  let currentX = 0;
  const damp = 4;
  
  // Subscribe to bookshelfDoorOpen changes
  const unsubscribe = gameStore.subscribe('bookshelfDoorOpen', (isOpen) => {
    console.log('BookshelfDoor received bookshelfDoorOpen change:', isOpen);
    targetX = isOpen ? slideDistance : 0;
  });
  
  // Set initial state
  targetX = gameStore.bookshelfDoorOpen ? slideDistance : 0;
  
  // Animation function
  function animate(deltaTime) {
    currentX = THREE.MathUtils.damp(currentX, targetX, damp, deltaTime);
    slidingGroup.position.x = currentX;
  }
  
  // Store animation function for cleanup
  group.userData.animate = animate;
  group.userData.cleanup = () => {
    unsubscribe();
  };
  
  return group;
}
