import * as THREE from 'three';

export class Minimap {
  constructor(scene, player, renderer) {
    this.scene = scene;
    this.player = player;
    this.renderer = renderer;
    
    // Minimap dimensions
    this.width = 200;
    this.height = 200;
    this.enlargedWidth = 400;
    this.enlargedHeight = 400;
    this.isEnlarged = false;
    
    // Performance optimization: track when redraw is needed
    this.needsRedraw = true;
    this.lastPlayerPosition = new THREE.Vector3();
    this.lastPlayerRotation = 0;
    this.redrawThreshold = 0.3; // Redraw if player moves more than 0.3 units (reduced for better responsiveness)
    this.rotationThreshold = 0.05; // Redraw if player rotates more than 0.05 radians (reduced for better responsiveness)
    this.lastRedrawTime = 0;
    this.redrawInterval = 50; // Minimum 50ms between redraws (reduced for smoother updates)
    
    // Zoom settings
    this.zoomLevel = 1; // 1 = normal, 2 = zoomed in, 0.5 = zoomed out
    this.zoomLevels = [0.5, 1, 2, 4]; // Available zoom levels
    this.currentZoomIndex = 1; // Start at normal zoom
    
    // Room data for accurate drawing based on actual world positions (Hub removed)
    this.roomData = {
      room0: { width: 20, depth: 15, position: { x: 0, z: 0 } }, // Awakening chamber at origin
      room1: { width: 18, depth: 18, position: { x: 28, z: 0 } }, // East of origin (9 + 10 + 9 = 28)
      room2: { width: 12, depth: 12, position: { x: 0, z: 22 } }, // South of origin (6 + 10 + 6 = 22)
      room4: { width: 18, depth: 18, position: { x: 0, z: -26.5 } }, // North of origin (7.5 + 10 + 9 = 26.5)
      room3: { width: 20, depth: 20, position: { x: -30, z: 0 }, label: 'SERVER ROOM' } // West of origin (10 + 10 + 10 = 30, circular)
    };
    
    // Hallway data for connecting corridors (matching main.js positions)
    this.hallwayData = {
      hubToRoom1: { 
        width: 2, 
        length: 10, 
        position: { x: 15, z: 0 },
        rotation: Math.PI / 2 // 90 degrees (East direction)
      },
      hubToRoom2: { 
        width: 2, 
        length: 10, 
        position: { x: 0, z: 12.5 },
        rotation: 0 // no rotation (South direction)
      },
      hubToRoom3: { 
        width: 2, 
        length: 10, 
        position: { x: -15, z: 0 },
        rotation: Math.PI / 2 // 90 degrees (West direction)
      },
      hubToRoom4: { 
        width: 3, 
        length: 10, 
        position: { x: 0, z: -13.25 },
        rotation: 0 // no rotation (North direction)
      }
    };
    
    // Calculate minimap bounds and scale
    this.calculateBounds();
    
    // Inject CSS animations
    this.injectCSS();
    
    // Create minimap UI element
    this.createMinimapUI();
  }
  
  injectCSS() {
    // Inject CSS for the minimap
    const style = document.createElement('style');
    style.textContent = `
      .minimap {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
      }
      
      .minimap::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 8px;
        box-shadow: 
          inset 0 0 20px rgba(0, 255, 65, 0.1),
          0 0 30px rgba(0, 255, 65, 0.2);
        pointer-events: none;
        z-index: 1;
      }
    `;
    document.head.appendChild(style);
  }
  
