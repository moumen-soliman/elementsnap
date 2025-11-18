// Content script for Chrome extension
// This injects ElementSnap into web pages

import ElementSnap from './index';

// Initialize ElementSnap when the page loads
let elementSnap: ElementSnap | null = null;

function initElementSnap() {
  // Only initialize once
  if (elementSnap) {
    return;
  }

  // Wait for DOM to be ready
  const init = () => {
    elementSnap = new ElementSnap({
      enabled: true,
      hotkey: 'e',
      hotkeyModifier: 'ctrl',
      showBanner: true,
      autoOpenDialog: false,
      hoverColor: '#0066ff',
      selectedColor: '#00cc66',
      onCopy: (data) => {
        console.log('ElementSnap: Copied to clipboard');
      },
      onSelectionChange: (elements) => {
        // Send message to popup if needed
        try {
          chrome.runtime.sendMessage({
            type: 'selectionChange',
            count: elements.length
          }).catch(() => {
            // Ignore errors if popup is not open
          });
        } catch (e) {
          // Ignore errors
        }
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((
  message: { type: string },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  if (message.type === 'ping') {
    // Respond to ping to confirm content script is loaded
    sendResponse({ loaded: true });
  } else if (message.type === 'init') {
    initElementSnap();
    sendResponse({ success: true });
  } else if (message.type === 'toggle') {
    if (elementSnap) {
      elementSnap.destroy();
      elementSnap = null;
    } else {
      initElementSnap();
    }
    sendResponse({ success: true });
  }
  return true;
});

// Initialize on page load
initElementSnap();

