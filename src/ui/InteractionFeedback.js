export class InteractionFeedback {
  constructor() {
    this.container = null;
    this.isVisible = false;
    this.hideTimeout = null;
    this.createContainer();
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'interaction-feedback';
    this.container.className = 'interaction-feedback';
    
    const style = document.createElement('style');
    style.textContent = `
      .interaction-feedback {
        position: fixed;
        bottom: 20%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid #666;
        border-radius: 4px;
        padding: 12px 20px;
        color: #ccc;
        font-family: 'Courier New', 'Consolas', monospace;
        font-size: 14px;
        text-align: center;
        z-index: 5000;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        pointer-events: none;
        max-width: 400px;
        word-wrap: break-word;
      }
      
      .interaction-feedback.show {
        opacity: 1;
      }
      
      .interaction-feedback.hidden {
        opacity: 0;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(this.container);
  }

  show(text, duration = 2000) {
    // Clear any existing timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.container.textContent = text;
    this.container.classList.remove('hidden');
    this.container.classList.add('show');
    this.isVisible = true;

    // Auto-hide after duration
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.container.classList.remove('show');
    this.container.classList.add('hidden');
    this.isVisible = false;
  }

  isShowing() {
    return this.isVisible;
  }
}

// Create global instance
export const interactionFeedback = new InteractionFeedback();
