import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export function handleMouseClick(event, camera, rooms) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  rooms.forEach(room => {
    if (room.userData.keypadButtons) {
      const intersects = raycaster.intersectObjects(room.userData.keypadButtons);
      if (intersects.length > 0) {
        room.userData.pressButton(intersects[0].object);
      }
    }
  });
}
