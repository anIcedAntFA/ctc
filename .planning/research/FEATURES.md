# Feature Research: Rich Clipboard & Benchmarks (v0.4.0)

**Domain:** Browser clipboard utility library -- rich content extension + published benchmarks
**Researched:** 2026-04-16
**Confidence:** HIGH (ClipboardItem API), MEDIUM (benchmark methodology)

> This document covers ONLY the v0.4.0 milestone features. For v0.1.0-v0.3.0 features
> (text copy/read/legacy/detect, framework adapters), see git history of this file.

## Feature Landscape

### Table Stakes (Users Expect These)

For a library that claims "rich clipboard support," these are non-negotiable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `copyRichContent(html, plainText)` | The whole point of the milestone. Users who want rich copy need HTML + plain text fallback in one call. Every rich editor (Tiptap, ProseMirror, Slate) needs this. | MEDIUM | Uses `navigator.clipboard.write()` with a `ClipboardItem` containing both `text/html` and `text/plain` Blobs. Must provide both MIME types so paste targets without HTML support still get usable text. |
| `readRichContent()` | Natural companion. If you can write rich, you need to read rich. Without this, round-trip workflows are broken. | MEDIUM | Uses `navigator.clipboard.read()`, iterates `ClipboardItem[]`, extracts `text/html` and `text/plain` via `getType()`. Returns a structured result, not raw ClipboardItems. |
| `isRichClipboardSupported()` | Detection function following established pattern (`isClipboardSupported()`, `isClipboardReadSupported()`). Users need to conditionally show rich paste UI. | LOW | Check for `navigator.clipboard.write` + `navigator.clipboard.read` + `ClipboardItem` constructor existence. Secure context required. |
| SSR safety on all new functions | Existing pattern. Every export must handle `typeof navigator === 'undefined'`. | LOW | Same guards as existing functions. No new patterns needed. |
| `onError` callback on all new functions | Existing pattern. All clipboard functions accept `options.onError` with typed `BrowserUtilsError`. | LOW | Reuse existing `createError`/`handleError`. Need new error codes (see below). |
| Plain text fallback in `copyRichContent` | When copying rich content, ALWAYS include `text/plain` alongside `text/html`. Apps that paste without HTML support (terminals, plain text editors) must get usable content. | LOW | Pass both MIME types to `ClipboardItem` constructor. This is the standard pattern in MDN docs. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Structured return type for `readRichContent()` | No library returns typed `{ html: string \| null, text: string \| null }`. Raw ClipboardItem API is painful -- callers must iterate items, check types, call `getType()`, convert Blobs. We abstract that away. | LOW | Return `RichClipboardData \| null` instead of raw `ClipboardItem[]`. This is the key DX improvement. |
| Published benchmarks with reproducible methodology | No clipboard library publishes benchmarks. Even though clipboard ops are I/O-bound (browser API), proving overhead is near-zero validates the "no bloat" claim. Bundle size comparison is equally valuable. | MEDIUM | Use `vitest bench` (built-in tinybench). Compare `@ngockhoi96/ctc` vs `clipboard-copy` vs `copy-to-clipboard`. Measure: ops/sec, bundle size (gzip + brotli), tree-shake effectiveness. |
| Browser support matrix documentation | No competitor documents which browsers support which features at a granular level. We document ClipboardItem support alongside text clipboard support. | LOW | MDN data: ClipboardItem reached Baseline June 2024. Chrome 66+, Firefox 127+, Safari 13.1+ (write), Safari 13.1+ (read -- partial). |
| HTML sanitization awareness | Browsers sanitize HTML on clipboard read by default (strip `<script>`, `<style>` in some cases). We document this behavior and optionally expose `unsanitized` read for advanced users. | LOW | Chrome supports `{ unsanitized: ["text/html"] }` parameter on `read()`. Firefox and Safari do not. Document the behavior difference, do not abstract it. |
| Adapter updates for rich clipboard | React `useCopyRichContent()`, Vue `useCopyRichContent()`, Svelte rich action -- no competing adapter library has these. | MEDIUM | Follow existing adapter patterns. Each adapter wraps the core function with framework-idiomatic state management. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Image clipboard support (`image/png`) | "Copy screenshots to clipboard" | Scope creep for v0.4.0. Image blobs require fetch/canvas/FileReader patterns that are app-specific. Browser support for `image/png` in ClipboardItem is good, but image handling logic does not belong in a utility library -- it belongs in the app layer. | Document the raw API pattern for image copy/paste. Users construct their own Blobs, pass to a future `copyBlob()` if demand warrants. |
| Arbitrary MIME type support | "Let me write any MIME type" | `ClipboardItem.supports()` exists but browser support for non-standard MIME types is unreliable. Building abstractions over unreliable foundations creates false confidence. | Support `text/html` + `text/plain` (universally supported). Document `ClipboardItem.supports()` for advanced users who want to check other types. |
| Unsanitized HTML read by default | "Give me the raw HTML" | Only Chrome supports the `unsanitized` option. Making this the default would silently change behavior across browsers. Security implications of unsanitized HTML are real. | Default to sanitized read. Document the `unsanitized` option for Chrome users who need it. Consider an `options.unsanitized` flag in future versions when browser support widens. |
| Auto-detect content type on copy | "Just pass content and figure out if it's HTML or plain text" | HTML detection is unreliable (is `<b>hello</b>` HTML or code?). Silent content-type decisions create debugging nightmares. | Explicit API: `copyRichContent(html, plainText)` requires both arguments. Caller knows what they're passing. |
| Benchmark CI integration (fail on regression) | "Fail CI if perf regresses" | Clipboard operations are I/O-bound; microbenchmark variance is high. CI environments have inconsistent performance characteristics. Threshold-based CI gates on I/O benchmarks create false failures. | Publish benchmarks as documentation. Run manually or in release workflow. Report results in README, not as CI gates. |
| Benchmark against clipboardy | "Compare with Node clipboard libs" | clipboardy is Node-only (uses child_process). Comparing browser API wrapper overhead to Node subprocess spawning is meaningless. Different domains entirely. | Only benchmark browser clipboard libraries: `clipboard-copy`, `copy-to-clipboard`. These are the actual alternatives users choose between. |

