# ElementSnap Chrome Extension

This is the Chrome extension version of ElementSnap. It allows you to select and capture DOM elements on any webpage.

## Building the Extension

1. Install dependencies:
```bash
npm install
```

2. Build the extension files:
```bash
npm run build:extension
```

This will generate:
- `content.js` - Content script that runs on web pages
- `popup.js` - Popup script for the extension UI

## Creating Icons

1. Open `create-icons.html` in your browser
2. Click "Generate Icons"
3. Right-click each canvas and save as:
   - `icons/icon16.png`
   - `icons/icon32.png`
   - `icons/icon48.png`
   - `icons/icon128.png`

Alternatively, you can create your own icons with these dimensions.

## Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the project root directory (`/Users/moumensoliman/code/elementsnap`)
5. The extension should now be loaded!

## Using the Extension

1. Navigate to any webpage
2. Click the ElementSnap extension icon in the toolbar
3. Click "Initialize on Page" (or it will auto-initialize)
4. Press `Ctrl+E` (or `Cmd+E` on Mac) to start selection mode
5. Click elements to select them
6. Press `Enter` to open the dialog
7. Add context notes if needed
8. Click "Copy to Clipboard" to export

## Keyboard Shortcuts

- `Ctrl+E` / `Cmd+E` - Start selection mode
- `Enter` - Finish selection and open dialog
- `Esc` - Cancel and close

## File Structure

```
elementsnap/
├── manifest.json          # Extension manifest
├── content.js            # Content script (built)
├── popup.html            # Popup UI
├── popup.js              # Popup script (built)
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── src/
    ├── index.ts          # Core ElementSnap library
    ├── content.ts        # Content script source
    └── popup.ts          # Popup script source
```

## Development

To watch for changes during development:

```bash
# Terminal 1: Watch content script
tsup src/content.ts --format iife --global-name ElementSnapContent --out-dir . --out-file content.js --no-splitting --watch

# Terminal 2: Watch popup script
tsup src/popup.ts --format iife --out-dir . --out-file popup.js --no-splitting --watch
```

After making changes, reload the extension in `chrome://extensions/`.

