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
    const tabId = tab.id!; // We already checked it's not undefined above

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

    // Automatically inject content script when popup opens (user gesture)
    // This works with activeTab permission
    const injectAndInit = () => {
      // First try to ping existing content script
      chrome.tabs.sendMessage(tabId, { type: 'ping' }, (response: any) => {
        if (chrome.runtime.lastError) {
          // Content script not loaded, inject it
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
          }).then(() => {
            // Wait a bit for script to load, then initialize
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, { type: 'init' }, (response: any) => {
                if (chrome.runtime.lastError) {
                  statusEl.textContent = 'ElementSnap ready! Press Ctrl+E to start';
                  statusEl.className = 'status active';
                } else if (response?.success) {
                  statusEl.textContent = 'ElementSnap initialized! Press Ctrl+E to start';
                  statusEl.className = 'status active';
                }
              });
            }, 100);
          }).catch((err) => {
            statusEl.textContent = 'Error: Could not inject script. Try refreshing the page.';
            statusEl.className = 'status';
            console.error('Failed to inject script:', err);
          });
        } else {
          // Content script already loaded, just initialize
          chrome.tabs.sendMessage(tabId, { type: 'init' }, (response: any) => {
            if (chrome.runtime.lastError) {
              statusEl.textContent = 'ElementSnap ready! Press Ctrl+E to start';
              statusEl.className = 'status active';
            } else if (response?.success) {
              statusEl.textContent = 'ElementSnap initialized! Press Ctrl+E to start';
              statusEl.className = 'status active';
            }
          });
        }
      });
    };

    // Inject and initialize automatically
    injectAndInit();

    // Initialize button click (for manual re-initialization)
    initBtn.addEventListener('click', () => {
      injectAndInit();
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

