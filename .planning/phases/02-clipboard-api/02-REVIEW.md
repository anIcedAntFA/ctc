---
phase: "02"
phase_name: "clipboard-api"
status: "issues-found"
files_reviewed: 7
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
---

# Code Review: Phase 02 — clipboard-api

**Depth:** standard  
**Files Reviewed:** 7  
**Status:** issues-found

---

## Critical

### CR-01 — `handleError` does not guard against a throwing `onError` callback

**File:** `src/utils/errors.ts` (lines ~48–51)  
**Confidence:** 85

`handleError` calls `onError(error)` without a try/catch. If the user-supplied callback throws, the exception propagates through `copyToClipboard` or `readFromClipboard`. Both functions document "never throws" in their TSDoc. That contract breaks the moment any consumer writes an `onError` that can throw — for example, one that updates component state during unmount, calls `JSON.parse`, or does any synchronous operation that rejects.

The project guideline in CLAUDE.md and PRD section 4.3 is explicit: "Promise-based, never throw — return boolean or null for failure." An `onError` callback that throws leaks an uncaught exception out of a function that promises it never will.

**Current code:**
```ts
if (onError) {
  onError(error)
  return
}
```

**Fix:**
```ts
if (onError) {
  try {
    onError(error)
  } catch {
    // Consumer callback errors must not escape — the no-throw contract
    // applies to the full call stack originating from clipboard functions.
  }
  return
}
```

---

## Warning

### WR-01 — Wrong error code on HTTP pages: `CLIPBOARD_NOT_SUPPORTED` fires instead of `INSECURE_CONTEXT` in Chrome/Edge

**Files:** `src/clipboard/copy.ts`, `src/clipboard/read.ts`  
**Confidence:** 82

In Chrome and Edge, `navigator.clipboard` is `undefined` on HTTP pages — the browser deliberately withholds the property on non-secure contexts. Both `copy.ts` and `read.ts` check for the Clipboard API feature _before_ checking `isSecureContext()`:

```ts
// Current order in copy.ts:
if (typeof navigator.clipboard?.writeText !== 'function') {
  // Fires on Chrome HTTP because navigator.clipboard is undefined there.
  // Returns CLIPBOARD_NOT_SUPPORTED — but the real cause is INSECURE_CONTEXT.
  handleError(createError('CLIPBOARD_NOT_SUPPORTED', ...), options?.onError)
  return false
}

if (!isSecureContext()) {
  // Never reached on Chrome HTTP even though this is the correct branch.
  handleError(createError('INSECURE_CONTEXT', ...), options?.onError)
  return false
}
```

A caller on an HTTP page in Chrome receives `CLIPBOARD_NOT_SUPPORTED` and cannot distinguish "this browser never supports clipboard" (old browser) from "this page is HTTP — use `copyToClipboardLegacy()` instead." The `isClipboardSupported()` detection function in `detect.ts` already uses the correct guard order (`isBrowser() && isSecureContext() && typeof ...`), so it is not affected.

**Fix — swap check order in both `copy.ts` and `read.ts`:**
```ts
if (!isSecureContext()) {
  handleError(
    createError('INSECURE_CONTEXT', 'Clipboard API requires a secure context (HTTPS)'),
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
```

---

### WR-02 — `document.body.removeChild(textarea)` in `finally` can throw, breaking the no-throw contract

**File:** `src/clipboard/fallback.ts` (~line 108)  
**Confidence:** 80

`copyToClipboardLegacy` documents "never throws". The `finally` block calls `document.body.removeChild(textarea)` unconditionally. If `textarea` has been removed from `document.body` between `appendChild` and the `finally` block — by a framework reconciliation pass (React 18 Strict Mode double-invocation), `MutationObserver` callback, or any DOM cleanup — `removeChild` throws a `NotFoundError` DOMException. A `finally`-block exception replaces any in-progress return value and propagates uncaught, violating the no-throw promise.

**Fix — guard the removal with `isConnected`:**
```ts
} finally {
  if (textarea.isConnected) {
    textarea.remove()
  }
}
```

`element.isConnected` is available in all browsers that support `document.execCommand`. `textarea.remove()` does not throw if the node is already detached.

---

## Clean Files

- `src/clipboard/detect.ts` — Feature detection functions use the correct short-circuit guard order. No issues.
- `src/clipboard/index.ts` — Barrel is correct: named exports only, no defaults, all public symbols re-exported.
- `src/index.ts` — Root barrel is correct. Re-export chain is clean.

---

## Recommended Fix Order

1. **WR-01** — Correctness: affects error-driven fallback logic for HTTP callers
2. **WR-02** — Safety: affects any framework host with DOM lifecycle management
3. **CR-01** — Defensive hardening: protects the no-throw contract from consumer mistakes
