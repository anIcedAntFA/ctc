---
phase: 11-framework-adapters
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - packages/react/src/use-copy-rich-content.ts
  - packages/react/src/index.ts
  - packages/react/tests/helpers/create-rich-clipboard-mock.ts
  - packages/react/tests/use-copy-rich-content.test.ts
  - packages/vue/src/use-copy-rich-content.ts
  - packages/vue/src/index.ts
  - packages/vue/tests/use-copy-rich-content.test.ts
  - packages/svelte/src/action/copy-rich-action.ts
  - packages/svelte/src/runes/use-copy-rich-content.svelte.ts
  - packages/svelte/src/stores/use-copy-rich-content.ts
  - packages/svelte/src/runes/index.ts
  - packages/svelte/src/stores/index.ts
  - packages/svelte/src/index.ts
  - packages/svelte/tsdown.config.ts
  - packages/svelte/tests/helpers/create-rich-clipboard-mock.ts
  - packages/svelte/tests/copy-rich-action.test.ts
  - packages/svelte/tests/use-copy-rich-content.test.ts
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-04-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

This phase adds `useCopyRichContent` across three framework adapter packages (React, Vue, Svelte) plus a `copyRichAction` Svelte action. The implementation is well-structured and the test suites are thorough. No critical security vulnerabilities were found.

Four warnings were identified: a stale-closure bug in the React hook (the `timeout` value inside `useCallback` is read from options at call-time but can drift from what the timer expects), an inconsistency in error-handling contract between Vue and the Svelte stores/runes variants for the no-content case, a missing timer cleanup branch in the Vue `onUnmounted` handler, and an observable window replacement in the Vue mock helper that can break other globals. Four lower-priority info items cover code duplication in mock helpers, a missing SSR guard in the Svelte runes file, undocumented `CLIPBOARD_NOT_SUPPORTED` error code reuse in Vue, and dead `CopyRichActionAttributes` interface interface members.

---

## Warnings

### WR-01: React `useCallback` captures stale `timeout` from closure at hook-call time

**File:** `packages/react/src/use-copy-rich-content.ts:71,129`

**Issue:** `timeout` is computed at hook render time from `options?.timeout ?? 2000` (line 71) and is listed in the `useCallback` dependency array (line 129). This is _technically_ correct for re-creating `copyRich` when `timeout` changes, but there is a subtler issue: if a consumer passes a new `options` object reference on every render (which is the common pattern — `useCopyRichContent(content, { timeout: 500 })` inline), `timeout` will have a stable _value_ but `options?.onError` changes reference, which does re-create `copyRich`. The real problem is the dependency array includes `options?.onError` by reference. If the consumer's `onError` is an inline arrow function, every render produces a new dependency, causing `copyRich` to be re-created every render. This is a usability hazard: the documentation comment on line 128 warns about it, but the hook itself does nothing to prevent or guard against it.

More critically, on line 105-110 `copyRichContent` is called with `{ onError: (err) => { setError(err); options?.onError?.(err) } }`. `options` is not in the dependency array — only `options?.onError` is. This means if the consumer replaces `options` with a new object but the `onError` reference stays the same (e.g., a memoized callback), the new `options` object's other fields are read stale. However, since the only field consumed from `options` beyond `onError` is `timeout` (already a dep), this is currently safe — but is fragile if new option fields are ever added.

The highest-priority problem is: the dependency `[initContent, timeout, options?.onError]` means every time the consumer re-renders with an inline `onError`, `copyRich` gets a new identity, breaking memoization for every downstream consumer.

**Fix:** Accept `onError` as a separate, stable ref to avoid reference churn:
```typescript
// At hook top level — stable across renders:
const onErrorRef = useRef(options?.onError)
useEffect(() => { onErrorRef.current = options?.onError }, [options?.onError])

// Inside copyRich — read from ref, no dependency needed:
onError: (err) => {
  setError(err)
  onErrorRef.current?.(err)
},

// Dependency array becomes:
[initContent, timeout]
```
This is the standard React pattern for stable callback references (also used in libraries like `react-use`).

---

### WR-02: Vue mock helper replaces the entire `window` object — can silently break dependent globals

**File:** `packages/vue/tests/helpers/create-rich-clipboard-mock.ts:45`

