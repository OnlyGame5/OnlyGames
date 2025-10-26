import './AIDialogueBox.css';

/**
 * AIDialogueBox - Reusable AI dialogue component with cyberpunk aesthetics
 * Implements typewriter and glitch-reveal effects using vanilla JavaScript
 */
export class AIDialogueBox {
  constructor(options = {}) {
    this.options = {
      tone: options.tone || 'neutral',
      headerLabel: options.headerLabel || 'NEXUS AI',
      footerCaption: options.footerCaption || 'SYSTEM v2.4.1',
      typingSpeed: options.typingSpeed || 15, // Much faster typing
      glitchDuration: options.glitchDuration || 1500, // Faster glitch
      autoHide: options.autoHide !== undefined ? options.autoHide : false,
      autoHideDelay: options.autoHideDelay || 5000,
      ...options
    };

    this.container = null;
    this.textElement = null;
    this.typingInterval = null;
    this.glitchInterval = null;
    this.isShowing = false;
    this.autoHideTimeout = null;
    this.currentText = '';
    this.currentIndex = 0;
    
    // Dialogue queue system
    this.dialogueQueue = [];
    this.isProcessingQueue = false;
    this.currentDialogue = null;
    
    // Idle state management removed - keeping box always visible

    this.create();
  }

  /**
   * Create the DOM structure
   */
  create() {
    // Main container
    this.container = document.createElement('div');
    this.container.className = 'ai-dialogue-box hidden';
    this.container.setAttribute('data-tone', this.options.tone);

    // Inner wrapper
    const inner = document.createElement('div');
    inner.className = 'ai-dialogue-inner';

    // Header
    const header = document.createElement('div');
    header.className = 'ai-dialogue-header';
    
    const statusDot = document.createElement('div');
    statusDot.className = 'ai-dialogue-status-dot';
    
    const label = document.createElement('div');
    label.className = 'ai-dialogue-label';
    label.textContent = this.options.headerLabel;
    
    header.appendChild(statusDot);
    header.appendChild(label);

    // Body
    const body = document.createElement('div');
    body.className = 'ai-dialogue-body';
    
    this.textElement = document.createElement('div');
    this.textElement.className = 'ai-dialogue-text';
    
    body.appendChild(this.textElement);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'ai-dialogue-footer';
    
    const caption = document.createElement('div');
    caption.className = 'ai-dialogue-caption';
    caption.textContent = this.options.footerCaption;
    
    const led = document.createElement('div');
    led.className = 'ai-dialogue-led';
    
    footer.appendChild(caption);
    footer.appendChild(led);

    // Assemble
    inner.appendChild(header);
    inner.appendChild(body);
    inner.appendChild(footer);
    this.container.appendChild(inner);

    // Remove old HUD element if it exists
    const oldHUD = document.getElementById('hud');
    if (oldHUD) {
      oldHUD.remove();
    }

    // Add to DOM
    document.body.appendChild(this.container);
  }