  calculateBounds() {
    // Get the active player position
    const activePlayer = window.leonardModel || this.player;
    const playerX = activePlayer.position.x;
    const playerZ = activePlayer.position.z;
    
    // Create a smaller viewport around the player with zoom support
    const baseViewRadius = 25; // Base view radius
    const viewRadius = baseViewRadius / this.zoomLevel; // Apply zoom
    
    this.bounds = {
      minX: playerX - viewRadius,
      maxX: playerX + viewRadius,
      minZ: playerZ - viewRadius,
      maxZ: playerZ + viewRadius,
      width: viewRadius * 2,
      height: viewRadius * 2
    };
    
    // Calculate scale factors to fit the viewport in minimap
    const minimapPadding = 10;
    this.scaleX = (this.width - minimapPadding * 2) / this.bounds.width;
    this.scaleZ = (this.height - minimapPadding * 2) / this.bounds.height;
    this.scale = Math.min(this.scaleX, this.scaleZ); // Use uniform scaling
    
    // Calculate offset to center the minimap on player
    this.offsetX = this.width / 2;
    this.offsetZ = this.height / 2;
  }
  
  worldToMinimap(worldX, worldZ) {
    // Convert world coordinates to minimap pixel coordinates
    // Player is always at the center of the minimap
    const minimapX = this.offsetX + (worldX - (this.bounds.minX + this.bounds.maxX) / 2) * this.scale;
    const minimapZ = this.offsetZ + (worldZ - (this.bounds.minZ + this.bounds.maxZ) / 2) * this.scale;
    return { x: minimapX, z: minimapZ };
  }

