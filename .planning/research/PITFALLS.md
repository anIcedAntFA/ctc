# Pitfalls Research

**Domain:** Adding rich clipboard (ClipboardItem API) to existing browser clipboard utility library
**Researched:** 2026-04-16
**Confidence:** HIGH (verified against MDN Clipboard/ClipboardItem docs, existing codebase patterns, Playwright config, TypeScript lib.dom.d.ts)

## Critical Pitfalls

### Pitfall 1: ClipboardItem Constructor Accepts Promise Values — But Only In Some Browsers

**What goes wrong:**
The ClipboardItem constructor signature accepts `string | Blob | PromiseLike<string | Blob>` per the spec (and TypeScript lib.dom.d.ts confirms this). Safari requires the `ClipboardItem` to be created synchronously within the user gesture handler, using a Promise-valued MIME entry to defer async data fetching. However, Firefox's ClipboardItem support (when enabled) and older Chromium versions may not accept `PromiseLike` values — they expect resolved `Blob` or `string` values only. Writing `copyRichContent` that relies on Promise-valued ClipboardItem entries will break on browsers that only accept resolved values.

**Why it happens:**
The Promise-in-ClipboardItem pattern is specifically a Safari workaround for user gesture activation. Chrome added support later. Firefox's ClipboardItem support was behind a pref flag (`dom.events.asyncClipboard.clipboardItem`) until recently and its Promise support lagged behind. Developers copy Safari-specific patterns from blog posts without testing on Firefox.

**How to avoid:**
For `copyRichContent(html, text)` where both values are already available (the planned API), always construct ClipboardItem with resolved values — never use Promise entries. The Promise-in-ClipboardItem pattern is only needed when data must be fetched asynchronously after the user gesture, which is NOT the case for this library's API where callers pass html and text directly:

```typescript
// CORRECT for copyRichContent(html, text) — values already available
const item = new ClipboardItem({
  'text/html': new Blob([html], { type: 'text/html' }),
  'text/plain': new Blob([text], { type: 'text/plain' }),
})
await navigator.clipboard.write([item])
```

The caller is responsible for having data ready before calling `copyRichContent`. Document this in TSDoc: "Must be called synchronously within a user gesture handler. Fetch data before calling."

**Warning signs:**
- Using `PromiseLike` values in ClipboardItem constructor
- Tests pass in Chrome/Safari but fail in Firefox
- Blog post code pasted without verifying against the library's actual use case

**Phase to address:**
Phase 1 (core `copyRichContent` implementation). The function signature accepts resolved strings, so Promise-valued entries are never needed.

---

### Pitfall 2: Firefox ClipboardItem Support Is Now Baseline But `clipboard.read()` Has Stricter Permissions

**What goes wrong:**
ClipboardItem became Baseline 2024 (available since June 2024 across latest browsers). Developers assume this means `navigator.clipboard.write([clipboardItem])` and `navigator.clipboard.read()` work identically across browsers. They do not. For `readRichContent()`:
- Chrome requires `clipboard-read` permission (grantable via Permissions API / Playwright contextOptions)
- Firefox shows a system paste prompt and does NOT support granting `clipboard-read` via the Permissions API
- Safari shows a system-level paste confirmation dialog

Writing `readRichContent` tests that rely on Playwright `grantPermissions(['clipboard-read'])` will only work in Chromium.

**Why it happens:**
The existing codebase already handles this for `readFromClipboard()` — the `skipReadPermission` helper in `clipboard.spec.ts` skips read tests on Firefox/WebKit. But when adding `readRichContent()`, developers may forget to apply the same skip pattern, or may try to test rich content reading on Firefox and hit permission walls.

**How to avoid:**
1. Reuse the existing `skipReadPermission` pattern from `clipboard.spec.ts` for all `readRichContent` E2E tests
2. In `readRichContent()` implementation, use the same guard chain as `readFromClipboard()`: check `isBrowser()`, `isSecureContext()`, then check `typeof navigator.clipboard?.read === 'function'`
3. Add a new detection function `isRichClipboardReadSupported()` that checks for `navigator.clipboard.read` (not `readText`)
4. Document that `readRichContent` read behavior varies by browser — Firefox may show a paste prompt the library cannot control

**Warning signs:**
- E2E tests for `readRichContent` not using the `skipReadPermission` guard
- Tests written assuming `grantPermissions` works on all browsers
- No browser-specific skip annotations in rich clipboard read tests

