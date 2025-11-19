// ElementSnap.ts - TypeScript version

export interface ElementInfo {
  tag: string;
  id: string;
  classes: string[];
  html: string;
  text: string;
  element: HTMLElement;
  url: string;
  selector: string | null;
}

export interface SelectionPromptOptions {
  enabled?: boolean;
  onCopy?: (data: string) => void;
  onSelectionChange?: (elements: ElementInfo[]) => void;
  className?: string;
  hotkey?: string;
  hotkeyModifier?: 'ctrl' | 'alt' | 'shift';
  maxElements?: number;
  showBanner?: boolean;
  autoOpenDialog?: boolean;
  hoverColor?: string;
  selectedColor?: string;
  excludeSelectors?: string[];
}

class ElementSnap {
  // Options with defaults
  enabled: boolean;
  onCopy: ((data: string) => void) | null;
  onSelectionChange: ((elements: ElementInfo[]) => void) | null;
  className: string;
  hotkey: string;
  hotkeyModifier: 'ctrl' | 'alt' | 'shift';
  maxElements: number | null;
  showBanner: boolean;
  autoOpenDialog: boolean;
  hoverColor: string;
  selectedColor: string;
  excludeSelectors: string[];

  // State
  isVisible: boolean;
  selectedElements: ElementInfo[];
  prompt: string;
  position: { x: number; y: number };
  hoveredElement: HTMLElement | null;
  isSelectionMode: boolean;
  isDragging: boolean;
  dragOffset: { x: number; y: number };

  // DOM references
  boxElement: HTMLDivElement | null;
  bannerElement: HTMLDivElement | null;

  constructor(options: SelectionPromptOptions = {}) {
    // Options with defaults
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.onCopy = options.onCopy || null;
    this.onSelectionChange = options.onSelectionChange || null;
    this.className = options.className || '';
    this.hotkey = options.hotkey || 'e';
    this.hotkeyModifier = options.hotkeyModifier || 'ctrl';
    this.maxElements = options.maxElements || null;
    this.showBanner = options.showBanner !== undefined ? options.showBanner : true;
    this.autoOpenDialog = options.autoOpenDialog || false;
    this.hoverColor = options.hoverColor || '#000000';
    this.selectedColor = options.selectedColor || '#000000';
    this.excludeSelectors = options.excludeSelectors || [];

    // State
    this.isVisible = false;
    this.selectedElements = [];
    this.prompt = '';
    this.position = { x: 0, y: 0 };
    this.hoveredElement = null;
    this.isSelectionMode = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };

    // DOM references
    this.boxElement = null;
    this.bannerElement = null;

