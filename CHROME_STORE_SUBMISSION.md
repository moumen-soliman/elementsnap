# Chrome Web Store Submission Guide

## Permission Justifications

### activeTab
**Justification:**
ElementSnap needs access to the active tab to inject the content script that enables element selection functionality. This permission allows the extension to interact with the webpage's DOM to highlight and select elements when the user activates the tool with Ctrl+E.

### clipboardWrite
**Justification:**
ElementSnap copies selected element information (HTML, classes, IDs, etc.) to the user's clipboard when they click the "Copy to Clipboard" button. This is the core functionality - allowing users to quickly copy element details for debugging, documentation, or sharing with AI assistants. The extension only writes to the clipboard when explicitly requested by the user.

### host_permissions (<all_urls>)
**Justification:**
ElementSnap needs to work on any website the user visits, as developers may need to inspect elements on any webpage. The extension only activates when the user explicitly triggers it with Ctrl+E, and it only reads the DOM structure of elements the user selects. No data is transmitted to external servers - all processing happens locally in the browser.

### remote code
**Justification:**
ElementSnap does not use remote code. All code is bundled locally in the extension package. The content script is included in the extension bundle and runs entirely on the user's device.

### scripting
**Justification:**
The scripting permission is used as a fallback mechanism to inject the content script if it hasn't loaded automatically on a page. This ensures the extension works reliably across all websites, including dynamically loaded pages. The script injection only occurs when the user explicitly clicks the "Initialize" button in the popup, and only the bundled content script is executed - no external code is loaded.

## Single Purpose Description

**Single Purpose:**
ElementSnap is a developer tool that allows users to visually select DOM elements on any webpage and copy their details (HTML, classes, IDs) to the clipboard. This helps developers quickly extract element information for debugging, documentation, or providing context to AI coding assistants.

## Detailed Description

**Detailed Description (for Chrome Web Store):**

ElementSnap is a powerful developer tool that makes it easy to select and capture DOM element information from any webpage. Perfect for developers, designers, and anyone who needs to quickly extract HTML element details.

**Key Features:**
- 🎯 Visual element selection with hover highlighting
- 📋 One-click copy of element details (HTML, classes, IDs, tags)
- ⌨️ Keyboard shortcuts (Ctrl+E to start, Enter to finish, Esc to cancel)
- 🎨 Customizable hover and selection colors
- 📝 Add context notes before copying
- 🚫 Exclude specific elements from selection
- 🔢 Optional element selection limits

**Use Cases:**
- Extract HTML for bug reports
- Document UI components quickly
- Provide context to AI coding assistants
- Quick DOM inspection during development
- Create element inventories for documentation

**How It Works:**
1. Press Ctrl+E (or Cmd+E on Mac) on any webpage
2. Click elements to select them (they'll be highlighted)
3. Press Enter to open the details dialog
4. Add optional context notes
5. Click "Copy to Clipboard" to export all selected element information

**Privacy:**
ElementSnap runs entirely locally in your browser. No data is sent to external servers. All element information is processed and copied to your clipboard only when you explicitly request it.

**Perfect for:**
- Frontend developers debugging layouts
- QA engineers reporting bugs
- Designers documenting components
- Anyone working with web development and AI coding assistants

## Category

**Recommended Category:** Developer Tools

## Language

**Primary Language:** English (en)

## Screenshots/Video

You'll need to create at least one screenshot or video showing:
1. The extension popup interface
2. Element selection in action (showing hover highlights)
3. The element details dialog with selected elements
4. The copied output format

**Screenshot Ideas:**
- Screenshot 1: Extension popup showing "ElementSnap is active!"
- Screenshot 2: A webpage with elements being selected (showing blue hover outlines)
- Screenshot 3: The element details dialog showing selected elements with their HTML
- Screenshot 4: Example of the copied output format

## Data Usage Certification

**Certification Statement:**
I certify that ElementSnap complies with Chrome Web Store Developer Program Policies:
- All data processing happens locally in the browser
- No user data is collected, stored, or transmitted
- No external servers are contacted
- The extension only accesses the DOM when explicitly activated by the user
- Clipboard access is only used when the user clicks "Copy to Clipboard"
- No analytics or tracking is implemented

## Additional Store Listing Information

**Short Description (132 characters max):**
Select and copy DOM element details from any webpage. Perfect for developers debugging, documenting, or sharing with AI assistants.

**Promotional Images:**
- Small tile (440x280): Use icon128.png as base
- Large tile (920x680): Create a promotional image showing the extension in action
- Marquee (1400x560): Optional promotional banner

**Support URL (optional):**
If you have a GitHub repository or support page, add it here.

**Homepage URL (optional):**
If you have a project homepage, add it here.

