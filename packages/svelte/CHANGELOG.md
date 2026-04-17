# @ngockhoi96/ctc-svelte

## 1.0.0

### Major Changes

- 💥 [`9d6603d`](https://github.com/anIcedAntFA/ctc/commit/9d6603d9960c3f86b454bcf3fe395dc56e64d062) Thanks [@anIcedAntFA](https://github.com/anIcedAntFA)! - ## Rich Clipboard API

  Adds full support for writing and reading rich content (HTML + plain-text pairs) using the Clipboard Items API, with framework adapters for React, Vue, and Svelte.

  ### `@ngockhoi96/ctc`

  **New exports:**

  - `copyRichContent(content, options?)` — Writes a `RichContent` object (`{ html, plain }`) to the clipboard using `ClipboardItem`. Automatically guards for SSR. Calls `onError` with `RICH_CLIPBOARD_NOT_SUPPORTED` when the Clipboard Items API is unavailable.
  - `readRichContent()` — Reads the richest available MIME type from the clipboard (`text/html` if present, falling back to `text/plain`). Returns `RichContent | null`.
  - `isRichClipboardSupported()` — Returns `true` when `ClipboardItem` is available in the current environment.
  - `RichContent` type — `{ html: string; plain: string }` shape used by the rich clipboard API.
  - `RICH_CLIPBOARD_NOT_SUPPORTED` error code added to `ErrorCode`.

  ### `@ngockhoi96/ctc-react`

  **New exports:**

  - `useCopyRichContent(options?)` — React hook that wraps `copyRichContent`. Returns `{ copyRich, copied, error, reset }`. Mirrors the `useCopyToClipboard` API shape for consistency.
  - `UseCopyRichContentOptions` and `UseCopyRichContentResult` types.

  **Fix:** Added `types` condition to the `exports` map, fixing TypeScript module resolution under `moduleResolution: "bundler"` and `"node16"`.

  ### `@ngockhoi96/ctc-vue`

  **New exports:**

  - `useCopyRichContent(options?)` — Vue 3 composable wrapping `copyRichContent`. Returns `{ copyRich, copied, error, reset }` as refs. Mirrors the `useCopyToClipboard` composable API shape.
  - `UseCopyRichContentOptions` and `UseCopyRichContentResult` types.

  **Fix:** Added `types` condition to the `exports` map, fixing TypeScript module resolution under `moduleResolution: "bundler"` and `"node16"`.

  ### `@ngockhoi96/ctc-svelte`

  **New exports:**

  - `copyRichAction` — Svelte action (`use:copyRichAction`) that copies rich content on the target element's click event.
  - `CopyRichActionParams` type.
  - `useCopyRichContent()` (via `/runes` subpath) — Svelte 5 runes-based hook returning reactive `{ copyRich, copied, error, reset }` state.
  - `useCopyRichContent()` (via `/stores` subpath) — Svelte 4 stores-based equivalent using writable stores.
  - `UseCopyRichContentOptions` and `UseCopyRichContentResult` types (available on both subpaths).

  **Fix:** `/runes` subpath export (`exports["./runes"]`) now correctly points to the compiled `dist/runes.mjs` instead of the raw TypeScript source file.

  ***

  All packages also received updated npm `keywords` and `description` fields for better discoverability.

### Patch Changes

- Updated dependencies [[`9d6603d`](https://github.com/anIcedAntFA/ctc/commit/9d6603d9960c3f86b454bcf3fe395dc56e64d062)]:
  - @ngockhoi96/ctc@0.3.0

## 0.1.0

### Minor Changes

- ✨ [`e9257f4`](https://github.com/anIcedAntFA/ctc/commit/e9257f4450606fe36f05d26fa45df554252d599f) Thanks [@anIcedAntFA](https://github.com/anIcedAntFA)! - feat(svelte): initial release of `@ngockhoi96/ctc-svelte` — Svelte action and reactive helpers for clipboard copy

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

  | Param            | Type                           | Description                                                    |
  | ---------------- | ------------------------------ | -------------------------------------------------------------- |
  | `params.text`    | `string`                       | Text copied on click. Reactive — `update()` rebinds on change. |
  | `params.onError` | `OnErrorCallback \| undefined` | Optional callback invoked with a structured error on failure.  |

  **Dispatched events (bubble):**

  | Event       | Detail                         | When                                      |
  | ----------- | ------------------------------ | ----------------------------------------- |
  | `ctc:copy`  | `{ text: string }`             | Fired after a successful clipboard write. |
  | `ctc:error` | `{ error: BrowserUtilsError }` | Fired when the copy operation fails.      |

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

  | Field    | Type                                  | Description                                                                                                 |
  | -------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
  | `copy`   | `(text?: string) => Promise<boolean>` | Trigger a copy. Per-call `text` overrides `initText`. Returns `true` on success.                            |
  | `copied` | `Readable<boolean>`                   | `true` immediately after a successful copy; auto-resets after `timeout` ms.                                 |
  | `error`  | `Readable<BrowserUtilsError \| null>` | Structured error from the most recent failed attempt. Cleared to `null` at the start of each `copy()` call. |
  | `reset`  | `() => void`                          | Resets `copied` and `error`, cancels any pending auto-reset timer.                                          |

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

## 0.0.2

### Patch Changes

- Updated dependencies [[`7b4cbbc`](https://github.com/anIcedAntFA/ctc/commit/7b4cbbc4287830391b41a1dc26b069bbd8c11e61)]:
  - @ngockhoi96/ctc@0.2.2