## Rich Clipboard: Technical Details

### ClipboardItem API -- What Matters

**Constructor:**
```typescript
new ClipboardItem({
  "text/html": new Blob([html], { type: "text/html" }),
  "text/plain": new Blob([plainText], { type: "text/plain" }),
})
```

**Key MIME types for v0.4.0:**
| MIME Type | Write Support | Read Support | Priority |
|-----------|--------------|--------------|----------|
| `text/plain` | All browsers | All browsers | Required -- always include as fallback |
| `text/html` | Chrome 66+, Firefox 127+, Safari 13.1+ | Chrome 66+, Firefox 127+, Safari 13.1+ | Required -- the primary rich content type |
| `image/png` | Chrome 66+, Firefox 127+, Safari 13.1+ | Chrome 66+, Firefox 127+, Safari 13.1+ | Out of scope for v0.4.0 |
| `image/svg+xml` | Chrome (check `supports()`) | Varies | Out of scope |

**Browser support matrix for ClipboardItem:**
| Browser | ClipboardItem | clipboard.write() | clipboard.read() | Notes |
|---------|--------------|-------------------|-------------------|-------|
| Chrome 76+ | Yes | Yes | Yes | Full support. Supports `unsanitized` read option. |
| Edge 79+ | Yes | Yes | Yes | Chromium-based, same as Chrome. |
| Firefox 127+ | Yes | Yes | Yes | Added June 2024. No `unsanitized` support. |
| Safari 13.1+ | Yes | Yes | Yes (partial) | Write: full. Read: may show paste prompt. |
| Safari 16.4+ | Yes | Yes | Yes | Improved read support with less UI friction. |

