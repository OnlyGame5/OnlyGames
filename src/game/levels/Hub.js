import * as THREE from 'three';

export function createHub() {
  const group = new THREE.Group();
  group.name = 'hub';

  // A large cylindrical room
  // Hub room geometry removed to prevent overlap with Room 0 (causing performance issues)
  // const geometry = new THREE.CylinderGeometry(20, 20, 8, 32);
  // const material = new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.BackSide });
  // const hubRoom = new THREE.Mesh(geometry, material);
  // hubRoom.position.y = 4;
  // group.add(hubRoom);
  
  // Hub floor removed to prevent overlap with Room 0 (causing performance issues)
  // const floor = new THREE.Mesh(
  //   new THREE.CircleGeometry(20, 32),
  //   new THREE.MeshStandardMaterial({ color: 0x333333 })
  // );
  // floor.rotation.x = -Math.PI / 2;
  // group.add(floor);

  // Define named entry/exit anchors for each room connection
  const anchors = {
    entry_from_room1: new THREE.Object3D(),
    exit_to_room1: new THREE.Object3D(),
    entry_from_room2: new THREE.Object3D(),
    exit_to_room2: new THREE.Object3D(),
    // ... add more for rooms 3 and 4 later
  };

  // Position the anchors around the hub
  anchors.exit_to_room1.position.set(18, 1, 0); // East
  anchors.entry_from_room1.position.set(16, 1, 0);

  anchors.exit_to_room2.position.set(0, 1, 18); // South
  anchors.entry_from_room2.position.set(0, 1, 16);

  Object.values(anchors).forEach(anchor => group.add(anchor));

  return {
    group,
    anchors
  };
}
