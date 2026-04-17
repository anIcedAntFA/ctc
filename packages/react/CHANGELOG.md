# @ngockhoi96/ctc-react

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

## 0.1.1

### Patch Changes

- 🐞 [`7b4cbbc`](https://github.com/anIcedAntFA/ctc/commit/7b4cbbc4287830391b41a1dc26b069bbd8c11e61) Thanks [@anIcedAntFA](https://github.com/anIcedAntFA)! - Remove unnecessary `react-dom` peer dependency — the hook only uses React core (`useState`, `useCallback`, `useEffect`, `useRef`) and never imports from `react-dom`. Add `homepage` field to package.json.

- Updated dependencies [[`7b4cbbc`](https://github.com/anIcedAntFA/ctc/commit/7b4cbbc4287830391b41a1dc26b069bbd8c11e61)]:
  - @ngockhoi96/ctc@0.2.2

## 0.1.0

### Minor Changes

- ✨ [#8](https://github.com/anIcedAntFA/ctc/pull/8) [`09ca8e6`](https://github.com/anIcedAntFA/ctc/commit/09ca8e6c4e3a70f069f6817e77fc88d7839c8aeb) Thanks [@anIcedAntFA](https://github.com/anIcedAntFA)! - feat(react): initial release of `@ngockhoi96/ctc-react` — React hook for clipboard copy

  Introduces the first stable API for the React adapter package. Built on top of `@ngockhoi96/ctc` core with full React state integration, auto-reset timer, and structured error handling.

  ## New export: `useCopyToClipboard`

  ```ts
  function useCopyToClipboard(
    initText?: string,
    options?: UseCopyToClipboardOptions
  ): UseCopyToClipboardResult;
  ```

  A React hook that wraps `copyToClipboard` from `@ngockhoi96/ctc` and manages `copied`/`error` state for you.

  **Parameters:**

  - `initText` — Text to copy. Optional at init; can be overridden per `copy()` call.
  - `options.timeout` — Milliseconds before `copied` auto-resets to `false` after a successful copy. Defaults to `2000`. Set to `0` to disable auto-reset.
  - `options.onError` — Callback receiving a `BrowserUtilsError` on failure (inherited from `ClipboardOptions`).

  **Returns `{ copy, copied, error, reset }`:**

  | Field    | Type                                  | Description                                                                                                 |
  | -------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
  | `copy`   | `(text?: string) => Promise<boolean>` | Trigger a copy. Per-call `text` overrides `initText`. Returns `true` on success.                            |
  | `copied` | `boolean`                             | `true` immediately after a successful copy; auto-resets after `timeout` ms.                                 |
  | `error`  | `BrowserUtilsError \| null`           | Structured error from the most recent failed attempt. Cleared to `null` at the start of each `copy()` call. |
  | `reset`  | `() => void`                          | Immediately resets `copied` to `false`, `error` to `null`, and cancels any pending auto-reset timer.        |

  **Example:**

  ```tsx
  import { useCopyToClipboard } from "@ngockhoi96/ctc-react";

  function CopyButton({ text }: { text: string }) {
    const { copy, copied, error } = useCopyToClipboard(text, { timeout: 1500 });

    return (
      <button onClick={() => copy()} disabled={copied}>
        {copied ? "Copied!" : "Copy"}
        {error && <span>Failed: {error.code}</span>}
      </button>
    );
  }
  ```

  ## New types exported

  - `UseCopyToClipboardOptions` — Options interface extending `ClipboardOptions`
  - `UseCopyToClipboardResult` — Return shape of the hook

  Re-exports from `@ngockhoi96/ctc` core for convenience:

  - `BrowserUtilsError`, `ClipboardOptions`, `ErrorCode`, `OnErrorCallback`

  ## Peer dependencies

  - `@ngockhoi96/ctc >= 0.1.0`
  - `react >= 18 < 20`
  - `react-dom >= 18 < 20`
