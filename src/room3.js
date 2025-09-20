import * as THREE from 'three';

export function createRoom3(scene, x=-20, z=0) {
  const group = new THREE.Group();
  group.position.set(x,0,z);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(12,0.2,12), new THREE.MeshStandardMaterial({color:0x224444}));
  floor.receiveShadow = true;
  group.add(floor);

  group.userData = {type:"room3"};
  scene.add(group);
  return group;
}
