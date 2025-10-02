import * as THREE from 'three';

export function createRoom2() {
  const group = new THREE.Group();
  group.name = 'room2';

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x333344,
    roughness: 0.35,
    metalness: 0.5
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 16), wallMaterial);
  floor.receiveShadow = true;
  group.add(floor);

  // Walls (enlarged room 16x16)
  const walls = [
    { size: [16, 4, 0.2], pos: [0, 2, -8] },     // Back wall
    { size: [6, 4, 0.2], pos: [-5, 2, 8] },      // Front left
    { size: [6, 4, 0.2], pos: [5, 2, 8] },       // Front right, leaves ~4 units gap
    { size: [0.2, 4, 16], pos: [-8, 2, 0] },     // Left
    { size: [0.2, 4, 16], pos: [8, 2, 0] }       // Right
  ];

  walls.forEach(wall => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...wall.size), wallMaterial);
    mesh.position.set(...wall.pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  const ceiling = floor.clone();
  ceiling.position.y = 4;
  group.add(ceiling);

  // --- Puzzle 1: Multi-Step Sequence (Bookshelf) ---
  const bookshelf = new THREE.Group();
  bookshelf.position.set(-4, 0, -2);

  const bookColors = [0xff0000, 0x00ff00, 0x0000ff];
  const books = [];

  bookColors.forEach((color, i) => {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.2, 0.2),
      new THREE.MeshStandardMaterial({ color })
    );
    book.position.set(i * 0.6, 1, 0);
    bookshelf.add(book);
    books.push(book);
  });

  group.add(bookshelf);

  // --- Puzzle 2: Shadow / Light Puzzle ---
  const lightObj = new THREE.PointLight(0xffffff, 1, 10);
  lightObj.position.set(3, 3.5, -3);
  group.add(lightObj);

  const shadowObjects = [];
  const shadowPositions = [
    [2, 0.5, -4],
    [2.7, 0.5, -4],
    [3.4, 0.5, -4]
  ];

  shadowPositions.forEach(pos => {
    const obj = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    obj.position.set(...pos);
    shadowObjects.push(obj);
    group.add(obj);
  });

  // --- Puzzle 3: Hidden Code / Number Logic ---
  const codeBox = new THREE.Group();
  const boxMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  codeBox.add(boxMesh);
  codeBox.position.set(5, 0.5, 4);
  group.add(codeBox);

  const codeDigits = [7, 2, 4]; // Example hidden code

  // Optional: place clues in the room as meshes
  const codeClues = [
    new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffff00 })
    ),
    new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffff00 })
    ),
    new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffff00 })
    )
  ];

  codeClues[0].position.set(-6, 0.2, 6); // chair leg clue
  codeClues[1].position.set(0, 1.5, -6); // console dust clue
  codeClues[2].position.set(6, 1.5, -6); // painting edge clue

  codeClues.forEach(clue => group.add(clue));

  // --- Collision / bounds ---
  const roomHalf = 8;
  const wallThickness = 0.1;

  function checkWallCollisions(player) {
    if (!player || !player.position) return;
    const playerRadius = 0.5;
    let clamped = false;

    const playerLocal = group.worldToLocal(player.position.clone());

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
    // Back wall
    if (playerLocal.z - playerRadius < -roomHalf + wallThickness) {
      playerLocal.z = -roomHalf + wallThickness + playerRadius;
      clamped = true;
    }
    // Front wall with doorway (~x in [-4,0])
    if (playerLocal.z + playerRadius > roomHalf - wallThickness) {
      const inOpeningX = (playerLocal.x >= -4 && playerLocal.x <= 0);
      if (!inOpeningX) {
        playerLocal.z = roomHalf - wallThickness - playerRadius;
        clamped = true;
      }
    }

    if (clamped) {
      const newWorld = group.localToWorld(playerLocal);
      player.position.copy(newWorld);
    }
  }

  // --- Placeholder interaction logic ---
  const puzzles = {
    // Puzzle 1
    bookshelfSequence: {
      books,
      correctOrder: [1, 0, 2], // green → red → blue
      currentIndex: 0,
      check: function(bookIndex) {
        if (bookIndex === this.correctOrder[this.currentIndex]) {
          this.currentIndex++;
          if (this.currentIndex >= this.correctOrder.length) {
            console.log("Puzzle 1 solved! Fuse revealed.");
          }
        } else {
          this.currentIndex = 0;
          console.log("Wrong book order. Try again.");
        }
      }
    },
    // Puzzle 2
    shadowPuzzle: {
      objects: shadowObjects,
      solved: false,
      check: function() {
        // placeholder: player must arrange objects in a specific x-order
        const correctX = [2, 2.7, 3.4];
        const match = this.objects.every((obj, i) => Math.abs(obj.position.x - correctX[i]) < 0.1);
        if (match) {
          this.solved = true;
          console.log("Puzzle 2 solved! Fuse revealed.");
        }
      }
    },
    // Puzzle 3
    codePuzzle: {
      code: codeDigits,
      entered: [],
      check: function(digit) {
        this.entered.push(digit);
        if (this.entered.length === this.code.length) {
          if (this.entered.every((val, i) => val === this.code[i])) {
            console.log("Puzzle 3 solved! Fuse revealed.");
          } else {
            console.log("Incorrect code.");
          }
          this.entered = [];
        }
      }
    }
  };

  return { group, checkWallCollisions, puzzles };
}