**Baseline status:** ClipboardItem became "Baseline Newly Available" in June 2024.
This means all major evergreen browsers support it, but users on older Firefox (<127) will not have it.

### Permission Model Differences: Rich vs Text

| Operation | Text API | Rich API | Difference |
|-----------|----------|----------|------------|
| Write | `writeText()` -- needs user gesture in most browsers | `write()` -- needs user gesture + some browsers require `clipboard-write` permission | Slightly stricter. Chromium auto-grants `clipboard-write` when document is focused. |
| Read | `readText()` -- Chrome prompts for permission, Firefox/Safari show paste menu | `read()` -- Same permission model as `readText()` | No practical difference. Same permission prompt. |
| Secure context | Required | Required | Same |

**Key insight:** The permission model for `read()` is the same whether reading text or rich content. The `write()` permission is also effectively the same. The primary difference is API complexity (ClipboardItem construction), not security.

### Proposed Type Definitions

```typescript
/** Result from reading rich clipboard content */
interface RichClipboardData {
  /** HTML content if available, null otherwise */
  html: string | null
  /** Plain text content if available, null otherwise */
  text: string | null
}

/** Options for rich clipboard operations */
interface RichClipboardOptions {
  onError?: OnErrorCallback | undefined
}
```

### New Error Codes Needed

| Code | When | Severity |
|------|------|----------|
| `RICH_CLIPBOARD_NOT_SUPPORTED` | `ClipboardItem` constructor or `clipboard.write()`/`clipboard.read()` not available | Expected (console.warn) |
| `CLIPBOARD_WRITE_FAILED` | `clipboard.write()` rejects for non-permission reasons | Unexpected (console.error) |
| `CLIPBOARD_READ_FAILED` | `clipboard.read()` rejects for non-permission reasons | Unexpected (console.error) |
| `CLIPBOARD_PERMISSION_DENIED` | NotAllowedError from write/read | Expected (console.warn) |
| `INSECURE_CONTEXT` | Not HTTPS | Expected (console.warn) |

**Note:** Reuse existing error codes where possible. Only `RICH_CLIPBOARD_NOT_SUPPORTED` is new -- it covers the case where text clipboard works but ClipboardItem does not (Firefox <127).

### API Signatures

```typescript
/**
 * Copy rich content (HTML + plain text) to the clipboard.
 * Always provides both text/html and text/plain so paste targets
 * without HTML support receive usable content.
 */
async function copyRichContent(
  html: string,
  plainText: string,
  options?: RichClipboardOptions,
): Promise<boolean>

/**
 * Read rich content from the clipboard.
 * Returns structured data with html and text fields,
 * abstracting away ClipboardItem iteration.
 */
async function readRichContent(
  options?: RichClipboardOptions,
): Promise<RichClipboardData | null>

/**
 * Check if rich clipboard operations (ClipboardItem API) are supported.
 */
function isRichClipboardSupported(): boolean
```

## Benchmarks: Technical Details

### What to Benchmark

Clipboard operations are I/O-bound (browser API calls). Microbenchmarking the actual `writeText()` call is meaningless -- it measures the browser, not the library. Instead, benchmark:

| Metric | Why It Matters | Tool |
|--------|---------------|------|
| **Bundle size** (gzip + brotli) | The primary reason users choose lightweight libs. Directly measurable, reproducible, no variance. | `size-limit` (already in project) |
| **Tree-shake effectiveness** | Does importing one function pull the whole library? | `size-limit` with specific imports |
| **Overhead per call** (library wrapper cost) | How much time does the library add on top of raw `navigator.clipboard.writeText()`? Should be <1ms. | `vitest bench` with mocked clipboard API |
| **Import/parse time** | Time to load and parse the module. Matters for cold starts. | `vitest bench` measuring dynamic import |

### Libraries to Compare

