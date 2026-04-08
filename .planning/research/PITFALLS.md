# Pitfalls Research

**Domain:** Browser clipboard utility library (npm package)
**Researched:** 2026-04-08
**Confidence:** HIGH (verified across MDN, W3C spec issues, WebKit blog, browser bug trackers)

## Critical Pitfalls

### Pitfall 1: Safari Kills Async Clipboard Writes After User Gesture

**What goes wrong:**
`navigator.clipboard.writeText()` called inside an async chain (after `await` or `.then()`) throws `NotAllowedError` in Safari, even when the original trigger was a user click. Safari considers the user activation "consumed" once you yield to the microtask queue.

**Why it happens:**
Safari's user activation model is stricter than Chrome's. Chrome grants a transient activation window (~5 seconds); Safari requires the clipboard call to be in the synchronous call stack of the user gesture handler. Any `await` between the click and `writeText()` breaks the chain.

**How to avoid:**
For simple text copy, call `navigator.clipboard.writeText()` synchronously within the click handler -- do NOT await anything before it. For cases where async data fetching is needed before copy, use the `ClipboardItem` with a Promise pattern:

```typescript
// Pass the async work INTO the ClipboardItem, not around it
const item = new ClipboardItem({
  "text/plain": fetchData().then(text => new Blob([text], { type: "text/plain" }))
});
navigator.clipboard.write([item]); // called synchronously from handler
```

**Warning signs:**
- `copyToClipboard` works in Chrome but fails silently or throws in Safari
- Tests pass in Chromium Playwright but fail in WebKit
- Any `await` keyword appears between the user event and the clipboard call

**Phase to address:**
Phase 1 (core implementation). This must be baked into the API design from day one. The function signature and internal flow must account for Safari's constraints.

---

### Pitfall 2: Firefox Does Not Support ClipboardItem (Without Prefs Flag)

**What goes wrong:**
The `ClipboardItem` constructor and `navigator.clipboard.write()` are behind the `dom.events.asyncClipboard.clipboardItem` preference in Firefox, which is off by default. Using the Safari workaround (Pitfall 1) breaks Firefox.

**Why it happens:**
Firefox has partial Clipboard API support. `writeText()` works fine with a user gesture, but `write()` with `ClipboardItem` requires a hidden pref. This creates a three-way incompatibility: Chrome (permissive), Safari (needs ClipboardItem pattern), Firefox (ClipboardItem unavailable).

**How to avoid:**
Branch by capability, not by browser detection:
1. Try `writeText()` first (works in all three browsers for plain text)
2. Only use `ClipboardItem` + `write()` for rich content (HTML/images)
3. For rich content, feature-detect `ClipboardItem` existence before using it
4. For the async-data-then-copy use case, restructure so data is fetched BEFORE the user gesture triggers the copy

```typescript
// Feature detection, not browser sniffing
if (typeof ClipboardItem !== 'undefined') {
  // Safari-compatible path with ClipboardItem
} else {
  // Firefox path with writeText()
}
```

**Warning signs:**
- Code uses `navigator.clipboard.write()` without checking for `ClipboardItem`
- E2E tests skip Firefox or only run on Chromium
- Rich content copy silently fails in Firefox

**Phase to address:**
Phase 1 (core implementation). Feature detection must be the branching strategy from the start.

---

### Pitfall 3: Clipboard API Requires Secure Context (HTTPS)

**What goes wrong:**
`navigator.clipboard` is `undefined` on HTTP pages (not just permission-denied -- the entire object is missing). Library consumers deploying on HTTP, local development servers without HTTPS, or embedded iframes on HTTP origins get cryptic "cannot read property writeText of undefined" errors.

**Why it happens:**
The Clipboard API is specified as requiring a secure context. `localhost` counts as secure, but `http://192.168.x.x` or plain HTTP deployments do not. Many developers test on localhost and never encounter this until production on HTTP.

**How to avoid:**
1. Check `window.isSecureContext` before attempting clipboard operations
2. Check `navigator.clipboard` existence explicitly
3. Return `false` with a `console.warn` explaining WHY it failed (not just "clipboard not supported")
4. Provide the explicit `execCommand` fallback function for HTTP contexts (already in project scope)

```typescript
if (!window.isSecureContext) {
  console.warn('Clipboard API requires a secure context (HTTPS). Use copyWithExecCommand() as fallback.');
  return false;
}
```

**Warning signs:**
- Library works on localhost but fails on staging/production HTTP
- Error message says "clipboard not supported" when the real issue is HTTP

