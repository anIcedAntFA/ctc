# @ngockhoi96/ctc

Core clipboard utilities for the [`@ngockhoi96/ctc`](https://github.com/anIcedAntFA/ctc) library. Zero runtime dependencies, tree-shakeable, SSR-safe, framework-agnostic.

> All functions are SSR-safe -- safe to import in Next.js, Nuxt, or any server-side environment without crashing.

## Install

```bash
# pnpm
pnpm add @ngockhoi96/ctc

# npm
npm install @ngockhoi96/ctc

# yarn
yarn add @ngockhoi96/ctc
```

## Quick Start

```typescript
import { copyToClipboard, isClipboardSupported } from '@ngockhoi96/ctc/clipboard'

button.addEventListener('click', async () => {
  if (isClipboardSupported()) {
    const success = await copyToClipboard('Hello, world!')
    console.log(success ? 'Copied!' : 'Copy failed')
  }
})
```

## API Reference

### `copyToClipboard(text, options?)`

Copy text to the clipboard using the modern Clipboard API.

```typescript
function copyToClipboard(text: string, options?: ClipboardOptions): Promise<boolean>
```

**Returns:** `true` on success, `false` on any failure (never throws).

**Browser support:** Requires HTTPS (secure context) and a user gesture (click, keydown, etc.). Chrome 66+, Firefox 63+, Safari 13.1+.

```typescript
import { copyToClipboard } from '@ngockhoi96/ctc/clipboard'

button.addEventListener('click', async () => {
  const success = await copyToClipboard('Hello, world!')
  if (!success) {
    showError('Copy failed -- check HTTPS and permissions')
  }
})
```

**Remarks:**

- Must be called synchronously within a user gesture handler. Programmatic calls from timers or microtasks will be rejected by the browser with `CLIPBOARD_PERMISSION_DENIED`.
- Returns `false` on HTTP pages with `INSECURE_CONTEXT` error code. Use `copyToClipboardLegacy()` for HTTP environments.
- On Safari, calling any async operation before `writeText()` in the same microtask may break the user activation window. Keep the call synchronous within the click handler.

---

### `readFromClipboard(options?)`

Read text from the clipboard using the modern Clipboard API.

```typescript
function readFromClipboard(options?: ClipboardOptions): Promise<string | null>
```

**Returns:** The clipboard text string on success, `null` on failure (never throws).

**Browser support:** Requires HTTPS (secure context) and a user gesture. May trigger a permission prompt on first call. Chrome 66+, Firefox 63+, Safari 13.1+.

```typescript
import { readFromClipboard } from '@ngockhoi96/ctc/clipboard'

pasteButton.addEventListener('click', async () => {
  const text = await readFromClipboard()
  if (text !== null) {
    input.value = text
  }
})
```

**Remarks:**

- Chrome prompts for `clipboard-read` permission on the first call. Firefox and Safari show a system-level paste prompt.
- If the clipboard contains only non-text content (e.g., an image), the read operation fails with `CLIPBOARD_READ_FAILED`.

---

### `isClipboardSupported()`

Check if the Clipboard API is available and usable for write operations in the current context.

```typescript
function isClipboardSupported(): boolean
```

**Returns:** `true` if clipboard write operations are supported. Returns `false` in SSR environments, on HTTP pages, or when the Clipboard API is absent.

**Browser support:** Synchronous check, no permissions needed. Chrome 66+, Firefox 63+, Safari 13.1+. Returns `false` on HTTP and in SSR.

```typescript
import { isClipboardSupported, copyToClipboardLegacy, copyToClipboard } from '@ngockhoi96/ctc/clipboard'

if (isClipboardSupported()) {
  await copyToClipboard(text)
} else {
  copyToClipboardLegacy(text)
}
```

**Remarks:**

- Permission state is not checked. A `true` result does not guarantee the user has granted clipboard access. Permission denial is surfaced at call time via `CLIPBOARD_PERMISSION_DENIED`.

---

### `isClipboardReadSupported()`

Check if clipboard read operations are available and usable in the current context.

```typescript
function isClipboardReadSupported(): boolean
```

**Returns:** `true` if clipboard read operations are supported. Returns `false` in SSR environments, on HTTP pages, or when the read API is absent.

**Browser support:** Synchronous check, no permissions needed. Chrome 66+, Firefox 63+, Safari 13.1+. Returns `false` on HTTP and in SSR.

```typescript
import { isClipboardReadSupported, readFromClipboard } from '@ngockhoi96/ctc/clipboard'

if (isClipboardReadSupported()) {
  const text = await readFromClipboard()
}
```

**Remarks:**

- Firefox does not support the Permissions API `clipboard-read` query. This function uses synchronous feature detection only.

---

### `copyToClipboardLegacy(text, options?)`

Copy text to the clipboard using the deprecated `document.execCommand('copy')` API.

```typescript
function copyToClipboardLegacy(text: string, options?: ClipboardOptions): boolean
```

**Returns:** `true` on success, `false` on failure (synchronous, never throws).

**Browser support:** Works on HTTP pages via deprecated `execCommand`. Supported in all desktop browsers. Not reliable on iOS Safari. Use only when the modern Clipboard API is unavailable.

```typescript
import { isClipboardSupported, copyToClipboard, copyToClipboardLegacy } from '@ngockhoi96/ctc/clipboard'

async function copyText(text: string): Promise<boolean> {
  if (isClipboardSupported()) {
    return copyToClipboard(text)
  }
  return copyToClipboardLegacy(text)
}
```

**Remarks:**

- Uses the deprecated `document.execCommand('copy')` API, which is synchronous and text-only.
- No secure context requirement. This function exists for environments where `copyToClipboard()` is unavailable due to HTTP.
- Temporarily creates and removes a textarea element in the DOM to perform the copy operation.
- `execCommand` copy is not reliably supported on iOS Safari. This function may return `false` on iOS Safari without a usable fallback.

## Error Handling

All clipboard functions accept an optional `onError` callback that receives a structured `BrowserUtilsError` object. Functions never throw -- they return `false` or `null` on failure.

### `BrowserUtilsError`

```typescript
interface BrowserUtilsError {
  code: ErrorCode
  message: string
  cause?: unknown
}

type ErrorCode =
  | 'CLIPBOARD_NOT_SUPPORTED'
  | 'CLIPBOARD_PERMISSION_DENIED'
  | 'CLIPBOARD_WRITE_FAILED'
  | 'CLIPBOARD_READ_FAILED'
  | 'INSECURE_CONTEXT'
```

### `ClipboardOptions`

```typescript
interface ClipboardOptions {
  onError?: (error: BrowserUtilsError) => void
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `CLIPBOARD_NOT_SUPPORTED` | Clipboard API is unavailable (SSR environment, very old browser, or `navigator.clipboard` missing) |
| `INSECURE_CONTEXT` | Page is served over HTTP (not HTTPS). The Clipboard API requires a secure context. Use `copyToClipboardLegacy()` instead |
| `CLIPBOARD_PERMISSION_DENIED` | User denied clipboard permission, or the call was made outside a user gesture |
| `CLIPBOARD_WRITE_FAILED` | Write operation failed for an unexpected reason |
| `CLIPBOARD_READ_FAILED` | Read operation failed for an unexpected reason |

### Example: Using `onError`

```typescript
import { copyToClipboard } from '@ngockhoi96/ctc/clipboard'

await copyToClipboard('text', {
  onError: (err) => {
    switch (err.code) {
      case 'CLIPBOARD_PERMISSION_DENIED':
        showPermissionPrompt()
        break
      case 'INSECURE_CONTEXT':
        // Fall back to legacy method on HTTP pages
        copyToClipboardLegacy(text)
        break
      default:
        console.error('Clipboard error:', err.message)
    }
  }
})
```

Without `onError`, expected failures (`CLIPBOARD_NOT_SUPPORTED`, `INSECURE_CONTEXT`, `CLIPBOARD_PERMISSION_DENIED`) are logged with `console.warn`. Unexpected failures (`CLIPBOARD_WRITE_FAILED`, `CLIPBOARD_READ_FAILED`) are logged with `console.error`.

## Browser Support

See the [browser support table in the root README](../../README.md#browser-support). All functions require ES2020+ (>95% global browser support) and are SSR-safe.

## License

[MIT](../../LICENSE)
