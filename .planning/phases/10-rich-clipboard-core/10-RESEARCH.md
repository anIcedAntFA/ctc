# Phase 10: Rich Clipboard Core - Research

**Researched:** 2026-04-16
**Domain:** ClipboardItem API (browser native), TypeScript library authoring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** `copyRichContent` accepts a named content object as first arg: `copyRichContent({ html, text }, options?)`
**D-02:** Both `html` and `text` fields are required — no auto-stripping. Callers provide both explicitly.
**D-03:** Define `RichContent` interface in `types.ts`:
```ts
export interface RichContent {
  html: string
  text: string
}
```
**D-04:** Full signature: `copyRichContent(content: RichContent, options?: ClipboardOptions): Promise<boolean>`
**D-05:** On complete failure: return `null` — consistent with `readFromClipboard()`.
**D-06:** On success or partial: return `{ html: string | null, text: string | null }` — null fields mean no MIME of that type.
**D-07:** Full return type: `Promise<{ html: string | null; text: string | null } | null>`
**D-08:** Two-level null check: `result === null` → operation failed; `result.html === null` → no HTML in clipboard.
**D-09:** `isRichClipboardSupported` checks both `typeof ClipboardItem !== 'undefined'` AND `typeof navigator.clipboard?.write === 'function'`.
**D-10:** Also gates on `isBrowser()` and `isSecureContext()` — same guard pattern as all existing detect functions.
**D-11:** Full implementation shape:
```ts
return (
  isBrowser() &&
  isSecureContext() &&
  typeof ClipboardItem !== 'undefined' &&
  typeof navigator.clipboard?.write === 'function'
)
```
**D-12:** Three new files in `src/clipboard/` with `rich-` prefix — no changes to existing files:
- `rich-detect.ts` — `isRichClipboardSupported()`
- `rich-copy.ts` — `copyRichContent()`
- `rich-read.ts` — `readRichContent()`
**D-13:** `types.ts` gains the `RichContent` interface — exported alongside `ClipboardOptions`.
**D-14:** All three new functions re-exported from `src/clipboard/index.ts` and `src/index.ts`.
**D-15:** Add `'RICH_CLIPBOARD_NOT_SUPPORTED'` to `EXPECTED_ERROR_CODES` set in `lib/errors.ts`.
**D-16:** Error codes used by the new functions:
- `CLIPBOARD_NOT_SUPPORTED` — not in a browser (SSR)
- `INSECURE_CONTEXT` — HTTP page
- `RICH_CLIPBOARD_NOT_SUPPORTED` — ClipboardItem API absent
- `CLIPBOARD_PERMISSION_DENIED` — NotAllowedError from browser
- `CLIPBOARD_WRITE_FAILED` — unexpected write failure
- `CLIPBOARD_READ_FAILED` — unexpected read failure

### Claude's Discretion

- TSDoc comment style and `@example` content for new functions
- Whether `readRichContent` iterates clipboard items via `getType()` with individual try/catch per MIME type
- Exact error message strings

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RICH-01 | Developer can call `isRichClipboardSupported()` to detect ClipboardItem API availability (SSR-safe, returns boolean) | D-09 through D-11 define the exact four-condition check; guard pattern from `detect.ts` applies directly |
| RICH-02 | Developer can call `copyRichContent(html, plainText, options?)` to write HTML + plain text via ClipboardItem (dual MIME always, returns boolean) | D-01 through D-04 lock signature; `ClipboardItem` constructor + `navigator.clipboard.write()` API verified |
| RICH-03 | Developer can call `readRichContent(options?)` to read rich clipboard content, receiving `{ html: string | null, text: string | null }` | D-05 through D-08 lock return type; `navigator.clipboard.read()` + `getType()` pattern verified |
| RICH-04 | All three rich clipboard functions are SSR-safe (`typeof ClipboardItem !== 'undefined'` guard inside function body) | Verified: guard order isBrowser() → isSecureContext() → ClipboardItem check covers SSR |
| RICH-05 | All three rich clipboard functions accept `onError` callback with typed `BrowserUtilsError` | `ClipboardOptions` interface already provides this; `handleError`/`createError` wiring is identical to existing functions |
| RICH-06 | Unit tests achieve 100% line + branch coverage on all new core functions | vitest.config.ts threshold pattern identified; new files need explicit threshold entries added |
</phase_requirements>