**Phase to address:**
Phase 1 (core implementation). The `isClipboardSupported()` function must check secure context, and error codes must distinguish `CLIPBOARD_NOT_SUPPORTED` from `CLIPBOARD_INSECURE_CONTEXT`.

---

### Pitfall 4: package.json Exports Map + TypeScript Declaration Mismatch

**What goes wrong:**
Library publishes with `exports` field in package.json, but TypeScript consumers cannot resolve types. The library works at runtime but breaks at compile time. Nearly one-third of types-included npm packages have module-related typing issues (per arethetypeswrong data).

**Why it happens:**
Multiple interacting mistakes:
1. `"types"` condition placed AFTER `"import"`/`"require"` in exports (order matters -- types must be first)
2. Single `.d.ts` file shared between ESM and CJS exports (TypeScript infers module format from `.d.ts` vs `.d.cts` vs `.d.mts` extensions)
3. Missing `"types"` field in subpath exports (e.g., `"./clipboard"` has import/require but no types)
4. Consumer uses `moduleResolution: "node"` (legacy) which ignores exports entirely

**How to avoid:**
1. Always put `"types"` FIRST in each export condition:
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.mts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```
2. Generate separate `.d.mts` and `.d.cts` declaration files (tsdown supports this)
3. Run `publint` and `attw` (arethetypeswrong) in CI on every build
4. Test with `moduleResolution: "bundler"` AND `"node16"` consumers

**Warning signs:**
- `publint` or `attw` reports errors but they're ignored
- Types work in the playground but not when installed from npm
- GitHub issues from consumers saying "types not found"

**Phase to address:**
Phase 1 (build + CI setup). `publint` and `attw` must be in the CI pipeline from the first build.

---

### Pitfall 5: Testing Clipboard in CI Headless Browsers

**What goes wrong:**
Clipboard E2E tests pass locally but fail in CI. Headless browsers have different permission models, no system clipboard, and user gesture simulation behaves differently.

**Why it happens:**
- Headless Chromium does not have a system clipboard by default
- Clipboard permissions must be explicitly granted via `browserContext.grantPermissions(['clipboard-read', 'clipboard-write'])`
- Firefox headless does not support `clipboard-read` permission grant the same way
- WebKit/Safari in Playwright has its own clipboard permission model
- User gesture simulation timing differs between headed and headless modes

**How to avoid:**
1. Grant clipboard permissions explicitly in Playwright context setup:
```typescript
const context = await browser.newContext({
  permissions: ['clipboard-read', 'clipboard-write']
});
```
2. Use `page.evaluate()` for clipboard operations rather than trying to interact with system clipboard
3. Run clipboard tests sequentially (not in parallel) -- clipboard is a shared resource
4. Increase timeouts for clipboard operations in CI
5. Accept that some tests may need to be Chromium-only for clipboard read (Firefox/WebKit limitations)
6. Consider using `xvfb` (virtual framebuffer) on Linux CI for headed-mode tests if headless is unreliable

**Warning signs:**
- Tests pass locally, fail in CI
- Flaky clipboard tests that pass sometimes
- Tests only run on Chromium, never tested on Firefox/WebKit

**Phase to address:**
Phase 1 (E2E test setup). The Playwright configuration must handle CI clipboard permissions from the start.

---

### Pitfall 6: execCommand Fallback Looks Simple But Has Hidden Complexity

**What goes wrong:**
The `document.execCommand('copy')` fallback is implemented naively -- it works on desktop Chrome but fails on iOS Safari, fails when called outside a user gesture, or leaves invisible textarea elements in the DOM on error.

**Why it happens:**
The textarea-based fallback has platform-specific requirements:
- iOS Safari requires the textarea to be VISIBLE and in the viewport (not `display:none` or off-screen)
- The textarea must have `contentEditable` and `readOnly` set correctly on iOS
- Selection range must be set with `setSelectionRange(0, 99999)` on mobile, not just `select()`
- The textarea must be cleaned up even if `execCommand` throws
- Some browsers return `false` from `execCommand` without throwing

**How to avoid:**
1. Use `font-size: 16px` on the textarea (prevents iOS zoom)
2. Position with `position: fixed; top: 0; left: 0; opacity: 0` (visible to Safari but invisible to user)
3. Set both `contentEditable = true` and `readOnly = true` for iOS
4. Use `setSelectionRange(0, text.length)` instead of `select()`
5. Wrap in try/finally to guarantee textarea cleanup
6. Check `execCommand` return value AND catch exceptions

**Warning signs:**
- Fallback works on desktop but fails on mobile
- Leftover invisible textareas accumulating in DOM
- iOS Safari zooms in when copy is triggered

**Phase to address:**
Phase 1 (fallback implementation). The explicit fallback function must handle these edge cases from day one.

---

### Pitfall 7: SSR Crashes from Navigator/Window Access

**What goes wrong:**
Library imported in Next.js, Nuxt, or any SSR framework throws `ReferenceError: navigator is not defined` at import time, crashing the server.

**Why it happens:**
Module-level code that accesses `navigator`, `window`, or `document` executes during import. SSR environments import all modules on the server where these globals don't exist. Even `const isSupported = !!navigator.clipboard` at module scope causes this.

**How to avoid:**
1. NEVER access browser globals at module scope
2. All browser API access must be inside function bodies
3. Guard with `typeof navigator !== 'undefined'` inside functions, not at module level
4. Use `typeof window !== 'undefined'` for `isSecureContext` checks
5. Test by importing the library in a Node.js script (no browser) -- it should import without errors

```typescript
// BAD -- crashes on import in SSR
const hasClipboard = !!navigator?.clipboard;

