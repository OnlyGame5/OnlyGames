import { aiOrgs } from '../data/aiOrgs.js';
import { projectEquirectangular, EQUIRECT_BOUNDS, isPlottable, toLatLon } from '../utils/projection.js';
import './FullscreenMap.css';

/**
 * Full-screen world map overlay with hover info cards
 * @param {Object} options
 * @param {Function} options.onClose - Callback when map is closed
 * @param {Function} [options.onOrgView] - Callback when an org card is shown (for tracking views)
 * @param {Object} [options.bounds] - Map bounds (defaults to EQUIRECT_BOUNDS)
 * @param {string} [options.imageSrc] - Map image path
 * @returns {Function} Cleanup function
 */
export function createFullscreenMap({ onClose, onOrgView, bounds = EQUIRECT_BOUNDS, imageSrc = '/images/world_map/world_map.jpg' }) {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.className = 'ai-map__overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Global AI Registry Map');
  overlay.setAttribute('aria-modal', 'true');
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'ai-map__close';
  closeBtn.textContent = '× Close';
  closeBtn.setAttribute('aria-label', 'Close map');
  closeBtn.addEventListener('click', onClose);
  
  // Create canvas container
  const canvas = document.createElement('div');
  canvas.className = 'ai-map__canvas';
  const canvasRef = canvas;
  
  // Create map image
  const mapImg = document.createElement('img');
  mapImg.className = 'ai-map__img';
  mapImg.src = imageSrc;
  mapImg.alt = 'World Map';
  
  // Create pins container
  const pinsContainer = document.createElement('div');
  pinsContainer.className = 'ai-map__pins';
  
  // Create info card container
  const cardContainer = document.createElement('div');
  cardContainer.className = 'ai-map__card-container';
  
  canvas.appendChild(mapImg);
  canvas.appendChild(pinsContainer);
  canvas.appendChild(cardContainer);
  
  overlay.appendChild(closeBtn);
  overlay.appendChild(canvas);
  
  document.body.appendChild(overlay);
  
  // State
  let canvasSize = { w: 0, h: 0 };
  let imageOffset = { x: 0, y: 0 };
  let hoveredOrgId = null;
  let hoveredPosition = null;
  let mapImageLoaded = false;
  
  // Helper to clamp values
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }
  
  // Calculate image size and offset
  function calculateImageLayout() {
    const rect = canvasRef.getBoundingClientRect();
    
    if (!mapImg.naturalWidth || !mapImg.naturalHeight) {
      canvasSize = { w: rect.width, h: rect.height };
      imageOffset = { x: 0, y: 0 };
      return;
    }
    
    const naturalAspect = mapImg.naturalWidth / mapImg.naturalHeight;
    const containerAspect = rect.width / rect.height;
    
    if (naturalAspect > containerAspect) {
      // Image is wider - it fills container width
      canvasSize = { w: rect.width, h: rect.width / naturalAspect };
      imageOffset = { x: 0, y: (rect.height - canvasSize.h) / 2 };
    } else {
      // Image is taller - it fills container height
      canvasSize = { w: rect.height * naturalAspect, h: rect.height };
      imageOffset = { x: (rect.width - canvasSize.w) / 2, y: 0 };
    }
  }
  
  // Project all pins
  function renderPins() {
    if (!canvasSize.w || !canvasSize.h || !mapImageLoaded) return;
    
    calculateImageLayout();
    pinsContainer.innerHTML = '';
    
    aiOrgs.forEach((org) => {
      if (!isPlottable(org)) return;
      
      const coords = toLatLon(org);
      if (!coords) return;
      
      // Project coordinates to pixel space (within image bounds)
      const { x, y } = projectEquirectangular(
        coords.lat,
        coords.lon,
        canvasSize.w,
        canvasSize.h,
        bounds
      );
      
      // Apply offset to position in container
      const pinX = imageOffset.x + x;
      const pinY = imageOffset.y + y;
      
      // Create pin element
      const pin = document.createElement('button');
      pin.className = 'ai-map__pin';
      pin.style.left = `${pinX}px`;
      pin.style.top = `${pinY}px`;
      pin.setAttribute('aria-label', `${org.name}, ${org.city}, ${org.country}`);
      pin.setAttribute('tabindex', '0');
      
      // Hover/focus handlers
      const handleEnter = () => {
        hoveredOrgId = org.id;
        hoveredPosition = { x: pinX, y: pinY };
        renderInfoCard();
      };
      
      const handleLeave = () => {
        hoveredOrgId = null;
        hoveredPosition = null;
        renderInfoCard();
      };
      
      pin.addEventListener('mouseenter', handleEnter);
      pin.addEventListener('mouseleave', handleLeave);
      pin.addEventListener('focus', handleEnter);
      pin.addEventListener('blur', handleLeave);
      
      pinsContainer.appendChild(pin);
    });
  }
  
  // Render info card
  function renderInfoCard() {
    cardContainer.innerHTML = '';
    
    if (!hoveredOrgId || !hoveredPosition) return;
    
    const org = aiOrgs.find(o => o.id === hoveredOrgId);
    if (!org) return;
    
    // Notify about org view (for tracking ClosedAI hint)
    if (onOrgView && org.id === 'closedai') {
      onOrgView(org);
    }
    
    const locationText = org.distributed ? 'Distributed — Global' : `${org.city}, ${org.country}`;
    
    // Calculate card position (clamp to keep on screen)
    // hoveredPosition is already in container coordinates (with offset applied)
    const rect = canvasRef.getBoundingClientRect();
    const cardWidth = 320;
    const cardHeight = 160;
    const cardX = clamp(hoveredPosition.x + 14, 8, rect.width - cardWidth);
    const cardY = clamp(hoveredPosition.y - 10, 8, rect.height - cardHeight);
    
    const card = document.createElement('div');
    card.className = 'ai-map__card';
    card.style.left = `${cardX}px`;
    card.style.top = `${cardY}px`;
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', `${org.name} details`);
    card.setAttribute('aria-live', 'polite');
    
    card.innerHTML = `
      <h3 class="ai-map__card-title">${org.name}</h3>
      <div class="ai-map__card-line">
        <strong>Location:</strong> ${locationText}
      </div>
      ${org.founded ? `
        <div class="ai-map__card-line">
          <strong>Founded:</strong> ${org.founded}
        </div>
      ` : ''}
      <p class="ai-map__card-desc">${org.summary}</p>
    `;
    
    cardContainer.appendChild(card);
  }
  
  // Update canvas size and re-render
  function updateSize() {
    calculateImageLayout();
    renderPins();
  }
  
  // ResizeObserver for responsive updates
  let resizeObserver = null;
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(canvasRef);
  } else {
    // Fallback to window resize
    window.addEventListener('resize', updateSize);
  }
  
  // ESC key handler
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  document.addEventListener('keydown', escHandler);
  
  // Load map image
  mapImg.addEventListener('load', () => {
    mapImageLoaded = true;
    updateSize();
  });
  
  // Initial size calculation
  setTimeout(updateSize, 100);
  
  // Focus first pin or close button
  setTimeout(() => {
    closeBtn.focus();
  }, 200);
  
  // Cleanup function
  return function cleanup() {
    document.removeEventListener('keydown', escHandler);
    if (resizeObserver) {
      resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', updateSize);
    }
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  };
}