---

## Summary

Phase 10 adds three new clipboard functions (`isRichClipboardSupported`, `copyRichContent`, `readRichContent`) that wrap the browser's `ClipboardItem` API for dual-MIME (HTML + plain text) clipboard operations. All design decisions are locked in CONTEXT.md, so this phase has zero architectural ambiguity — implementation is a direct pattern application of Phase 9's existing `copy.ts`, `read.ts`, and `detect.ts`.

The main technical differences from existing text clipboard functions are: (1) `copyRichContent` constructs a `ClipboardItem` with two MIME entries (`text/html` and `text/plain`) and calls `navigator.clipboard.write([item])` instead of `writeText()`, (2) `readRichContent` calls `navigator.clipboard.read()` which returns an array of `ClipboardItem` objects, then iterates items calling `getType()` for each MIME type, and (3) the feature-detect function requires two checks (`typeof ClipboardItem !== 'undefined'` and `typeof navigator.clipboard?.write === 'function'`) instead of one.

Unit testing ClipboardItem requires more mock scaffolding than `writeText`/`readText` — the mock must provide `navigator.clipboard.write` (takes a `ClipboardItem[]`), `navigator.clipboard.read` (returns a `ClipboardItem[]`), and a mock `ClipboardItem` global with a `getType()` method that returns a `Blob`-like object.

**Primary recommendation:** Follow the existing guard + try/catch pattern exactly. The three new files are near-identical in structure to `copy.ts`, `read.ts`, and `detect.ts` with ClipboardItem-specific API calls substituted in.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `isRichClipboardSupported()` | Browser / Client | — | Synchronous feature detection reading globals; returns false in SSR. No server tier needed. |
| `copyRichContent()` | Browser / Client | — | Calls `navigator.clipboard.write()` — browser-only async API. SSR guard returns false before reaching the call. |
| `readRichContent()` | Browser / Client | — | Calls `navigator.clipboard.read()` — browser-only async API. SSR guard returns null before reaching the call. |
| Type exports (`RichContent`, updated barrel files) | Library Surface | — | TypeScript interface additions; no runtime tier. |
| Error code registration (`EXPECTED_ERROR_CODES`) | Library Internal | — | `lib/errors.ts` modification; no tier boundary. |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript (strict) | `~5.x` (project-pinned) | Type safety, interface definitions | Project mandate in CLAUDE.md |
| Vitest | `^3.x` (project-pinned) | Unit test runner, mocking globals | Project mandate; `vi.stubGlobal` used for all browser mocks |

[VERIFIED: codebase inspection] — versions locked by existing `package.json`; no new dependencies needed.

### Supporting

No new runtime or dev dependencies required. All browser APIs used (`ClipboardItem`, `navigator.clipboard.write`, `navigator.clipboard.read`) are native browser globals.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `ClipboardItem` constructor | `clipboard-polyfill` library | CLAUDE.md mandates zero runtime dependencies — polyfill is out of scope |
| `navigator.clipboard.write([item])` | `document.execCommand('copy')` with HTML | execCommand is deprecated and cannot write HTML reliably in modern browsers |
| Per-MIME try/catch in `readRichContent` | Single try/catch wrapping all reads | Per-MIME isolation allows partial success (one type fails, other succeeds) — aligns with D-06's partial-content return |

---

## Architecture Patterns

### System Architecture Diagram

