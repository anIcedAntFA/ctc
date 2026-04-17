---
"@ngockhoi96/ctc": minor
"@ngockhoi96/ctc-react": major
"@ngockhoi96/ctc-vue": major
"@ngockhoi96/ctc-svelte": major
---

## Rich Clipboard API

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

---

All packages also received updated npm `keywords` and `description` fields for better discoverability.
