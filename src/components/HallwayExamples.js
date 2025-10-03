/**
 * Hallway Usage Examples
 * This file demonstrates how to use the ReusableHallway component
 */

import { createReusableHallway, HallwayPresets } from './ReusableHallway.js';

// Example 1: Basic hallway between Room 0 and Room 1
export function createBasicHallway() {
  return createReusableHallway({
    length: 18,
    width: 2,
    height: 4,
    positionX: -8,
    positionY: 0,
    positionZ: -18,
    name: 'basic-hallway',
    addLighting: true,
    lightIntensity: 0.3,
    ambientIntensity: 0.1,
    textureSet: 'concrete031'
  });
}

// Example 2: Using presets
export function createPresetHallways() {
  // Standard hallway (18 units long, 2 units wide)
  const standard = HallwayPresets.standard({
    positionX: -8,
    positionY: 0,
    positionZ: -18,
    name: 'standard-preset-hallway'
  });

  // Short hallway (9 units long)
  const short = HallwayPresets.short({
    positionX: 0,
    positionY: 0,
    positionZ: -9,
    name: 'short-preset-hallway'
  });

  // Long hallway (30 units long)
  const long = HallwayPresets.long({
    positionX: 8,
    positionY: 0,
    positionZ: -30,
    name: 'long-preset-hallway'
  });

  // Wide hallway (4 units wide)
  const wide = HallwayPresets.wide({
    positionX: 0,
    positionY: 0,
    positionZ: -18,
    name: 'wide-preset-hallway'
  });

  // Tiled hallway (using tiles136c textures)
  const tiled = HallwayPresets.tiled({
    positionX: 8,
    positionY: 0,
    positionZ: -18,
    name: 'tiled-preset-hallway'
  });

  return { standard, short, long, wide, tiled };
}

// Example 3: Custom configurations
export function createCustomHallways() {
  // Narrow hallway with bright lighting
  const narrowBright = createReusableHallway({
    length: 12,
    width: 1.5,
    height: 3.5,
    positionX: -10,
    positionY: 0,
    positionZ: -12,
    name: 'narrow-bright-hallway',
    addLighting: true,
    lightIntensity: 0.6,
    ambientIntensity: 0.2,
    textureSet: 'concrete031'
  });

  // Dark hallway with minimal lighting
  const darkMinimal = createReusableHallway({
    length: 25,
    width: 3,
    height: 5,
    positionX: 5,
    positionY: 0,
    positionZ: -25,
    name: 'dark-minimal-hallway',
    addLighting: true,
    lightIntensity: 0.1,
    ambientIntensity: 0.05,
    textureSet: 'concrete031'
  });

  // Tiled hallway without lighting
  const tiledNoLight = createReusableHallway({
    length: 15,
    width: 2,
    height: 4,
    positionX: -5,
    positionY: 0,
    positionZ: -15,
    name: 'tiled-no-light-hallway',
    addLighting: false,
    textureSet: 'tiles136c'
  });

  return { narrowBright, darkMinimal, tiledNoLight };
}

// Example 4: How to use in a room creation function
export function createRoomWithHallway() {
  const room = new THREE.Group();
  room.name = 'example-room';

  // Create the room itself (walls, floor, etc.)
  // ... room creation code ...

  // Add a hallway to the room
  const hallway = HallwayPresets.standard({
    positionX: -8,
    positionY: 0,
    positionZ: -18,
    name: 'room-exit-hallway'
  });

  room.add(hallway.group);

  // Return room with utility methods
  return {
    group: room,
    hallway: hallway,
    
    // Utility method to check if player is in hallway
    isPlayerInHallway: (playerPosition) => {
      return hallway.isPointInside(playerPosition);
    },
    
    // Utility method to get hallway bounds
    getHallwayBounds: () => {
      return hallway.getBounds();
    }
  };
}

// Example 5: Multiple hallways in one scene
export function createMultiHallwayScene() {
  const scene = new THREE.Group();
  scene.name = 'multi-hallway-scene';

  // Hallway 1: Room 0 to Room 1
  const hallway1 = HallwayPresets.standard({
    positionX: -8,
    positionY: 0,
    positionZ: -18,
    name: 'hallway-0-to-1'
  });

  // Hallway 2: Room 1 to Room 2
  const hallway2 = HallwayPresets.standard({
    positionX: -8,
    positionY: 0,
    positionZ: -36,
    name: 'hallway-1-to-2'
  });

  // Hallway 3: Short connecting hallway
  const hallway3 = HallwayPresets.short({
    positionX: 0,
    positionY: 0,
    positionZ: -9,
    name: 'connecting-hallway'
  });

  // Add all hallways to scene
  scene.add(hallway1.group);
  scene.add(hallway2.group);
  scene.add(hallway3.group);

  return {
    group: scene,
    hallways: {
      room0to1: hallway1,
      room1to2: hallway2,
      connecting: hallway3
    }
  };
}
