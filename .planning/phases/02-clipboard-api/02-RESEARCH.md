# Phase 2: Clipboard API - Research

**Researched:** 2026-04-08
**Domain:** Browser Clipboard API — implementation, cross-browser error mapping, execCommand fallback, TSDoc patterns
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `isClipboardSupported()` checks API existence AND `isSecureContext()`. Returns `false` on HTTP, in SSR, or when `navigator.clipboard` is absent. "Supported" means "usable right now".
- **D-02:** `isClipboardReadSupported()` checks `navigator.clipboard.readText` existence AND `isSecureContext()`. Synchronous boolean — no `navigator.permissions.query()`.
- **D-03:** Actual permission denial state is surfaced at call time via `CLIPBOARD_PERMISSION_DENIED` error code, not by detection functions.
- **D-04:** `copyToClipboardLegacy` uses textarea + `document.execCommand('copy')` pattern: create hidden textarea, set value, select all, call execCommand, remove textarea.
- **D-05:** Signature: `copyToClipboardLegacy(text: string, options?: ClipboardOptions): boolean`. Text-only. Returns `boolean`.
- **D-06:** Same `ClipboardOptions` / `onError` callback pattern as `copyToClipboard`. Failures return `false`, call `onError` — never throw.
- **D-07:** `isBrowser`, `isSecureContext`, `createError`, `handleError` are internal-only. Remove from `src/clipboard/index.ts` and `src/index.ts` public barrel exports.
- **D-08:** Public API exports from Phase 2: `copyToClipboard`, `readFromClipboard`, `copyToClipboardLegacy`, `isClipboardSupported`, `isClipboardReadSupported`, and all public types (`ClipboardOptions`, `BrowserUtilsError`, `ErrorCode`, `OnErrorCallback`).
- **D-09:** Expected failures (`CLIPBOARD_NOT_SUPPORTED`, `INSECURE_CONTEXT`, `CLIPBOARD_PERMISSION_DENIED`) → `console.warn` when no `onError`.
- **D-10:** Unexpected failures (`CLIPBOARD_WRITE_FAILED`, `CLIPBOARD_READ_FAILED`) → `console.error` when no `onError`.
- **D-11:** `handleError()` must be updated to differentiate between expected and unexpected error codes.

### Claude's Discretion

- Exact textarea implementation details (z-index, position, visibility approach for the hidden textarea in `copyToClipboardLegacy`)
- Whether to add a `document.body` guard in `copyToClipboardLegacy`
- Internal set/array of expected vs unexpected error codes used by `handleError`
- File naming within `src/clipboard/` (e.g., `copy.ts`, `read.ts`, `detect.ts`, `fallback.ts`)
- Whether to add `copyRichContent` / `readRichContent` stubs (deferred to v2 per REQUIREMENTS.md)

### Deferred Ideas (OUT OF SCOPE)

- `copyRichContent()` / `readRichContent()` — deferred to v2 (RICH-01, RICH-02)
- Permissions API proactive query in `isClipboardReadSupported()`
- Debug mode flag (silent console output by default, log on flag)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLIP-01 | `copyToClipboard(text, options?)` — copy text to clipboard | Guard-first pattern, error code mapping, NotAllowedError → CLIPBOARD_PERMISSION_DENIED or CLIPBOARD_WRITE_FAILED |
| CLIP-02 | `readFromClipboard()` — read text from clipboard | NotAllowedError → CLIPBOARD_PERMISSION_DENIED, NotFoundError → CLIPBOARD_READ_FAILED |
| CLIP-03 | `copyToClipboardLegacy()` — copy text on HTTP/legacy browsers via execCommand | Textarea pattern with iOS-safe visibility, try/finally cleanup |
| DETECT-01 | `isClipboardSupported()` — check Clipboard API availability | typeof navigator.clipboard?.writeText === 'function' + isSecureContext() |
| DETECT-02 | `isClipboardReadSupported()` — check clipboard read support | typeof navigator.clipboard?.readText === 'function' + isSecureContext() |
| DETECT-03 | All exports SSR-safe — importable in Node.js without crash | Guard-first at function level, never at module scope |
| DETECT-04 | Secure context detection with specific error code | INSECURE_CONTEXT error code already in types.ts |
| ERR-01 | All clipboard functions accept optional `onError` callback with typed `BrowserUtilsError` | ClipboardOptions.onError already typed; handleError() update needed |
| ERR-02 | All clipboard functions return boolean/null for failures, never throw | Return false/null from every guard and catch block |
</phase_requirements>

