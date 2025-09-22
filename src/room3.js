import * as THREE from 'three';

export function createRoom3() {
  const group = new THREE.Group();
  group.name = 'room3';

  const floor = new THREE.Mesh(new THREE.BoxGeometry(12,0.2,12), new THREE.MeshStandardMaterial({color:0x224444}));
  floor.receiveShadow = true;
  group.add(floor);

  group.userData = {type:"room3"};

  // Create entry/exit anchors for future hallway/minimap work
  const entryAnchor = new THREE.Object3D();
  entryAnchor.name = 'entryAnchor';
  entryAnchor.position.set(0, 0, 6); // Front of room (entry point)
  group.add(entryAnchor);

  const exitAnchor = new THREE.Object3D();
  exitAnchor.name = 'exitAnchor';
  exitAnchor.position.set(0, 0, -6); // Back of room (exit point)
  group.add(exitAnchor);

  return {
    group,
    anchors: { entry: entryAnchor, exit: exitAnchor }
  };
}