**Issue:** `vi.stubGlobal('window', { isSecureContext: true })` on line 45 replaces the entire `window` object with a plain object containing only `isSecureContext`. Any code path exercised by the composable under test that accesses `window.location`, `window.document`, or any other property will receive `undefined`, which can cause unexpected test failures or silently mask errors that would not exist in a real browser.

The React mock helper (`packages/react/tests/helpers/create-rich-clipboard-mock.ts:55-60`) correctly uses `Object.defineProperty(window, 'isSecureContext', ...)` for this exact reason (the comment at line 52-55 explains it). The Svelte mock helper (`packages/svelte/tests/helpers/create-rich-clipboard-mock.ts:45`) has the same `vi.stubGlobal('window', ...)` issue.

**Fix:** Replace `vi.stubGlobal('window', { isSecureContext: true })` with:
```typescript
Object.defineProperty(window, 'isSecureContext', {
  value: true,
  writable: true,
  configurable: true,
})
```
Apply the same fix to `packages/svelte/tests/helpers/create-rich-clipboard-mock.ts:45`.

---

### WR-03: Inconsistent no-content error contract between Vue and Svelte/React adapters

**File:** `packages/vue/src/use-copy-rich-content.ts:88-99` vs `packages/svelte/src/stores/use-copy-rich-content.ts:81-84` and `packages/svelte/src/runes/use-copy-rich-content.svelte.ts:89-93`

**Issue:** When both `initContent` and `callContent` are `undefined`, the adapters handle this differently:
- **React** (line 91-93): throws `TypeError`
- **Svelte runes** (line 89-93): throws `TypeError`
- **Svelte stores** (line 81-84): throws `TypeError`
- **Vue** (line 88-99): returns `false`, sets `error.value` to `{ code: 'CLIPBOARD_NOT_SUPPORTED', ... }`

The use of `CLIPBOARD_NOT_SUPPORTED` as the error code for a missing-content programmer error in the Vue adapter is semantically wrong. `CLIPBOARD_NOT_SUPPORTED` implies a browser support issue, not a missing argument. A consumer inspecting `error.value.code` cannot distinguish "browser does not support clipboard" from "developer forgot to pass content". Additionally, the divergent behavior (throw vs. return false) means a library user switching between framework adapters will encounter a broken mental model.

**Fix (option A — align Vue to throw):** Remove the try/catch-style handling and throw TypeError like the other adapters:
```typescript
if (content === undefined) {
  throw new TypeError(
    '[ctc] useCopyRichContent: no content provided. Pass content at init or call-site.',
  )
}
```

**Fix (option B — align all to return false with a distinct error code):** Define a new error code (`MISSING_CONTENT` or `INVALID_ARGUMENT`) and make React/Svelte consistent with Vue's graceful-return pattern. Update error code type in `@ngockhoi96/ctc` accordingly.

Either option is valid; option A requires fewer changes and matches the existing React/Svelte approach.

---

### WR-04: Vue `onUnmounted` cleanup does not reset the `timer` variable to `null` after clearing

**File:** `packages/vue/src/use-copy-rich-content.ts:143-147`