| Library | npm Package | Why Compare | Notes |
|---------|-------------|-------------|-------|
| `@ngockhoi96/ctc` | `@ngockhoi96/ctc` | Our library | |
| `clipboard-copy` | `clipboard-copy` | Most popular lightweight clipboard lib (~200B). Write-only. | Last published ~5 years ago but still downloaded. |
| `copy-to-clipboard` | `copy-to-clipboard` | Second most popular. Uses `execCommand` as primary. | ~1.5KB. Last published ~3 years ago. |

**Exclude:**
- `clipboardy` -- Node.js only, not a browser library
- `clipboard.js` -- DOM-based API (data attributes), different paradigm, 3KB+ but declining downloads
- `@vueuse/core` -- Framework-locked, comparing useClipboard from a 200KB bundle is unfair

### Benchmark Methodology

**Bundle size comparison (most credible, fully reproducible):**
```
1. Install each library in an isolated project
2. Import the primary copy function
3. Bundle with esbuild/rollup (standard config)
4. Measure: raw bytes, gzip bytes, brotli bytes
5. Report in table format
```

**Wrapper overhead benchmark (vitest bench):**
```
1. Mock navigator.clipboard.writeText to resolve immediately
2. Benchmark each library's copy function (1000 iterations)
3. Measure: ops/sec, mean time, standard deviation
4. Also benchmark raw navigator.clipboard.writeText for baseline
5. Report overhead = library time - raw API time
```

**Tree-shake comparison:**
```
1. Import only the copy function from each library
2. Bundle with tree-shaking enabled
3. Measure dead code elimination effectiveness
4. Report: full bundle vs single-import bundle size
```

### Benchmark Output Format

A credible published benchmark includes:
1. **Environment:** Node version, OS, browser (for E2E), date
2. **Methodology:** Exact steps to reproduce
3. **Raw numbers:** Not just "we're faster" but actual ops/sec and byte counts
4. **Comparison table:** Side-by-side, including our library
5. **Scripts to reproduce:** `pnpm bench` should regenerate all results
6. **Caveats:** "Clipboard operations are I/O-bound; wrapper overhead is negligible for all libraries. Bundle size is the meaningful differentiator."

## Feature Dependencies

```
Existing: copyToClipboard(), readFromClipboard(), detect functions, error system
    |
    v
isRichClipboardSupported()  [depends on: isBrowser, isSecureContext -- already exist]
    |
    +---> copyRichContent(html, plainText)  [depends on: isRichClipboardSupported, error system]
    |
    +---> readRichContent()  [depends on: isRichClipboardSupported, error system]
    |
    v
Framework adapter updates  [depends on: core rich functions]
    |-- React: useCopyRichContent hook
    |-- Vue: useCopyRichContent composable
    |-- Svelte: rich clipboard action/runes
    |
    v
Benchmarks  [independent of rich clipboard -- can be done in parallel]
    |-- Bundle size comparison (size-limit)
    |-- Wrapper overhead (vitest bench)
    |-- Published results in README/docs
```

### Dependency Notes

- **`isRichClipboardSupported()` is the foundation** for rich clipboard. Build it first, then `copyRichContent` and `readRichContent` can use it internally.
- **Error codes must be extended** before implementing rich functions. Add `RICH_CLIPBOARD_NOT_SUPPORTED` to the `ErrorCode` union type.
- **Benchmarks are fully independent** of rich clipboard work. They measure the existing text clipboard functions. Can run in parallel.
- **Framework adapters depend on core rich functions.** Core must be stable before adapters wrap it.
- **`copyRichContent` and `readRichContent` share detection logic** but are otherwise independent implementations. They can be developed in parallel.

## MVP Definition (v0.4.0)

### Must Ship