**Phase to address:**
Phase 1 (core `readRichContent` implementation) and Phase 2 (E2E tests for rich clipboard).

---

### Pitfall 3: HTML Sanitization Silently Strips Content

**What goes wrong:**
When writing HTML to clipboard via `ClipboardItem({ 'text/html': blob })`, Chrome sanitizes the HTML by default — stripping `<script>` tags, event handlers, and potentially `<style>` blocks. When reading HTML back via `clipboard.read()`, Chrome returns sanitized HTML. The roundtrip `copyRichContent(html) -> readRichContent()` produces different HTML than what was written. Tests that assert exact HTML equality will fail.

**Why it happens:**
Chrome applies sanitization as a security measure to prevent clipboard-based XSS attacks. This happens transparently. MDN documents an `unsanitized` option for `clipboard.read({ unsanitized: ['text/html'] })` but browser support for this option is limited and inconsistent.

**How to avoid:**
1. Document clearly in TSDoc that HTML may be sanitized by the browser during write or read operations — the library does not control this
2. Do NOT attempt to implement `unsanitized` read — it is not widely supported and creates a false sense of security
3. In unit tests, test with simple HTML that survives sanitization (e.g., `<b>bold</b>` not `<script>alert(1)</script>`)
4. In the return type for `readRichContent()`, document that the `html` field may differ from what was originally copied
5. Do NOT add sanitization to the library itself — the library's job is to pass data to/from the clipboard, not to sanitize HTML. Sanitization is the consumer's responsibility.

**Warning signs:**
- E2E tests comparing exact HTML strings fail in Chrome but pass in Firefox
- Tests use complex HTML with styles/scripts that get stripped
- Feature requests to "preserve exact HTML" — this is a browser limitation, not a library bug

**Phase to address:**
Phase 1 (core implementation). Document the limitation. Phase 2 (E2E tests) must use sanitization-safe test HTML.

---

### Pitfall 4: Bundle Size Blowup From ClipboardItem Feature Detection Boilerplate

**What goes wrong:**
Each rich clipboard function needs its own guard chain: `isBrowser()` + `isSecureContext()` + `typeof ClipboardItem !== 'undefined'` + `typeof navigator.clipboard?.write === 'function'`. Duplicating this across `copyRichContent`, `readRichContent`, and detection functions adds significant bytes. The core module has a 1KB gzip budget. Adding two new functions with full guard chains, error handling, and Blob construction could push past the limit.

**Why it happens:**
The existing functions (`copyToClipboard`, `readFromClipboard`, `isClipboardSupported`, `isClipboardReadSupported`, `copyToClipboardLegacy`) already use ~1KB. Adding rich clipboard functions with similar boilerplate doubles the guard/error code. The zero-dependency constraint means no shared abstractions from external packages.

**How to avoid:**
1. Measure after implementing, not before assuming. Run `pnpm build && pnpm size` after adding each function
2. Share internal guard functions — `isBrowser()`, `isSecureContext()` are already shared via `lib/env.ts`. Add `isClipboardWriteAvailable()` and `isClipboardReadAvailable()` as internal helpers
3. Consider whether `copyRichContent` and `readRichContent` should be in a separate subpath export (`@ngockhoi96/ctc/rich-clipboard` or `@ngockhoi96/ctc/clipboard/rich`) so consumers who only need text copy don't pay for rich clipboard code
4. If the combined module exceeds 1KB gzip, split into subpath exports and set separate size-limit entries
5. The `createError` and `handleError` helpers are already shared — ensure new functions reuse them, not inline error construction

**Warning signs:**
- `pnpm size` fails after adding rich clipboard functions
- Guard chains are copy-pasted instead of extracted to shared helpers
- No separate size-limit entry for the rich clipboard subpath

**Phase to address:**
Phase 0 (architecture audit — already planned). Decide the folder structure and subpath export strategy before implementing.

---

### Pitfall 5: SSR Safety for `ClipboardItem` Global — Different From `navigator.clipboard`

**What goes wrong:**
The existing SSR guard pattern checks `typeof navigator !== 'undefined'` and `typeof window !== 'undefined'`. But `ClipboardItem` is a separate global constructor — not a property of `navigator` or `window`. Writing `typeof ClipboardItem !== 'undefined'` at module scope crashes SSR. Writing `new ClipboardItem(...)` inside a function without first checking the global exists also crashes SSR if the function is somehow called server-side.