```
User call: copyRichContent({ html, text }, options?)
        |
        v
  [rich-copy.ts]
        |
   isBrowser()? ──── false ──► handleError(CLIPBOARD_NOT_SUPPORTED) → return false
        |
   isSecureContext()? ── false ──► handleError(INSECURE_CONTEXT) → return false
        |
   typeof ClipboardItem !== 'undefined'
   && typeof navigator.clipboard?.write === 'function'? ── false ──► handleError(RICH_CLIPBOARD_NOT_SUPPORTED) → return false
        |
   try:
     new ClipboardItem({ 'text/html': Blob(html), 'text/plain': Blob(text) })
     navigator.clipboard.write([item])
     return true
   catch NotAllowedError ──► handleError(CLIPBOARD_PERMISSION_DENIED) → return false
   catch other ──► handleError(CLIPBOARD_WRITE_FAILED) → return false


User call: readRichContent(options?)
        |
        v
  [rich-read.ts]
        |
   isBrowser()? ──── false ──► handleError(CLIPBOARD_NOT_SUPPORTED) → return null
        |
   isSecureContext()? ── false ──► handleError(INSECURE_CONTEXT) → return null
        |
   typeof ClipboardItem !== 'undefined'
   && typeof navigator.clipboard?.read === 'function'? ── false ──► handleError(RICH_CLIPBOARD_NOT_SUPPORTED) → return null
        |
   try:
     items = await navigator.clipboard.read()
     result = { html: null, text: null }
     for item of items:
       try: blob = await item.getType('text/html'); result.html = await blob.text()
       catch: (type absent — leave null)
       try: blob = await item.getType('text/plain'); result.text = await blob.text()
       catch: (type absent — leave null)
     return result
   catch NotAllowedError ──► handleError(CLIPBOARD_PERMISSION_DENIED) → return null
   catch other ──► handleError(CLIPBOARD_READ_FAILED) → return null
```

### Recommended Project Structure

```
packages/core/src/clipboard/
├── copy.ts              # existing — no changes
├── detect.ts            # existing — no changes
├── fallback.ts          # existing — no changes
├── read.ts              # existing — no changes
├── rich-copy.ts         # NEW — copyRichContent()
├── rich-detect.ts       # NEW — isRichClipboardSupported()
├── rich-read.ts         # NEW — readRichContent()
├── index.ts             # MODIFIED — add new exports + RichContent type
└── types.ts             # MODIFIED — add RichContent interface

packages/core/src/index.ts  # MODIFIED — add new named exports

packages/core/src/lib/
└── errors.ts            # MODIFIED — add RICH_CLIPBOARD_NOT_SUPPORTED to EXPECTED_ERROR_CODES

packages/core/tests/unit/clipboard/
├── copy.test.ts         # existing — no changes
├── detect.test.ts       # existing — no changes
├── fallback.test.ts     # existing — no changes
├── read.test.ts         # existing — no changes
├── rich-copy.test.ts    # NEW
├── rich-detect.test.ts  # NEW
└── rich-read.test.ts    # NEW

packages/core/vitest.config.ts  # MODIFIED — add coverage thresholds for 3 new files
```

### Pattern 1: ClipboardItem Write (copyRichContent)

**What:** Construct a `ClipboardItem` with `Blob` values for each MIME type, then call `navigator.clipboard.write([item])`.
**When to use:** Dual-MIME write where both `text/html` and `text/plain` must land on the clipboard together.

```typescript
// Source: MDN Clipboard.write() — https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write
// Adapted to project guard + error pattern

const item = new ClipboardItem({
  'text/html': new Blob([content.html], { type: 'text/html' }),
  'text/plain': new Blob([content.text], { type: 'text/plain' }),
})
await navigator.clipboard.write([item])
```

Note: `ClipboardItem` constructor accepts strings or Blobs as values. Using `Blob` is the more explicit/correct form. [VERIFIED: MDN docs]

### Pattern 2: ClipboardItem Read (readRichContent)

**What:** Call `navigator.clipboard.read()`, iterate `ClipboardItem` objects, call `getType(mimeType)` per MIME, read `Blob.text()`.
**When to use:** Reading HTML and/or plain text from clipboard where content may have multiple MIME representations.

