import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Door } from '../../components/Door.js';
import { Pickup } from '../../components/Pickup.js';
import { SecurityCamera } from '../../components/Camera.js';
import { makeBrickMaterialForPanel, makeTiles108Floor, makeMetal030MaterialForCylinderFlexible, makeConcrete031MaterialFlexible } from '../../rendering/materials/Room0Materials.js';
import {
  setupRendererColorPipeline,
  applyEnvironment,
  buildStandardLightRig,
  removeExistingLights,
} from '../../rendering/lighting/StandardLighting.js';

export class Room0 {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'stage0-room';
    
    this.state = {
      hasKey: false,
      doorOpen: false,
      doorAnim: 0,
      hintTimer: 0,
      securityCamera: { isTracking: false }
    };
    
    this.pedestal = null;
    this.key = null;
    this.doorGroup = null;
    this.securityCamera = null;
    
    this.createRoom();
  }

  createRoom() {
    const roomWidth = 20;
    const roomDepth = 15;
    
    // Metal030 texture files
    const metal030Files = {
      color:  "/textures/metal030/Metal030_2K-JPG_Color.jpg",
      normal: "/textures/metal030/Metal030_2K-JPG/Metal030_2K-JPG_NormalGL.jpg",
      rough:  "/textures/metal030/Metal030_2K-JPG_Roughness.jpg",
      metal:  "/textures/metal030/Metal030_2K-JPG_Metalness.jpg",
    };
    
    // Concrete031 texture files for hallway
    const concrete031Files = {
      color:  "/textures/concrete031/Concrete031_2K-JPG_Color.jpg",
      normal: "/textures/concrete031/Concrete031_2K-JPG_NormalGL.jpg",
      rough:  "/textures/concrete031/Concrete031_2K-JPG_Roughness.jpg",
      ao:     "/textures/concrete031/Concrete031_2K-JPG_AmbientOcclusion.jpg",
    };
    
    // Create floor
    this.createFloor(roomWidth, roomDepth);
    
    // Create walls
    this.createWalls(roomWidth, roomDepth);
    
    // Create ceiling
    this.createCeiling(roomWidth, roomDepth);
    
    // Create door
    this.createDoor();
    
    // Create pedestal and key
    this.createPedestalAndKey();
    
    // Create security camera
    this.createSecurityCamera();
    
    // Create hallway
    this.createHallway();
    
    // Setup lighting
    this.setupLighting();
  }

  createFloor(roomWidth, roomDepth) {
    const floor = makeTiles108Floor(roomWidth, roomDepth, {
      tileSizeMeters: 1.0,
      anisotropy: 16
    });
    this.group.add(floor);
  }

  createWalls(roomWidth, roomDepth) {
    const wallHeight = 4;
    const wallThickness = 0.5;
    const roomWidthHalf = 10;
    const roomDepthHalf = 7.5;
    
    // Create wall panel material
    const wallMaterial = makeBrickMaterialForPanel();
    
    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, roomDepth),
      wallMaterial
    );
    leftWall.position.set(-roomWidthHalf, wallHeight / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.group.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, roomDepth),
      wallMaterial
    );
    rightWall.position.set(roomWidthHalf, wallHeight / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.group.add(rightWall);
    
    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth, wallHeight, wallThickness),
      wallMaterial
    );
    backWall.position.set(0, wallHeight / 2, -roomDepthHalf);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.group.add(backWall);
    
    // Front wall (with door opening)
    const frontWallLeft = new THREE.Mesh(
      new THREE.BoxGeometry(6, wallHeight, wallThickness),
      wallMaterial
    );
    frontWallLeft.position.set(-7, wallHeight / 2, roomDepthHalf);
    frontWallLeft.castShadow = true;
    frontWallLeft.receiveShadow = true;
    this.group.add(frontWallLeft);
    
    const frontWallRight = new THREE.Mesh(
      new THREE.BoxGeometry(6, wallHeight, wallThickness),
      wallMaterial
    );
    frontWallRight.position.set(7, wallHeight / 2, roomDepthHalf);
    frontWallRight.castShadow = true;
    frontWallRight.receiveShadow = true;
    this.group.add(frontWallRight);
  }

  createCeiling(roomWidth, roomDepth) {
    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth, 0.1, roomDepth),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
    );
    ceiling.position.set(0, 4.05, 0);
    ceiling.receiveShadow = true;
    this.group.add(ceiling);
  }

  createDoor() {
    // Create door using Door component
    this.door = new Door({
      width: 3,
      height: 3.5,
      color: 0x1a1a1a,
      lockRequired: true,
      requiredItem: 'stage0-key',
      openDistance: 4.0,
      duration: 0.8
    });
    
    this.door.group.position.set(0, 0, 7.5);
    this.group.add(this.door.group);
    
    // Listen for door events
    this.door.on('opened', () => {
      this.state.doorOpen = true;
      console.log('Door opened!');
    });
  }

  createPedestalAndKey() {
    // Create pedestal
    this.pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    this.pedestal.position.set(0, 0.6, 0);
    this.pedestal.castShadow = true;
    this.pedestal.receiveShadow = true;
    this.group.add(this.pedestal);
    
    // Create key pickup
    this.key = new Pickup({
      itemData: {
        name: 'stage0-key',
        description: 'A mysterious key',
        type: 'key'
      },
      model: '/models/key.glb',
      pickupDistance: 2.0
    });
    
    this.key.group.position.set(0, 1.5, 0);
    this.group.add(this.key.group);
    
    // Listen for pickup events
    this.key.on('pickedUp', (itemData) => {
      this.state.hasKey = true;
      console.log('Key picked up!');
    });
  }

  createSecurityCamera() {
    this.securityCamera = new SecurityCamera({
      trackingSpeed: 2.0,
      maxVerticalRotation: Math.PI / 4
    });
    
    this.securityCamera.group.position.set(0, 3.5, -6);
    this.group.add(this.securityCamera.group);
  }

  createHallway() {
    // Create hallway using Hallway component
    const hallway = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 2.2, 6),
      makeConcrete031MaterialFlexible()
    );
    hallway.position.set(0, 1.1, 10.5);
    hallway.receiveShadow = true;
    this.group.add(hallway);
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
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.group.add(directionalLight);
  }

  update(deltaTime, context) {
    const { player, ai } = context;
    
    if (!player) return;
    
    // Update security camera tracking
    if (this.securityCamera) {
      const roomBounds = {
        min: { x: -10, z: -7.5 },
        max: { x: 10, z: 7.5 }
      };
      this.securityCamera.updateTracking(player, roomBounds);
    }
    
    // Update key pickup
    if (this.key && !this.state.hasKey) {
      this.key.update(deltaTime);
      
      if (this.key.canPickup(player.getPosition())) {
        const itemData = this.key.pickup();
        if (itemData && player.addToInventory(itemData)) {
          this.state.hasKey = true;
        }
      }
    }
    
    // Update door
    if (this.door) {
      this.door.update(deltaTime);
    }
    
    // Update hint timer
    this.state.hintTimer += deltaTime;
    if (this.state.hintTimer > 10 && !this.state.hasKey) {
      ai.say("Look around. You'll need to find a way out of here.");
      this.state.hintTimer = 0;
    }
  }

  handleEKeyInteraction(player) {
    if (!player) return;
    
    const playerPos = player.getPosition();
    
    // Check key pickup
    if (this.key && !this.state.hasKey && this.key.canPickup(playerPos)) {
      const itemData = this.key.pickup();
      if (itemData && player.addToInventory(itemData)) {
        this.state.hasKey = true;
        ai.say("You found a key. Now you can open the door.");
        return;
      }
    }
    
    // Check door interaction
    if (this.door && this.door.canInteract(player.getPlayerInventory())) {
      if (!this.state.doorOpen) {
        this.door.open();
        ai.say("The door opens. You can now proceed to the next area.");
      }
      return;
    }
    
    ai.say("Nothing to interact with here.");
  }

  checkWallCollisions(player) {
    if (!player) return;
    
    const playerPos = player.getPosition();
    const playerRadius = 0.5;
    
    // Room boundaries
    const roomBounds = {
      minX: -10,
      maxX: 10,
      minZ: -7.5,
      maxZ: 7.5
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
    
    // Check hallway collision
    if (playerPos.z > 7.5 && playerPos.z < 13.5) {
      if (playerPos.x < -1.25 || playerPos.x > 1.25) {
        if (playerPos.x < 0) {
          playerPos.x = -1.25;
        } else {
          playerPos.x = 1.25;
        }
      }
    }
  }

  onRoomClick(event) {
    // Handle room-specific click interactions
    console.log('Room 0 clicked');
  }

  destroy() {
    if (this.door) {
      this.door.destroy();
    }
    if (this.key) {
      this.key.destroy();
    }
    if (this.securityCamera) {
      this.securityCamera.destroy();
    }
  }
}
