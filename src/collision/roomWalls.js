// src/collision/roomWalls.js
import * as THREE from 'three';

/**
 * Wall definitions for all rooms
 * Each room has walls with openings for hallways
 */
export const roomWallDefinitions = {
  room0: {
    name: 'Hub',
    walls: [
      // Back wall (split with door opening) - moved forward slightly
      { position: new THREE.Vector3(-5.75, 2, -7.2), size: new THREE.Vector3(8.5, 4, 0.5) },
      { position: new THREE.Vector3(5.75, 2, -7.2), size: new THREE.Vector3(8.5, 4, 0.5) },
      
      // Left wall (split with Room 3 hallway) - moved forward slightly
      { position: new THREE.Vector3(-9.7, 2, 4.0), size: new THREE.Vector3(0.5, 4, 6) },
      { position: new THREE.Vector3(-9.7, 2, -4.0), size: new THREE.Vector3(0.5, 4, 6) },
      
      // Right wall (split with Room 1 hallway) - moved forward slightly
      { position: new THREE.Vector3(9.7, 2, 4.0), size: new THREE.Vector3(0.5, 4, 6) },
      { position: new THREE.Vector3(9.7, 2, -4.0), size: new THREE.Vector3(0.5, 4, 6) },
      
      // Front wall (split with entry) - moved forward slightly
      { position: new THREE.Vector3(-4, 2, 7.2), size: new THREE.Vector3(6, 4, 0.5) },
      { position: new THREE.Vector3(4, 2, 7.2), size: new THREE.Vector3(6, 4, 0.5) }
    ],
    hallways: [
      // Room 1 hallway (East)
      { position: new THREE.Vector3(15, 1, 0), size: new THREE.Vector3(10, 4, 2) },
      
      // Room 2 hallway (South)
      { position: new THREE.Vector3(0, 1, 12.5), size: new THREE.Vector3(2, 4, 10) },
      
      // Room 3 hallway (West)
      { position: new THREE.Vector3(-15, 1, 0), size: new THREE.Vector3(10, 4, 2) },
      
      // Room 4 hallway (North)
      { position: new THREE.Vector3(0, 1, -12.5), size: new THREE.Vector3(3, 4, 10) }
    ]
  },
  
  room1: {
    name: 'East Sector',
    walls: [
      // Back wall
      { position: new THREE.Vector3(29, 2, -9), size: new THREE.Vector3(18, 4, 0.5) },
      
      // Left wall (with hub connection)
      { position: new THREE.Vector3(20, 2, 4.0), size: new THREE.Vector3(0.5, 4, 6) },
      { position: new THREE.Vector3(20, 2, -4.0), size: new THREE.Vector3(0.5, 4, 6) },
      
      // Right wall
      { position: new THREE.Vector3(38, 2, 0), size: new THREE.Vector3(0.5, 4, 18) },
      
      // Front wall
      { position: new THREE.Vector3(29, 2, 9), size: new THREE.Vector3(18, 4, 0.5) }
    ],
    hallways: [
      // Hub connection
      { position: new THREE.Vector3(15, 1, 0), size: new THREE.Vector3(10, 4, 2) }
    ]
  },
  
  room2: {
    name: 'South Sector',
    walls: [
      // Back wall
      { position: new THREE.Vector3(0, 2, 23.5), size: new THREE.Vector3(12, 4, 0.5) },
      
      // Left wall
      { position: new THREE.Vector3(-6, 2, 17.5), size: new THREE.Vector3(0.5, 4, 12) },
      
      // Right wall
      { position: new THREE.Vector3(6, 2, 17.5), size: new THREE.Vector3(0.5, 4, 12) },
      
      // Front wall (with hub connection)
      { position: new THREE.Vector3(-3, 2, 12.5), size: new THREE.Vector3(6, 4, 0.5) },
      { position: new THREE.Vector3(3, 2, 12.5), size: new THREE.Vector3(6, 4, 0.5) }
    ],
    hallways: [
      // Hub connection
      { position: new THREE.Vector3(0, 1, 12.5), size: new THREE.Vector3(2, 4, 10) }
    ]
  },
  
  room3: {
    name: 'Server Room',
    walls: [
      // Circular room - use multiple wall segments
      // North wall
      { position: new THREE.Vector3(-30, 2, -10), size: new THREE.Vector3(20, 4, 0.5) },
      
      // South wall
      { position: new THREE.Vector3(-30, 2, 10), size: new THREE.Vector3(20, 4, 0.5) },
      
      // East wall
      { position: new THREE.Vector3(-20, 2, 0), size: new THREE.Vector3(0.5, 4, 20) },
      
      // West wall (with hub connection)
      { position: new THREE.Vector3(-40, 2, 4.0), size: new THREE.Vector3(0.5, 4, 6) },
      { position: new THREE.Vector3(-40, 2, -4.0), size: new THREE.Vector3(0.5, 4, 6) }
    ],
    hallways: [
      // Hub connection
      { position: new THREE.Vector3(-15, 1, 0), size: new THREE.Vector3(10, 4, 2) }
    ]
  },
  
  room4: {
    name: 'North Sector',
    walls: [
      // Back wall
      { position: new THREE.Vector3(0, 2, -26.5), size: new THREE.Vector3(18, 4, 0.5) },
      
      // Left wall
      { position: new THREE.Vector3(-9, 2, -17.5), size: new THREE.Vector3(0.5, 4, 18) },
      
      // Right wall
      { position: new THREE.Vector3(9, 2, -17.5), size: new THREE.Vector3(0.5, 4, 18) },
      
      // Front wall (with hub connection)
      { position: new THREE.Vector3(-4.5, 2, -12.5), size: new THREE.Vector3(9, 4, 0.5) },
      { position: new THREE.Vector3(4.5, 2, -12.5), size: new THREE.Vector3(9, 4, 0.5) }
    ],
    hallways: [
      // Hub connection
      { position: new THREE.Vector3(0, 1, -12.5), size: new THREE.Vector3(3, 4, 10) }
    ]
  }
};