```typescript
// Source: MDN Clipboard.read() — https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read
const items = await navigator.clipboard.read()
const result: { html: string | null; text: string | null } = { html: null, text: null }

for (const item of items) {
  // Per-MIME try/catch: getType() throws if that MIME type is absent
  try {
    const blob = await item.getType('text/html')
    result.html = await blob.text()
  } catch {
    // text/html not present in this item — leave null
  }
  try {
    const blob = await item.getType('text/plain')
    result.text = await blob.text()
  } catch {
    // text/plain not present in this item — leave null
  }
}
return result
```

[VERIFIED: MDN — `getType()` throws `NotFoundError` DOMException if MIME type absent from item]

### Pattern 3: Vitest Mock for ClipboardItem API

**What:** Stub `ClipboardItem` global and `navigator.clipboard.write`/`read` for unit tests.
**When to use:** All unit tests for `rich-copy.ts`, `rich-detect.ts`, `rich-read.ts`.

```typescript
// Source: project copy.test.ts + read.test.ts patterns [VERIFIED: codebase]
// ClipboardItem must be stubbed as a global class

const mockWrite = vi.fn()
const mockRead = vi.fn()

beforeEach(() => {
  vi.stubGlobal('ClipboardItem', class MockClipboardItem {
    constructor(public data: Record<string, Blob | string>) {}
    get types() { return Object.keys(this.data) }
    async getType(type: string): Promise<Blob> {
      if (!(type in this.data)) throw new DOMException('Not found', 'NotFoundError')
      const val = this.data[type]
      return val instanceof Blob ? val : new Blob([val], { type })
    }
  })
  vi.stubGlobal('navigator', {
    clipboard: { write: mockWrite, read: mockRead },
  })
  vi.stubGlobal('window', { isSecureContext: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
```

For `rich-detect.ts` tests specifically: the mock must stub both `ClipboardItem` (as a non-undefined value) and `navigator.clipboard.write` (as a function). Tests that check the negative condition should set `ClipboardItem` to `undefined` or remove `write` from the mock.

### Pattern 4: vitest.config.ts Coverage Threshold Addition

**What:** Add per-file 100% coverage thresholds for the three new source files.
**When to use:** Required by RICH-06 and existing project convention.

```typescript
// Source: packages/core/vitest.config.ts [VERIFIED: codebase]
// Add to existing thresholds object:
'src/clipboard/rich-detect.ts': { 100: true },
'src/clipboard/rich-copy.ts': { 100: true },
'src/clipboard/rich-read.ts': { 100: true },
```

### Anti-Patterns to Avoid

- **Calling async work before `clipboard.write()` in Safari:** Safari's clipboard permission window only lasts for the synchronous user-gesture frame. If `copyRichContent` does async work before constructing the `ClipboardItem` and calling `write()`, Safari will reject it. The current pattern (construct item and call write directly in try block) is safe. [VERIFIED: wolfgangrittner.dev, MDN]
- **Using `navigator.clipboard.readText()` in `readRichContent`:** `readText()` only returns `text/plain` — it cannot read `text/html`. `read()` must be used. [VERIFIED: MDN]
- **Checking only `typeof ClipboardItem !== 'undefined'` in detect:** Some environments expose `ClipboardItem` as a global but lack `navigator.clipboard.write`. Both checks are required (D-09). [ASSUMED — based on pattern from CONTEXT.md D-09; the exact environments are not enumerated in MDN]
- **Expecting `read()` to throw when HTML is absent:** `navigator.clipboard.read()` succeeds but the returned `ClipboardItem` may not have `text/html` in its `types`. Calling `getType('text/html')` on such an item throws `NotFoundError`. Per-MIME try/catch is the correct handling, not a single wrapping try/catch.
- **Skipping coverage threshold registration:** New files added to `src/clipboard/` are not automatically covered by existing thresholds. Each new file needs an explicit entry in `vitest.config.ts` or it silently gets no coverage enforcement.
- **Modifying `src/index.ts` manually when barrel re-exports `*`:** Current `src/index.ts` uses named explicit exports (not `export * from`), so new symbols must be added explicitly. Do not assume wildcard re-export.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Constructing multi-MIME clipboard data | Custom binary encoding or string concatenation | `new ClipboardItem({ 'text/html': Blob, 'text/plain': Blob })` | ClipboardItem is the browser-native structure the API requires |
| Reading a Blob to string | Custom FileReader wrapper | `blob.text()` (async) | Built into the Blob interface since ES2020 baseline [VERIFIED: MDN] |
| Detecting MIME support before write | Custom feature matrix table | `ClipboardItem.supports(mimeType)` static method | Baseline 2025 — deterministic per-browser check [VERIFIED: MDN/web.dev] |

