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
      // Back wall (split with 3m door opening) - Updated to match visual walls
      // Left section: covers x=-10 to x=-1.5 (8.5m wide)
      { position: new THREE.Vector3(-5.75, 2, -7.5), size: new THREE.Vector3(8.5, 4, 0.5) },
      // Right section: covers x=1.5 to x=10 (8.5m wide)
      { position: new THREE.Vector3(5.75, 2, -7.5), size: new THREE.Vector3(8.5, 4, 0.5) },
      
      // Left wall (split with 2m Room 3 hallway) - Extended to 6.6m to match visual walls
      // Top section: covers z=1.0 to z=7.6
      { position: new THREE.Vector3(-10, 2, 4.3), size: new THREE.Vector3(0.5, 4, 6.6) },
      // Bottom section: covers z=-7.6 to z=-1.0
      { position: new THREE.Vector3(-10, 2, -4.3), size: new THREE.Vector3(0.5, 4, 6.6) },
      
      // Right wall (split with 2m Room 1 hallway) - Extended to 6.6m to match visual walls
      // Top section: covers z=1.0 to z=7.6
      { position: new THREE.Vector3(10, 2, 4.3), size: new THREE.Vector3(0.5, 4, 6.6) },
      // Bottom section: covers z=-7.6 to z=-1.0
      { position: new THREE.Vector3(10, 2, -4.3), size: new THREE.Vector3(0.5, 4, 6.6) },
      
      // Front wall (split with 2m entry) - Updated to match visual walls
      // Left section: covers x=-10 to x=-1 (9m wide)
      { position: new THREE.Vector3(-5.5, 2, 7.5), size: new THREE.Vector3(9, 4, 0.5) },
      // Right section: covers x=1 to x=10 (9m wide)
      { position: new THREE.Vector3(5.5, 2, 7.5), size: new THREE.Vector3(9, 4, 0.5) }
    ],
    objects: [
      // Awakening chair collision (position: 0, 1.5, 2)
      { position: new THREE.Vector3(0, 1.5, 2), size: new THREE.Vector3(1.2, 2, 1.2), type: 'chair' },
      
      // Pedestal collision (position: 0, 0.4, -2)
      { position: new THREE.Vector3(0, 0.4, -2), size: new THREE.Vector3(0.8, 1.2, 0.8), type: 'pedestal' },
      
      // Pillar 1 (position: -8, wallHeight/2, -6) -> World: (-8, 2, -6)
      { position: new THREE.Vector3(-8, 2, -6), size: new THREE.Vector3(0.8, 4, 0.8), type: 'pillar' },
      
      // Pillar 2 (position: 9.5, wallHeight/2, -6) -> World: (9.5, 2, -6)
      { position: new THREE.Vector3(9.5, 2, -6), size: new THREE.Vector3(0.8, 4, 0.8), type: 'pillar' },
      
      // East Door (to Room 1) - Moved closer to hallway entrance (wall at x=10)
      { position: new THREE.Vector3(9.8, 1.75, 0), size: new THREE.Vector3(0.2, 3.5, 2.0), type: 'door', id: 'east-door', dynamic: true },
      
      // South Door (to Room 2) - Moved closer to hallway entrance (wall at z=7.5)
      { position: new THREE.Vector3(0, 1.75, 7.3), size: new THREE.Vector3(2.0, 3.5, 0.2), type: 'door', id: 'south-door', dynamic: true },
      
      // West Door (to Room 3) - Moved closer to hallway entrance (wall at x=-10)
      { position: new THREE.Vector3(-9.8, 1.75, 0), size: new THREE.Vector3(0.2, 3.5, 2.0), type: 'door', id: 'west-door', dynamic: true },
      
      // Main Door (RESTRICTED SECTOR) - Moved closer to hallway entrance (wall at z=-7.5)
      { position: new THREE.Vector3(0, 1.75, -7.4), size: new THREE.Vector3(3.0, 3.5, 0.2), type: 'door', id: 'stage0-door', dynamic: true },
      
      // Security Monitor - Mounted on South Wall (offset left)
      { position: new THREE.Vector3(-4, 2.5, 7.2), size: new THREE.Vector3(2.0, 1.5, 0.5), type: 'monitor', id: 'security-monitor', dynamic: false }
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
    ],
    hallwayWalls: [
      // Room 1 hallway outer walls (East) - thicker walls extending outward
      { position: new THREE.Vector3(15, 2, 1.5), size: new THREE.Vector3(10, 4, 1.0) }, // Top wall
      { position: new THREE.Vector3(15, 2, -1.5), size: new THREE.Vector3(10, 4, 1.0) }, // Bottom wall
      
      // Room 2 hallway outer walls (South) - thicker walls extending outward
      { position: new THREE.Vector3(1.5, 2, 12.5), size: new THREE.Vector3(1.0, 4, 10) }, // Left wall
      { position: new THREE.Vector3(-1.5, 2, 12.5), size: new THREE.Vector3(1.0, 4, 10) }, // Right wall
      
      // Room 3 hallway outer walls (West) - thicker walls extending outward
      { position: new THREE.Vector3(-15, 2, 1.5), size: new THREE.Vector3(10, 4, 1.0) }, // Top wall
      { position: new THREE.Vector3(-15, 2, -1.5), size: new THREE.Vector3(10, 4, 1.0) }, // Bottom wall
      
      // Room 4 hallway outer walls (North) - thicker walls extending outward
      { position: new THREE.Vector3(2.0, 2, -12.5), size: new THREE.Vector3(1.0, 4, 10) }, // Left wall
      { position: new THREE.Vector3(-2.0, 2, -12.5), size: new THREE.Vector3(1.0, 4, 10) } // Right wall
    ]
  },
  
  room1: {
    name: 'East Sector',
    walls: [
      // Back wall
      { position: new THREE.Vector3(29, 2, -9), size: new THREE.Vector3(18, 4, 0.5) },
      
      // Left wall (with hub connection) - Positioned to align with hallway at x=20
      // Top section: covers z=1.0 to z=9 (8m)
      { position: new THREE.Vector3(20, 2, 5.0), size: new THREE.Vector3(0.5, 4, 8) },
      // Bottom section: covers z=-9 to z=-1.0 (8m)
      { position: new THREE.Vector3(20, 2, -5.0), size: new THREE.Vector3(0.5, 4, 8) },
      
      // Right wall
      { position: new THREE.Vector3(38, 2, 0), size: new THREE.Vector3(0.5, 4, 18) },
      
      // Front wall
      { position: new THREE.Vector3(29, 2, 9), size: new THREE.Vector3(18, 4, 0.5) }
    ],
    objects: [
      // Sci-fi table (position: 0, 0, -7.5) -> World: (29, 0.5, -7.5)
      { position: new THREE.Vector3(29, 0.5, -7.5), size: new THREE.Vector3(2.0, 1.0, 1.5), type: 'table' },
      
      // Safe (position: 1.8, 0.1, -7.8) -> World: (30.8, 0.3, -7.8)
      { position: new THREE.Vector3(30.8, 0.3, -7.8), size: new THREE.Vector3(0.8, 0.6, 0.6), type: 'safe' },
      
      // Wire panel (position: 0, 0.8, 8.2) -> World: (29, 0.8, 8.2) - Made thicker
      { position: new THREE.Vector3(29, 0.8, 8.2), size: new THREE.Vector3(1.5, 1.5, 1.0), type: 'wirePanel' },
      
      // Simon stand/Memory game (position: 8.2, 0, -3) -> World: (37.2, 0.5, -3)
      { position: new THREE.Vector3(37.2, 0.5, -3), size: new THREE.Vector3(0.8, 1.0, 0.8), type: 'memoryGame' },
      
      // Bookshelf door/Cabinet (position: -8.5, 0, -4.5) -> World: (20.5, 1.0, -4.5)
      { position: new THREE.Vector3(20.5, 1.0, -4.5), size: new THREE.Vector3(0.3, 2.0, 1.5), type: 'cabinet' },
      
      // Console 1 (position: -6, 0.4, 6) -> World: (23, 0.4, 6)
      { position: new THREE.Vector3(23, 0.4, 6), size: new THREE.Vector3(1.0, 0.8, 0.6), type: 'console' },
      
      // Console 2 (position: 6, 0.3, -6) -> World: (35, 0.3, -6)
      { position: new THREE.Vector3(35, 0.3, -6), size: new THREE.Vector3(1.0, 0.8, 0.6), type: 'console' },
      
      // Light fixture (position: 0, 4.0, 0) -> World: (29, 4.0, 0)
      { position: new THREE.Vector3(29, 4.0, 0), size: new THREE.Vector3(2.0, 0.5, 2.0), type: 'lightBox' },
      
      // (Laptop collision handled dynamically when the room is active)
    ],
    hallways: [
      // Hub connection
      { position: new THREE.Vector3(15, 1, 0), size: new THREE.Vector3(10, 4, 2) }
    ]
  },
  
  room2: {
    name: 'South Sector',
    walls: [
      // Back wall - Room 2 is at (0, 0, 23.5), so back wall is at z = 23.5 + 6 = 29.5
      { position: new THREE.Vector3(0, 2, 29.5), size: new THREE.Vector3(12, 4, 0.5) },
      
      // Left wall - Room 2 is at (0, 0, 23.5), so left wall is at x = -6, z = 23.5
      { position: new THREE.Vector3(-6, 2, 23.5), size: new THREE.Vector3(0.5, 4, 12) },
      
      // Right wall - Room 2 is at (0, 0, 23.5), so right wall is at x = 6, z = 23.5
      { position: new THREE.Vector3(6, 2, 23.5), size: new THREE.Vector3(0.5, 4, 12) },
      
      // Front wall (with hub connection) - Positioned to align with hallway at z=17.5
      // Left section: covers x=-6 to x=-1.0 (5m)
      { position: new THREE.Vector3(-3.5, 2, 17.5), size: new THREE.Vector3(5, 4, 0.5) },
      // Right section: covers x=1.0 to x=6 (5m)
      { position: new THREE.Vector3(3.5, 2, 17.5), size: new THREE.Vector3(5, 4, 0.5) }
    ],
    objects: [
      // Scale of Balance (position: 0, 0.2, 4.5) -> World: (0, 0.4, 28.0)
      { position: new THREE.Vector3(0, 0.4, 28.0), size: new THREE.Vector3(1.5, 1.0, 1.5), type: 'scale' },
      
      // Secret compartment (position: 0, 0.05, -4.1) -> World: (0, 0.1, 19.4)
      { position: new THREE.Vector3(0, 0.1, 19.4), size: new THREE.Vector3(0.6, 0.2, 0.4), type: 'compartment' },
      
      // Statue of Liberty (position: -3.5, 0.5, 0) -> World: (-3.5, 0.5, 23.5)
      { position: new THREE.Vector3(-3.5, 0.5, 23.5), size: new THREE.Vector3(0.8, 1.0, 0.8), type: 'statue' },
      
      // Bowling Pin (position: 4, 0.2, -5) -> World: (4, 0.2, 18.5)
      { position: new THREE.Vector3(4, 0.2, 18.5), size: new THREE.Vector3(0.6, 1.2, 0.6), type: 'bowlingPin' },
      
      // Bowling Ball (position: 5, 0.5, -4) -> World: (5, 0.5, 19.5)
      { position: new THREE.Vector3(5, 0.5, 19.5), size: new THREE.Vector3(0.8, 0.8, 0.8), type: 'bowlingBall' },
      
      // Book (position: -5, 0.15, 3.5) -> World: (-5, 0.15, 27.0)
      { position: new THREE.Vector3(-5, 0.15, 27.0), size: new THREE.Vector3(0.6, 0.3, 0.4), type: 'book' },
      
      // Note sheet: no collision (removed collider to allow smooth pickup and movement)
      
      // Candle (position: -1.5, 0.2, -1.6) -> World: (-1.5, 0.2, 21.9)
      { position: new THREE.Vector3(-1.5, 0.2, 21.9), size: new THREE.Vector3(0.2, 0.4, 0.2), type: 'candle' },
      
      // Glasses (position: -1.0, 0.22, -2.2) -> World: (-1.0, 0.22, 21.3)
      { position: new THREE.Vector3(-1.0, 0.22, 21.3), size: new THREE.Vector3(0.3, 0.2, 0.3), type: 'glasses' },
      
      // Light fixture (position: 0, 4.2, 0) -> World: (0, 4.2, 23.5)
      { position: new THREE.Vector3(0, 4.2, 23.5), size: new THREE.Vector3(1.0, 0.5, 1.0), type: 'lightFixture' },
      
      // Laptop (position: 3, 0, 2) -> World: (3, 0.8, 25.5)
      { position: new THREE.Vector3(3, 0.8, 25.5), size: new THREE.Vector3(1.2, 1.6, 1.2), type: 'laptop' }
    ],
    hallways: [
      // Hub connection - Positioned at z=12.5 (between Room 0 at z=7.5 and Room 2 entrance at z=17.5)
      { position: new THREE.Vector3(0, 1, 12.5), size: new THREE.Vector3(2, 4, 10) }
    ]
  },
  
  room3: {
    name: 'Server Room',
    walls: [
      // Square room - clean, simple wall boundaries
      // Room 3 is at (-30, 0, 0), so walls are positioned around a 20x20 square
      
      // North wall
      { position: new THREE.Vector3(-30, 2, -10), size: new THREE.Vector3(20, 4, 0.5) },
      
      // South wall
      { position: new THREE.Vector3(-30, 2, 10), size: new THREE.Vector3(20, 4, 0.5) },
      
      // East wall (with 2m hallway connection) - Positioned to align with hallway at x=-20
      // Top section: covers z=1.0 to z=10 (9m)
      { position: new THREE.Vector3(-20, 2, 5.5), size: new THREE.Vector3(0.5, 4, 9) },
      // Bottom section: covers z=-10 to z=-1.0 (9m)
      { position: new THREE.Vector3(-20, 2, -5.5), size: new THREE.Vector3(0.5, 4, 9) },
      
      // West wall
      { position: new THREE.Vector3(-40, 2, 0), size: new THREE.Vector3(0.5, 4, 20) }
    ],
    objects: [
      // Only the laptop workstation and central CPU core should have collision
      // Laptop workstation (position: -7, 0, 0) -> World: (-37, 0.8, 0)
      { position: new THREE.Vector3(-37, 0.8, 0), size: new THREE.Vector3(1.2, 1.6, 1.2), type: 'laptop' },
      
      // Central CPU core cube (position: 0, 2.2, 0) -> World: (-30, 2.2, 0)
      { position: new THREE.Vector3(-30, 2.2, 0), size: new THREE.Vector3(1.2, 1.2, 1.2), type: 'cpuCore' }
    ],
    hallways: [
      // Hub connection
      { position: new THREE.Vector3(-15, 1, 0), size: new THREE.Vector3(10, 4, 2) }
    ]
  },
  
  room4: {
    name: 'North Sector',
    walls: [
      // Back wall - Room 4 is at (0, 0, -26.5), so back wall is at z = -26.5 - 9 = -35.5
      { position: new THREE.Vector3(0, 2, -35.5), size: new THREE.Vector3(18, 4, 0.5) },
      
      // Left wall - Room 4 is at (0, 0, -26.5), so left wall is at x = -9, z = -26.5
      { position: new THREE.Vector3(-9, 2, -26.5), size: new THREE.Vector3(0.5, 4, 18) },
      
      // Right wall - Room 4 is at (0, 0, -26.5), so right wall is at x = 9, z = -26.5
      { position: new THREE.Vector3(9, 2, -26.5), size: new THREE.Vector3(0.5, 4, 18) },
      
      // Front wall (with hub connection) - Room 4 is at (0, 0, -26.5), so front wall is at z = -26.5 + 9 = -17.5
      // Updated to match 3-meter door opening (hallway width)
      { position: new THREE.Vector3(-5.25, 2, -17.5), size: new THREE.Vector3(7.5, 4, 0.5) },
      { position: new THREE.Vector3(5.25, 2, -17.5), size: new THREE.Vector3(7.5, 4, 0.5) }
    ],
    objects: [
      // (Laptop collision handled dynamically when the room is active)
    ],
    hallways: [
      // Hub connection - Positioned at z=-12.5 (between Room 0 at z=-7.5 and Room 4 entrance at z=-17.5)
      { position: new THREE.Vector3(0, 1, -12.5), size: new THREE.Vector3(3, 4, 10) }
    ]
  }
};