## Summary

Phase 2 implements the complete clipboard API surface by adding five new function files to `src/clipboard/` and updating two barrel files. The skeleton from Phase 1 provides all required utilities: `isBrowser()`, `isSecureContext()`, `createError()`, and the `ErrorCode`/`BrowserUtilsError`/`ClipboardOptions` types. The only utility that needs modification is `handleError()` — it currently always uses `console.warn`, but must be updated to route expected vs unexpected error codes to `console.warn` vs `console.error` respectively.

The implementation is straightforward for modern clipboard functions (`copyToClipboard`, `readFromClipboard`, `detect.ts`): each follows a guard-first pattern with the same three guards (isBrowser → API existence → secure context) before delegating to the browser API. The catch block maps browser-thrown errors to typed codes. The complex function is `copyToClipboardLegacy` because `document.execCommand` has well-documented edge cases around textarea visibility and iOS behavior — the textarea must be visible in the DOM (not `display:none`) to be selected, positioned off-screen with `opacity: 0` and `position: fixed` to avoid layout impact.

**Primary recommendation:** Implement functions in dependency order: update `handleError()` first, then create `detect.ts`, `copy.ts`, `read.ts`, `fallback.ts`, then clean up barrel files. Each file is 30-60 lines; total implementation is under 200 lines of logic.

## Architecture Patterns

### File Structure for Phase 2

```
src/
├── clipboard/
│   ├── copy.ts       # NEW: copyToClipboard()
│   ├── read.ts       # NEW: readFromClipboard()
│   ├── detect.ts     # NEW: isClipboardSupported(), isClipboardReadSupported()
│   ├── fallback.ts   # NEW: copyToClipboardLegacy()
│   ├── types.ts      # EXISTS: ClipboardOptions (no changes needed)
│   └── index.ts      # UPDATE: clean up per D-07/D-08
├── utils/
│   ├── env.ts        # EXISTS: isBrowser(), isSecureContext() (no changes needed)
│   ├── errors.ts     # UPDATE: handleError() split console.warn/error per D-11
│   └── types.ts      # EXISTS: ErrorCode, BrowserUtilsError, OnErrorCallback (no changes needed)
└── index.ts          # UPDATE: clean up per D-07/D-08
```

### Pattern 1: Guard-First Design for copyToClipboard

**Correct error code sequence (in order):**
1. `isBrowser()` fails → `CLIPBOARD_NOT_SUPPORTED` (expected → console.warn)
2. `navigator.clipboard?.writeText` missing → `CLIPBOARD_NOT_SUPPORTED` (expected → console.warn)
3. `isSecureContext()` false → `INSECURE_CONTEXT` (expected → console.warn)
4. `catch` on `writeText()` with `NotAllowedError` → `CLIPBOARD_PERMISSION_DENIED` (expected → console.warn)
5. `catch` on `writeText()` with other error → `CLIPBOARD_WRITE_FAILED` (unexpected → console.error)