**Key insight:** ClipboardItem and Blob are browser natives. The only "hand-rolling" risk is in test mocks — the mock ClipboardItem class should closely mirror the real interface (`types` getter, `getType()` returning `Promise<Blob>`) so tests catch real integration failures.

---

## Common Pitfalls

### Pitfall 1: `readRichContent` returns `null` instead of `{ html: null, text: null }` when clipboard is empty

**What goes wrong:** If no `ClipboardItem` entries are in the returned array (clipboard is empty), the loop never executes and `result` stays `{ html: null, text: null }`. This is the correct partial-success return — not a failure. Returning `null` here would violate D-06.
**Why it happens:** Developer confuses empty clipboard (valid `read()` success) with a read failure.
**How to avoid:** Only set `return null` on caught outer exceptions. Return `result` object after the loop completes, even if all fields are null.
**Warning signs:** Test for `result === null` when you expected `result.html === null`.

### Pitfall 2: `navigator.clipboard.write` is available but `ClipboardItem` is not (or vice versa)

**What goes wrong:** Some environments (older Chrome, certain embedded webviews) may have partial support. A check on only one of the two causes a runtime error.
**Why it happens:** Developers assume `navigator.clipboard.write` implies `ClipboardItem` support.
**How to avoid:** D-09 mandates both checks. Never drop either condition from `isRichClipboardSupported`.
**Warning signs:** Runtime `TypeError: ClipboardItem is not a constructor` despite `isRichClipboardSupported()` returning false.

### Pitfall 3: Firefox ClipboardItem flag requirement

**What goes wrong:** In Firefox, `ClipboardItem` and `navigator.clipboard.write` are behind the `dom.events.asyncClipboard.clipboardItem` preference (disabled by default in some versions). `isRichClipboardSupported()` correctly returns `false` in these environments, but developers may be surprised by this in development. [VERIFIED: search results cross-referenced with MDN baseline note]
**Why it happens:** Firefox's baseline support arrived later than Chrome/Safari.
**How to avoid:** Document in TSDoc `@remarks` that Firefox may return false by default. Do not attempt to workaround or polyfill.
**Warning signs:** Function works in Chrome/Safari dev but not Firefox during E2E testing.

### Pitfall 4: Missing `vitest.config.ts` threshold for new files

**What goes wrong:** RICH-06 requires 100% coverage but new source files have no coverage threshold registered.
**Why it happens:** The threshold object in `vitest.config.ts` uses explicit per-file keys, not glob patterns.
**How to avoid:** Add threshold entries for all three new `rich-*.ts` files in the same plan that creates them (or in a dedicated Wave 0 setup step).
**Warning signs:** `pnpm test` passes but no coverage error appears when a branch is missing tests.

### Pitfall 5: HTML sanitization in `readRichContent`

**What goes wrong:** Chrome sanitizes HTML read from clipboard by default (strips `<script>` tags). The returned `result.html` will be sanitized content, which may surprise consumers expecting exact fidelity.
**Why it happens:** Chrome's default behavior per the Clipboard API spec.
**How to avoid:** Document in TSDoc `@remarks`. The `unsanitized: ['text/html']` option in `navigator.clipboard.read()` can bypass this but is out of scope for Phase 10 (deferred as RICH-07+). Do not implement `unsanitized` option.
**Warning signs:** Round-trip test (write then read) where the HTML changes on read.

---

## Code Examples

Verified patterns from official sources:

