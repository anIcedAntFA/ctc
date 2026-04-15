---
"@ngockhoi96/ctc-svelte": "minor"
---

feat(svelte): initial release of `@ngockhoi96/ctc-svelte` — Svelte action and reactive helpers for clipboard copy

Introduces the first stable API for the Svelte adapter package. Built on top of `@ngockhoi96/ctc` core and ships three complementary exports — pick the one that fits your code style.

## New export: `copyAction` (default subpath)

A Svelte action for declarative copy-on-click buttons. No `copied` state to manage — just bind text and listen for events.

```svelte
<script lang="ts">
  import { copyAction } from "@ngockhoi96/ctc-svelte";
</script>

<button
  use:copyAction={{ text: "Hello, world!" }}
  on:ctc:copy={(e) => console.log("copied", e.detail.text)}
  on:ctc:error={(e) => console.error(e.detail.error)}
>
  Copy
</button>
```

**Parameters (`CopyActionParams`):**

| Param          | Type                              | Description                                              |
| -------------- | --------------------------------- | -------------------------------------------------------- |
| `params.text`  | `string`                          | Text copied on click. Reactive — `update()` rebinds on change. |
| `params.onError` | `OnErrorCallback \| undefined`  | Optional callback invoked with a structured error on failure. |

**Dispatched events (bubble):**

| Event       | Detail                        | When                                    |
| ----------- | ----------------------------- | --------------------------------------- |
| `ctc:copy`  | `{ text: string }`            | Fired after a successful clipboard write. |
| `ctc:error` | `{ error: BrowserUtilsError }` | Fired when the copy operation fails.   |

## New export: `useCopyToClipboard` via `/stores` (Svelte 4 + 5)

```ts
import { useCopyToClipboard } from "@ngockhoi96/ctc-svelte/stores";

function useCopyToClipboard(
  initText?: string,
  options?: UseCopyToClipboardOptions
): UseCopyToClipboardResult;
```

Returns `copied` and `error` as `Readable` stores. Subscribe with `$copied` / `$error` in templates, or read synchronously via `get()` from `svelte/store`.

**Returns `{ copy, copied, error, reset }`:**

| Field    | Type                                 | Description                                                                                              |
| -------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `copy`   | `(text?: string) => Promise<boolean>` | Trigger a copy. Per-call `text` overrides `initText`. Returns `true` on success.                        |
| `copied` | `Readable<boolean>`                  | `true` immediately after a successful copy; auto-resets after `timeout` ms.                             |
| `error`  | `Readable<BrowserUtilsError \| null>` | Structured error from the most recent failed attempt. Cleared to `null` at the start of each `copy()` call. |
| `reset`  | `() => void`                         | Resets `copied` and `error`, cancels any pending auto-reset timer.                                       |

## New export: `useCopyToClipboard` via `/runes` (Svelte 5 only)

```ts
import { useCopyToClipboard } from "@ngockhoi96/ctc-svelte/runes";
```

Returns a reactive object with `copied` and `error` as `$state`-backed getters. Idiomatic Svelte 5 — read directly in templates and `$effect` without `.value` or `$` prefix. Uses `$effect` for automatic timer cleanup on component destroy.

**Example:**

```svelte
<script lang="ts">
  import { useCopyToClipboard } from "@ngockhoi96/ctc-svelte/runes";

  const ctc = useCopyToClipboard("Hello, world!", { timeout: 1500 });
</script>

<button onclick={() => ctc.copy()} disabled={ctc.copied}>
  {ctc.copied ? "Copied!" : "Copy"}
</button>
{#if ctc.error}
  <span>Failed: {ctc.error.code}</span>
{/if}
```

> **Note:** Do not destructure `copied` / `error` into local `const` bindings outside a reactive scope — the getters preserve reactivity, plain destructuring snapshots the value.

## Compatibility

| Export                        | Svelte 4 | Svelte 5 |
| ----------------------------- | -------- | -------- |
| `copyAction`                  | yes      | yes      |
| `useCopyToClipboard` (stores) | yes      | yes      |
| `useCopyToClipboard` (runes)  | no       | yes      |

## New types exported

- `CopyActionParams` — Params for the `copyAction` Svelte action
- `UseCopyToClipboardOptions` — Options interface extending `ClipboardOptions`
- `UseCopyToClipboardResult` — Return shape of `useCopyToClipboard`

Re-exports from `@ngockhoi96/ctc` core for convenience:

- `BrowserUtilsError`, `ClipboardOptions`, `ErrorCode`, `OnErrorCallback`

## Peer dependencies

- `@ngockhoi96/ctc >= 0.1.0`
- `svelte >= 4.0.0`
