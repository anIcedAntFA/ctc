# @ngockhoi96/ctc

## 0.2.0

### Minor Changes

- [`6b75f83`](https://github.com/anIcedAntFA/ctc/commit/6b75f8353389adbf446d88c59745e85ab5d7995f) Thanks [@anIcedAntFA](https://github.com/anIcedAntFA)! - Initial public release of `@ngockhoi96/ctc`.

  Includes a complete, tree-shakeable clipboard utilities module:

  - `copyToClipboard(text, options?)` — copy text via modern Clipboard API, returns `boolean`
  - `readFromClipboard()` — read text from clipboard, returns `string | null`
  - `copyToClipboardLegacy(text, options?)` — explicit execCommand fallback for HTTP/legacy browsers
  - `isClipboardSupported()` — detect Clipboard API write availability
  - `isClipboardReadSupported()` — detect Clipboard API read availability
  - Typed `BrowserUtilsError` with specific error codes via optional `onError` callback
  - SSR-safe: all exports importable in Node.js without crashing
  - Zero runtime dependencies, bundle < 1 KB gzip, ES2020+ output (ESM + CJS + `.d.ts`)