**Why it happens:**
Developers pattern-match on the existing `navigator.clipboard` guards and forget that `ClipboardItem` is a standalone global. In Node.js/Deno/Bun, `ClipboardItem` is not defined. The existing `isBrowser()` check returns false in SSR, which prevents reaching the `ClipboardItem` code — but only if the guard is the FIRST thing in the function.

**How to avoid:**
1. Always check `isBrowser()` before any `ClipboardItem` reference — the existing pattern already does this for navigator.clipboard
2. Add an explicit `typeof ClipboardItem !== 'undefined'` check AFTER the `isBrowser()` guard, INSIDE the function body
3. Never reference `ClipboardItem` at module scope (same rule as `navigator`)
4. Add a `isRichClipboardSupported()` detection function that checks: `isBrowser() && isSecureContext() && typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function'`
5. Add a CI test that imports the built package in Node.js — the existing v0.1.0 test does `require('./dist/index.cjs')` which validates plain clipboard imports, but must also validate rich clipboard imports

**Warning signs:**
- `ClipboardItem` referenced before `isBrowser()` check
- `ClipboardItem` referenced at module scope (even in a type guard)
- No SSR import test covering the new rich clipboard exports

**Phase to address:**
Phase 1 (core implementation). Follow the existing guard pattern exactly.

---

### Pitfall 6: TypeScript `ClipboardItem` Types Exist But `ClipboardItem.supports()` Is Newer