**Implementation:**
```typescript
// Source: architecture from ARCHITECTURE.md + CONTEXT.md D-01, D-09, D-10
import { isBrowser, isSecureContext } from '../utils/env.ts'
import { createError, handleError } from '../utils/errors.ts'
import type { ClipboardOptions } from './types.ts'

/**
 * Copy text to the clipboard.
 *
 * Uses the modern Clipboard API (`navigator.clipboard.writeText`).
 * Requires a secure context (HTTPS or localhost) and a user gesture.
 *
 * @param text - The text to copy to the clipboard
 * @param options - Optional configuration including `onError` callback
 * @returns `true` on success, `false` on any failure (never throws)
 *
 * @remarks
 * **User gesture requirement:** Must be called from within a user gesture
 * handler (click, keydown, etc.). Programmatic calls from timers or
 * microtasks will be rejected by the browser.
 *
 * **Secure context:** Returns `false` on HTTP pages. Use
 * `copyToClipboardLegacy()` for HTTP environments.
 *
 * **Safari:** Calling any async operation before `writeText()` may break
 * Safari's user activation window. Keep the call synchronous within the
 * click handler.
 *
 * @example
 * ```ts
 * button.addEventListener('click', async () => {
 *   const success = await copyToClipboard('Hello, world!')
 *   if (!success) {
 *     showError('Copy failed — check HTTPS and permissions')
 *   }
 * })
 * ```
 */
export async function copyToClipboard(
  text: string,
  options?: ClipboardOptions,
): Promise<boolean> {
  if (!isBrowser()) {
    handleError(
      createError('CLIPBOARD_NOT_SUPPORTED', 'Not in a browser environment'),
      options?.onError,
    )
    return false
  }

  if (typeof navigator.clipboard?.writeText !== 'function') {
    handleError(
      createError('CLIPBOARD_NOT_SUPPORTED', 'Clipboard API not available'),
      options?.onError,
    )
    return false
  }

  if (!isSecureContext()) {
    handleError(
      createError('INSECURE_CONTEXT', 'Clipboard API requires a secure context (HTTPS)'),
      options?.onError,
    )
    return false
  }

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    const isPermissionDenied =
      error instanceof DOMException && error.name === 'NotAllowedError'

    if (isPermissionDenied) {
      handleError(
        createError('CLIPBOARD_PERMISSION_DENIED', 'Clipboard write permission denied', error),
        options?.onError,
      )
    } else {
      handleError(
        createError('CLIPBOARD_WRITE_FAILED', 'Failed to write to clipboard', error),
        options?.onError,
      )
    }
    return false
  }
}
```

### Pattern 2: Guard-First Design for readFromClipboard

**Correct error code sequence (in order):**
1. `isBrowser()` fails → `CLIPBOARD_NOT_SUPPORTED` (expected → console.warn)
2. `navigator.clipboard?.readText` missing → `CLIPBOARD_NOT_SUPPORTED` (expected → console.warn)
3. `isSecureContext()` false → `INSECURE_CONTEXT` (expected → console.warn)
4. `catch` with `NotAllowedError` → `CLIPBOARD_PERMISSION_DENIED` (expected → console.warn)
5. `catch` with `NotFoundError` or other → `CLIPBOARD_READ_FAILED` (unexpected → console.error)

**Browser behavior notes:**
- Chrome: Prompts user for `clipboard-read` permission on first call if not yet granted. Throws `NotAllowedError` if denied. [CITED: developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText]
- Firefox: Supports `readText()`. Does not require explicit Permissions API grant for same-origin clipboard reads. Throws `NotAllowedError` if blocked. [ASSUMED]
- Safari: Shows a "paste" system-level prompt. Throws `NotAllowedError` if user declines. [ASSUMED]
- All browsers: Throw `NotFoundError` if clipboard has non-text content that cannot be represented as text. [CITED: developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText]

```typescript
// Source: MDN Clipboard.readText() docs + guard-first pattern
export async function readFromClipboard(
  options?: ClipboardOptions,
): Promise<string | null> {
  if (!isBrowser()) {
    handleError(
      createError('CLIPBOARD_NOT_SUPPORTED', 'Not in a browser environment'),
      options?.onError,
    )
    return null
  }

  if (typeof navigator.clipboard?.readText !== 'function') {
    handleError(
      createError('CLIPBOARD_NOT_SUPPORTED', 'Clipboard read API not available'),
      options?.onError,
    )
    return null
  }

  if (!isSecureContext()) {
    handleError(
      createError('INSECURE_CONTEXT', 'Clipboard API requires a secure context (HTTPS)'),
      options?.onError,
    )
    return null
  }

  try {
    return await navigator.clipboard.readText()
  } catch (error) {
    const isPermissionDenied =
      error instanceof DOMException && error.name === 'NotAllowedError'

    if (isPermissionDenied) {
      handleError(
        createError('CLIPBOARD_PERMISSION_DENIED', 'Clipboard read permission denied', error),
        options?.onError,
      )
    } else {
      handleError(
        createError('CLIPBOARD_READ_FAILED', 'Failed to read from clipboard', error),
        options?.onError,
      )
    }
    return null
  }
}
```

### Pattern 3: Detection Functions (detect.ts)