**Issue:** The `onUnmounted` cleanup block at line 143-147:
```typescript
onUnmounted(() => {
  if (timer !== null) {
    clearTimeout(timer)
  }
})
```
does not set `timer = null` after clearing. While this is practically harmless (the component is unmounting so the closure is about to be GC'd), it is inconsistent with every other cleanup path in the file (`reset()` at line 132-133, and the in-flight clear at line 105-108), all of which null `timer` after clearing. If the cleanup callback runs but the Vue runtime somehow calls another lifecycle hook after unmount (which has occurred in some edge cases with Suspense/keep-alive), the stale timer ID could be double-cleared. Additionally, the asymmetry is a maintenance hazard.

**Fix:**
```typescript
onUnmounted(() => {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
})
```

---

## Info

### IN-01: Identical `createRichClipboardMock` factory duplicated across all three packages

**File:** `packages/react/tests/helpers/create-rich-clipboard-mock.ts`, `packages/vue/tests/helpers/create-rich-clipboard-mock.ts`, `packages/svelte/tests/helpers/create-rich-clipboard-mock.ts`

**Issue:** All three helpers implement essentially identical logic (stub `ClipboardItem`, stub `navigator.clipboard.write`, set `isSecureContext`). Differences exist only in how `isSecureContext` is set (`Object.defineProperty` vs `vi.stubGlobal('window', ...)`). Three copies means the bug identified in WR-02 propagated to two files before being noticed. A shared test utility package or a monorepo `packages/test-utils` folder would prevent drift.

**Fix:** Extract to a shared internal test helper, e.g., `packages/test-utils/src/create-rich-clipboard-mock.ts`, and import from there in all three test suites. Mark the package as private (`"private": true` in `package.json`) so it is not published.

---

### IN-02: Svelte runes variant has no SSR guard but the stores variant and action do not either

**File:** `packages/svelte/src/runes/use-copy-rich-content.svelte.ts:76-83`

**Issue:** The `$effect` block on line 76-83 registers a timer cleanup effect. In Svelte 5 with SSR, `$effect` is a no-op on the server, which is safe. However, `copyRich()` calls `copyRichContent()` which internally accesses `navigator.clipboard`. The review skill checklist (`SSR guard: typeof navigator !== 'undefined'`) flags that the underlying `copyRichContent` from `@ngockhoi96/ctc` should already guard this, but the adapter itself has no documentation or guard making the SSR behavior explicit. Same applies to `packages/svelte/src/stores/use-copy-rich-content.ts` and `packages/svelte/src/action/copy-rich-action.ts`. The action is the highest risk because Svelte actions are only applied to DOM elements (so no SSR concern in practice), but the hooks can be called in `+page.server.ts`-adjacent code by an inattentive user.

**Fix:** Add a note to the TSDoc for each function clarifying SSR behavior, e.g.:
```typescript
 * @remarks SSR-safe: `copyRich()` is a no-op on the server because `navigator`
 * is not available. The underlying `copyRichContent` performs a feature check
 * and returns `false` when `navigator.clipboard` is absent.
```

---

### IN-03: Vue `useCopyRichContent` uses `CLIPBOARD_NOT_SUPPORTED` error code for a missing-argument condition

**File:** `packages/vue/src/use-copy-rich-content.ts:91-96`

**Issue:** (Elaboration of WR-03.) The error object constructed for the no-content case on line 91-96 uses `code: 'CLIPBOARD_NOT_SUPPORTED'`. This code is defined in the core `@ngockhoi96/ctc` `ErrorCode` union for the case where the Clipboard API is not present in the browser. Reusing it for a different runtime condition creates two distinct error situations with the same observable code, making programmatic error-handling impossible to distinguish. This is logged separately as Info because the main contract mismatch is already flagged in WR-03.

**Fix:** Use a new, purpose-specific error code such as `'MISSING_CONTENT'` (add it to the `ErrorCode` union in `@ngockhoi96/ctc`), or simply throw a `TypeError` as the other adapters do (see WR-03).

---

### IN-04: `CopyRichActionAttributes` interface has `on:ctc:rich-copy` and `on:ctc:rich-error` — Svelte 5 event syntax changed

**File:** `packages/svelte/src/action/copy-rich-action.ts:22-25`

**Issue:** The `CopyRichActionAttributes` interface uses `on:ctc:rich-copy` and `on:ctc:rich-error` property names (Svelte 4 event directive syntax). In Svelte 5, the event handling moved to `oncustomevent` or standard DOM `addEventListener`. The `Action` generic's third type parameter (`Attributes`) is used by Svelte's type checker to expose the custom event typings. In Svelte 5 components with `<button use:copyRichAction ...>`, the correct attribute name for a custom event `ctc:rich-copy` would be expressed differently. This means consumers using Svelte 5 will not get TypeScript completions for the custom events even though the runtime behavior is correct (because `dispatchEvent` works regardless). This is an Info item (not a Warning) because the runtime is unaffected and the action correctly dispatches events.

**Fix:** Verify compatibility with Svelte 5's action attribute typing. The `svelte/action` `Action<E, P, A>` third parameter expects an object of the form `{ 'on:eventname': handler }` in Svelte 4 tooling. For Svelte 5, consult the Svelte 5 migration guide for action typing. If the package targets Svelte 5 only (since it has a `/runes` subpath), update the attribute interface accordingly; if it targets both versions, document the limitation.

---

_Reviewed: 2026-04-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