  /**
   * Show the dialogue box with text (queued system)
   * @param {string|string[]} text - Text to display (string or array for multi-line)
   * @param {Object} options - Display options
   */
  show(text, options = {}) {
    // Add to queue
    this.dialogueQueue.push({
      text: text,
      options: {
        effect: options.effect || 'type',
        tone: options.tone || this.options.tone,
        typingSpeed: options.typingSpeed || this.options.typingSpeed,
        onComplete: options.onComplete || null
      }
    });

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process the dialogue queue
   */
  processQueue() {
    if (this.dialogueQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    // No idle timer logic - box stays fully visible

    this.isProcessingQueue = true;
    const dialogue = this.dialogueQueue.shift();
    this.currentDialogue = dialogue;

    const {
      effect,
      tone,
      typingSpeed,
      onComplete
    } = dialogue.options;

    // Update tone if changed
    if (tone !== this.options.tone) {
      this.setTone(tone);
    }

    // Clear any existing effects
    this.cleanup();

    // Show container
    this.container.classList.remove('hidden');
    this.isShowing = true;

    // Create completion callback that processes next in queue
    const queueCallback = () => {
      if (onComplete) {
        onComplete();
      }
      
      // Auto-hide if enabled
      if (this.options.autoHide) {
        this.autoHideTimeout = setTimeout(() => {
          this.hide();
        }, this.options.autoHideDelay);
      }
      
      // No idle timer - box stays fully visible
      
      // Process next in queue
      setTimeout(() => {
        this.currentDialogue = null;
        this.processQueue();
      }, 500); // Small delay between dialogues
    };

    if (effect === 'glitch') {
      this.showWithGlitch(dialogue.text, queueCallback);
    } else {
      this.showWithTyping(dialogue.text, queueCallback, typingSpeed);
    }
  }

  /**
   * Show text with typewriter effect (vanilla JS implementation)
   * Supports HTML tags by parsing and typing text content while preserving tags
   */
  showWithTyping(text, onComplete, typingSpeed = this.options.typingSpeed) {
    const strings = Array.isArray(text) ? text : [text];
    this.currentStringIndex = 0;
    this.currentText = strings[0];
    this.currentIndex = 0;

    // Helper function to parse HTML and get text with tags
    const parseHTML = (html) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const textNodes = [];
      const walk = (node) => {
        if (node.nodeType === 3) { // Text node
          const text = node.textContent;
          for (let i = 0; i < text.length; i++) {
            textNodes.push({ type: 'char', char: text[i] });
          }
        } else if (node.nodeType === 1) { // Element node
          const tagName = node.tagName.toLowerCase();
          const attributes = Array.from(node.attributes).map(attr => 
            `${attr.name}="${attr.value}"`
          ).join(' ');
          textNodes.push({ type: 'open', tag: tagName, attrs: attributes });
          Array.from(node.childNodes).forEach(walk);
          textNodes.push({ type: 'close', tag: tagName });
        }
      };
      walk(tempDiv);
      return textNodes;
    };

    const nodes = parseHTML(this.currentText);
    let nodeIndex = 0;
    let charIndex = 0;

    const typeNextChar = () => {
      if (nodeIndex < nodes.length) {
        const node = nodes[nodeIndex];
        
        if (node.type === 'open') {
          // Render opening tag immediately
          const tagStr = `<${node.tag}${node.attrs ? ' ' + node.attrs : ''}>`;
          const currentHTML = this.textElement.innerHTML.replace('<span class="ai-dialogue-caret"></span>', '');
          this.textElement.innerHTML = currentHTML + tagStr + '<span class="ai-dialogue-caret"></span>';
          nodeIndex++;
          this.typingInterval = setTimeout(typeNextChar, typingSpeed);
        } else if (node.type === 'close') {
          // Render closing tag immediately
          const tagStr = `</${node.tag}>`;
          const currentHTML = this.textElement.innerHTML.replace('<span class="ai-dialogue-caret"></span>', '');
          this.textElement.innerHTML = currentHTML + tagStr + '<span class="ai-dialogue-caret"></span>';
          nodeIndex++;
          this.typingInterval = setTimeout(typeNextChar, typingSpeed);
        } else if (node.type === 'char') {
          // Type character normally
          const currentHTML = this.textElement.innerHTML.replace('<span class="ai-dialogue-caret"></span>', '');
          this.textElement.innerHTML = currentHTML + node.char + '<span class="ai-dialogue-caret"></span>';
          nodeIndex++;
          this.typingInterval = setTimeout(typeNextChar, typingSpeed);
        }
      } else {
        // Check if there are more strings to type
        this.currentStringIndex++;
        if (this.currentStringIndex < strings.length) {
          // Wait a bit before starting next string
          setTimeout(() => {
            this.currentText = strings[this.currentStringIndex];
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.currentText;
            const textNodes = parseHTML(this.currentText);
            nodes.length = 0;
            nodes.push(...textNodes);
            nodeIndex = 0;
            this.textElement.innerHTML = '<span class="ai-dialogue-caret"></span>';
            typeNextChar();
          }, 1000);
        } else {
          // Remove caret when done
          this.textElement.innerHTML = this.currentText;
          if (onComplete) onComplete();
        }
      }
    };

    typeNextChar();
  }

  /**
   * Show text with glitch-reveal effect (vanilla JS implementation)
   */
  showWithGlitch(text, onComplete) {
    const finalText = Array.isArray(text) ? text[0] : text;
    this.textElement.textContent = finalText;
    this.textElement.classList.add('glitching');

    // Glitch characters
    const glitchChars = '█▓▒░ ><+-÷×=~!@#$%^&*()█▓▒░';
    let glitchIndex = 0;

    const glitchInterval = setInterval(() => {
      let glitchedText = '';
      for (let i = 0; i < finalText.length; i++) {
        if (i < glitchIndex) {
          glitchedText += finalText[i];
        } else {
          glitchedText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
      }
      this.textElement.textContent = glitchedText;
      
      glitchIndex += Math.random() * 3 + 1; // Random reveal speed
      
      if (glitchIndex >= finalText.length) {
        clearInterval(glitchInterval);
        this.textElement.textContent = finalText;
        this.textElement.classList.remove('glitching');
        if (onComplete) onComplete();
      }
    }, 50);
  }

  /**
   * Hide the dialogue box
   */
  hide() {
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = null;
    }

    this.container.classList.add('hidden');
    this.isShowing = false;
    this.cleanup();
  }

  /**
   * Clear the dialogue queue
   */
  clearQueue() {
    this.dialogueQueue = [];
    this.isProcessingQueue = false;
    this.currentDialogue = null;
    // No idle timer to clear
  }

  /**
   * Check if dialogue is currently playing
   */
  isDialoguePlaying() {
    return this.isProcessingQueue || this.isShowing;
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      isPlaying: this.isDialoguePlaying(),
      queueLength: this.dialogueQueue.length,
      currentDialogue: this.currentDialogue
    };
  }

  /**
   * Update the tone/intent
   */
  setTone(tone) {
    this.options.tone = tone;
    this.container.setAttribute('data-tone', tone);
  }

  /**
   * Update header label
   */
  setHeaderLabel(label) {
    this.options.headerLabel = label;
    const labelElement = this.container.querySelector('.ai-dialogue-label');
    if (labelElement) {
      labelElement.textContent = label;
    }
  }

  /**
   * Update footer caption
   */
  setFooterCaption(caption) {
    this.options.footerCaption = caption;
    const captionElement = this.container.querySelector('.ai-dialogue-caption');
    if (captionElement) {
      captionElement.textContent = caption;
    }
  }

  // Idle timer methods removed - box stays fully visible

  /**
   * Clean up active effects
   */
  cleanup() {
    if (this.typingInterval) {
      clearTimeout(this.typingInterval);
      this.typingInterval = null;
    }

    if (this.glitchInterval) {
      clearInterval(this.glitchInterval);
      this.glitchInterval = null;
    }

    this.textElement.innerHTML = '';
    this.textElement.classList.remove('glitching');
  }

  /**
   * Destroy the component
   */
  destroy() {
    this.cleanup();
    // No idle timer to clear
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Export a singleton instance for convenience
export const aiDialogueBox = new AIDialogueBox();
