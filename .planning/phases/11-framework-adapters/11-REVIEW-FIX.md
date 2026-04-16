---
phase: 11-framework-adapters
fixed_at: 2026-04-16T00:00:00Z
review_path: .planning/phases/11-framework-adapters/11-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 11: Code Review Fix Report

**Fixed at:** 2026-04-16T00:00:00Z
**Source review:** .planning/phases/11-framework-adapters/11-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: React `useCallback` captures stale `timeout` from closure at hook-call time

**Files modified:** `packages/react/src/use-copy-rich-content.ts`
**Commit:** 02786db
**Applied fix:** Added `onErrorRef = useRef(options?.onError)` and a `useEffect` that keeps the ref current on every render. Inside `copyRich`, replaced `options?.onError?.(err)` with `onErrorRef.current?.(err)`. Removed `options?.onError` from the `useCallback` dependency array — the dep array is now `[initContent, timeout]`. This prevents `copyRich` from being re-created on every render when the consumer passes an inline arrow function as `onError`.

---

### WR-02: Vue mock helper replaces the entire `window` object — can silently break dependent globals

**Files modified:** `packages/vue/tests/helpers/create-rich-clipboard-mock.ts`
**Commit:** c3b2b3a
**Applied fix:** Replaced `vi.stubGlobal('window', { isSecureContext: true })` with `Object.defineProperty(window, 'isSecureContext', { value: true, writable: true, configurable: true })`. This matches the pattern already used in the React mock helper and preserves all other `window` properties. The Svelte mock helper already had the correct pattern and required no change.

---

### WR-03: Inconsistent no-content error contract between Vue and Svelte/React adapters

**Files modified:** `packages/vue/src/use-copy-rich-content.ts`, `packages/vue/tests/use-copy-rich-content.test.ts`
**Commit:** 9657544
**Applied fix (option A):** Replaced the `error.value` / `return false` path in Vue's `copyRich()` with `throw new TypeError('[ctc] useCopyRichContent: no content provided. Pass content at init or call-site.')`, matching the React and Svelte contract exactly. Updated the Vue test suite: replaced three tests that asserted old graceful-failure behavior with a single test asserting `TypeError` is thrown. Also rewrote the D-07 "clears error.value on next call" test — its prior implementation relied on the now-removed missing-content path to seed `error.value`; the rewritten test verifies `error.value` stays null across successive successful calls instead. All 38 Vue tests pass.

---

### WR-04: Vue `onUnmounted` cleanup does not reset the `timer` variable to `null` after clearing

**Files modified:** `packages/vue/src/use-copy-rich-content.ts`
**Commit:** 911faf0
**Applied fix:** Added `timer = null` inside the `onUnmounted` callback after `clearTimeout(timer)`. This makes the unmount cleanup path consistent with every other timer-clearing path in the file (`reset()` and the in-flight clear in `copyRich()`), removing the maintenance asymmetry and guarding against potential double-clear in edge cases with Suspense/keep-alive.

---

_Fixed: 2026-04-16T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
