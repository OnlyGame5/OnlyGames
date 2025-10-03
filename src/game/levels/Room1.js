import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Door } from '../../components/Door.js';
import { Pickup } from '../../components/Pickup.js';
import { Switch } from '../../components/Switch.js';
import { LightFixture } from '../../components/LightFixture.js';
import { InteractivePanel } from '../../components/InteractivePanel.js';
import { makeTiles136cFloor, makeTiles136cWall, makeTiles136cCeiling } from '../../rendering/materials/Room1Materials.js';
import { gameStore } from '../../state/gameStore.js';
import { WirePanel } from '../puzzles/WirePanel.js';
import { MemoryPanel } from '../puzzles/MemoryPanel.js';
import { BookshelfDoor } from '../puzzles/BookshelfDoor.js';

export class Room1 {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'room1';
    
    this.state = {
      safeOpened: false,
      safeObject: null,
      keypadOpen: false,
      inputCode: '',
      lightsOn: true
    };
    
    this.lightSwitch = null;
    this.safe = null;
    this.note = null;
    this.bookshelfDoor = null;
    this.wirePanel = null;
    this.memoryPanel = null;
    this.lightFixtures = [];
    
    this.createRoom();
  }

  createRoom() {
    const roomWidth = 12;
    const roomDepth = 12;
    const roomHeight = 4;
    
    // Create room structure
    this.createFloor(roomWidth, roomDepth);
    this.createWalls(roomWidth, roomDepth, roomHeight);
    this.createCeiling(roomWidth, roomDepth);
    
    // Create interactive elements
    this.createLightSwitch();
    this.createSafe();
    this.createNote();
    this.createBookshelfDoor();
    this.createWirePanel();
    this.createMemoryPanel();
    this.createLightFixtures();
    this.createEnvironmentalDetails();
    
    // Setup lighting
    this.setupLighting();
  }

  createFloor(roomWidth, roomDepth) {
    const floor = makeTiles136cFloor(roomWidth, roomDepth, {
      tileSizeMeters: 0.8,
      anisotropy: 16
    });
    this.group.add(floor);
  }

  createWalls(roomWidth, roomDepth, roomHeight) {
    const wallThickness = 0.3;
    const halfWidth = roomWidth / 2;
    const halfDepth = roomDepth / 2;
    
    // Left wall
    const leftWall = makeTiles136cWall(roomDepth, roomHeight, wallThickness);
    leftWall.position.set(-halfWidth, roomHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.group.add(leftWall);
    
    // Right wall
    const rightWall = makeTiles136cWall(roomDepth, roomHeight, wallThickness);
    rightWall.position.set(halfWidth, roomHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.group.add(rightWall);
    
    // Back wall
    const backWall = makeTiles136cWall(roomWidth, roomHeight, wallThickness);
    backWall.position.set(0, roomHeight / 2, -halfDepth);
    this.group.add(backWall);
    
    // Front wall (with opening to hallway)
    const frontWallLeft = makeTiles136cWall(4, roomHeight, wallThickness);
    frontWallLeft.position.set(-4, roomHeight / 2, halfDepth);
    this.group.add(frontWallLeft);
    
    const frontWallRight = makeTiles136cWall(4, roomHeight, wallThickness);
    frontWallRight.position.set(4, roomHeight / 2, halfDepth);
    this.group.add(frontWallRight);
  }

  createCeiling(roomWidth, roomDepth) {
    const ceiling = makeTiles136cCeiling(roomWidth, roomDepth);
    ceiling.position.set(0, 4.15, 0);
    this.group.add(ceiling);
  }

  createLightSwitch() {
    this.lightSwitch = new Switch({
      initialState: true,
      interactionDistance: 4.0,
      toggleCallback: (isOn) => {
        this.state.lightsOn = isOn;
        this.updateLighting();
        console.log(`Lights ${isOn ? 'ON' : 'OFF'}`);
      }
    });
    
    this.lightSwitch.group.position.set(-5, 1.5, 5);
    this.group.add(this.lightSwitch.group);
  }

  createSafe() {
    // Create safe using GLTF model
    const loader = new GLTFLoader();
    loader.load('/models/safe.glb', (gltf) => {
      this.state.safeObject = gltf.scene;
      this.state.safeObject.position.set(4, 0, 4);
      this.state.safeObject.scale.set(1, 1, 1);
      this.state.safeObject.castShadow = true;
      this.state.safeObject.receiveShadow = true;
      this.group.add(this.state.safeObject);
    });
  }

  createNote() {
    this.note = new Pickup({
      itemData: {
        name: 'room1-note',
        description: 'A note with wire connection instructions',
        type: 'note'
      },
      model: '/models/paper.glb',
      pickupDistance: 2.0
    });
    
    this.note.group.position.set(4, 1.5, 4);
    this.group.add(this.note.group);
    
    // Initially hidden until safe is opened
    this.note.group.visible = false;
  }

  createBookshelfDoor() {
    this.bookshelfDoor = new BookshelfDoor();
    this.bookshelfDoor.group.position.set(0, 0, -5);
    this.group.add(this.bookshelfDoor.group);
  }

  createWirePanel() {
    this.wirePanel = new WirePanel();
    this.wirePanel.group.position.set(-4, 1.5, -4);
    this.group.add(this.wirePanel.group);
  }

  createMemoryPanel() {
    this.memoryPanel = new MemoryPanel();
    this.memoryPanel.group.position.set(0, 1.5, 0);
    this.group.add(this.memoryPanel.group);
  }

  createLightFixtures() {
    // Create ceiling light fixtures
    for (let i = 0; i < 4; i++) {
      const light = new LightFixture({
        intensity: 1.5,
        distance: 25,
        flickerEnabled: true,
        flickerIntensity: 0.1
      });
      
      const x = (i % 2) * 8 - 4;
      const z = Math.floor(i / 2) * 8 - 4;
      light.group.position.set(x, 3.5, z);
      
      this.lightFixtures.push(light);
      this.group.add(light.group);
    }
  }

  createEnvironmentalDetails() {
    // Add graffiti, tally marks, burnt schematics, etc.
    this.addGraffiti();
    this.addTallyMarks();
    this.addBurntSchematics();
    this.addBrokenConsoles();
    this.addPaperClutter();
  }

  addGraffiti() {
    const graffiti = new InteractivePanel({
      content: "TRUST NO ONE\nTHE AI LIES\nFIND THE TRUTH",
      width: 2,
      height: 1.5,
      backgroundColor: 'black',
      textColor: 'red'
    });
    
    graffiti.group.position.set(-5, 2, -5);
    graffiti.group.rotation.y = Math.PI / 4;
    this.group.add(graffiti.group);
  }

  addTallyMarks() {
    const tallyMarks = new InteractivePanel({
      content: "||||| ||||| ||||| ||||| |||||\n||||| ||||| ||||| ||||| |||||\n||||| ||||| ||||| ||||| |||||",
      width: 1,
      height: 2,
      backgroundColor: 'black',
      textColor: 'white'
    });
    
    tallyMarks.group.position.set(5, 2, -5);
    this.group.add(tallyMarks.group);
  }

  addBurntSchematics() {
    const schematics = new InteractivePanel({
      content: "WIRE CONNECTIONS:\nR-G-B-Y\n(When lights are ON)",
      width: 2,
      height: 1,
      backgroundColor: 'black',
      textColor: 'lime'
    });
    
    schematics.group.position.set(0, 2, 5);
    this.group.add(schematics.group);
  }

  addBrokenConsoles() {
    // Add broken console meshes
    const console = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    console.position.set(3, 0.5, -3);
    console.castShadow = true;
    console.receiveShadow = true;
    this.group.add(console);
  }

  addPaperClutter() {
    // Add scattered paper meshes
    for (let i = 0; i < 5; i++) {
      const paper = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      paper.position.set(
        (Math.random() - 0.5) * 8,
        0.01,
        (Math.random() - 0.5) * 8
      );
      paper.rotation.x = -Math.PI / 2;
      paper.rotation.z = (Math.random() - 0.5) * Math.PI;
      this.group.add(paper);
    }
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.group.add(ambientLight);
    
    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.group.add(directionalLight);
  }

  updateLighting() {
    // Update light fixtures based on switch state
    this.lightFixtures.forEach(light => {
      light.setState(this.state.lightsOn);
    });
  }

  update(deltaTime, context) {
    const { player, ai } = context;
    
    if (!player) return;
    
    // Update light switch
    if (this.lightSwitch) {
      this.lightSwitch.update(deltaTime);
    }
    
    // Update light fixtures
    this.lightFixtures.forEach(light => {
      light.update(deltaTime);
    });
    
    // Update wire panel
    if (this.wirePanel) {
      this.wirePanel.update(deltaTime);
    }
    
    // Update memory panel
    if (this.memoryPanel) {
      this.memoryPanel.update(deltaTime);
    }
    
    // Update bookshelf door
    if (this.bookshelfDoor) {
      this.bookshelfDoor.update(deltaTime);
    }
    
    // Update note pickup
    if (this.note && !this.state.safeOpened) {
      this.note.update(deltaTime);
      
      if (this.note.canPickup(player.getPosition())) {
        const itemData = this.note.pickup();
        if (itemData && player.addToInventory(itemData)) {
          this.state.safeOpened = true;
        }
      }
    }
    
    // Update dialogue based on game state
    this.updateDialogue(ai);
  }

  updateDialogue(ai) {
    // Contextual AI dialogue based on puzzle progress
    if (gameStore.wirePuzzleComplete && !gameStore.memoryPuzzleComplete) {
      ai.say("Good work on the wire panel. Now try the memory game.");
    } else if (gameStore.memoryPuzzleComplete && !gameStore.pageTakenFromSafe) {
      ai.say("Excellent! Now check the safe for more clues.");
    } else if (gameStore.pageTakenFromSafe && !gameStore.bookshelfDoorOpen) {
      ai.say("You're almost there. The bookshelf should open now.");
    }
  }

  handleEKeyInteraction(player) {
    if (!player) return;
    
    const playerPos = player.getPosition();
    
    // Check light switch interaction
    if (this.lightSwitch && this.lightSwitch.canInteract(playerPos)) {
      this.lightSwitch.toggle();
      return;
    }
    
    // Check safe interaction
    if (this.state.safeObject && this.isNearSafe(playerPos)) {
      this.toggleKeypad();
      return;
    }
    
    // Check wire panel interaction
    if (this.wirePanel && this.wirePanel.canInteract(playerPos)) {
      this.wirePanel.openPanel();
      return;
    }
    
    // Check memory panel interaction
    if (this.memoryPanel && this.memoryPanel.canInteract(playerPos)) {
      gameStore.setShowMemoryUI(true);
      return;
    }
    
    // Check note pickup
    if (this.note && this.note.canPickup(playerPos)) {
      const itemData = this.note.pickup();
      if (itemData && player.addToInventory(itemData)) {
        this.state.safeOpened = true;
        return;
      }
    }
  }

  isNearSafe(playerPos) {
    const safePos = new THREE.Vector3(4, 0, 4);
    return playerPos.distanceTo(safePos) < 3.0;
  }

  toggleKeypad() {
    this.state.keypadOpen = !this.state.keypadOpen;
    
    if (this.state.keypadOpen) {
      this.showKeypad();
    } else {
      this.hideKeypad();
    }
  }

  showKeypad() {
    // Create keypad UI
    const keypad = document.createElement('div');
    keypad.id = 'keypad';
    keypad.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      padding: 20px;
      border-radius: 8px;
      z-index: 1000;
    `;
    
    keypad.innerHTML = `
      <h3>Safe Keypad</h3>
      <input type="text" id="keypadInput" maxlength="4" placeholder="Enter code">
      <div>
        <button onclick="window.gameState.currentRoom.handleKeypadInput('1')">1</button>
        <button onclick="window.gameState.currentRoom.handleKeypadInput('2')">2</button>
        <button onclick="window.gameState.currentRoom.handleKeypadInput('3')">3</button>
      </div>
      <div>
        <button onclick="window.gameState.currentRoom.handleKeypadInput('4')">4</button>
        <button onclick="window.gameState.currentRoom.handleKeypadInput('5')">5</button>
        <button onclick="window.gameState.currentRoom.handleKeypadInput('6')">6</button>
      </div>
      <div>
        <button onclick="window.gameState.currentRoom.handleKeypadInput('7')">7</button>
        <button onclick="window.gameState.currentRoom.handleKeypadInput('8')">8</button>
        <button onclick="window.gameState.currentRoom.handleKeypadInput('9')">9</button>
      </div>
      <div>
        <button onclick="window.gameState.currentRoom.handleKeypadInput('0')">0</button>
        <button onclick="window.gameState.currentRoom.handleKeypadInput('clear')">Clear</button>
        <button onclick="window.gameState.currentRoom.handleKeypadInput('enter')">Enter</button>
      </div>
    `;
    
    document.body.appendChild(keypad);
  }

  hideKeypad() {
    const keypad = document.getElementById('keypad');
    if (keypad) {
      document.body.removeChild(keypad);
    }
  }

  handleKeypadInput(input) {
    if (input === 'clear') {
      this.state.inputCode = '';
    } else if (input === 'enter') {
      if (this.state.inputCode === '1886') {
        this.state.safeOpened = true;
        this.note.group.visible = true;
        this.hideKeypad();
        console.log('Safe opened!');
      } else {
        this.state.inputCode = '';
        console.log('Wrong code!');
      }
    } else {
      this.state.inputCode += input;
    }
    
    const inputField = document.getElementById('keypadInput');
    if (inputField) {
      inputField.value = this.state.inputCode;
    }
  }

  checkWallCollisions(player) {
    if (!player) return;
    
    const playerPos = player.getPosition();
    const playerRadius = 0.5;
    
    // Room boundaries
    const roomBounds = {
      minX: -6,
      maxX: 6,
      minZ: -6,
      maxZ: 6
    };
    
    // Check room boundaries
    if (playerPos.x - playerRadius < roomBounds.minX) {
      playerPos.x = roomBounds.minX + playerRadius;
    }
    if (playerPos.x + playerRadius > roomBounds.maxX) {
      playerPos.x = roomBounds.maxX - playerRadius;
    }
    if (playerPos.z - playerRadius < roomBounds.minZ) {
      playerPos.z = roomBounds.minZ + playerRadius;
    }
    if (playerPos.z + playerRadius > roomBounds.maxZ) {
      playerPos.z = roomBounds.maxZ - playerRadius;
    }
  }

  onRoomClick(event) {
    // Handle room-specific click interactions
    console.log('Room 1 clicked');
  }

  destroy() {
    if (this.lightSwitch) {
      this.lightSwitch.destroy();
    }
    if (this.note) {
      this.note.destroy();
    }
    if (this.bookshelfDoor) {
      this.bookshelfDoor.destroy();
    }
    if (this.wirePanel) {
      this.wirePanel.destroy();
    }
    if (this.memoryPanel) {
      this.memoryPanel.destroy();
    }
    this.lightFixtures.forEach(light => light.destroy());
  }
}