// GOOD -- deferred to function call
function isClipboardSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.clipboard;
}
```

**Warning signs:**
- Any `navigator`, `window`, or `document` reference outside a function body
- Library has no test that imports it in a pure Node.js environment
- Barrel file (`index.ts`) re-exports modules that access browser globals at top level

**Phase to address:**
Phase 1 (core implementation). Add a CI step that imports the built package in Node.js without a browser -- must not throw.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Single `.d.ts` for ESM+CJS | Simpler build config | TypeScript consumers get wrong module inference; `attw` flags errors | Never -- tsdown generates separate files; configure it correctly from start |
| Browser sniffing instead of feature detection | Quick fix for Safari | Breaks when browsers change UA strings or add/remove features | Never |
| Skipping WebKit E2E tests | Faster CI, fewer flaky tests | Safari bugs ship to users undetected | Acceptable in early dev, must add before v0.1.0 release |
| `any` casts for ClipboardItem | TypeScript doesn't have perfect ClipboardItem types | Hides type errors, confuses consumers | Only with documented reason in code comment |
| Bundling into single file (no subpath exports) | Simpler package.json | No tree-shaking for consumers who only need `isClipboardSupported` | Acceptable for v0.1.0 if bundle is <1KB anyway |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| npm publish via changesets | Publishing without running `publint`/`attw` first | Add validation to prepublish script AND CI |
| Playwright in GitHub Actions | Not installing browser binaries | Use `npx playwright install --with-deps chromium firefox` in CI setup |
| tsdown CJS output | Generating `.js` files with `"type": "module"` in package.json | Ensure CJS output uses `.cjs` extension, ESM uses `.mjs` |
| size-limit in CI | Checking minified but not gzipped size | Configure size-limit with `gzip: true`; the <1KB target is gzip |
| Biome + tsdown output | Linting generated dist/ files | Add `dist/` to Biome ignore patterns |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Creating textarea element on every execCommand call | DOM thrashing if copy is called rapidly | Create once, reuse, remove on idle | Rapid sequential copies (e.g., "copy all" feature) |
| Not cleaning up event listeners on clipboard events | Memory leak in long-running SPAs | Use AbortController or explicit removeEventListener | After hours of SPA usage |
| Synchronous large text copy via execCommand | UI freeze on >100KB text | Warn in docs; async Clipboard API handles large text better | Text >100KB |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Reading clipboard without explaining why to user | Browser shows scary permission prompt with no context; user denies | Document that consumers should explain WHY clipboard read is needed before calling `readFromClipboard()` |
| Not sanitizing HTML in `copyRichContent` | XSS via clipboard -- malicious HTML copied then pasted into vulnerable editors | Document that the library copies what you give it; sanitization is the consumer's responsibility. Consider warning in TSDoc. |
| Exposing raw clipboard errors to users | Error messages may contain system/permission details | Map all errors to typed `BrowserUtilsError` codes; never expose raw `DOMException` messages |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Failing silently on permission denied | User clicks "Copy" button, nothing happens, no feedback | Return `false` AND trigger `onError` with `CLIPBOARD_PERMISSION_DENIED` so UI can show feedback |
| No user gesture context in docs | Developers wire up copy on timer/programmatic trigger, it fails | Document prominently: "Must be called from a user gesture (click, keydown)" with examples |
| execCommand fallback without visual feedback | User doesn't know copy succeeded because there's no native browser toast | Document that consumers should provide their own "Copied!" feedback UI |

## "Looks Done But Isn't" Checklist

- [ ] **copyToClipboard:** Often missing Safari async workaround -- verify with WebKit Playwright tests
- [ ] **package.json exports:** Often missing `"types"` condition or wrong order -- verify with `publint` AND `attw`
- [ ] **SSR safety:** Often has module-level browser global access -- verify by importing in Node.js
- [ ] **execCommand fallback:** Often broken on iOS Safari -- verify with mobile Safari user agent or real device
- [ ] **Tree-shaking:** Often broken by barrel files with side effects -- verify with webpack/rollup consuming only one export
- [ ] **CJS output:** Often has wrong extension or missing declaration file -- verify with `require()` in Node.js CommonJS script
- [ ] **Error codes:** Often only covers happy path -- verify permission denied, insecure context, and API-missing paths all return correct codes
- [ ] **Bundle size:** Often measured uncompressed -- verify gzip size is <1KB with `size-limit`

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Safari async clipboard failure | LOW | Restructure to call writeText synchronously; no API change needed if function signature accepts string directly |
| Wrong exports map shipped to npm | MEDIUM | Publish patch version with corrected exports; cannot un-publish, must bump version |
| SSR crash in published version | MEDIUM | Patch release with guards; consumers must update. Add Node.js import test to prevent recurrence |
| execCommand fallback broken on iOS | LOW | Fix textarea positioning/selection; no API change, just implementation fix |
| Missing .d.cts declarations | MEDIUM | Reconfigure tsdown, publish patch. Consumers stuck until they update |
| Flaky CI clipboard tests | LOW | Fix Playwright config, add permissions, run sequentially |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Safari async clipboard (P1) | Phase 1: Core Implementation | WebKit E2E test passes with async data flow |
| Firefox ClipboardItem missing (P2) | Phase 1: Core Implementation | Firefox E2E test passes for all copy functions |
| Secure context / HTTPS (P3) | Phase 1: Core Implementation | `isClipboardSupported()` returns false on HTTP; error code is specific |
| Exports map + types (P4) | Phase 1: Build + CI Setup | `publint` and `attw` pass in CI with zero errors |
| CI clipboard testing (P5) | Phase 1: E2E Test Setup | All clipboard E2E tests pass in GitHub Actions headless |
| execCommand fallback edge cases (P6) | Phase 1: Fallback Implementation | Manual test on iOS Safari or documented limitation |
| SSR crashes (P7) | Phase 1: Core Implementation | CI step: `node -e "require('./dist/index.cjs')"` succeeds |

## Sources

- [The Clipboard API: How Did We Get Here?](https://cekrem.github.io/posts/clipboard-api-how-hard-can-it-be/) -- comprehensive overview of clipboard API cross-browser issues
- [How to use Clipboard API in Safari async](https://wolfgangrittner.dev/how-to-use-clipboard-api-in-safari/) -- ClipboardItem Promise pattern for Safari
- [W3C Clipboard APIs Issue #182: User gesture requirement](https://github.com/w3c/clipboard-apis/issues/182) -- browser interop discussion on user gesture requirements
- [Clipboard API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) -- authoritative API reference
- [Async Clipboard API - WebKit Blog](https://webkit.org/blog/10855/async-clipboard-api/) -- Safari's implementation details
- [publint rules](https://publint.dev/rules) -- package.json validation rules
- [Are the types wrong?](https://github.com/arethetypeswrong/arethetypeswrong.github.io) -- TypeScript declaration validation
- [Firefox Bug 1560373: clipboard-write permission](https://bugzilla.mozilla.org/show_bug.cgi?id=1560373) -- Firefox clipboard permission status
- [Playwright clipboard testing](https://playwrightsolutions.com/how-do-i-access-the-browser-clipboard-with-playwright/) -- Playwright clipboard permission patterns
- [tsdown tree-shaking docs](https://tsdown.dev/options/tree-shaking) -- tsdown tree-shaking configuration
- [Guide to package.json exports field](https://hirok.io/posts/package-json-exports) -- exports map best practices
- [navigator.clipboard.writeText fails in Safari](https://developer.apple.com/forums/thread/691873) -- Apple developer forum discussion

---
*Pitfalls research for: Browser clipboard utility library*
*Researched: 2026-04-08*