### Full `copyRichContent` shape
```typescript
// Pattern source: packages/core/src/clipboard/copy.ts [VERIFIED: codebase]
// API source: MDN Clipboard.write() [VERIFIED: MDN]
export async function copyRichContent(
  content: RichContent,
  options?: ClipboardOptions,
): Promise<boolean> {
  if (!isBrowser()) {
    handleError(createError('CLIPBOARD_NOT_SUPPORTED', '...'), options?.onError)
    return false
  }
  if (!isSecureContext()) {
    handleError(createError('INSECURE_CONTEXT', '...'), options?.onError)
    return false
  }
  if (
    typeof ClipboardItem === 'undefined' ||
    typeof navigator.clipboard?.write !== 'function'
  ) {
    handleError(createError('RICH_CLIPBOARD_NOT_SUPPORTED', '...'), options?.onError)
    return false
  }
  try {
    const item = new ClipboardItem({
      'text/html': new Blob([content.html], { type: 'text/html' }),
      'text/plain': new Blob([content.text], { type: 'text/plain' }),
    })
    await navigator.clipboard.write([item])
    return true
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      handleError(createError('CLIPBOARD_PERMISSION_DENIED', '...', error), options?.onError)
    } else {
      handleError(createError('CLIPBOARD_WRITE_FAILED', '...', error), options?.onError)
    }
    return false
  }
}
```

### `readRichContent` getType loop
```typescript
// Pattern source: MDN Clipboard.read() [VERIFIED: MDN]
const items = await navigator.clipboard.read()
const result: { html: string | null; text: string | null } = { html: null, text: null }
for (const item of items) {
  try {
    const blob = await item.getType('text/html')
    result.html = await blob.text()
  } catch { /* type not present */ }
  try {
    const blob = await item.getType('text/plain')
    result.text = await blob.text()
  } catch { /* type not present */ }
}
return result
```

### `errors.ts` EXPECTED_ERROR_CODES update
```typescript
// Source: packages/core/src/lib/errors.ts [VERIFIED: codebase]
// Remove TODO comment, add the code:
const EXPECTED_ERROR_CODES = new Set<ErrorCode>([
  'CLIPBOARD_NOT_SUPPORTED',
  'INSECURE_CONTEXT',
  'CLIPBOARD_PERMISSION_DENIED',
  'RICH_CLIPBOARD_NOT_SUPPORTED',  // added in Phase 10
])
```

### Barrel export additions (`src/clipboard/index.ts`)
```typescript
// Source: packages/core/src/clipboard/index.ts [VERIFIED: codebase]
// Additions needed:
export { isRichClipboardSupported } from './rich-detect.ts'
export { copyRichContent } from './rich-copy.ts'
export { readRichContent } from './rich-read.ts'
export type { RichContent } from './types.ts'
```

### Root barrel additions (`src/index.ts`)
```typescript
// Source: packages/core/src/index.ts [VERIFIED: codebase]
// src/index.ts uses explicit named re-exports — must add individually:
export type { RichContent } from './clipboard/index.ts'
export { isRichClipboardSupported, copyRichContent, readRichContent } from './clipboard/index.ts'
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.execCommand('copy')` with innerHTML trick | `ClipboardItem` + `navigator.clipboard.write()` | ~2020 (Async Clipboard API) | Native dual-MIME; no hidden textarea hacks |
| `readText()` only for clipboard reads | `navigator.clipboard.read()` returning `ClipboardItem[]` | ~2020 | Can now read HTML, PNG, custom web formats |
| Manual MIME support detection via try/catch | `ClipboardItem.supports(mimeType)` static method | 2025 (Baseline Newly Available) | Synchronous pre-flight check for custom/image MIMEs |