**What goes wrong:**
TypeScript lib.dom.d.ts (both TS 5.6 and TS 6.0 in this project's dependencies) includes `ClipboardItem` with the `supports()` static method. However, `ClipboardItem.supports()` only became Baseline 2025 (March 2025). Browsers shipped before mid-2024 may have `ClipboardItem` but NOT `supports()`. Using `ClipboardItem.supports('text/html')` without a fallback will throw `TypeError` on older browsers that have the constructor but not the static method.

**Why it happens:**
TypeScript types represent the latest spec, not what every browser actually implements. The types say `supports()` exists, so developers use it without a runtime check. The library targets ES2020+ which includes browsers that predate `supports()`.

**How to avoid:**
1. Always guard `ClipboardItem.supports` with a typeof check:
```typescript
function isRichClipboardMimeSupported(mimeType: string): boolean {
  if (typeof ClipboardItem === 'undefined') return false
  if (typeof ClipboardItem.supports !== 'function') return false
  return ClipboardItem.supports(mimeType)
}
```
2. Do NOT rely on `ClipboardItem.supports()` as a prerequisite for `copyRichContent`. The core MIME types (`text/html`, `text/plain`) are universally supported wherever `ClipboardItem` exists. Use `supports()` only as an informational/detection helper, not as a gate.
3. If `supports()` is unavailable, assume `text/html` and `text/plain` are supported (they are in all ClipboardItem implementations).

**Warning signs:**
- Code calls `ClipboardItem.supports()` without checking if the method exists
- Feature detection function returns false negatives on browsers that support ClipboardItem but not `supports()`
- Tests mock `ClipboardItem` but forget to mock/omit `supports`

**Phase to address:**
Phase 1 (detection functions). The `isRichClipboardSupported()` function must not depend on `supports()`.

---

### Pitfall 7: Framework Adapter `readRichContent` State Shape Breaks Existing Pattern

**What goes wrong:**
The existing adapter pattern returns `{ copy, copied, error, reset }`. Adding rich clipboard means adding `copyRich` and potentially `readRich` methods. Developers may try to overload the existing hook (`useCopyToClipboard`) to handle both text and rich content, bloating the hook and breaking the single-responsibility pattern. Or they create a new hook with an incompatible return shape.

**Why it happens:**
The v0.3.0 adapters were designed for text-only copy. Rich clipboard has a fundamentally different data shape:
- `copyRichContent(html, text)` takes TWO parameters, not one
- `readRichContent()` returns `{ html: string | null, text: string | null }`, not a flat string
- Read operations introduce new state (the read result) that copy-only hooks do not have

**How to avoid:**
1. Create SEPARATE hooks/composables/actions for rich clipboard — do not extend existing ones:
   - React: `useCopyRichContent()` (not overloading `useCopyToClipboard`)
   - Vue: `useCopyRichContent()` composable
   - Svelte: `copyRichAction` action + runes
2. Keep the return shape consistent with existing pattern where possible: `{ copyRich, copied, error, reset }`
3. For read operations, create a separate `useReadRichContent()` hook if needed, or bundle read into the rich hook with a `readRich` method in the return
4. Ensure the new hooks/composables are in separate files and separate exports — tree-shaking must work. Consumers who import only `useCopyToClipboard` must not pay for `useCopyRichContent` code
5. Each adapter's `package.json` must stay under 2KB brotli. Measure after adding.

**Warning signs:**
- Existing `useCopyToClipboard` hook is modified to accept HTML/rich content
- New hook returns a different shape than `{ copy*, copied, error, reset }`
- Adapter bundle size exceeds 2KB after adding rich clipboard hooks

**Phase to address:**
Phase 0 (architecture audit) for the API design decision. Phase 2 (adapter implementation) for execution.

---

### Pitfall 8: Playwright E2E Tests for Rich Clipboard Require Different Permission Handling Than Text

**What goes wrong:**
`navigator.clipboard.write()` (used by `copyRichContent`) may require different permission grants than `navigator.clipboard.writeText()` (used by existing `copyToClipboard`). In Chromium, the existing `clipboard-write` permission covers both. But verifying the write by reading back via `navigator.clipboard.read()` (not `readText()`) requires `clipboard-read` permission. The existing E2E tests use `readText()` to verify — but rich content verification needs `read()` + `getType()`.

**Why it happens:**
The existing Playwright config grants `['clipboard-read', 'clipboard-write']` for Chromium, which covers both text and rich operations. But the test code must use `clipboard.read()` (returns `ClipboardItem[]`) instead of `clipboard.readText()` to verify HTML content. The `page.evaluate()` callback must handle the async `ClipboardItem.getType()` call and Blob-to-text conversion.

**How to avoid:**
1. E2E verification for rich clipboard must use the full ClipboardItem read flow:
```typescript
const html = await page.evaluate(async () => {
  const items = await navigator.clipboard.read()
  const item = items[0]
  if (!item.types.includes('text/html')) return null
  const blob = await item.getType('text/html')
  return blob.text()
})
```
2. Keep using the existing `skipReadPermission` guard — rich clipboard read verification is Chromium-only in Playwright
3. For Firefox/WebKit E2E, test only that `copyRichContent` returns `true` (write succeeded) without verifying clipboard contents
4. Ensure the vanilla playground exposes `__clipboard.copyRichContent` and `__clipboard.readRichContent` on `window` for E2E access

**Warning signs:**
- E2E tests try to verify rich clipboard content on Firefox/WebKit
- Tests use `readText()` to verify HTML content (will only return plain text fallback)
- Playground fixture does not expose new rich clipboard functions

**Phase to address:**
Phase 2 (E2E tests for rich clipboard).

---

### Pitfall 9: `text/html` Blob Must Include Complete HTML — Bare Fragments May Be Ignored

**What goes wrong:**
Passing `<b>bold</b>` as the HTML to `ClipboardItem` works in Chrome but may be treated as plain text or ignored by some paste targets. Some applications expect clipboard HTML to have a basic structure (at minimum a `<html>` or `<body>` wrapper). The HTML fragment in the clipboard is browser-processed and may lose formatting if too minimal.

**Why it happens:**
The clipboard HTML format varies by OS. Windows uses a specific CF_HTML format with headers. macOS uses NSPasteboardTypeHTML. Browsers handle the wrapping internally when you use `ClipboardItem`, but the behavior with bare fragments is inconsistent across paste targets (Word, Google Docs, rich text editors).

**How to avoid:**
1. In `copyRichContent`, do NOT wrap the HTML — let the browser handle it. The consumer passes whatever HTML they want; the library passes it through to the clipboard API as-is
2. Document in TSDoc that the HTML string does not need wrapping — the browser handles clipboard format conversion
3. In tests, use HTML that is representative of real-world usage: `<p>Hello <strong>world</strong></p>` rather than bare text nodes
4. Do NOT attempt to "fix" or normalize the HTML — this violates the zero-dependency constraint and adds complexity

**Warning signs:**
- Library wraps user HTML in `<html><body>...</body></html>` (unnecessary, browser does this)
- Tests use minimal HTML that doesn't represent real usage
- Bug reports about pasted HTML looking different in Word vs Google Docs (this is a paste target issue, not a library issue)

**Phase to address:**
Phase 1 (core implementation). Document the limitation. Do not attempt to solve it.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Adding rich clipboard to existing barrel export without subpath | Simpler package.json | Consumers who only use text copy pay for rich clipboard bytes in bundle | Acceptable only if combined module stays under 1KB gzip |
| Skipping `ClipboardItem.supports()` detection function | One less function to maintain | Consumers cannot check MIME type support before calling | Acceptable for v0.4.0 — `text/html` and `text/plain` are universally supported |
| Copy-pasting guard chains instead of extracting shared helper | Faster to implement | Duplicated code grows maintenance burden and byte count | Never — extract to shared internal functions |
| Using `as` cast for ClipboardItem in unit test mocks | Avoids complex mock setup | Hides type mismatches, tests may not catch real issues | Acceptable with `// eslint-disable-next-line` comment explaining why |
| Not testing `readRichContent` E2E on Firefox/WebKit | Faster green CI | Bugs in Firefox/WebKit read path go undetected | Acceptable — clipboard.read() permission cannot be granted in Playwright for these browsers |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| React adapter + rich clipboard | Overloading `useCopyToClipboard` with HTML parameter | Create separate `useCopyRichContent` hook |
| Vue composable + rich clipboard | Making `useCopyRichContent` depend on `useCopyToClipboard` internally | Both hooks call core functions independently — no hook-calls-hook pattern |
| Svelte action + rich clipboard | Using `use:copyAction` for both text and rich — action parameter type becomes union | Create `use:copyRichAction` with `{ html: string, text: string }` parameter |
| Svelte runes + rich clipboard | Exposing mutable `$state` for `{ html, text }` result | Use readonly derived state for read results |
| Existing ErrorCode union + new codes | Adding `RICH_CLIPBOARD_NOT_SUPPORTED` as new code but not updating `EXPECTED_ERROR_CODES` set | Add new error codes to both the type union AND the expected set in `errors.ts` |
| Vanilla playground + rich clipboard | Not adding rich clipboard demo buttons to the playground HTML | Must add rich copy/read buttons AND expose functions on `window.__clipboard` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Creating new Blob on every `copyRichContent` call | GC pressure on rapid repeated copies | Acceptable — Blob creation is cheap for text-sized content | Only if copying megabytes of HTML repeatedly (not a real use case) |
| Reading all MIME types from ClipboardItem when only HTML is needed | Slow read on clipboard items with images/files | In `readRichContent`, only call `getType()` for `text/html` and `text/plain`, skip other MIME types | Clipboard contains large image data alongside HTML |
| Importing rich clipboard functions pulls in all of core | No tree-shaking benefit from separate functions | Ensure rich clipboard functions are in separate files, not mixed into `copy.ts`/`read.ts` | When consumers only import `copyToClipboard` but bundle includes `copyRichContent` |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing raw HTML from `readRichContent` without consumer warning | XSS if consumer injects clipboard HTML into DOM via `innerHTML` | Document in TSDoc: "HTML from clipboard is untrusted. Sanitize before rendering." Do NOT sanitize in the library — consumers choose their sanitizer. |
| Not documenting the `unsanitized` read option omission | Consumers may wonder why read HTML differs from written HTML | Document that the library intentionally does NOT use `unsanitized` read — browser sanitization is a security feature |
| Using `readRichContent` to exfiltrate clipboard in background | Privacy violation — reading clipboard without user awareness | The browser's permission model prevents this. Document that `readRichContent` requires user gesture and permission grant. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| `copyRichContent` fails silently when ClipboardItem is unavailable | User clicks "Copy rich" and nothing happens | Return `false` with `RICH_CLIPBOARD_NOT_SUPPORTED` error code. Consumer can fall back to `copyToClipboard(text)` |
| `readRichContent` returns `null` for both html and text when only text/plain is on clipboard | Consumer expected at least text/plain from a rich read | Return `{ html: null, text: 'the text' }` when only text/plain is available — do not return all-null |
| No guidance on which function to use (text vs rich) | Developers always use `copyRichContent` even for plain text, adding unnecessary bytes | Document: "Use `copyToClipboard` for text-only. Use `copyRichContent` only when you need HTML formatting preserved." |

## "Looks Done But Isn't" Checklist

- [ ] **copyRichContent:** Often missing the `text/plain` fallback in ClipboardItem — always include both `text/html` AND `text/plain` MIME types so paste targets without HTML support get plain text
- [ ] **readRichContent:** Often only reads `text/html` — must also read `text/plain` as a separate return field. Check `item.types` before calling `getType()` to avoid `NotFoundError`
- [ ] **Detection functions:** Often checks `ClipboardItem` existence but not `navigator.clipboard.write` — both must be present
- [ ] **Error codes:** New codes (`RICH_CLIPBOARD_NOT_SUPPORTED`, `RICH_CLIPBOARD_WRITE_FAILED`, `RICH_CLIPBOARD_READ_FAILED`) must be added to the `ErrorCode` union type AND the `EXPECTED_ERROR_CODES` set
- [ ] **SSR safety:** `typeof ClipboardItem` guard must be inside function body, never at module scope
- [ ] **Bundle size:** Must run `pnpm size` after adding rich clipboard — if over 1KB, split into subpath export
- [ ] **Playground:** Vanilla playground must expose `copyRichContent` and `readRichContent` on `window.__clipboard` for E2E
- [ ] **Framework adapters:** Each adapter must export new hook/composable/action AND re-export new types from core
- [ ] **ClipboardItem.supports():** Must guard with `typeof ClipboardItem.supports === 'function'` — not all ClipboardItem implementations have it

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Bundle exceeds 1KB after adding rich clipboard | LOW | Split into subpath export `@ngockhoi96/ctc/clipboard/rich`; add separate size-limit entry |
| Adapter hook return shape inconsistent with existing pattern | MEDIUM | Rename/restructure the hook before publishing; breaking change if already released |
| Missing text/plain fallback in ClipboardItem | LOW | Add the second MIME entry; no API change needed |
| readRichContent returns wrong shape | HIGH if already published | Requires breaking change or overloaded return type; must get right before first publish |
| E2E tests flaky on rich clipboard read | LOW | Add `skipReadPermission` guard; accept Chromium-only verification |
| New error codes missing from ErrorCode union | LOW | Add to union type; patch release. Not breaking since it is a union expansion |
| SSR crash from ClipboardItem reference | MEDIUM | Add guard; patch release. Same recovery as original SSR pitfall |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Promise-valued ClipboardItem entries (P1) | Phase 1: Core Implementation | Use resolved Blob values only; unit test confirms no Promise values |
| Firefox/Safari read permission differences (P2) | Phase 1: Core Implementation + Phase 2: E2E | `skipReadPermission` applied to all rich read E2E tests |
| HTML sanitization transparency (P3) | Phase 1: Core Implementation | TSDoc documents sanitization; tests use sanitization-safe HTML |
| Bundle size blowup (P4) | Phase 0: Architecture Audit | `pnpm size` passes after implementation; subpath split if needed |
| SSR safety for ClipboardItem global (P5) | Phase 1: Core Implementation | `node -e "require('./dist/index.cjs')"` CI step covers new exports |
| ClipboardItem.supports() availability (P6) | Phase 1: Detection Functions | Guard function does not depend on `supports()`; tested with mock that omits it |
| Adapter return shape design (P7) | Phase 0: Architecture Audit | API design reviewed before implementation; consistent `{ copy*, copied, error, reset }` pattern |
| E2E permission handling for rich clipboard (P8) | Phase 2: E2E Tests | Chromium-only verification; Firefox/WebKit test write success only |
| HTML fragment handling (P9) | Phase 1: Core Implementation | Document that library passes HTML through as-is; no wrapping |

## Sources

- [MDN: ClipboardItem](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem) — constructor signature, browser compatibility (Baseline 2024)
- [MDN: Clipboard.write()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write) — write method, supported MIME types (text/html, text/plain, image/png)
- [MDN: Clipboard.read()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read) — read method, unsanitized option, permission differences
- [MDN: ClipboardItem.supports()](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem/supports_static) — Baseline 2025 (March 2025), newer than ClipboardItem itself
- TypeScript lib.dom.d.ts (TS 5.6 and 6.0) — verified ClipboardItem types including `supports()` static method and `PromiseLike` constructor parameter
- Existing codebase: `packages/core/src/clipboard/` — current guard patterns, error handling, SSR safety
- Existing codebase: `packages/core/playwright.config.ts` — current permission grants and browser-specific skip patterns
- Existing codebase: `packages/core/tests/e2e/clipboard.spec.ts` — current `skipReadPermission` pattern for Firefox/WebKit

---
*Pitfalls research for: Adding rich clipboard (ClipboardItem API) to existing browser clipboard utility library*
*Researched: 2026-04-16*