  createMinimapUI() {
    // Create minimap container
    this.minimapContainer = document.createElement('div');
    this.minimapContainer.className = 'minimap';
    this.minimapContainer.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      width: ${this.width}px;
      height: ${this.height}px;
      border: 2px solid #00ff41;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.95);
      box-shadow: 
        0 0 10px rgba(0, 255, 65, 0.3),
        inset 0 0 10px rgba(0, 255, 65, 0.1),
        0 0 20px rgba(0, 255, 65, 0.2);
      z-index: 1000;
      overflow: hidden;
      transition: all 0.3s ease;
      display: block;
      visibility: visible;
      opacity: 1;
    `;
    
    // Create canvas for minimap
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = this.width;
    this.minimapCanvas.height = this.height;
    this.minimapCanvas.style.cssText = `
      width: 100%;
      height: 100%;
      display: block;
    `;
    
    this.minimapContainer.appendChild(this.minimapCanvas);
    
    // Add grid background
    this.addGridBackground();
    
    // Add scanlines overlay
    this.addScanlinesOverlay();
    
    document.body.appendChild(this.minimapContainer);
    
    
    // Get 2D context for drawing player marker
    this.ctx = this.minimapCanvas.getContext('2d');
    
    // Add title text
    this.addTitleText();
    
    // Force visibility
    this.minimapContainer.style.display = 'block';
    this.minimapContainer.style.visibility = 'visible';
    this.minimapContainer.style.opacity = '1';
  }
  
  addGridBackground() {
    // Add grid background element
    this.gridBackground = document.createElement('div');
    this.gridBackground.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px);
      background-size: 20px 20px;
      pointer-events: none;
      z-index: 1;
    `;
    this.minimapContainer.appendChild(this.gridBackground);
  }
  
  
  addScanlinesOverlay() {
    // Add CRT scanlines overlay
    this.scanlinesOverlay = document.createElement('div');
    this.scanlinesOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 65, 0.03) 2px,
        rgba(0, 255, 65, 0.03) 4px
      );
      pointer-events: none;
      z-index: 10;
    `;
    this.minimapContainer.appendChild(this.scanlinesOverlay);
  }
  
  addTitleText() {
    // Add title text to minimap
    this.titleText = document.createElement('div');
    this.titleText.textContent = 'MINIMAP';
    this.titleText.style.cssText = `
      position: absolute;
      top: 5px;
      left: 5px;
      color: #00ff41;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      font-weight: bold;
      text-shadow: 
        0 0 5px rgba(0, 255, 65, 0.8),
        0 0 10px rgba(0, 255, 65, 0.4);
      pointer-events: none;
      z-index: 11;
      letter-spacing: 1px;
    `;
    this.minimapContainer.appendChild(this.titleText);
  }
  
  update() {
    // Performance optimization: Throttle redraws based on time
    const currentTime = Date.now();
    const timeSinceLastRedraw = currentTime - this.lastRedrawTime;
    
    // Only redraw if something significant has changed AND enough time has passed
    if ((this.needsRedraw || this.shouldRedraw()) && timeSinceLastRedraw > this.redrawInterval) {
      this.drawMinimapToCanvas();
      this.needsRedraw = false;
      this.lastRedrawTime = currentTime;
    }
  }
  
  shouldRedraw() {
    const activePlayer = window.leonardModel || this.player;
    
    // Check if player position changed significantly
    const positionChanged = this.lastPlayerPosition.distanceTo(activePlayer.position) > this.redrawThreshold;
    
    // Check if player rotation changed significantly
    let currentRotation = 0;
    if (window.isInFirstPerson !== undefined && window.isInFirstPerson()) {
      currentRotation = window.camera ? window.camera.rotation.y : 0;
    } else if (activePlayer && activePlayer.rotation) {
      currentRotation = activePlayer.rotation.y;
    }
    const rotationChanged = Math.abs(currentRotation - this.lastPlayerRotation) > this.rotationThreshold;
    
    if (positionChanged || rotationChanged) {
      this.lastPlayerPosition.copy(activePlayer.position);
      this.lastPlayerRotation = currentRotation;
      return true;
    }
    
    return false;
  }
  
  drawMinimapToCanvas() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw a simple background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Get the active player (Leonard model or fallback player)
    const activePlayer = window.leonardModel || this.player;
    
    // Recalculate bounds centered on player for following effect
    this.calculateBounds();
    
    // Draw room outlines (now centered around player)
    this.drawRoomOutlines();
    
    // Player is always at the center of the minimap
    const centerX = this.width / 2;
    const centerZ = this.height / 2;
    
    // Draw player marker as a neon green arrow
    this.ctx.save();
    this.ctx.translate(centerX, centerZ);
    
    // Get rotation angle for arrow direction
    let angle = 0;
    
    // Check if we can access the mouse rotation variables from player.js
    if (window.isInFirstPerson !== undefined) {
      if (window.isInFirstPerson()) {
        // In first-person mode, use camera rotation
        angle = window.camera ? -window.camera.rotation.y : 0; // Negate to fix direction
      } else if (activePlayer && activePlayer.rotation) {
        // In third-person mode, use player/Leonard rotation
        angle = -activePlayer.rotation.y; // Negate to fix direction
      }
    } else {
      // Fallback: try to get rotation from camera directly
      angle = window.camera ? -window.camera.rotation.y : 0; // Negate to fix direction
    }
    
    this.ctx.rotate(angle);
    
    // Draw neon green arrow with glow effect (matching NEXUS AI chatbox)
    this.ctx.shadowColor = '#00ff41';
    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = '#00ff41';
    this.ctx.strokeStyle = '#00ff41';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, -10); // Arrow tip
    this.ctx.lineTo(-6, 6);  // Bottom left
    this.ctx.lineTo(-2, 4);  // Inner left
    this.ctx.lineTo(-2, 8);  // Bottom left inner
    this.ctx.lineTo(2, 8);   // Bottom right inner
    this.ctx.lineTo(2, 4);   // Inner right
    this.ctx.lineTo(6, 6);   // Bottom right
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.restore();
    
  }
  
  drawRoomOutlines() {
    this.ctx.strokeStyle = '#00ff41';
    this.ctx.lineWidth = 1.5;
    this.ctx.fillStyle = 'rgba(0, 255, 65, 0.05)';
    this.ctx.shadowColor = '#00ff41';
    this.ctx.shadowBlur = 4;
    
    // Draw each room based on actual dimensions and positions
    Object.entries(this.roomData).forEach(([roomName, room]) => {
      const halfWidth = room.width / 2;
      const halfDepth = room.depth / 2;
      
      // Check if room is visible in current viewport
      const roomMinX = room.position.x - halfWidth;
      const roomMaxX = room.position.x + halfWidth;
      const roomMinZ = room.position.z - halfDepth;
      const roomMaxZ = room.position.z + halfDepth;
      
      // Skip if room is completely outside viewport
      if (roomMaxX < this.bounds.minX || roomMinX > this.bounds.maxX ||
          roomMaxZ < this.bounds.minZ || roomMinZ > this.bounds.maxZ) {
        return;
      }
      
      // Calculate minimap coordinates for the room corners
      const topLeft = this.worldToMinimap(roomMinX, roomMinZ);
      const bottomRight = this.worldToMinimap(roomMaxX, roomMaxZ);
      
      const roomWidth = bottomRight.x - topLeft.x;
      const roomHeight = bottomRight.z - topLeft.z;
      
      // Only draw if room is large enough to be visible
      if (roomWidth > 1 && roomHeight > 1) {
        
        // Regular rectangular rooms
        // Draw room fill
        this.ctx.fillRect(topLeft.x, topLeft.z, roomWidth, roomHeight);
        
        // Draw room outline
        this.ctx.strokeRect(topLeft.x, topLeft.z, roomWidth, roomHeight);
        
        // Add room labels (only if room is large enough)
        if (roomWidth > 20 && roomHeight > 15) {
          this.ctx.fillStyle = '#00ff41';
          this.ctx.font = '8px monospace';
          this.ctx.textAlign = 'center';
          this.ctx.shadowColor = '#00ff41';
          this.ctx.shadowBlur = 2;
          const displayName = room.label ? room.label : roomName.toUpperCase().replace('ROOM', 'R');
          this.ctx.fillText(
            displayName,
            topLeft.x + roomWidth / 2,
            topLeft.z + roomHeight / 2 + 3
          );
        }
        
        // Reset styles for next room
        this.ctx.fillStyle = 'rgba(0, 255, 65, 0.05)';
        this.ctx.strokeStyle = '#00ff41';
        this.ctx.lineWidth = 1.5;
        this.ctx.shadowBlur = 0;
      }
    });
    
    // Draw hallways
    this.drawHallways();
  }
  
  drawHallways() {
    // Set styles for hallway drawing (slightly different from rooms)
    this.ctx.strokeStyle = '#00ff41';
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = 'rgba(0, 255, 65, 0.03)';
    this.ctx.shadowColor = '#00ff41';
    this.ctx.shadowBlur = 2;
    
    // Draw each hallway based on actual dimensions and positions
    Object.entries(this.hallwayData).forEach(([hallwayName, hallway]) => {
      let halfWidth = hallway.width / 2;
      let halfLength = hallway.length / 2;
      
      // For rotated hallways (East and West), swap width and length dimensions
      if (hallway.rotation === Math.PI / 2) {
        // East and West hallways: swap width and length for proper orientation
        const temp = halfWidth;
        halfWidth = halfLength;
        halfLength = temp;
      }
      
      // Check if hallway is visible in current viewport
      const hallwayMinX = hallway.position.x - halfWidth;
      const hallwayMaxX = hallway.position.x + halfWidth;
      const hallwayMinZ = hallway.position.z - halfLength;
      const hallwayMaxZ = hallway.position.z + halfLength;
      
      // Skip if hallway is completely outside viewport
      if (hallwayMaxX < this.bounds.minX || hallwayMinX > this.bounds.maxX ||
          hallwayMaxZ < this.bounds.minZ || hallwayMinZ > this.bounds.maxZ) {
        return;
      }
      
      // Calculate minimap coordinates for the hallway corners
      const topLeft = this.worldToMinimap(hallwayMinX, hallwayMinZ);
      const bottomRight = this.worldToMinimap(hallwayMaxX, hallwayMaxZ);
      
      const hallwayWidth = bottomRight.x - topLeft.x;
      const hallwayHeight = bottomRight.z - topLeft.z;
      
      // Only draw if hallway is large enough to be visible
      if (hallwayWidth > 0.5 && hallwayHeight > 0.5) {
        // Draw hallway fill (lighter than rooms)
        this.ctx.fillRect(topLeft.x, topLeft.z, hallwayWidth, hallwayHeight);
        
        // Draw hallway outline (thinner than rooms)
        this.ctx.strokeRect(topLeft.x, topLeft.z, hallwayWidth, hallwayHeight);
      }
    });
    
    // Reset styles for other drawing operations
    this.ctx.fillStyle = 'rgba(0, 255, 65, 0.05)';
    this.ctx.strokeStyle = '#00ff41';
    this.ctx.lineWidth = 1.5;
    this.ctx.shadowBlur = 0;
  }
  
  toggle() {
    if (this.minimapContainer.style.display === 'none') {
      this.minimapContainer.style.display = 'block';
    } else {
      this.minimapContainer.style.display = 'none';
    }
  }
  
  toggleEnlarge() {
    this.isEnlarged = !this.isEnlarged;
    this.needsRedraw = true; // Force redraw when toggling size
    
    if (this.isEnlarged) {
      // Enlarge to center of screen
      this.minimapContainer.style.width = `${this.enlargedWidth}px`;
      this.minimapContainer.style.height = `${this.enlargedHeight}px`;
      this.minimapContainer.style.top = '50%';
      this.minimapContainer.style.right = 'auto';
      this.minimapContainer.style.left = '50%';
      this.minimapContainer.style.transform = 'translate(-50%, 50%)';
      this.minimapContainer.style.zIndex = '2000';
      this.minimapContainer.style.position = 'fixed';
      
      // Update canvas size
      this.minimapCanvas.width = this.enlargedWidth;
      this.minimapCanvas.height = this.enlargedHeight;
      
      // Update title text
      this.titleText.style.fontSize = '18px';
      this.titleText.textContent = 'MAP VIEW';
    } else {
      // Return to normal size in top right
      this.minimapContainer.style.width = `${this.width}px`;
      this.minimapContainer.style.height = `${this.height}px`;
      this.minimapContainer.style.top = '20px';
      this.minimapContainer.style.right = '20px';
      this.minimapContainer.style.left = 'auto';
      this.minimapContainer.style.transform = 'none';
      this.minimapContainer.style.zIndex = '1000';
      this.minimapContainer.style.position = 'fixed';
      
      // Update canvas size
      this.minimapCanvas.width = this.width;
      this.minimapCanvas.height = this.height;
      
      // Update title text
      this.titleText.style.fontSize = '12px';
      this.titleText.textContent = 'MINIMAP';
    }
  }
  
  // Zoom functionality
  toggleZoom() {
    // Cycle through zoom levels
    this.currentZoomIndex = (this.currentZoomIndex + 1) % this.zoomLevels.length;
    this.zoomLevel = this.zoomLevels[this.currentZoomIndex];
    this.needsRedraw = true; // Force redraw when zooming
    
    // Update the viewport to reflect new zoom level
    this.calculateBounds();
    
    // Log zoom level change
    const zoomNames = ['Far Out', 'Normal', 'Close', 'Very Close'];
    console.log(`Minimap zoom: ${zoomNames[this.currentZoomIndex]} (${this.zoomLevel}x)`);
  }
  
  addFogOfWar() {
    // Stub for fog of war overlay
    // Dark mask for unexplored areas
    console.log('Fog of war - feature not yet implemented');
  }
  
  addRoomMarkers() {
    // Stub for room/object markers
    // Placeholder icons with neon glow
    console.log('Room markers - feature not yet implemented');
  }
  
  destroy() {
    if (this.minimapContainer && this.minimapContainer.parentNode) {
      this.minimapContainer.parentNode.removeChild(this.minimapContainer);
    }
  }
}
