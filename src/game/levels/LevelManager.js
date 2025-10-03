import { Room0 } from './Room0.js';
import { Room1 } from './Room1.js';
import { Room2 } from './Room2.js';
import { Room3 } from './Room3.js';
import { GAME_CONSTANTS } from '../../utils/Constants.js';

export class LevelManager {
  constructor(scene) {
    this.scene = scene;
    this.rooms = {};
    this.currentRoom = null;
    this.roomSpacing = GAME_CONSTANTS.ROOM_SPACING;
  }

  async initialize() {
    try {
      // Create all rooms
      this.rooms.room0 = new Room0();
      this.rooms.room1 = new Room1();
      this.rooms.room2 = new Room2();
      this.rooms.room3 = new Room3();

      // Position rooms
      this.rooms.room0.group.position.set(0, 0, 0);
      this.rooms.room1.group.position.set(0, 0, -this.roomSpacing);
      this.rooms.room2.group.position.set(0, 0, -this.roomSpacing * 2);
      this.rooms.room3.group.position.set(0, 0, -this.roomSpacing * 3);

      // Add rooms to scene
      Object.values(this.rooms).forEach(room => {
        this.scene.add(room.group);
      });

      // Set initial room
      this.currentRoom = this.rooms.room0;
      
      console.log('Level manager initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize level manager:', error);
      throw error;
    }
  }

  update(deltaTime, context) {
    // Update current room
    if (this.currentRoom && this.currentRoom.update) {
      this.currentRoom.update(deltaTime, context);
    }

    // Update all rooms for continuous systems
    Object.values(this.rooms).forEach(room => {
      if (room.update) {
        room.update(deltaTime, context);
      }
    });
  }

  getCurrentRoom() {
    return this.currentRoom;
  }

  getRoom(roomName) {
    return this.rooms[roomName];
  }

  switchRoom(roomName) {
    if (this.rooms[roomName]) {
      this.currentRoom = this.rooms[roomName];
      console.log(`Switched to ${roomName}`);
    }
  }

  destroy() {
    Object.values(this.rooms).forEach(room => {
      if (room.destroy) {
        room.destroy();
      }
      this.scene.remove(room.group);
    });
    this.rooms = {};
    this.currentRoom = null;
  }
}
