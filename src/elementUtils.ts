import type { ElementInfo } from './types';
import { getUniqueSelector } from './utils';

/**
 * Checks if an element should be excluded based on selectors
 */
export function shouldExcludeElement(
  element: HTMLElement,
  excludeSelectors: string[]
): boolean {
  if (excludeSelectors.length === 0) return false;
  return excludeSelectors.some(selector => {
    try {
      return element.matches(selector);
    } catch {
      return false;
    }
  });
}

/**
 * Checks if an element is interactive (button, input, etc.)
 */
export function isInteractiveElement(element: HTMLElement): boolean {
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

/**
 * Extracts information from an HTML element
 */
export function getElementInfo(element: HTMLElement | null): ElementInfo | null {
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
    selector: getUniqueSelector(element),
  };
}

