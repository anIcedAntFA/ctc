# Feature Research

**Domain:** Browser clipboard utility library
**Researched:** 2026-04-08
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `copyToClipboard(text)` | The primary reason anyone installs a clipboard library. Every competitor has this. | LOW | Wraps `navigator.clipboard.writeText()`. Return `Promise<boolean>`. ~5 lines of core logic. |
| `isClipboardSupported()` | Developers need to conditionally render copy buttons. clipboard.js, VueUse all expose this. | LOW | Check `navigator.clipboard` existence + secure context. Pure synchronous check. |
| SSR guards | Next.js/Nuxt users will import this at module level. Crash without guards = instant uninstall. | LOW | `typeof navigator !== 'undefined'` checks at function entry, not module level. |
| TypeScript declarations (.d.ts) | Every modern library ships types. Missing types = friction for 85%+ of JS ecosystem using TS. | LOW | Handled by tsdown build. Full strict types on all public APIs. |
| ESM + CJS dual output | Some projects still use CJS (Jest default, older Node tooling). ESM-only loses real users. | LOW | tsdown handles this. Correct `exports` map in package.json is the real work. |
| `sideEffects: false` | Bundlers need this to tree-shake. Without it, importing one function pulls the entire library. | LOW | package.json field. Must be true (no module-level side effects anywhere). |
| Zero dependencies | Users of utility libraries are extremely sensitive to transitive deps. clipboard-copy has zero. | LOW | Architecture constraint, not a feature to implement. Never add runtime deps. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `readFromClipboard()` | clipboard-copy and copy-to-clipboard are write-only. Read support makes this a complete clipboard solution, not just a copy helper. | LOW | Wraps `navigator.clipboard.readText()`. Returns `Promise<string \| null>`. Permission prompt handled by browser. |
| `isClipboardReadSupported()` | Read permissions differ from write across browsers (Firefox requires explicit permission). Separate detection prevents confusing failures. | LOW | Check `navigator.clipboard.readText` existence. |
| `onError` callback with typed error codes | Every competitor either throws (clipboard.js), rejects with generic Error (clipboard-copy), or silently fails. Typed error codes (`CLIPBOARD_NOT_SUPPORTED`, `CLIPBOARD_PERMISSION_DENIED`, `CLIPBOARD_WRITE_FAILED`, `CLIPBOARD_READ_FAILED`) let callers handle errors meaningfully without try/catch. | MEDIUM | Define `BrowserUtilsError` interface. Each function accepts optional `options.onError`. Must not change the return type (still boolean/null). |
| `copyRichContent(data)` | No lightweight library handles HTML/image clipboard writes. Only VueUse (Vue-locked, huge bundle) and raw Clipboard API (complex). This is a genuine gap in the ecosystem. | MEDIUM | Wraps `navigator.clipboard.write()` with `ClipboardItem`. Callers provide MIME-typed data. Browser support for non-text types varies (PNG widely supported, others spotty). |
| `readRichContent()` | Companion to `copyRichContent`. Complete read/write for rich data. No standalone library offers this. | MEDIUM | Wraps `navigator.clipboard.read()`. Returns `ClipboardItems` or null. |
| Secure context detection | Clipboard API requires HTTPS. No library proactively warns when running on HTTP. Developers waste time debugging silent failures. | LOW | `window.isSecureContext` check. Warn via console and surface through `onError`. |
| Explicit execCommand fallback (separate function) | clipboard-copy buries its fallback silently. copy-to-clipboard uses execCommand as primary. An explicit `copyToClipboardLegacy()` function is honest about what it does, keeps the modern API clean, and lets callers choose deliberately. | MEDIUM | Separate exported function. Uses textarea/span + `document.execCommand('copy')`. Clearly documented as deprecated browser API. Does not pollute the modern `copyToClipboard`. |
| Framework-agnostic core + adapter pattern | VueUse is Vue-only. usehooks-ts is React-only. A clean core that both can wrap means one library serves all frameworks. | LOW | Architecture decision, not implementation complexity. Core has zero framework deps. Adapters (Phase 2) are separate packages. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Transparent/auto execCommand fallback | "Just make it work everywhere" | Hides which API path ran. Developers can't reason about behavior. When execCommand eventually gets removed from browsers, silent fallback becomes silent failure. VueUse's `legacy: true` option already creates confusion about what actually happened. | Explicit `copyToClipboardLegacy()` function. Caller decides. Different function = different behavior contract. |
| `clipboardchange` event listener | "I want to react when clipboard changes" | Experimental API (not Baseline). Only Chrome supports it. Building features on experimental APIs guarantees breakage. | Document the raw API for adventurous users. Don't wrap it until it reaches Baseline. |
| Polling/watching clipboard contents | "Continuously monitor clipboard" | Security nightmare. Browsers actively restrict this. Permission model makes it unreliable. Creates false sense of capability. | Provide `readFromClipboard()` for on-demand reads. Users call it when they need it. |
| Custom toast/notification on copy | "Show a success message automatically" | UI is the app's responsibility, not a utility library's. Any built-in UI couples to DOM assumptions, conflicts with design systems, and bloats bundle. | Return boolean. Caller shows their own UI. Framework adapters (Phase 2) can provide `hasCopied` state for this. |
| Image/file paste handling | "Parse pasted images from clipboard" | Scope creep. Paste handling is an input event concern, not a clipboard utility concern. Requires DOM event binding, which violates "no side effects". | Document how to use native `paste` event with `readRichContent()` for users who need this pattern. |
| Node.js / server-side clipboard access | "Use same API in Node" | Completely different API surface (child_process calls to pbcopy/xclip). Zero code sharing with browser implementation. Different security model. | Out of scope. Recommend `clipboardy` for Node.js. This library is browser-only. |
| Automatic permission request handling | "Request clipboard permission for me" | Permissions API behavior varies wildly across browsers. `clipboard-write` permission is not supported in Firefox or Safari. Abstracting over inconsistent APIs creates more confusion than it solves. | Detect permission state if available, but let the browser handle the permission prompt naturally when clipboard methods are called. |

