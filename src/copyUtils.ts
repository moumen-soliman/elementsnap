import type { ElementInfo } from './types';

/**
 * Formats element data for copying to clipboard
 */
export function formatElementsForCopy(
  elements: ElementInfo[],
  prompt: string
): string {
  if (elements.length === 0) return '';

  const elementsData = elements.map((elementInfo, idx) => {
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

  return prompt 
    ? `${elementsData}\n\n=== Prompt ===\n${prompt}`
    : elementsData;
}