- [x] Architecture audit (folder structure, tooling) -- prerequisite for clean implementation
- [ ] `copyRichContent(html, plainText, options?)` -- core rich write function
- [ ] `readRichContent(options?)` -- core rich read function
- [ ] `isRichClipboardSupported()` -- detection function
- [ ] New error code: `RICH_CLIPBOARD_NOT_SUPPORTED`
- [ ] Unit tests: 100% coverage on rich clipboard functions
- [ ] E2E tests: rich copy/paste across Chromium, Firefox, WebKit

### Should Ship

- [ ] Framework adapter updates (React, Vue, Svelte) for rich clipboard
- [ ] Bundle size benchmarks vs clipboard-copy + copy-to-clipboard
- [ ] Wrapper overhead benchmarks (vitest bench)
- [ ] Published benchmark results in README or docs

### Defer

- [ ] Image clipboard support (`image/png`) -- wait for user demand
- [ ] `unsanitized` read option -- wait for cross-browser support
- [ ] Benchmark CI gates -- I/O variance makes this unreliable
- [ ] Arbitrary MIME type support -- `text/html` + `text/plain` cover 95% of use cases

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `copyRichContent(html, plainText)` | HIGH | MEDIUM | P1 |
| `readRichContent()` | HIGH | MEDIUM | P1 |
| `isRichClipboardSupported()` | HIGH | LOW | P1 |
| `RICH_CLIPBOARD_NOT_SUPPORTED` error code | MEDIUM | LOW | P1 |
| Unit tests for rich clipboard | HIGH | MEDIUM | P1 |
| E2E tests for rich clipboard | HIGH | MEDIUM | P1 |
| Framework adapter updates (rich) | MEDIUM | MEDIUM | P2 |
| Bundle size benchmarks | MEDIUM | LOW | P2 |
| Wrapper overhead benchmarks | LOW | MEDIUM | P2 |
| Published benchmark documentation | MEDIUM | LOW | P2 |
| Image clipboard support | LOW | HIGH | P3 |
| `unsanitized` read option | LOW | LOW | P3 |

## Competitor Feature Analysis (Rich Clipboard Specific)

| Feature | clipboard-copy | copy-to-clipboard | VueUse useClipboard | Our Approach |
|---------|---------------|-------------------|--------------------|----|
| Rich content write (HTML) | No | No | No | Yes -- `copyRichContent(html, text)` with dual MIME types |
| Rich content read | No | No | No | Yes -- `readRichContent()` returns structured `{ html, text }` |
| Rich clipboard detection | No | No | No | Yes -- `isRichClipboardSupported()` |
| ClipboardItem API usage | No | No | No | Yes -- wraps the modern API |
| Published benchmarks | No | No | No | Yes -- bundle size + overhead comparison |
| Bundle size documentation | Informal ("685 bytes") | No | No | Yes -- reproducible size-limit measurements |

**Key insight:** No standalone clipboard library supports rich content. VueUse's `useClipboard` only handles text. This is a genuine gap in the ecosystem. The only way developers currently copy rich content is with raw ClipboardItem API code, which is verbose and error-prone.

## Sources

- [MDN ClipboardItem](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem) -- constructor, MIME types, browser compat (Baseline June 2024). Confidence: HIGH.
- [MDN Clipboard.write()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write) -- write method, ClipboardItem array parameter, permission model. Confidence: HIGH.
- [MDN Clipboard.read()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read) -- read method, unsanitized option, return type. Confidence: HIGH.
- [MDN Clipboard API Security](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) -- permission differences across Chrome/Firefox/Safari. Confidence: HIGH.
- Existing codebase analysis (copy.ts, read.ts, detect.ts, types.ts, errors.ts) -- current patterns and error handling conventions. Confidence: HIGH.
- Browser support versions from MDN compat data and Baseline status. Confidence: MEDIUM (versions may shift with updates; verified against MDN as of April 2026).
- Benchmark methodology based on vitest bench (tinybench) capabilities already available in the project. Confidence: MEDIUM (benchmark design not yet validated in practice).

---
*Feature research for: Rich Clipboard & Benchmarks (v0.4.0)*
*Researched: 2026-04-16*