## Feature Dependencies

```
isClipboardSupported()
    └──required by──> copyToClipboard()
    └──required by──> readFromClipboard()
    └──required by──> copyRichContent()
    └──required by──> readRichContent()

isClipboardReadSupported()
    └──required by──> readFromClipboard()
    └──required by──> readRichContent()

SSR guards
    └──required by──> ALL functions (every export must be SSR-safe)

BrowserUtilsError type definitions
    └──required by──> onError callbacks on all functions

Secure context detection
    └──enhances──> isClipboardSupported() (more informative result)
    └──enhances──> onError callbacks (specific error code)

copyToClipboard()
    └──foundation for──> copyToClipboardLegacy() (same API shape, different implementation)

copyRichContent()
    └──enhances──> copyToClipboard() (but independent — different ClipboardItem API)

readRichContent()
    └──enhances──> readFromClipboard() (but independent — different ClipboardItem API)
```

### Dependency Notes

- **All functions require SSR guards:** Every export touches `navigator` or `window`. Guards must be at function level, not module level, so imports never crash.
- **Detection functions are foundations:** `isClipboardSupported()` and `isClipboardReadSupported()` are used internally by clipboard operations and exposed publicly. Build these first.
- **Rich content is independent from text:** `copyRichContent` and `readRichContent` use `clipboard.write()`/`clipboard.read()` which is a different API surface from `writeText()`/`readText()`. They share detection logic but not implementation.
- **Legacy fallback is intentionally disconnected:** `copyToClipboardLegacy()` shares no code with `copyToClipboard()`. This is deliberate — different browser APIs, different behavior guarantees.
- **Error types must exist before functions:** `BrowserUtilsError` interface and error code constants must be defined before any function can use `onError` callbacks.

## MVP Definition

### Launch With (v0.1.0)

Minimum viable product. Ship a complete clipboard write+read+detect module.

- [x] `copyToClipboard(text, options?)` -- The core use case. Without this there is no library.
- [x] `readFromClipboard()` -- Differentiator over clipboard-copy and copy-to-clipboard (both write-only).
- [x] `isClipboardSupported()` -- Developers need conditional UI rendering.
- [x] `isClipboardReadSupported()` -- Read permissions differ from write; separate detection prevents confusion.
- [x] `onError` callback with `BrowserUtilsError` typed codes -- Differentiator. No competitor provides typed error codes without throwing.
- [x] SSR guards on all exports -- Next.js/Nuxt users will find this on day one.
- [x] Secure context detection -- Warn on HTTP; surface as specific error code.
- [x] `copyToClipboardLegacy()` -- HTTP/legacy escape hatch. Explicit, separate, documented.

### Add After Validation (v0.1.x - v0.2.0)

Features to add once core is validated and users provide feedback.

- [ ] `copyRichContent(data)` -- Add when users request HTML/image copy. Moderate complexity from ClipboardItem API differences across browsers.
- [ ] `readRichContent()` -- Companion to copyRichContent. Add together.
- [ ] React hook `useCopyToClipboard()` -- Add when React users request it. Requires separate package (@browser-utils/react).
- [ ] Vue composable `useCopyToClipboard()` -- Add when Vue users request it. Requires separate package (@browser-utils/vue).