Detection functions are pure: no side effects, no logging. They check API existence synchronously. Per D-01 and D-02, `isSecureContext()` is NOT included in the detect functions — the decision was to make `isClipboardSupported()` check both API existence AND secure context, since "supported" means "usable right now."

```typescript
// Source: CONTEXT.md D-01, D-02; ARCHITECTURE.md Pattern 3
import { isBrowser, isSecureContext } from '../utils/env.ts'

/**
 * Check if the Clipboard API is available and usable in the current context.
 *
 * Returns `true` only when `navigator.clipboard.writeText` exists AND the
 * page is running in a secure context (HTTPS or localhost). Returns `false`
 * on HTTP, in SSR environments, or when the Clipboard API is not supported.
 *
 * @returns `true` if clipboard write operations are supported
 *
 * @remarks
 * Permission state is not checked — a `true` result does not guarantee the
 * user has granted clipboard access. Permission denial is surfaced at call
 * time via the `CLIPBOARD_PERMISSION_DENIED` error code.
 */
export function isClipboardSupported(): boolean {
  return (
    isBrowser() &&
    isSecureContext() &&
    typeof navigator.clipboard?.writeText === 'function'
  )
}

/**
 * Check if clipboard read operations are available and usable.
 *
 * Returns `true` only when `navigator.clipboard.readText` exists AND the
 * page is running in a secure context (HTTPS or localhost).
 *
 * @returns `true` if clipboard read operations are supported
 */
export function isClipboardReadSupported(): boolean {
  return (
    isBrowser() &&
    isSecureContext() &&
    typeof navigator.clipboard?.readText === 'function'
  )
}
```

### Pattern 4: copyToClipboardLegacy (fallback.ts)

The textarea approach must be visible to the browser (not `display: none`) but invisible to the user. The correct approach: `position: fixed`, `top: 0`, `left: 0`, `opacity: 0`. This satisfies browser selection requirements without affecting layout.

**iOS Safari specific requirements:**
- `font-size: 16px` prevents iOS auto-zoom when the textarea is focused
- `readOnly: true` prevents the keyboard from appearing on mobile
- `setSelectionRange(0, text.length)` is more reliable than `.select()` on mobile [CITED: PITFALLS.md §6]

