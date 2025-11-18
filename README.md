# ElementSnap

A lightweight JavaScript library for selecting DOM elements and capturing their details. Designed for developers who need to extract element information for debugging, documentation, or AI-assisted development.

## Demo

Watch a demo video: [https://iimydr2b8o.ufs.sh/f/Zqn6AViLMoTtnt9FhoUytujFekWacTxmRSXfOM2NDw63Jgp4](https://iimydr2b8o.ufs.sh/f/Zqn6AViLMoTtnt9FhoUytujFekWacTxmRSXfOM2NDw63Jgp4)

## Installation

```bash
npm install elementsnap
```

## Framework Integration

### React

```jsx
import { useEffect, useRef } from 'react';
import ElementSnap from 'elementsnap';

function App() {
  const snapRef = useRef(null);

  useEffect(() => {
    snapRef.current = new ElementSnap({
      onCopy: (data) => console.log('Copied:', data)
    });
    return () => snapRef.current?.destroy();
  }, []);

  return <div>Press Ctrl+E to start</div>;
}
```

### Vue

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';
import ElementSnap from 'elementsnap';

let snap = null;
onMounted(() => snap = new ElementSnap());
onUnmounted(() => snap?.destroy());
</script>
```

### Svelte

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import ElementSnap from 'elementsnap';

  let snap;
  onMount(() => snap = new ElementSnap());
  onDestroy(() => snap?.destroy());
</script>
```

## Configuration

```javascript
new ElementSnap({
  enabled: true,                    // Enable/disable
  hotkey: 'e',                      // Trigger key
  hotkeyModifier: 'ctrl',           // 'ctrl', 'alt', or 'shift'
  maxElements: 5,                   // Selection limit
  showBanner: true,                 // Show status banner
  autoOpenDialog: false,            // Auto-open on select
  hoverColor: '#0066ff',            // Hover outline color
  selectedColor: '#00cc66',         // Selected outline color
  excludeSelectors: ['.ignore'],    // Elements to skip
  onCopy: (data) => {},             // Copy callback
  onSelectionChange: (elements) => {} // Selection callback
});
```

## Usage

1. Press `Ctrl+E` (or `Cmd+E` on Mac) to enter selection mode
2. Click elements to select them (highlighted with outline)
3. Press `Enter` to open the dialog
4. Add context notes in the textarea (optional)
5. Click "Copy to Clipboard" to export
6. Press `ESC` to cancel anytime

## Output Format

```
=== Element 1 ===
tag: div
id: header
classes: container flex items-center

HTML:
<div id="header" class="container flex items-center">...</div>

=== Element 2 ===
tag: button
classes: btn btn-primary

HTML:
<button class="btn btn-primary">Click me</button>

=== Prompt ===
Your context notes here
```

## API Reference

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable the library |
| `hotkey` | string | `'e'` | Activation key |
| `hotkeyModifier` | string | `'ctrl'` | Modifier key |
| `maxElements` | number | `null` | Max selections (unlimited if null) |
| `showBanner` | boolean | `true` | Display status banner |
| `autoOpenDialog` | boolean | `false` | Open dialog immediately on selection |
| `hoverColor` | string | `'#000000'` | Hover state color |
| `selectedColor` | string | `'#000000'` | Selected state color |
| `excludeSelectors` | string[] | `[]` | CSS selectors to ignore |
| `className` | string | `''` | Custom class for dialog |
| `onCopy` | function | `null` | Callback with copied data |
| `onSelectionChange` | function | `null` | Callback with selected elements |

### Methods

- `destroy()` - Remove all event listeners and clean up DOM

### Keyboard Shortcuts

- `Ctrl+E` / `Cmd+E` - Start selection mode
- `Enter` - Open dialog (when `autoOpenDialog` is false)
- `ESC` - Cancel and close

## Use Cases

- Extracting HTML for bug reports
- Documenting UI components
- Providing context to AI coding assistants
- Quick DOM inspection for development
- Creating element inventories

## Browser Support

Works in all modern browsers that support ES6+ and the Clipboard API.

## License

MIT