    // Initialize
    if (this.enabled) {
      this.init();
    }
  }

  init(): void {
    document.addEventListener('keyup', this.handleKeyUp);
  }

  shouldExcludeElement(element: HTMLElement): boolean {
    if (this.excludeSelectors.length === 0) return false;
    return this.excludeSelectors.some(selector => {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    });
  }

  isInteractiveElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    
    // Check if element is a button, input, select, textarea
    if (['button', 'input', 'select', 'textarea'].includes(tagName)) {
      return true;
    }
    
    // Check if element has role="button"
    const role = element.getAttribute('role');
    if (role === 'button') {
      return true;
    }
    
    // Check if element has onclick handler or is contenteditable
    if (element.hasAttribute('onclick') || element.contentEditable === 'true') {
      return true;
    }
    
    return false;
  }

  getUniqueSelector(el: Element | null): string | null {
    try {
      if (!(el instanceof Element)) return null;

      const path: string[] = [];
      let currentEl: Element | null = el;

      while (currentEl && currentEl.nodeType === Node.ELEMENT_NODE) {
        const currentTagName = currentEl.nodeName;
        if (!currentTagName) break;
        
        let selector = currentTagName.toLowerCase();

        // Add nth-child if necessary
        if (currentEl.parentNode) {
          try {
            const siblings = Array.from(currentEl.parentNode.children);
            const sameTagSiblings = siblings.filter(s => s.nodeName === currentTagName);

            if (sameTagSiblings.length > 1) {
              const index = sameTagSiblings.indexOf(currentEl) + 1;
              if (index > 0) {
                selector += `:nth-of-type(${index})`;
              }
            }
          } catch (e) {
            // If we can't get siblings, just use the tag name
          }
        }

        path.unshift(selector);
        currentEl = currentEl.parentElement;
        
        // Safety check to prevent infinite loops
        if (path.length > 100) break;
      }

      return path.length > 0 ? path.join(" > ") : null;
    } catch (e) {
      console.error('Error generating selector:', e);
      return null;
    }
  }

  getElementInfo(element: HTMLElement | null): ElementInfo | null {
    if (!element) return null;

    let url = '';
    try {
      if (typeof window !== 'undefined' && window.location) {
        url = window.location.href;
      }
    } catch (e) {
      // If we can't get the URL, just use empty string
      console.warn('Could not get page URL:', e);
    }

    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || '',
      classes: Array.from(element.classList),
      html: element.outerHTML.substring(0, 500),
      text: element.textContent?.trim().substring(0, 200) || '',
      element: element,
      url: url,
      selector: this.getUniqueSelector(element),
    };
  }

  getRandomPosition(): { x: number; y: number } {
    if (typeof window === 'undefined') return { x: 100, y: 100 };

    const padding = 20;
    const boxWidth = 480;
    const boxHeight = 500;

    const maxX = window.innerWidth - boxWidth - padding;
    const maxY = window.innerHeight - boxHeight - padding;

    return {
      x: Math.max(padding, Math.floor(Math.random() * maxX)),
      y: Math.max(padding, Math.floor(Math.random() * maxY)),
    };
  }

  handleMouseMove = (e: MouseEvent): void => {
    if (!this.isSelectionMode) return;
    if (this.boxElement && this.boxElement.contains(e.target as Node)) return;
    if (this.bannerElement && this.bannerElement.contains(e.target as Node)) return;

    const element = e.target as HTMLElement;
    
    if (element.tagName === 'BODY' || element.tagName === 'HTML') return;
    if (this.shouldExcludeElement(element)) return;
    
    this.setHoveredElement(element);
  }

  handleClick = (e: MouseEvent): void => {
    if (!this.isSelectionMode) return;
    if (this.boxElement && this.boxElement.contains(e.target as Node)) return;
    if (this.bannerElement && this.bannerElement.contains(e.target as Node)) return;

    // Get the actual HTML element (e.target might be a text node)
    let element = e.target as HTMLElement;
    if (element && element.nodeType !== Node.ELEMENT_NODE) {
      element = element.parentElement as HTMLElement;
    }
    if (!element || !(element instanceof HTMLElement)) return;
    
    // In selection mode, prevent default behavior for ALL elements
    // This includes links, which should be selectable, not clickable
    e.preventDefault();
    e.stopPropagation();
    
    if (element.tagName === 'BODY' || element.tagName === 'HTML') return;
    if (this.shouldExcludeElement(element)) return;

    const info = this.getElementInfo(element);
    if (info) {
      const isAlreadySelected = this.selectedElements.some(sel => sel.element === element);
      
      let newSelection: ElementInfo[];
      if (isAlreadySelected) {
        newSelection = this.selectedElements.filter(sel => sel.element !== element);
      } else {
        if (this.maxElements && this.selectedElements.length >= this.maxElements) {
          return;
        }
        newSelection = [...this.selectedElements, info];
      }
      
      this.selectedElements = newSelection;
      if (this.onSelectionChange) {
        this.onSelectionChange(newSelection);
      }
      
      this.setHoveredElement(null);
      this.updateSelectedElementsStyles();
      this.renderBanner(); // Update banner with new count
      
      if (this.autoOpenDialog && newSelection.length > 0 && !this.isVisible) {
        this.position = this.getRandomPosition();
        this.showDialog();
      }
    }
  }

  handleKeyUp = (e: KeyboardEvent): void => {
    if (!this.enabled) return;

    if (e.key === 'Escape') {
      this.handleClose();
    } else if (
      ((this.hotkeyModifier === 'ctrl' && (e.ctrlKey || e.metaKey)) ||
       (this.hotkeyModifier === 'alt' && e.altKey) ||
       (this.hotkeyModifier === 'shift' && e.shiftKey)) &&
      e.key.toLowerCase() === this.hotkey.toLowerCase()
    ) {
      e.preventDefault();
      this.startSelectionMode();
    } else if (e.key === 'Enter' && this.isSelectionMode && !this.autoOpenDialog) {
      this.finishSelection();
    }
  }

  setHoveredElement(element: HTMLElement | null): void {
    // Clean up previous hover
    if (this.hoveredElement) {
      this.hoveredElement.style.outline = (this.hoveredElement as any)._originalOutline || '';
      this.hoveredElement.style.outlineOffset = (this.hoveredElement as any)._originalOutlineOffset || '';
      this.hoveredElement.style.cursor = (this.hoveredElement as any)._originalCursor || '';
    }

    this.hoveredElement = element;

    if (element) {
      (element as any)._originalOutline = element.style.outline;
      (element as any)._originalOutlineOffset = element.style.outlineOffset;
      (element as any)._originalCursor = element.style.cursor;

      element.style.outline = `2px solid ${this.hoverColor}`;
      element.style.outlineOffset = '2px';
      element.style.cursor = 'crosshair';
    }
  }

  updateSelectedElementsStyles(): void {
    // Clean up all previous selections
    document.querySelectorAll('[data-selection-prompt-selected]').forEach(el => {
      const element = el as HTMLElement;
      element.style.outline = (element as any)._selectedOriginalOutline || '';
      element.style.outlineOffset = (element as any)._selectedOriginalOutlineOffset || '';
      element.style.boxShadow = (element as any)._selectedOriginalBoxShadow || '';
      delete (element as any)._selectedOriginalOutline;
      delete (element as any)._selectedOriginalOutlineOffset;
      delete (element as any)._selectedOriginalBoxShadow;
      element.removeAttribute('data-selection-prompt-selected');
    });

    // Apply styles to current selection
    this.selectedElements.forEach(({ element }) => {
      (element as any)._selectedOriginalOutline = element.style.outline;
      (element as any)._selectedOriginalOutlineOffset = element.style.outlineOffset;
      (element as any)._selectedOriginalBoxShadow = element.style.boxShadow;

      element.style.outline = `2px dashed ${this.selectedColor}`;
      element.style.outlineOffset = '2px';
      element.style.boxShadow = `0 0 0 4px ${this.selectedColor}20`;
      element.setAttribute('data-selection-prompt-selected', 'true');
    });
  }

  removeElement(index: number): void {
    const newSelection = this.selectedElements.filter((_, i) => i !== index);
    this.selectedElements = newSelection;
    if (this.onSelectionChange) {
      this.onSelectionChange(newSelection);
    }
    this.updateSelectedElementsStyles();
    this.render();
  }

  handleCopy(): void {
    if (this.selectedElements.length === 0) return;

    const elementsData = this.selectedElements.map((elementInfo, idx) => {
      const classesStr = elementInfo.classes.length > 0
        ? `classes: ${elementInfo.classes.join(' ')}`
        : '';
      const idStr = elementInfo.id ? `id: ${elementInfo.id}` : '';
      const tagStr = `tag: ${elementInfo.tag}`;
      const urlStr = `url: ${elementInfo.url}`;
      const selectorStr = elementInfo.selector ? `selector: ${elementInfo.selector}` : '';

      const parts = [
        `=== Element ${idx + 1} ===`,
        urlStr,
        tagStr,
        idStr,
        classesStr,
        selectorStr,
        `\nHTML:\n${elementInfo.html}`,
      ].filter(Boolean);

      return parts.join('\n');
    }).join('\n\n');

    const output = this.prompt 
      ? `${elementsData}\n\n=== Prompt ===\n${this.prompt}`
      : elementsData;
    
    navigator.clipboard.writeText(output).then(() => {
      if (this.onCopy) {
        this.onCopy(output);
      }
      const button = this.boxElement?.querySelector('[data-copy-button]') as HTMLButtonElement | null;
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✓ Copied';
        setTimeout(() => {
          if (button) button.textContent = originalText;
        }, 2000);
      }
    }).catch((err) => {
      console.error('Failed to copy:', err);
    });
  }

  handleClose(): void {
    this.isVisible = false;
    this.prompt = '';
    this.selectedElements = [];
    this.setHoveredElement(null);
    this.isSelectionMode = false;
    if (this.onSelectionChange) {
      this.onSelectionChange([]);
    }
    this.updateSelectedElementsStyles();
    this.cleanup();
  }

  startSelectionMode(): void {
    this.isSelectionMode = true;
    if (!this.autoOpenDialog) {
      this.isVisible = false;
      this.cleanup();
    }
    this.selectedElements = [];
    if (this.onSelectionChange) {
      this.onSelectionChange([]);
    }
    this.updateSelectedElementsStyles();
    
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleClick, true);
    
    this.renderBanner();
  }

  finishSelection(): void {
    this.isSelectionMode = false;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick, true);
    
    if (this.selectedElements.length > 0 && !this.isVisible) {
      this.position = this.getRandomPosition();
      this.showDialog();
    }
    
    this.removeBanner();
  }

  showDialog(): void {
    this.isVisible = true;
    this.render();
  }

  renderBanner(): void {
    if (!this.showBanner || this.isVisible) {
      this.removeBanner();
      return;
    }

    if (!this.bannerElement) {
      this.bannerElement = document.createElement('div');
      this.bannerElement.setAttribute('data-selection-prompt-banner', 'true');
      document.body.appendChild(this.bannerElement);
    }

    Object.assign(this.bannerElement.style, {
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '8px 16px',
      borderRadius: '9999px',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(12px)',
      zIndex: '10000',
      fontSize: '13px',
      fontWeight: '500',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      pointerEvents: 'none',
      textAlign: 'center',
      letterSpacing: '-0.01em',
    });

    this.bannerElement.innerHTML = `
      <span style="opacity: 0.7">Click to select</span>
      •
      <span style="color: ${this.selectedColor}">${this.selectedElements.length}${this.maxElements ? `/${this.maxElements}` : ''}</span>
      ${!this.autoOpenDialog ? '<span style="opacity: 0.7"> • Enter to finish</span>' : ''}
      •
      <span style="opacity: 0.7">Esc to cancel</span>
    `;
  }

  removeBanner(): void {
    if (this.bannerElement) {
      this.bannerElement.remove();
      this.bannerElement = null;
    }
  }

  render(): void {
    if (!this.isVisible || this.selectedElements.length === 0) {
      this.cleanup();
      return;
    }

    if (!this.boxElement) {
      this.boxElement = document.createElement('div');
      this.boxElement.className = `selection-prompt-box ${this.className}`;
      this.boxElement.setAttribute('data-selection-prompt-box', 'true');
      document.body.appendChild(this.boxElement);
    }

    Object.assign(this.boxElement.style, {
      position: 'fixed',
      left: `${this.position.x}px`,
      top: `${this.position.y}px`,
      zIndex: '9999',
      backgroundColor: '#ffffff',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: '12px',
      padding: '0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      width: '480px',
      maxHeight: '85vh',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    });

    this.boxElement.innerHTML = `
      <div data-drag-handle style="padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.06); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; cursor: move; user-select: none;">
        <div>
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #000000; letter-spacing: -0.01em;">
            Selected Elements
          </h3>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #666666; font-weight: 400;">
            ${this.selectedElements.length}${this.maxElements ? `/${this.maxElements}` : ''} element${this.selectedElements.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${this.isSelectionMode ? '<button data-finish-btn style="background: #000000; border: none; font-size: 12px; cursor: pointer; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 500; letter-spacing: -0.01em; transition: opacity 0.15s ease;">Done</button>' : ''}
          <button data-close-btn style="background: transparent; border: none; font-size: 18px; cursor: pointer; color: #666666; padding: 4px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.15s ease;">×</button>
        </div>
      </div>

      <div data-elements-list style="padding: 12px; max-height: 320px; overflow: auto; flex-grow: 1;">
        ${this.selectedElements.map((elementInfo, idx) => `
          <div style="margin-bottom: 8px; padding: 12px; background-color: #fafafa; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; transition: all 0.15s ease;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div style="font-size: 11px; font-weight: 600; color: #666666; text-transform: uppercase; letter-spacing: 0.05em;">
                Element ${idx + 1}
              </div>
              <button data-remove-btn="${idx}" style="background: transparent; border: 1px solid rgba(0,0,0,0.1); color: #666666; padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.15s ease; letter-spacing: -0.01em;">
                Remove
              </button>
            </div>
            
            <div style="font-size: 12px; color: #000000;">
              <div style="margin-bottom: 6px;">
                <span style="color: #666666; font-size: 11px; font-weight: 500; display: block; margin-bottom: 4px;">URL:</span>
                <code style="background-color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; border: 1px solid rgba(0,0,0,0.06); font-weight: 500; word-break: break-all; display: block;">${this.escapeHtml(elementInfo.url)}</code>
              </div>
              <div style="margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                <span style="color: #666666; font-size: 11px; font-weight: 500;">Tag:</span>
                <code style="background-color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; border: 1px solid rgba(0,0,0,0.06); font-weight: 500;">${elementInfo.tag}</code>
              </div>
              ${elementInfo.id ? `
                <div style="margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                  <span style="color: #666666; font-size: 11px; font-weight: 500;">ID:</span>
                  <code style="background-color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; border: 1px solid rgba(0,0,0,0.06); font-weight: 500;">${elementInfo.id}</code>
                </div>
              ` : ''}
              ${elementInfo.classes.length > 0 ? `
                <div style="margin-bottom: 6px;">
                  <span style="color: #666666; font-size: 11px; font-weight: 500; display: block; margin-bottom: 4px;">Classes:</span>
                  <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                    ${elementInfo.classes.map(cls => `
                      <code style="background-color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; border: 1px solid rgba(0,0,0,0.06); font-weight: 500;">
                        ${cls}
                      </code>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${elementInfo.selector ? `
                <div style="margin-bottom: 6px;">
                  <span style="color: #666666; font-size: 11px; font-weight: 500; display: block; margin-bottom: 4px;">Selector:</span>
                  <code style="background-color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; border: 1px solid rgba(0,0,0,0.06); font-weight: 500; word-break: break-all; display: block;">${this.escapeHtml(elementInfo.selector)}</code>
                </div>
              ` : ''}
              <div style="margin-top: 10px; padding: 10px; background-color: #ffffff; border-radius: 6px; border: 1px solid rgba(0,0,0,0.06);">
                <span style="color: #666666; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">HTML</span>
                <pre style="margin: 0; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 10px; line-height: 1.5; color: #000000;">${this.escapeHtml(elementInfo.html)}</pre>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="padding: 12px 20px; border-top: 1px solid rgba(0,0,0,0.06); flex-shrink: 0;">
        <label for="prompt-textarea" style="display: block; margin-bottom: 8px; font-size: 12px; font-weight: 500; color: #000000; letter-spacing: -0.01em;">
          Additional Context
        </label>
        <textarea id="prompt-textarea" data-prompt-textarea placeholder="Add notes or context..." style="width: 100%; min-height: 64px; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; font-size: 13px; font-family: inherit; resize: vertical; box-sizing: border-box; transition: all 0.15s ease; background-color: #fafafa; color: #000000; outline: none;">${this.prompt}</textarea>
      </div>

      <div style="padding: 12px 20px 16px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; gap: 8px; flex-shrink: 0;">
        ${(!this.maxElements || this.selectedElements.length < this.maxElements) ? `
          <button data-add-more-btn style="flex: 1; padding: 10px 16px; background-color: #fafafa; color: #000000; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; letter-spacing: -0.01em;">
            Add More
          </button>
        ` : ''}
        <button data-copy-button style="flex: 2; padding: 10px 16px; background-color: #000000; color: #ffffff; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity 0.15s ease; letter-spacing: -0.01em;">
          Copy to Clipboard
        </button>
      </div>
    `;

    this.attachEventListeners();
  }

  handleDragStart = (e: MouseEvent): void => {
    // Don't start drag if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    
    this.isDragging = true;
    const rect = this.boxElement!.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    document.addEventListener('mousemove', this.handleDragMove);
    document.addEventListener('mouseup', this.handleDragEnd);
    e.preventDefault();
  }

  handleDragMove = (e: MouseEvent): void => {
    if (!this.isDragging || !this.boxElement) return;
    
    const newX = e.clientX - this.dragOffset.x;
    const newY = e.clientY - this.dragOffset.y;
    
    // Constrain to window bounds
    const boxWidth = this.boxElement.offsetWidth;
    const boxHeight = this.boxElement.offsetHeight;
    const maxX = window.innerWidth - boxWidth;
    const maxY = window.innerHeight - boxHeight;
    
    this.position = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    };
    
    this.boxElement.style.left = `${this.position.x}px`;
    this.boxElement.style.top = `${this.position.y}px`;
  }

  handleDragEnd = (): void => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);
  }

  attachEventListeners(): void {
    if (!this.boxElement) return;

    // Drag handle
    const dragHandle = this.boxElement.querySelector('[data-drag-handle]');
    if (dragHandle) {
      dragHandle.addEventListener('mousedown', this.handleDragStart as EventListener);
    }

    // Close button
    const closeBtn = this.boxElement.querySelector('[data-close-btn]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.handleClose());
      closeBtn.addEventListener('mouseenter', (e) => {
        const target = e.target as HTMLElement;
        target.style.backgroundColor = 'rgba(0,0,0,0.05)';
        target.style.color = '#000000';
      });
      closeBtn.addEventListener('mouseleave', (e) => {
        const target = e.target as HTMLElement;
        target.style.backgroundColor = 'transparent';
        target.style.color = '#666666';
      });
    }

    // Finish button
    const finishBtn = this.boxElement.querySelector('[data-finish-btn]');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => this.finishSelection());
      finishBtn.addEventListener('mouseenter', (e) => {
        (e.target as HTMLElement).style.opacity = '0.8';
      });
      finishBtn.addEventListener('mouseleave', (e) => {
        (e.target as HTMLElement).style.opacity = '1';
      });
    }

    // Remove buttons
    this.boxElement.querySelectorAll('[data-remove-btn]').forEach(btn => {
      const idx = parseInt(btn.getAttribute('data-remove-btn') || '0');
      btn.addEventListener('click', () => this.removeElement(idx));
      btn.addEventListener('mouseenter', (e) => {
        const target = e.target as HTMLElement;
        target.style.backgroundColor = '#000000';
        target.style.color = '#ffffff';
        target.style.borderColor = '#000000';
      });
      btn.addEventListener('mouseleave', (e) => {
        const target = e.target as HTMLElement;
        target.style.backgroundColor = 'transparent';
        target.style.color = '#666666';
        target.style.borderColor = 'rgba(0,0,0,0.1)';
      });
    });

    // Prompt textarea
    const textarea = this.boxElement.querySelector('[data-prompt-textarea]') as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.addEventListener('input', (e) => {
        this.prompt = (e.target as HTMLTextAreaElement).value;
      });
      textarea.addEventListener('focus', (e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.borderColor = '#000000';
        target.style.backgroundColor = '#ffffff';
      });
      textarea.addEventListener('blur', (e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.borderColor = 'rgba(0,0,0,0.1)';
        target.style.backgroundColor = '#fafafa';
      });
    }

    // Add More button
    const addMoreBtn = this.boxElement.querySelector('[data-add-more-btn]');
    if (addMoreBtn) {
      addMoreBtn.addEventListener('click', () => this.startSelectionMode());
      addMoreBtn.addEventListener('mouseenter', (e) => {
        const target = e.target as HTMLElement;
        target.style.backgroundColor = '#000000';
        target.style.color = '#ffffff';
        target.style.borderColor = '#000000';
      });
      addMoreBtn.addEventListener('mouseleave', (e) => {
        const target = e.target as HTMLElement;
        target.style.backgroundColor = '#fafafa';
        target.style.color = '#000000';
        target.style.borderColor = 'rgba(0,0,0,0.1)';
      });
    }

    // Copy button
    const copyBtn = this.boxElement.querySelector('[data-copy-button]');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.handleCopy());
      copyBtn.addEventListener('mouseenter', (e) => {
        (e.target as HTMLElement).style.opacity = '0.8';
      });
      copyBtn.addEventListener('mouseleave', (e) => {
        (e.target as HTMLElement).style.opacity = '1';
      });
    }
  }

  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  cleanup(): void {
    // Clean up drag listeners
    this.handleDragEnd();
    
    if (this.boxElement) {
      this.boxElement.remove();
      this.boxElement = null;
    }
    this.removeBanner();
  }

  destroy(): void {
    this.handleClose();
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);
  }
}

// Export for different module systems
export default ElementSnap;