**document.body guard:** Include a guard for `document.body` — `document.body` can be null during SSR or very early page load. This is a defensive measure (Claude's Discretion).

**execCommand return value:** `execCommand` returns `boolean` — check it. Some environments return `false` without throwing, so checking the return value is required in addition to try/catch.

```typescript
// Source: PITFALLS.md §6, clipboard-copy reference implementation
import { isBrowser } from '../utils/env.ts'
import { createError, handleError } from '../utils/errors.ts'
import type { ClipboardOptions } from './types.ts'

/**
 * Copy text to the clipboard using the legacy `execCommand` API.
 *
 * Use this function when the modern Clipboard API is unavailable — for
 * example, on HTTP pages (non-HTTPS) or in browsers that do not support
 * `navigator.clipboard`. For HTTPS pages, prefer `copyToClipboard()`.
 *
 * @param text - The text to copy to the clipboard
 * @param options - Optional configuration including `onError` callback
 * @returns `true` on success, `false` on any failure (never throws)
 *
 * @remarks
 * This function uses the deprecated `document.execCommand('copy')` API,
 * which is synchronous and text-only. It does not support rich content
 * (HTML, images). The function creates and removes a temporary textarea
 * element — this is a visual side effect that is not avoidable.
 *
 * **iOS Safari:** Copy via `execCommand` is not reliably supported on iOS.
 * This function may return `false` on iOS Safari.
 */
export function copyToClipboardLegacy(
  text: string,
  options?: ClipboardOptions,
): boolean {
  if (!isBrowser()) {
    handleError(
      createError('CLIPBOARD_NOT_SUPPORTED', 'Not in a browser environment'),
      options?.onError,
    )
    return false
  }

  if (!document.body) {
    handleError(
      createError('CLIPBOARD_NOT_SUPPORTED', 'document.body is not available'),
      options?.onError,
    )
    return false
  }

  const textarea = document.createElement('textarea')

  // Position off-screen but visible to browser (required for selection on iOS)
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  // Prevent iOS auto-zoom when textarea is focused
  textarea.style.fontSize = '16px'
  // Prevent mobile keyboard from appearing
  textarea.readOnly = true
  textarea.value = text

  document.body.appendChild(textarea)

  try {
    textarea.focus()
    // setSelectionRange is more reliable than .select() on mobile
    textarea.setSelectionRange(0, text.length)

    const success = document.execCommand('copy')

    if (!success) {
      handleError(
        createError('CLIPBOARD_WRITE_FAILED', 'execCommand copy returned false'),
        options?.onError,
      )
      return false
    }

    return true
  } catch (error) {
    handleError(
      createError('CLIPBOARD_WRITE_FAILED', 'execCommand copy threw an error', error),
      options?.onError,
    )
    return false
  } finally {
    // Always remove the textarea — even if an exception was thrown
    document.body.removeChild(textarea)
  }
}
```

### Pattern 5: handleError Update (errors.ts)

The current `handleError()` always uses `console.warn`. Per D-09 and D-10, it must distinguish expected from unexpected errors.

**Implementation approach:** Use a Set of expected error codes. This is the most idiomatic and tree-shakeable approach — the Set is a module-level constant referenced only by `handleError`, so it's trivially inlined by the bundler.

```typescript
// Source: CONTEXT.md D-09, D-10, D-11
import type { BrowserUtilsError, ErrorCode, OnErrorCallback } from './types.ts'

const EXPECTED_ERROR_CODES = new Set<ErrorCode>([
  'CLIPBOARD_NOT_SUPPORTED',
  'INSECURE_CONTEXT',
  'CLIPBOARD_PERMISSION_DENIED',
])

export function createError(
  code: ErrorCode,
  message: string,
  cause?: unknown,
): BrowserUtilsError {
  return { code, message, cause }
}

export function handleError(
  error: BrowserUtilsError,
  onError?: OnErrorCallback,
): void {
  if (onError) {
    onError(error)
    return
  }

  const isExpected = EXPECTED_ERROR_CODES.has(error.code)
  const prefix = '[ngockhoi96]'

  if (isExpected) {
    console.warn(`${prefix} ${error.code}: ${error.message}`)
  } else {
    console.error(`${prefix} ${error.code}: ${error.message}`, error.cause)
  }
}
```

### Pattern 6: Barrel Cleanup

**Before (current — exports internal utils publicly):**
```typescript
// src/clipboard/index.ts (current — has internal exports)
export { isBrowser, isSecureContext } from '../utils/env.ts'
export { createError, handleError } from '../utils/errors.ts'
export type { BrowserUtilsError, ErrorCode, OnErrorCallback } from '../utils/types.ts'
export type { ClipboardOptions } from './types.ts'
```

**After (cleaned — only public API):**
```typescript
// src/clipboard/index.ts (after Phase 2)
export { copyToClipboard } from './copy.ts'
export { readFromClipboard } from './read.ts'
export { isClipboardSupported, isClipboardReadSupported } from './detect.ts'
export { copyToClipboardLegacy } from './fallback.ts'
export type { ClipboardOptions } from './types.ts'
export type { BrowserUtilsError, ErrorCode, OnErrorCallback } from '../utils/types.ts'
```

```typescript
// src/index.ts (after Phase 2)
export {
  copyToClipboard,
  readFromClipboard,
  copyToClipboardLegacy,
  isClipboardSupported,
  isClipboardReadSupported,
} from './clipboard/index.ts'
export type {
  ClipboardOptions,
  BrowserUtilsError,
  ErrorCode,
  OnErrorCallback,
} from './clipboard/index.ts'
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error classification | Custom string matching on error.message | `instanceof DOMException && error.name === 'NotAllowedError'` | `error.name` is spec-defined and stable; `error.message` is browser-localized and unreliable |
| SSR detection | Checking `process.env.NODE_ENV` or `typeof process` | `typeof navigator !== 'undefined' && typeof window !== 'undefined'` in `isBrowser()` | Already implemented in `src/utils/env.ts` |
| Textarea cleanup | Manual cleanup in each code path | `try/finally` block | try/finally guarantees cleanup even when exceptions are thrown |
| Error code routing | if/else chain on error codes | `Set<ErrorCode>` constant + `.has()` | Set membership is O(1), and the Set is statically analyzable by bundlers |

**Key insight:** The existing utilities in `src/utils/` handle all cross-cutting concerns. Each clipboard function should be thin: guards → API call → catch block. Don't add complexity to the functions themselves.

## Common Pitfalls

### Pitfall 1: Wrong Error Code for Insecure Context in Guard Chain
**What goes wrong:** The guard at step 3 (isSecureContext) fires `CLIPBOARD_NOT_SUPPORTED` instead of `INSECURE_CONTEXT`.
**Why it happens:** The existing skeleton code in `ARCHITECTURE.md` uses `CLIPBOARD_NOT_SUPPORTED` for ALL guards including the secure context check. This is incorrect — the `INSECURE_CONTEXT` error code exists explicitly for this case.
**How to avoid:** The guard order must produce `INSECURE_CONTEXT` from the `isSecureContext()` guard (decision D-04, error code already exists in `utils/types.ts`).
**Warning sign:** Tests checking that HTTP pages produce `INSECURE_CONTEXT` code would fail if the wrong code is used.

### Pitfall 2: Overly-broad catch Mapping to CLIPBOARD_PERMISSION_DENIED
**What goes wrong:** All errors in the catch block are mapped to `CLIPBOARD_PERMISSION_DENIED`, including network errors or unexpected browser bugs.
**Why it happens:** `NotAllowedError` is the most common clipboard error so it's tempting to map all errors to it.
**How to avoid:** Check `error instanceof DOMException && error.name === 'NotAllowedError'` specifically. Anything else maps to `CLIPBOARD_WRITE_FAILED` or `CLIPBOARD_READ_FAILED` (unexpected → console.error).
**Warning sign:** No `CLIPBOARD_WRITE_FAILED` test cases would indicate the catch block isn't doing the split.

### Pitfall 3: textarea.select() Fails on Mobile
**What goes wrong:** `copyToClipboardLegacy` works on desktop but fails silently on mobile (iOS/Android) because `textarea.select()` does not select all text on mobile browsers.
**Why it happens:** Mobile browsers handle text selection differently; `select()` is unreliable.
**How to avoid:** Use `textarea.setSelectionRange(0, text.length)` instead of `textarea.select()`. [CITED: PITFALLS.md §6]
**Warning sign:** E2E tests only run on desktop Chromium, no mobile viewport testing.

### Pitfall 4: Missing try/finally Leaves Orphaned textareas
**What goes wrong:** If `execCommand` throws, the textarea is not removed from the DOM.
**Why it happens:** Code puts cleanup in `else` branch or after the `if` block without `finally`.
**How to avoid:** The `document.body.removeChild(textarea)` call MUST be in the `finally` block.
**Warning sign:** Inspecting DOM after a failed copy shows orphaned textarea elements.

### Pitfall 5: Barrel Exports Breaking After Cleanup
**What goes wrong:** After removing `isBrowser`/`isSecureContext`/etc. from barrel exports, consumers who were importing these (incorrectly, since they should be internal) get TypeScript errors.
**Why it happens:** These were previously exported — removing them is technically a breaking change.
**How to avoid:** This is intentional cleanup (D-07). Since the library is pre-v1.0, there are no documented public consumers of internal utils. The removal is correct.
**Warning sign:** If the existing barrel re-exports were tested and relied upon, tests will fail — that's the signal the cleanup happened.

### Pitfall 6: isolatedDeclarations Requires Explicit Return Types
**What goes wrong:** TypeScript errors at build time on every new exported function.
**Why it happens:** `isolatedDeclarations: true` in tsconfig requires explicit return types on all exported functions. The tsdown Oxc path for `.d.ts` generation requires this.
**How to avoid:** Every exported function needs an explicit return type annotation:
  - `copyToClipboard(...): Promise<boolean>`
  - `readFromClipboard(...): Promise<string | null>`
  - `copyToClipboardLegacy(...): boolean`
  - `isClipboardSupported(): boolean`
  - `isClipboardReadSupported(): boolean`

## Cross-Browser Error Behavior

This table maps browser-thrown errors to our typed error codes:

| Scenario | Browser Throws | Error Name | Our Code |
|----------|---------------|------------|----------|
| Clipboard API not supported | — (API missing) | — | `CLIPBOARD_NOT_SUPPORTED` |
| Not in secure context | — (API missing, `navigator.clipboard` is undefined on HTTP) | — | `INSECURE_CONTEXT` |
| Write permission denied by user | `DOMException` | `NotAllowedError` | `CLIPBOARD_PERMISSION_DENIED` |
| Write called outside user gesture | `DOMException` | `NotAllowedError` | `CLIPBOARD_PERMISSION_DENIED` |
| Write fails for unexpected reason | `DOMException` | (various) | `CLIPBOARD_WRITE_FAILED` |
| Read permission denied by user | `DOMException` | `NotAllowedError` | `CLIPBOARD_PERMISSION_DENIED` |
| Read clipboard has non-text content | `DOMException` | `NotFoundError` | `CLIPBOARD_READ_FAILED` |
| Read fails for unexpected reason | `DOMException` | (various) | `CLIPBOARD_READ_FAILED` |

**Key insight:** `NotAllowedError` covers both "user denied" and "called outside user gesture." The library cannot distinguish these two cases from the error alone — both map to `CLIPBOARD_PERMISSION_DENIED`, which is the correct public-facing code since both represent "access was not granted."

**Checking the error:** Use `error instanceof DOMException && error.name === 'NotAllowedError'` not `error.message` matching. The `message` property is browser-localized (can be in the user's language) and is not part of the spec. [CITED: developer.mozilla.org/en-US/docs/Web/API/DOMException]

## TSDoc Documentation Patterns

For library functions with `onError` callbacks and multiple failure modes, the standard TSDoc pattern is:

1. One-line summary (what the function does)
2. `@param` for each parameter with type info in prose (not types — TypeScript handles that)
3. `@returns` describing the return value and failure behavior
4. `@remarks` for user gesture requirements, secure context requirements, browser-specific notes
5. `@example` with a minimal real-world snippet

The `@throws` tag is intentionally omitted since these functions never throw. The `onError` callback is documented via the `ClipboardOptions` type's JSDoc, not repeated on every function.

**TSDoc example for detection function:**
```typescript
/**
 * Check if the Clipboard API is available and usable in the current context.
 *
 * Returns `true` only when `navigator.clipboard.writeText` exists AND the
 * page is running in a secure context (HTTPS or localhost). Returns `false`
 * in SSR environments, on HTTP pages, or when the API is absent.
 *
 * @returns `true` if clipboard write operations are supported
 *
 * @remarks
 * This function does not check permission state. A `true` result does not
 * guarantee the user has granted clipboard access — permission denial is
 * surfaced at call time via the `CLIPBOARD_PERMISSION_DENIED` error code.
 *
 * @example
 * ```ts
 * if (isClipboardSupported()) {
 *   await copyToClipboard(text)
 * } else {
 *   // show a manual copy dialog or use copyToClipboardLegacy()
 * }
 * ```
 */
export function isClipboardSupported(): boolean { ... }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.execCommand('copy')` as primary | `navigator.clipboard.writeText()` as primary, execCommand as explicit opt-in | Clipboard API Baseline 2020 | execCommand is deprecated; keep as separate explicit function |
| Browser sniffing for clipboard support | `typeof navigator.clipboard?.writeText === 'function'` feature detection | ES2020+ | Browser sniffing breaks with UA changes; feature detection is future-proof |
| Single error string passed to consumers | Typed `BrowserUtilsError` with `ErrorCode` union | Library design choice | Consumers can branch on `error.code` without string matching |
| `try/catch` with throw at call site | Return boolean/null + optional `onError` callback | Library design choice | Better DX for non-critical browser operations |
| `clipboard-read` Permissions API query before readText | Direct readText call, let browser handle permission prompt | Current best practice | Firefox doesn't support `clipboard-read` in Permissions API; adds async complexity for no benefit |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated per spec, but still functional in most browsers. Kept as `copyToClipboardLegacy()` — an explicit opt-in, not a silent fallback.
- `navigator.permissions.query({ name: 'clipboard-read' })`: Partially supported — Firefox does not support `clipboard-read` as a permission query name. The decision (D-02) is to not use this.

## Environment Availability

This phase is code-only — no external dependencies. All browser APIs accessed (`navigator.clipboard`, `document.execCommand`, `window.isSecureContext`) are guarded at runtime. No new dev tools or packages are installed.

Step 2.6: SKIPPED (no external dependencies — Phase 2 adds source files only, all required dev tooling installed in Phase 1)

## Validation Architecture

> Nyquist validation is enabled (key absent from config = enabled). However, Phase 2 scope explicitly excludes testing (Phase 3 handles TEST-01, TEST-02). No test files are created in this phase. The planner should NOT include test tasks.

Phase 3 owns all test creation. Phase 2 only delivers the implementation files. The validation gate is: `pnpm build` succeeds and produces valid output. Manual SSR safety check: `node -e "require('./dist/index.cjs')"` must not throw.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Firefox `readText()` throws `NotAllowedError` (not a different error) on permission denial | Cross-Browser Error Behavior | Low — Firefox follows the spec for `NotAllowedError`; the catch block handles any DOMException anyway |
| A2 | Safari throws `NotAllowedError` when user declines the system paste prompt | Cross-Browser Error Behavior | Low — the fallback to `CLIPBOARD_READ_FAILED` handles any non-NotAllowedError cases |
| A3 | `document.execCommand('copy')` returns `false` (rather than throwing) when called outside a user gesture in some browsers | Pattern 4: copyToClipboardLegacy | Medium — the try/catch covers the throw case; only if it silently returns false without throwing does the return-value check matter |

## Open Questions

1. **Should `copyToClipboardLegacy` guard with `isSecureContext()` check?**
   - What we know: `execCommand` does NOT require a secure context — it's the whole point of the legacy fallback for HTTP pages.
   - What's unclear: Should we still warn users if they call legacy on HTTPS? (They should use `copyToClipboard` instead.)
   - Recommendation: No secure context guard. The function should work on both HTTP and HTTPS. TSDoc should note that `copyToClipboard()` is preferred on HTTPS.

2. **`console.error` include `error.cause` in output?**
   - What we know: `handleError` currently logs only code + message.
   - What's unclear: For unexpected failures (`CLIPBOARD_WRITE_FAILED`), should the original error be logged too for debugging?
   - Recommendation: Yes — pass `error.cause` as a second argument to `console.error`. This is standard practice and provides actionable debug info. The Pattern 5 code example above reflects this.

## Sources

### Primary (HIGH confidence)
- MDN Web Docs: [Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) — error types, secure context requirement
- MDN Web Docs: [Clipboard.readText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText) — error types (NotAllowedError, NotFoundError), Baseline 2024 status
- MDN Web Docs: [DOMException](https://developer.mozilla.org/en-US/docs/Web/API/DOMException) — error.name property spec definition
- `.planning/research/ARCHITECTURE.md` — guard-first pattern, barrel structure, dependency graph
- `.planning/research/PITFALLS.md` — textarea edge cases (§6), Safari async constraints (§1), SSR guards (§7)
- `.planning/phases/02-clipboard-api/02-CONTEXT.md` — all locked decisions (D-01 through D-11)
- `src/utils/env.ts`, `src/utils/errors.ts`, `src/utils/types.ts` — existing skeleton verified by direct read
- `src/clipboard/types.ts`, `src/clipboard/index.ts`, `src/index.ts` — current barrel state verified by direct read

### Secondary (MEDIUM confidence)
- [clipboard-copy by feross](https://github.com/feross/clipboard-copy) — reference implementation for textarea pattern and visibility approach
- [WebSearch: Clipboard API cross-browser errors 2025](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) — Baseline Newly Available March 2025, NotAllowedError as canonical permission error

### Tertiary (LOW confidence)
- A1-A3 in Assumptions Log: browser-specific error throwing behavior for Firefox and Safari `readText()` — not directly verified from official browser release notes

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing utils verified by reading source files
- Architecture: HIGH — patterns locked by CONTEXT.md decisions and prior architecture research
- Pitfalls: HIGH — majority drawn from PITFALLS.md (verified in prior research session) and MDN docs
- Cross-browser error mapping: MEDIUM — MDN confirms NotAllowedError; Firefox/Safari specific behavior ASSUMED for some edge cases

**Research date:** 2026-04-08
**Valid until:** 2026-07-08 (Clipboard API is stable; no imminent breaking changes expected)
