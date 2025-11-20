/**
 * Generates a unique CSS selector for an element
 */
export function getUniqueSelector(el: Element | null): string | null {
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

/**
 * Escapes HTML special characters
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Gets a random position for the dialog box within the viewport
 */
export function getRandomPosition(): { x: number; y: number } {
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

