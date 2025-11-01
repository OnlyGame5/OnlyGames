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
  const scale = 0.25;
  
  // Sliding group (moves on local +X when open)
  const slidingGroup = new THREE.Group();
  slidingGroup.position.set(0, 0, 0);
  slidingGroup.scale.set(scale, scale, scale);
  group.add(slidingGroup);
  
  // Load GLB model
  const loader = new GLTFLoader();
  let modelLoaded = false;
  
  loader.load('./models/sci-fi_office_desk.glb', (gltf) => {
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
    console.log('BookshelfDoor GLB model (sci-fi office desk) loaded successfully');

    // Try to find drawer meshes; pick the lowest as the bottom drawer
    const candidateDrawers = [];
    model.traverse((n) => {
      const nm = (n.name || '').toLowerCase();
      if (n.isMesh && (nm.includes('drawer') || nm.includes('draw'))) {
        candidateDrawers.push(n);
      }
    });

    if (candidateDrawers.length > 0) {
      const worldPos = new THREE.Vector3();
      let bottomDrawer = candidateDrawers[0];
      let minY = Infinity;
      for (const d of candidateDrawers) {
        d.getWorldPosition(worldPos);
        if (worldPos.y < minY) {
          minY = worldPos.y;
          bottomDrawer = d;
        }
      }

      // Set up simple open animation for bottom drawer
      const baseMatrix = bottomDrawer.matrix.clone();
      let drawerTarget = 1; // open by default
      let drawerT = 0;
      const drawerDamp = 6;
      const openDistance = 0.28; // meters
      const localAxis = new THREE.Vector3(0, 0, 1); // adjust if desk uses different axis

      const prevAnimate = group.userData.animate;
      group.userData.animate = (dt) => {
        if (prevAnimate) prevAnimate(dt);
        drawerT = THREE.MathUtils.damp(drawerT, drawerTarget, drawerDamp, dt);

        // reset to base then apply offset along local axis
        bottomDrawer.matrix.copy(baseMatrix);
        bottomDrawer.matrix.decompose(bottomDrawer.position, bottomDrawer.quaternion, bottomDrawer.scale);
        const offset = localAxis.clone().multiplyScalar(openDistance * drawerT).applyQuaternion(bottomDrawer.quaternion);
        bottomDrawer.position.add(offset);
        bottomDrawer.updateMatrix();
        bottomDrawer.updateMatrixWorld(true);
      };

      group.userData.setBottomDrawerOpen = (open) => { drawerTarget = open ? 1 : 0; };
      group.userData.toggleBottomDrawer = () => { drawerTarget = drawerTarget < 0.5 ? 1 : 0; };
    } else {
      console.warn('No drawer meshes found in sci-fi office desk model; cannot animate bottom drawer.');
    }
  }, undefined, (error) => {
    console.error('Error loading BookshelfDoor GLB model (sci-fi office desk):', error);
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
