# 💚 @ngockhoi96/ctc-vue

Vue 3 composable for the [`@ngockhoi96/ctc`](https://github.com/anIcedAntFA/ctc) clipboard
utilities library. Provides `useCopyToClipboard` with managed `copied` and `error` refs,
configurable auto-reset timeout, and TypeScript-first API.

## 📦 Install

```bash
# npm
npm install @ngockhoi96/ctc-vue @ngockhoi96/ctc

# pnpm
pnpm add @ngockhoi96/ctc-vue @ngockhoi96/ctc

# bun
bun add @ngockhoi96/ctc-vue @ngockhoi96/ctc
```

## 🔗 Peer dependencies

| Package | Range |
|---------|-------|
| `@ngockhoi96/ctc` | `>=0.1.0` |
| `vue` | `>=3.0.0 <4.0.0` |

## Quick start

```vue
<script setup lang="ts">
import { useCopyToClipboard } from '@ngockhoi96/ctc-vue'

const { copy, copied, error } = useCopyToClipboard('Hello, world!')
</script>

<template>
  <button @click="copy()">
    {{ copied ? 'Copied!' : 'Copy' }}
  </button>
  <span v-if="error">Error: {{ error.code }}</span>
</template>
```

### Override text at call site

```vue
<script setup lang="ts">
const { copy, copied } = useCopyToClipboard()
</script>

<template>
  <button @click="copy(dynamicValue)">Copy</button>
</template>
```

### Disable auto-reset (`timeout: 0`)

```vue
<script setup lang="ts">
const { copy, copied, reset } = useCopyToClipboard('text', { timeout: 0 })
// copied.value stays true until reset() is called explicitly
</script>
```

### Programmatic reset

```vue
<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'

const { copy, copied, reset } = useCopyToClipboard('text')

// Reset on route leave
onBeforeRouteLeave(() => reset())
</script>
```

### Custom timeout

```vue
<script setup lang="ts">
const { copy, copied } = useCopyToClipboard('text', { timeout: 5000 })
// copied.value resets after 5 seconds
</script>
```

### Error handling

```vue
<script setup lang="ts">
import type { BrowserUtilsError } from '@ngockhoi96/ctc-vue'

const { copy, error } = useCopyToClipboard('text', {
  onError: (err: BrowserUtilsError) => {
    console.error('Clipboard error:', err.code, err.message)
  },
})
</script>
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
| `copied` | `ShallowRef<boolean>` | `true` immediately after a successful copy. Resets after `timeout` ms. |
| `error` | `ShallowRef<BrowserUtilsError \| null>` | Error from the last failed copy, or `null`. Cleared on each new `copy()` call. |
| `reset` | `() => void` | Immediately clears `copied.value` and `error.value`. Cancels any pending auto-reset timer. |

Note: `copied` and `error` are **shallow refs** — use `.value` to access their current
value. In Vue templates, `.value` is unwrapped automatically.

## TypeScript types

All types are re-exported from `@ngockhoi96/ctc-vue` for convenience:

```typescript
import type {
  BrowserUtilsError,
  ClipboardOptions,
  ErrorCode,
  OnErrorCallback,
  UseCopyToClipboardOptions,
  UseCopyToClipboardResult,
} from '@ngockhoi96/ctc-vue'
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

Branch on `error.value?.code` to handle specific failure modes:

```vue
<script setup lang="ts">
const { copy, error } = useCopyToClipboard('text')
</script>

<template>
  <span v-if="error?.code === 'CLIPBOARD_NOT_SUPPORTED'">
    Clipboard API not available in this browser.
  </span>
  <span v-if="error?.code === 'INSECURE_CONTEXT'">
    Copy requires HTTPS.
  </span>
</template>
```

## Browser support

Browser support is determined by `@ngockhoi96/ctc` core. Requires:
- `navigator.clipboard` API (Chromium 66+, Firefox 63+, Safari 13.1+)
- Secure context (HTTPS or localhost)

See [`@ngockhoi96/ctc` browser support](https://github.com/anIcedAntFA/ctc#browser-support)
for details.

## SSR

The composable is SSR-safe. In non-browser environments (Nuxt SSR, Node.js):
- `copyToClipboard` from core returns `false` immediately (guarded by `isBrowser()`)
- `copied.value` and `error.value` remain in their initial state
- `onUnmounted` is a no-op on the server — no timer cleanup issues

## See also

- [`@ngockhoi96/ctc`](../core/README.md) — core clipboard utilities (framework-agnostic)
- [`@ngockhoi96/ctc-react`](../react/README.md) — React hook
- [`@ngockhoi96/ctc-svelte`](../svelte/README.md) — Svelte action + composable

## License

MIT
