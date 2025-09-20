import * as THREE from 'three';

export function createRoom1(scene) {
  const group = new THREE.Group();
  group.position.set(0,0,0);

  // Floor + walls
  const floor = new THREE.Mesh(new THREE.BoxGeometry(12,0.2,12), new THREE.MeshStandardMaterial({color:0x222244}));
  floor.receiveShadow = true;
  group.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({color:0x333366});
  const wall1 = new THREE.Mesh(new THREE.BoxGeometry(12,4,0.2), wallMat); wall1.position.set(0,2,-6);
  const wall2 = wall1.clone(); wall2.position.set(0,2,6);
  const wall3 = new THREE.Mesh(new THREE.BoxGeometry(0.2,4,12), wallMat); wall3.position.set(-6,2,0);
  const wall4 = wall3.clone(); wall4.position.set(6,2,0);
  group.add(wall1, wall2, wall3, wall4);

  // Console pedestal
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(2,1,1), new THREE.MeshStandardMaterial({color:0x444444}));
  pedestal.position.set(0,0.5,-3);
  group.add(pedestal);

  // Panel
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.8,1,0.1), new THREE.MeshStandardMaterial({color:0x111111, emissive:0x111155}));
  panel.position.set(0,1.2,-2.55);
  group.add(panel);

  // Keypad
  const buttons = [];
  const geom = new THREE.BoxGeometry(0.4,0.2,0.1);
  let num=1;
  for(let row=0; row<3; row++){
    for(let col=0; col<3; col++){
      const b = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({color:0x555555}));
      b.position.set(-0.6+col*0.6, 1.2-row*0.3, -2.5);
      b.userData = {number:num};
      group.add(b);
      buttons.push(b);
      num++;
    }
  }
  const zero = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({color:0x555555}));
  zero.position.set(0,0.3,-2.5);
  zero.userData = {number:0};
  group.add(zero);
  buttons.push(zero);

  const solution = "3142";
  let input = "";

  function press(b) {
    b.material.emissive = new THREE.Color(0x3333ff);
    setTimeout(()=> b.material.emissive = new THREE.Color(0x000000),300);
    input += b.userData.number;
    if(input.length===4){
      if(input===solution){
        panel.material.emissive.setHex(0x00ff00);
        console.log("Correct!");
      } else {
        panel.material.emissive.setHex(0xff0000);
        console.log("Wrong!");
      }
      input="";
    }
  }

  group.userData = {keypadButtons:buttons, pressButton:press};
  scene.add(group);
  return group;
}
