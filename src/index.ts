import type { ElementInfo, SelectionPromptOptions } from './types';
import { getRandomPosition } from './utils';
import { getElementInfo, shouldExcludeElement } from './elementUtils';
import { formatElementsForCopy } from './copyUtils';
import { generateDialogHTML, generateBannerHTML } from './templates';

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
  isPaused: boolean;

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
    this.isPaused = false; // Initialize isPaused here

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

    // Load saved selection
    chrome.storage.local.get(['selectedElements'], (result) => {
      if (result.selectedElements && Array.isArray(result.selectedElements)) {
        this.selectedElements = result.selectedElements;
        if (this.selectedElements.length > 0) {
          // If we have saved elements, show the banner/dialog
          this.isVisible = false; // Start hidden, user can open with hotkey or if they select more
          this.renderBanner();
        }
      }
    });
  }

  handleMouseMove = (e: MouseEvent): void => {
    if (!this.isSelectionMode || this.isPaused) return;
    if (this.boxElement && this.boxElement.contains(e.target as Node)) return;
    if (this.bannerElement && this.bannerElement.contains(e.target as Node)) return;

    const element = e.target as HTMLElement;

    if (element.tagName === 'BODY' || element.tagName === 'HTML') return;
    if (shouldExcludeElement(element, this.excludeSelectors)) return;

    this.setHoveredElement(element);
  }

  handleClick = (e: MouseEvent): void => {
    if (!this.isSelectionMode || this.isPaused) return;
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
    if (shouldExcludeElement(element, this.excludeSelectors)) return;

    const info = getElementInfo(element);
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

      // Save to storage (remove element reference as it's not serializable)
      const serializableSelection = newSelection.map(item => {
        const { element, ...rest } = item;
        return rest;
      });
      chrome.storage.local.set({ selectedElements: serializableSelection });

      this.setHoveredElement(null);
      this.updateSelectedElementsStyles();
      this.renderBanner(); // Update banner with new count

      if (this.autoOpenDialog && newSelection.length > 0 && !this.isVisible) {
        this.position = getRandomPosition();
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
      // If we already have selected elements or the dialog is open, resume selection
      // instead of starting over (which clears selection)
      if (this.selectedElements.length > 0 || this.isVisible) {
        this.resumeSelectionMode();
      } else {
        this.startSelectionMode();
      }
    } else if (e.key === ' ' && this.isSelectionMode) {
      // Spacebar to toggle pause
      e.preventDefault();
      this.togglePause();
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
      if (!element) return; // Skip if element is not on this page (loaded from storage)
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

    // Update storage
    const serializableSelection = newSelection.map(item => {
      const { element, ...rest } = item;
      return rest;
    });
    chrome.storage.local.set({ selectedElements: serializableSelection });

    this.updateSelectedElementsStyles();
    this.render();
  }

  clearSelection(): void {
    this.selectedElements = [];
    if (this.onSelectionChange) {
      this.onSelectionChange([]);
    }
    chrome.storage.local.remove('selectedElements');
    this.updateSelectedElementsStyles();
    this.render();
  }

  handleCopy(): void {
    if (this.selectedElements.length === 0) return;

    const output = formatElementsForCopy(this.selectedElements, this.prompt);

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
    this.selectedElements = []; // Clear selected elements on close
    this.setHoveredElement(null);
    this.isSelectionMode = false;
    if (this.onSelectionChange) {
      this.onSelectionChange([]);
    }
    chrome.storage.local.remove('selectedElements'); // Clear storage on close
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
    chrome.storage.local.remove('selectedElements');
    this.updateSelectedElementsStyles();

    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleClick, true);

    this.renderBanner();
  }

  resumeSelectionMode(): void {
    // Close the dialog but keep the selected elements
    this.isVisible = false;
    this.cleanup();

    // Re-enter selection mode
    this.isSelectionMode = true;

    // Re-apply styles to selected elements (they might have been cleared)
    this.updateSelectedElementsStyles();

    // Ensure event listeners are attached
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleClick, true);

    this.renderBanner();
  }

  finishSelection(): void {
    this.isSelectionMode = false;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick, true);

    if (this.selectedElements.length > 0 && !this.isVisible) {
      this.position = getRandomPosition();
      this.showDialog();
    }

    this.removeBanner();
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.setHoveredElement(null);
      document.body.style.cursor = 'default';
    } else {
      document.body.style.cursor = 'crosshair';
    }
    this.renderBanner();
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });

    this.bannerElement.innerHTML = generateBannerHTML({
      selectedCount: this.selectedElements.length,
      maxElements: this.maxElements,
      selectedColor: this.selectedColor,
      autoOpenDialog: this.autoOpenDialog,
      isPaused: this.isPaused,
    });

    // Attach banner listeners
    const toggleBtn = this.bannerElement.querySelector('[data-toggle-pause]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.togglePause();
      });
      toggleBtn.addEventListener('mouseenter', (e) => {
        (e.target as HTMLElement).style.opacity = '1';
      });
      toggleBtn.addEventListener('mouseleave', (e) => {
        (e.target as HTMLElement).style.opacity = '0.7';
      });
    }
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

    this.boxElement.innerHTML = generateDialogHTML({
      selectedElements: this.selectedElements,
      prompt: this.prompt,
      maxElements: this.maxElements,
      isSelectionMode: this.isSelectionMode,
      selectedColor: this.selectedColor,
      className: this.className,
    });

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
      addMoreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.resumeSelectionMode();
      });
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

    // Clear All button
    const clearAllBtn = this.boxElement.querySelector('[data-clear-all-btn]');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.clearSelection());
      clearAllBtn.addEventListener('mouseenter', (e) => {
        const target = e.target as HTMLElement;
        target.style.backgroundColor = '#fee2e2';
        target.style.color = '#ef4444';
        target.style.borderColor = '#fca5a5';
      });
      clearAllBtn.addEventListener('mouseleave', (e) => {
        const target = e.target as HTMLElement;
        target.style.backgroundColor = '#fafafa';
        target.style.color = '#ef4444';
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
export type { ElementInfo, SelectionPromptOptions };
