// Popup script for Chrome extension

document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const initBtn = document.getElementById('initBtn');

  if (!statusEl || !initBtn) return;

  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id === undefined) {
      statusEl.textContent = 'No active tab found';
      return;
    }

    const tab = tabs[0];
    const tabId = tab.id;

    // Check if we can inject into this page
    const url = tab.url || '';
    const isInjectable = url && 
      !url.startsWith('chrome://') && 
      !url.startsWith('chrome-extension://') && 
      !url.startsWith('edge://') &&
      !url.startsWith('about:') &&
      !url.startsWith('moz-extension://');

    if (!isInjectable) {
      statusEl.textContent = 'Cannot use on this page (chrome://, extension pages, etc.)';
      statusEl.className = 'status';
      initBtn.style.display = 'none';
      return;
    }

    // Try to ping the content script to see if it's loaded
    chrome.tabs.sendMessage(tabId, { type: 'ping' }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script might not be loaded yet, that's okay
        statusEl.textContent = 'Ready - Content script will load automatically';
        statusEl.className = 'status';
      } else {
        statusEl.textContent = 'ElementSnap is active! Press Ctrl+E to start';
        statusEl.className = 'status active';
      }
    });

    // Initialize button click
    initBtn.addEventListener('click', () => {
      chrome.tabs.sendMessage(tabId, { type: 'init' }, (response) => {
        if (chrome.runtime.lastError) {
          // Try to inject the script if it's not loaded
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
          }).then(() => {
            statusEl.textContent = 'ElementSnap initialized! Press Ctrl+E to start';
            statusEl.className = 'status active';
          }).catch((err) => {
            statusEl.textContent = 'Error: Could not inject script. Try refreshing the page.';
            statusEl.className = 'status';
            console.error('Failed to inject script:', err);
          });
          return;
        }

        if (response?.success) {
          statusEl.textContent = 'ElementSnap initialized! Press Ctrl+E to start';
          statusEl.className = 'status active';
        }
      });
    });

    // Listen for selection changes
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'selectionChange') {
        if (message.count > 0) {
          statusEl.textContent = `${message.count} element(s) selected`;
          statusEl.className = 'status active';
        } else {
          statusEl.textContent = 'Ready to use';
          statusEl.className = 'status';
        }
      }
    });
  });
});

