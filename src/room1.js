import * as THREE from 'three';

export function createRoom1() {
  const group = new THREE.Group();
  group.name = 'room1';

  // Floor + walls
  const floor = new THREE.Mesh(new THREE.BoxGeometry(12,0.2,12), new THREE.MeshStandardMaterial({color:0x222244}));
  floor.receiveShadow = true;
  group.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({color:0x333366});
  
  // Back wall
  const wall1 = new THREE.Mesh(new THREE.BoxGeometry(12,4,0.2), wallMat); 
  wall1.position.set(0,2,-6);
  wall1.userData = { type: 'wall', side: 'back' };
  group.add(wall1);
  
  // Front wall with doorway (split into two parts)
  const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(4,4,0.2), wallMat);
  frontWallLeft.position.set(-4,2,6);
  frontWallLeft.userData = { type: 'wall', side: 'front-left' };
  group.add(frontWallLeft);
  
  const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(4,4,0.2), wallMat);
  frontWallRight.position.set(4,2,6);
  frontWallRight.userData = { type: 'wall', side: 'front-right' };
  group.add(frontWallRight);
  
  // Side walls
  const wall3 = new THREE.Mesh(new THREE.BoxGeometry(0.2,4,12), wallMat); 
  wall3.position.set(-6,2,0);
  wall3.userData = { type: 'wall', side: 'left' };
  group.add(wall3);
  
  const wall4 = wall3.clone(); 
  wall4.position.set(6,2,0);
  wall4.userData = { type: 'wall', side: 'right' };
  group.add(wall4);

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

  // Create entry/exit anchors for future hallway/minimap work
  const entryAnchor = new THREE.Object3D();
  entryAnchor.name = 'entryAnchor';
  entryAnchor.position.set(0, 0, 6); // Front of room (entry point)
  group.add(entryAnchor);

  const exitAnchor = new THREE.Object3D();
  exitAnchor.name = 'exitAnchor';
  exitAnchor.position.set(0, 0, -6); // Back of room (exit point)
  group.add(exitAnchor);

  // Collision detection function for room1 walls (account for room's world position)
  function checkWallCollisions(playerObject) {
    if (!playerObject || !playerObject.position) return;

    const playerRadius = 0.5;
    const roomHalf = 6; // Half of 12
    const wallThickness = 0.1;

    // Convert player world position to room-local space
    const playerWorldPos = playerObject.position.clone();
    const playerLocal = group.worldToLocal(playerWorldPos.clone());

    let clamped = false;

    // Left wall
    if (playerLocal.x - playerRadius < -roomHalf + wallThickness) {
      playerLocal.x = -roomHalf + wallThickness + playerRadius;
      clamped = true;
    }

    // Right wall
    if (playerLocal.x + playerRadius > roomHalf - wallThickness) {
      playerLocal.x = roomHalf - wallThickness - playerRadius;
      clamped = true;
    }

    // Front wall (z = +roomHalf) with doorway at center (x in [-2, 2])
    if (playerLocal.z + playerRadius > roomHalf - wallThickness) {
      if (Math.abs(playerLocal.x) > 2) {
        playerLocal.z = roomHalf - wallThickness - playerRadius;
        clamped = true;
      }
    }

    // Back wall (z = -roomHalf)
    if (playerLocal.z - playerRadius < -roomHalf + wallThickness) {
      playerLocal.z = -roomHalf + wallThickness + playerRadius;
      clamped = true;
    }

    if (clamped) {
      const newWorld = group.localToWorld(playerLocal);
      playerObject.position.copy(newWorld);
    }
  }

  return {
    group,
    anchors: { entry: entryAnchor, exit: exitAnchor },
    checkWallCollisions
  };
}

