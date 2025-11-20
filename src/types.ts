export interface ElementInfo {
  tag: string;
  id: string;
  classes: string[];
  html: string;
  text: string;
  element?: HTMLElement;
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