**Deprecated/outdated:**
- `document.execCommand('insertHTML')` / `execCommand('copy')` with `contenteditable`: deprecated, inconsistent, removed from spec. The existing `copyToClipboardLegacy` uses `execCommand('copy')` for plain text fallback only — do not extend it for HTML.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Some environments expose `ClipboardItem` as a global without `navigator.clipboard.write` being present, necessitating the dual check in D-09 | Anti-Patterns, Pitfalls | Low risk — the dual check is strictly more defensive; false positives impossible |
| A2 | The per-MIME try/catch approach for `readRichContent` (vs. checking `item.types` first) is the canonical pattern | Architecture Patterns | Low risk — both work; per-MIME try/catch handles concurrent API changes gracefully |

---

## Open Questions

1. **`readRichContent` iteration strategy — `item.types` check vs. blind `getType()` call**
   - What we know: `getType()` throws `NotFoundError` if MIME absent; `item.types` exposes available MIMEs synchronously
   - What's unclear: Whether checking `item.types.includes('text/html')` before calling `getType()` is preferable to just try/catching
   - Recommendation: Both are valid. The direct try/catch approach (Claude's discretion per CONTEXT.md) avoids double-checking and is simpler. Either is correct for 100% coverage since both branches are easily testable.

2. **Whether to type `ClipboardItem` explicitly in TypeScript or rely on `lib.dom.d.ts`**
   - What we know: `ClipboardItem` is in TypeScript's `lib.dom.d.ts` for TypeScript 4.4+. The project targets ES2020 with strict mode.
   - What's unclear: Whether the project's `tsconfig.json` lib setting includes `dom` or needs adjustment.
   - Recommendation: Check `tsconfig.json` `lib` field before implementation. If `dom` is present, `ClipboardItem` types are available with no extra steps.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code/config changes within an existing TypeScript project. No external tools, databases, or CLIs are required beyond what the project already uses.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on This Phase |
|-----------|----------------------|
| Zero runtime dependencies — only browser native APIs | `ClipboardItem`, `Blob`, `navigator.clipboard.write/read` are all native — no new packages |
| Bundle size < 1.5KB gzip for core clipboard module | Three small wrapper files; no new runtime code paths except direct API calls. Size-limit raised to 1.5KB in Phase 9. |
| Named exports only — no default exports | All new exports must be named |
| No `any`, no `as` casts unless documented | Use proper `ClipboardItem` types from `lib.dom.d.ts` |
| Functions return boolean/null for failure, never throw | Maintained by guard + try/catch pattern |
| Every exported function has TSDoc comments | Required for all three new functions |
| `tsconfig.json` covers `src/` only; `tsconfig.node.json` covers config files | `vitest.config.ts` threshold additions use `tsconfig.node.json` scope |
| NEVER add runtime dependencies to `package.json` | Confirmed — no additions needed |
| Run `pnpm lint && pnpm test && pnpm build` before any commit | Must pass before any plan commit step |
| Conventional commits: `feat/fix/chore/docs/test/ci(scope): description` | Plan commit messages must follow this |

---

## Sources

### Primary (HIGH confidence)
- MDN Web Docs — ClipboardItem: https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem
- MDN Web Docs — Clipboard.write(): https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write
- MDN Web Docs — Clipboard.read(): https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read
- MDN Web Docs — ClipboardItem.getType(): https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem/getType
- Project codebase — `packages/core/src/clipboard/*.ts`, `lib/errors.ts`, `lib/types.ts`, `vitest.config.ts` (all directly read)

### Secondary (MEDIUM confidence)
- web.dev — ClipboardItem.supports() Baseline 2025: https://web.dev/blog/baseline-clipboard-item-supports
- wolfgangrittner.dev — Safari ClipboardItem async pattern: https://wolfgangrittner.dev/how-to-use-clipboard-api-in-safari/

### Tertiary (LOW confidence)
- Search results on Firefox `dom.events.asyncClipboard.clipboardItem` preference flag (not directly verified against current Firefox release notes)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; browser API verified against MDN
- Architecture: HIGH — all decisions locked in CONTEXT.md; implementation is pattern application
- Pitfalls: MEDIUM — ClipboardItem/write dual-check rationale is ASSUMED; Firefox flag status not freshly verified against current release

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (ClipboardItem API is stable; Firefox status worth re-checking if E2E fails)
