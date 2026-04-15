# ⚛️ @ngockhoi96/ctc-react

React hook for the [`@ngockhoi96/ctc`](https://github.com/anIcedAntFA/ctc) clipboard
utilities library. Provides `useCopyToClipboard` with managed `copied` and `error` state,
configurable auto-reset timeout, and TypeScript-first API.

## 📦 Install

```bash
# npm
npm install @ngockhoi96/ctc-react @ngockhoi96/ctc

# pnpm
pnpm add @ngockhoi96/ctc-react @ngockhoi96/ctc

# bun
bun add @ngockhoi96/ctc-react @ngockhoi96/ctc
```

## 🔗 Peer dependencies

| Package | Range |
|---------|-------|
| `@ngockhoi96/ctc` | `>=0.1.0` |
| `react` | `>=18 <20` |

## Quick start

```tsx
import { useCopyToClipboard } from '@ngockhoi96/ctc-react'

function CopyButton() {
  const { copy, copied, error } = useCopyToClipboard('Hello, world!')

  return (
    <div>
      <button onClick={() => copy()}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
      {error && <span>Error: {error.code}</span>}
    </div>
  )
}
```

### Override text at call site

```tsx
const { copy, copied } = useCopyToClipboard()
// ...
<button onClick={() => copy(dynamicValue)}>Copy</button>
```

### Disable auto-reset (`timeout: 0`)

```tsx
const { copy, copied, reset } = useCopyToClipboard('text', { timeout: 0 })
// copied stays true until reset() is called explicitly
```

### Programmatic reset

```tsx
const { copy, copied, reset } = useCopyToClipboard('text')

// On modal close or route change:
useEffect(() => {
  return () => reset()
}, [reset])
```

### Custom timeout

```tsx
const { copy, copied } = useCopyToClipboard('text', { timeout: 5000 })
// copied resets after 5 seconds
```

### Error handling

```tsx
import type { BrowserUtilsError } from '@ngockhoi96/ctc-react'

const { copy, error } = useCopyToClipboard('text', {
  onError: (err: BrowserUtilsError) => {
    console.error('Clipboard error:', err.code, err.message)
  },
})
```

## API

### `useCopyToClipboard(initText?, options?)`

```typescript
function useCopyToClipboard(
  initText?: string,
  options?: UseCopyToClipboardOptions,
): UseCopyToClipboardResult
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `initText` | `string \| undefined` | Text to copy. Can be overridden per `copy()` call. |
| `options` | `UseCopyToClipboardOptions \| undefined` | Optional configuration. |

#### `UseCopyToClipboardOptions`

Extends `ClipboardOptions` from `@ngockhoi96/ctc`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `timeout` | `number \| undefined` | `2000` | Milliseconds before `copied` resets to `false`. Set to `0` to disable auto-reset. |
| `onError` | `OnErrorCallback \| undefined` | — | Called when a copy operation fails. Receives a `BrowserUtilsError`. |

#### Return value: `UseCopyToClipboardResult`

| Property | Type | Description |
|----------|------|-------------|
| `copy` | `(text?: string) => Promise<boolean>` | Trigger a copy. Call-site `text` overrides `initText`. Returns `true` on success. |
| `copied` | `boolean` | `true` immediately after a successful copy. Resets after `timeout` ms. |
| `error` | `BrowserUtilsError \| null` | Error from the last failed copy, or `null`. Cleared on each new `copy()` call. |
| `reset` | `() => void` | Immediately clears `copied` and `error`. Cancels any pending auto-reset timer. |

## TypeScript types

All types are re-exported from `@ngockhoi96/ctc-react` for convenience:

```typescript
import type {
  BrowserUtilsError,
  ClipboardOptions,
  ErrorCode,
  OnErrorCallback,
  UseCopyToClipboardOptions,
  UseCopyToClipboardResult,
} from '@ngockhoi96/ctc-react'
```

### `ErrorCode`

```typescript
type ErrorCode =
  | 'CLIPBOARD_NOT_SUPPORTED'
  | 'CLIPBOARD_PERMISSION_DENIED'
  | 'CLIPBOARD_WRITE_FAILED'
  | 'CLIPBOARD_READ_FAILED'
  | 'INSECURE_CONTEXT'
```

Branch on `error?.code` to handle specific failure modes:

```tsx
if (error?.code === 'CLIPBOARD_NOT_SUPPORTED') {
  // Browser does not support the Clipboard API
}
if (error?.code === 'INSECURE_CONTEXT') {
  // Page is not served over HTTPS
}
```

## Browser support

Browser support is determined by `@ngockhoi96/ctc` core. Requires:
- `navigator.clipboard` API (Chromium 66+, Firefox 63+, Safari 13.1+)
- Secure context (HTTPS or localhost)

See [`@ngockhoi96/ctc` browser support](https://github.com/anIcedAntFA/ctc#browser-support)
for details.

## Important note on `onError` stability

If you pass an inline function as `onError`, it will be a new reference on every render,
which invalidates the `copy` callback's `useCallback` memoization. Wrap `onError` in
`useCallback` if you care about referential stability:

```tsx
const handleError = useCallback((err: BrowserUtilsError) => {
  setMyError(err)
}, [])

const { copy } = useCopyToClipboard('text', { onError: handleError })
```

## See also

- [`@ngockhoi96/ctc`](../core/README.md) — core clipboard utilities (framework-agnostic)
- [`@ngockhoi96/ctc-vue`](../vue/README.md) — Vue 3 composable
- [`@ngockhoi96/ctc-svelte`](../svelte/README.md) — Svelte action + composable

## License

MIT
