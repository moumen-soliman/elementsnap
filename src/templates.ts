import type { ElementInfo } from './types';
import { escapeHtml } from './utils';

export interface RenderOptions {
  selectedElements: ElementInfo[];
  prompt: string;
  maxElements: number | null;
  isSelectionMode: boolean;
  selectedColor: string;
  className: string;
}

export interface BannerOptions {
  selectedCount: number;
  maxElements: number | null;
  selectedColor: string;
  autoOpenDialog: boolean;
  isPaused: boolean;
}

/**
 * Generates the HTML for the main dialog box
 */
export function generateDialogHTML(options: RenderOptions): string {
  const { selectedElements, prompt, maxElements, isSelectionMode, selectedColor, className } = options;

  return `
    <div data-drag-handle style="padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.06); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; cursor: move; user-select: none;">
      <div>
        <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #000000; letter-spacing: -0.01em;">
          Selected Elements
        </h3>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #666666; font-weight: 400;">
          ${selectedElements.length}${maxElements ? `/${maxElements}` : ''} element${selectedElements.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        ${isSelectionMode ? '<button data-finish-btn style="background: #000000; border: none; font-size: 12px; cursor: pointer; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 500; letter-spacing: -0.01em; transition: opacity 0.15s ease;">Done</button>' : ''}
        <button data-close-btn style="background: transparent; border: none; font-size: 18px; cursor: pointer; color: #666666; padding: 4px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.15s ease;">×</button>
      </div>
    </div>

    <div data-elements-list style="padding: 12px; max-height: 320px; overflow: auto; flex-grow: 1;">
      ${selectedElements.map((elementInfo, idx) => `
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
              <code style="background-color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; border: 1px solid rgba(0,0,0,0.06); font-weight: 500; word-break: break-all; display: block;">${escapeHtml(elementInfo.url)}</code>
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
                <code style="background-color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; border: 1px solid rgba(0,0,0,0.06); font-weight: 500; word-break: break-all; display: block;">${escapeHtml(elementInfo.selector)}</code>
              </div>
            ` : ''}
            <div style="margin-top: 10px; padding: 10px; background-color: #ffffff; border-radius: 6px; border: 1px solid rgba(0,0,0,0.06);">
              <span style="color: #666666; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">HTML</span>
              <pre style="margin: 0; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 10px; line-height: 1.5; color: #000000;">${escapeHtml(elementInfo.html)}</pre>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div style="padding: 12px 20px; border-top: 1px solid rgba(0,0,0,0.06); flex-shrink: 0;">
      <label for="prompt-textarea" style="display: block; margin-bottom: 8px; font-size: 12px; font-weight: 500; color: #000000; letter-spacing: -0.01em;">
        Additional Context
      </label>
      <textarea id="prompt-textarea" data-prompt-textarea placeholder="Add notes or context..." style="width: 100%; min-height: 64px; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; font-size: 13px; font-family: inherit; resize: vertical; box-sizing: border-box; transition: all 0.15s ease; background-color: #fafafa; color: #000000; outline: none;">${escapeHtml(prompt)}</textarea>
    </div>

    <div style="padding: 12px 20px 16px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; gap: 8px; flex-shrink: 0;">
      ${(!maxElements || selectedElements.length < maxElements) ? `
        <button data-add-more-btn style="flex: 1; padding: 10px 16px; background-color: #fafafa; color: #000000; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; letter-spacing: -0.01em;">
          Add More
        </button>
      ` : ''}
      <button data-clear-all-btn style="flex: 1; padding: 10px 16px; background-color: #fafafa; color: #ef4444; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; letter-spacing: -0.01em;">
        Clear All
      </button>
      <button data-copy-button style="flex: 2; padding: 10px 16px; background-color: #000000; color: #ffffff; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity 0.15s ease; letter-spacing: -0.01em;">
        Copy to Clipboard
      </button>
    </div>
  `;
}

/**
 * Generates the HTML for the selection banner
 */
export function generateBannerHTML(options: BannerOptions): string {
  const { selectedCount, maxElements, selectedColor, autoOpenDialog, isPaused } = options;

  return `
    <button data-toggle-pause style="background: transparent; border: none; cursor: pointer; padding: 0 8px 0 0; margin-right: 8px; border-right: 1px solid rgba(255,255,255,0.2); color: white; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; transition: opacity 0.2s; opacity: 0.7; pointer-events: auto;">
      ${isPaused ? '▶ Resume' : '⏸ Pause'}
    </button>
    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="opacity: 0.7">${isPaused ? 'Paused' : 'Click to select'}</span>
      •
      <span style="color: ${selectedColor}">${selectedCount}${maxElements ? `/${maxElements}` : ''}</span>
      ${!autoOpenDialog ? '<span style="opacity: 0.7"> • Enter to finish</span>' : ''}
      •
      <span style="opacity: 0.7">Esc to cancel</span>
    </div>
  `;
}