### Future Consideration (v0.3.0+)

Features to defer until the library has real users.

- [ ] Clipboard event helpers (copy/cut/paste event wrappers) -- Low demand for standalone library. Apps handle events in their own UI layer.
- [ ] `clipboardchange` listener -- Wait for browser support to reach Baseline.
- [ ] Other browser utility modules (storage, media, DOM) -- Only when clipboard module is stable and well-adopted.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `copyToClipboard()` | HIGH | LOW | P1 |
| `isClipboardSupported()` | HIGH | LOW | P1 |
| SSR guards | HIGH | LOW | P1 |
| `BrowserUtilsError` types + `onError` | HIGH | LOW | P1 |
| Secure context detection | MEDIUM | LOW | P1 |
| `readFromClipboard()` | MEDIUM | LOW | P1 |
| `isClipboardReadSupported()` | MEDIUM | LOW | P1 |
| `copyToClipboardLegacy()` | MEDIUM | MEDIUM | P1 |
| `copyRichContent()` | MEDIUM | MEDIUM | P2 |
| `readRichContent()` | MEDIUM | MEDIUM | P2 |
| React hook | HIGH | MEDIUM | P2 |
| Vue composable | MEDIUM | MEDIUM | P2 |
| Clipboard event helpers | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v0.1.0 launch
- P2: Should have, add in v0.1.x or v0.2.0
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | clipboard-copy (feross) | copy-to-clipboard | clipboard.js | VueUse useClipboard | usehooks-ts | Our Approach |
|---------|------------------------|-------------------|--------------|--------------------|--------------|----|
| Copy text | Yes | Yes | Yes | Yes | Yes | Yes -- table stakes |
| Read text | No | No | No | Yes (opt-in) | No | Yes -- differentiator |
| Rich content (HTML/images) | No | No | No | No | No | v0.2.0 -- gap in ecosystem |
| Feature detection | No | No | No | `isSupported` ref | No | Yes, separate functions |
| execCommand fallback | Yes (transparent) | Yes (primary API) | No | Yes (opt-in `legacy`) | No | Yes, explicit separate function |
| Typed error codes | No (rejects Promise) | No (throws) | No (throws) | No | No | Yes -- differentiator |
| SSR safe | Yes | Partial | No (needs DOM) | Yes | Yes | Yes |
| TypeScript types | Yes (.d.ts) | @types package | @types package | Native TS | Native TS | Native TS |
| Tree-shakeable | N/A (single fn) | N/A (single fn) | Partial | Yes (but huge bundle) | Yes | Yes |
| Framework agnostic | Yes | Yes | Yes | Vue only | React only | Yes, with adapter pattern |
| Bundle size | ~200B | ~1.5KB | ~3KB | Massive (all of VueUse) | Varies | Target <1KB |
| Zero deps | Yes | Yes | No | No | No | Yes |
| Active maintenance | Last publish 5y ago | Last publish 3y ago | Sporadic | Active | Active | New |

### Competitive Positioning

The market has two extremes:
1. **Tiny, stale, write-only utilities** (clipboard-copy, copy-to-clipboard) -- small but abandoned, no read support, no types, no rich content.
2. **Framework-locked mega-bundles** (VueUse, usehooks-ts) -- active but force framework commitment and drag in enormous dependency trees.

Our library occupies the gap: **modern, complete, framework-agnostic, tiny, actively maintained**. The key differentiators are read support, typed error handling, and the explicit (not hidden) fallback strategy.

## Sources

- [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard) -- Clipboard interface reached Baseline March 2020, secure context required
- [clipboard-copy by feross](https://github.com/feross/clipboard-copy) -- 30 lines, write-only, transparent execCommand fallback, last published 5 years ago
- [copy-to-clipboard](https://www.npmjs.com/package/copy-to-clipboard) -- execCommand-based, last published 3 years ago
- [clipboard.js](https://clipboardjs.com/) -- 3KB, DOM-based API (data attributes), no read support
- [VueUse useClipboard](https://vueuse.org/core/useclipboard/) -- Vue-only, supports read and legacy fallback, `isSupported` ref
- [usehooks-ts useCopyToClipboard](https://usehooks-ts.com/react-hook/use-copy-to-clipboard) -- React-only, write-only, maintains `copiedText` state
- [npm trends comparison](https://npmtrends.com/clipboard-vs-clipboard-copy-vs-clipboard-js-vs-clipboardy-vs-copy-text-to-clipboard) -- download statistics
- [web.dev Clipboard API guide](https://web.dev/async-clipboard/) -- permission model, user gesture requirements, HTTPS requirement

---
*Feature research for: Browser clipboard utility library*
*Researched: 2026-04-08*
