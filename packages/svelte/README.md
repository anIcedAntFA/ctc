# @ngockhoi96/ctc-svelte

Svelte action and reactive helpers for the [`@ngockhoi96/ctc`](https://github.com/anIcedAntFA/ctc)
clipboard utilities library. Ships three exports: a `copyAction` for declarative `use:`
buttons, plus a `useCopyToClipboard` helper available in two flavours — `svelte/store` for
Svelte 4 + 5 compatibility and Svelte 5 runes (`$state` + `$effect`) for idiomatic Svelte 5.

## Install

```bash
npm install @ngockhoi96/ctc-svelte @ngockhoi96/ctc
# or
pnpm add @ngockhoi96/ctc-svelte @ngockhoi96/ctc
```

## Peer dependencies

| Package           | Range      |
| ----------------- | ---------- |
| `@ngockhoi96/ctc` | `>=0.1.0`  |
| `svelte`          | `>=4.0.0`  |

The `/stores` subpath works in Svelte 4 and Svelte 5. The `/runes` subpath requires
Svelte 5 (it depends on the `$state` and `$effect` runes).

## Three exports — pick the one that fits your code

| Export | Import path | When to use it |
| ------ | ----------- | -------------- |
| `copyAction` | `@ngockhoi96/ctc-svelte` | Declarative buttons. `<button use:copyAction={{ text }}>` and listen for `ctc:copy` / `ctc:error` events. No `copied` state to track. |
| `useCopyToClipboard` (stores) | `@ngockhoi96/ctc-svelte/stores` | Need reactive `copied` / `error` and want Svelte 4 + 5 compatibility. Returns `Readable` stores. |
| `useCopyToClipboard` (runes) | `@ngockhoi96/ctc-svelte/runes` | Svelte 5 only. Returns reactive getters backed by `$state`. Idiomatic Svelte 5. |

## `copyAction` — the action

```svelte
<script lang="ts">
  import { copyAction } from '@ngockhoi96/ctc-svelte'

  function handleCopy(e: CustomEvent<{ text: string }>) {
    console.log('copied', e.detail.text)
  }
  function handleErr(e: CustomEvent<{ error: { code: string; message: string } }>) {
    console.error(e.detail.error)
  }
</script>

<button
  use:copyAction={{ text: 'Hello world' }}
  on:ctc:copy={handleCopy}
  on:ctc:error={handleErr}
>
  Copy
</button>
```

The action triggers a copy on `click`, then dispatches a bubbling `ctc:copy`
CustomEvent on success or `ctc:error` on failure. Reactive text changes are picked
up automatically via the action's `update()` lifecycle.

### Reactive text

```svelte
<script lang="ts">
  import { copyAction } from '@ngockhoi96/ctc-svelte'

  let value = 'first'
</script>

<input bind:value />
<button use:copyAction={{ text: value }}>Copy current value</button>
```

## `useCopyToClipboard` — stores variant (`/stores`)

```svelte
<script lang="ts">
  import { useCopyToClipboard } from '@ngockhoi96/ctc-svelte/stores'

  const { copy, copied, error } = useCopyToClipboard('Hello world')
</script>

<button on:click={() => copy()}>{$copied ? 'Copied!' : 'Copy'}</button>
{#if $error}
  <span>Error: {$error.code}</span>
{/if}
```

`copied` and `error` are `Readable` stores — subscribe with `$copied` / `$error` in
templates, or call `get(copied)` from `svelte/store` for synchronous reads.

### Override text at call site

```svelte
<script lang="ts">
  import { useCopyToClipboard } from '@ngockhoi96/ctc-svelte/stores'

  const { copy } = useCopyToClipboard()
  let dynamicValue = 'whatever'
</script>

<button on:click={() => copy(dynamicValue)}>Copy</button>
```

### Disable auto-reset (`timeout: 0`)

```svelte
<script lang="ts">
  import { useCopyToClipboard } from '@ngockhoi96/ctc-svelte/stores'

  const { copy, copied, reset } = useCopyToClipboard('text', { timeout: 0 })
  // $copied stays true until reset() is called explicitly
</script>
```

### Programmatic reset on component destroy

The stores variant has no automatic unmount cleanup. If you set a long timeout and
need to cancel a pending timer when your component goes away, call `reset()` from
`onDestroy`:

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte'
  import { useCopyToClipboard } from '@ngockhoi96/ctc-svelte/stores'

  const { copy, copied, reset } = useCopyToClipboard('text', { timeout: 10_000 })
  onDestroy(() => reset())
</script>
```

## `useCopyToClipboard` — runes variant (`/runes`, Svelte 5 only)

```svelte
<script lang="ts">
  import { useCopyToClipboard } from '@ngockhoi96/ctc-svelte/runes'

  const ctc = useCopyToClipboard('Hello world')
</script>

<button onclick={() => ctc.copy()}>{ctc.copied ? 'Copied!' : 'Copy'}</button>
{#if ctc.error}
  <span>Error: {ctc.error.code}</span>
{/if}
```

The runes variant returns a reactive object with `copied` and `error` getters —
read them directly inside templates and `$effect`. **Do not destructure `copied` /
`error` into local `const` bindings outside a reactive scope** — the getters
preserve reactivity, plain destructuring would snapshot the value.

The runes variant uses `$effect` to clean up any pending auto-reset timer when the
host component unmounts. No manual cleanup needed.

### Custom timeout

```svelte
<script lang="ts">
  import { useCopyToClipboard } from '@ngockhoi96/ctc-svelte/runes'

  const ctc = useCopyToClipboard('text', { timeout: 5000 })
</script>
```

## API

### `copyAction(node, params)`

Svelte action — use via `use:copyAction={{ text, onError? }}`.

| Param | Type | Description |
| ----- | ---- | ----------- |
| `params.text` | `string` | Text copied to the clipboard on click. Reactive — `update()` rebinds on change. |
| `params.onError` | `OnErrorCallback \| undefined` | Optional callback invoked with a structured error on copy failure. |

Dispatched events (bubble through component hierarchy):

| Event | Detail | When |
| ----- | ------ | ---- |
| `ctc:copy` | `{ text: string }` | Fired after a successful clipboard write. |
| `ctc:error` | `{ error: BrowserUtilsError }` | Fired when the underlying `copyToClipboard` call reports failure. |

### `useCopyToClipboard(initText?, options?)`

Same signature for both `/stores` and `/runes` — the difference is the shape of
`copied` and `error` in the return value.

```typescript
function useCopyToClipboard(
  initText?: string,
  options?: UseCopyToClipboardOptions,
): UseCopyToClipboardResult
```

#### Parameters

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `initText` | `string \| undefined` | Text to copy. Can be overridden per `copy()` call. |
| `options` | `UseCopyToClipboardOptions \| undefined` | Optional configuration. |

#### `UseCopyToClipboardOptions`

Extends `ClipboardOptions` from `@ngockhoi96/ctc`.

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `timeout` | `number \| undefined` | `2000` | Milliseconds before `copied` resets to `false`. Set to `0` to disable auto-reset. |
| `onError` | `OnErrorCallback \| undefined` | — | Called when a copy operation fails. Receives a `BrowserUtilsError`. |

#### Return value

| Property | Type (stores) | Type (runes) | Description |
| -------- | ------------- | ------------ | ----------- |
| `copy` | `(text?: string) => Promise<boolean>` | `(text?: string) => Promise<boolean>` | Trigger a copy. Call-site `text` overrides `initText`. Returns `true` on success. |
| `copied` | `Readable<boolean>` | `boolean` (getter) | `true` immediately after a successful copy. Resets after `timeout` ms. |
| `error` | `Readable<BrowserUtilsError \| null>` | `BrowserUtilsError \| null` (getter) | Error from the last failed copy, or `null`. Cleared on each new `copy()` call. |
| `reset` | `() => void` | `() => void` | Immediately clears `copied` and `error`. Cancels any pending auto-reset timer. |

## Compatibility

| Export | Svelte 4 | Svelte 5 |
| ------ | -------- | -------- |
| `copyAction` | yes | yes |
| `useCopyToClipboard` (stores) | yes | yes |
| `useCopyToClipboard` (runes) | no | yes |

## Browser support

Browser support is determined by `@ngockhoi96/ctc` core. Requires:
- `navigator.clipboard` API (Chromium 66+, Firefox 63+, Safari 13.1+)
- Secure context (HTTPS or localhost)

See [`@ngockhoi96/ctc` browser support](https://github.com/anIcedAntFA/ctc#browser-support)
for details.

## License

MIT
