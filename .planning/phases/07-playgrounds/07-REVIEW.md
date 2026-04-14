---
phase: 07-playgrounds
reviewed: 2026-04-13T00:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - playground/vanilla/src/main.ts
  - playground/vanilla/index.html
  - playground/react/src/App.tsx
  - playground/react/src/main.tsx
  - playground/vue/src/App.vue
  - playground/vue/src/main.ts
  - playground/vue/src/env.d.ts
  - playground/svelte/src/App.svelte
  - playground/svelte/src/CopyAction.svelte
  - playground/svelte/src/CopyRune.svelte
  - playground/svelte/src/main.ts
  - packages/react/src/use-copy-to-clipboard.ts
  - packages/react/src/index.ts
  - packages/react/tests/use-copy-to-clipboard.test.ts
  - packages/svelte/src/action/copy-action.ts
  - packages/svelte/src/runes/use-copy-to-clipboard.svelte.ts
  - packages/svelte/src/stores/use-copy-to-clipboard.ts
  - packages/svelte/src/index.ts
  - packages/svelte/tests/copy-action.test.ts
  - packages/svelte/tests/use-copy-to-clipboard.test.ts
  - packages/core/playwright.config.ts
  - packages/core/tests/e2e/clipboard.spec.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-04-13
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Phase 07 lands four playground apps (vanilla, React 19, Vue 3, Svelte 5) plus restored adapter packages for `@ngockhoi96/ctc-react` and `@ngockhoi96/ctc-svelte`. The overall quality is high: known Svelte 5 deviations are correctly handled, API names are accurate, and error object shapes (`error.code`) are used consistently across all four playgrounds. Three warnings were found — all in the adapter package source logic rather than playground UI code — plus two low-priority items.

## Findings

### Warning (strongly recommended to fix)

---

#### WR-01: `error` reactive state is never populated on clipboard write failure in all three hook variants

**Files:**
- `packages/react/src/use-copy-to-clipboard.ts:102-104`
- `packages/svelte/src/runes/use-copy-to-clipboard.svelte.ts:104`
- `packages/svelte/src/stores/use-copy-to-clipboard.ts:96`

**Issue:** When `copyToClipboard` fails due to a browser-level error (e.g. `NotAllowedError`, insecure context, write failure), the hooks forward the error exclusively to `options?.onError`. The `error` reactive state (`useState` / `$state` / `writable`) is never updated from this code path. `error` is only set when `text` is `undefined` at both call sites (the pre-flight guard).

All three packages advertise in their TSDoc: `error` — "structured error from the most recent failed copy attempt, or null." This contract is broken: a consumer who does not supply `onError` will see `error === null` with `copied === false` and `return false` — no way to surface what went wrong in reactive UI without an out-of-band callback.

The existing test at `packages/react/tests/use-copy-to-clipboard.test.ts:252-256` acknowledges this with an inline comment ("error state is only populated via onError callback") but does not flag it as an intentional design decision in the public docs.

**Fix:** Wrap `options?.onError` at the call to `copyToClipboard` so the reactive state is also updated when any error arrives:

```ts
// React variant — packages/react/src/use-copy-to-clipboard.ts
const success = await copyToClipboard(text, {
  onError: (err) => {
    setError(err)              // populate reactive state
    options?.onError?.(err)   // still forward to consumer callback
  },
})

// Svelte runes — packages/svelte/src/runes/use-copy-to-clipboard.svelte.ts
const success = await copyToClipboard(text, {
  onError: (err) => {
    state.error = err
    options?.onError?.(err)
  },
})

// Svelte stores — packages/svelte/src/stores/use-copy-to-clipboard.ts
const success = await copyToClipboard(text, {
  onError: (err) => {
    errorW.set(err)
    options?.onError?.(err)
  },
})
```

---

#### WR-02: Wrong error code used for missing-text programmer error in all three hook variants

**Files:**
- `packages/react/src/use-copy-to-clipboard.ts:84-88`
- `packages/svelte/src/runes/use-copy-to-clipboard.svelte.ts:86-90`
- `packages/svelte/src/stores/use-copy-to-clipboard.ts:78-82`

**Issue:** When `text` is `undefined` at both init-time and call-site, the hooks emit:
```ts
{ code: 'CLIPBOARD_NOT_SUPPORTED', message: 'No text provided to copy...' }
```

`CLIPBOARD_NOT_SUPPORTED` is semantically reserved (in `packages/core/src/lib/errors.ts` and `types.ts`) for cases where `navigator.clipboard` is absent or the environment is not a browser. Using it for a missing-argument programmer error conflates two distinct failure categories. A consumer checking `error.code === 'CLIPBOARD_NOT_SUPPORTED'` will incorrectly treat it as a browser support issue rather than a call-site bug.

The correct code for a bad-argument situation would be a new `ErrorCode` value (e.g. `'MISSING_TEXT'`) or, since this is unambiguously a programmer error, a thrown `TypeError` — consistent with the project rule "Never throw unless it's a programmer error (wrong argument type)."

**Fix (option A — align with project error-handling rule):** Throw a `TypeError` since this is a programmer error:
```ts
if (text === undefined) {
  throw new TypeError(
    '[ctc] useCopyToClipboard: no text provided. Pass text at init or call-site.',
  )
}
```

**Fix (option B — keep returning false but use a distinct code):** Add `'MISSING_TEXT'` to `ErrorCode` in `packages/core/src/lib/types.ts` and use it:
```ts
// packages/core/src/lib/types.ts
export type ErrorCode =
  | 'CLIPBOARD_NOT_SUPPORTED'
  | 'CLIPBOARD_PERMISSION_DENIED'
  | 'CLIPBOARD_WRITE_FAILED'
  | 'CLIPBOARD_READ_FAILED'
  | 'INSECURE_CONTEXT'
  | 'MISSING_TEXT'   // programmer error: no text at init or call-site
```

---

#### WR-03: `packages/svelte/src/index.ts` only exports `copyAction` — runes and stores adapters are unreachable from the package root

**File:** `packages/svelte/src/index.ts`

**Issue:** The barrel re-exports `copyAction` and its types but omits the runes and stores `useCopyToClipboard` functions entirely:

```ts
// current index.ts
export type { CopyActionParams } from './action/copy-action.ts'
export { copyAction } from './action/copy-action.ts'
```

The runes variant is published under a `/runes` subpath export (referenced in `CopyRune.svelte` as `@ngockhoi96/ctc-svelte/runes`) and the stores variant under `/stores`. Whether those subpath entries exist in `package.json` exports was not in scope for this review, but the root `index.ts` being the only confirmed barrel means any consumer who imports from `@ngockhoi96/ctc-svelte` directly gets only `copyAction`. This is not a blocker if subpath exports are defined in `package.json`, but is a potential silent gap if they are not.

**Fix:** Verify that `packages/svelte/package.json` exports map contains:
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./runes": "./dist/runes/use-copy-to-clipboard.svelte.js",
    "./stores": "./dist/stores/use-copy-to-clipboard.js"
  }
}
```
If subpath exports are absent, add them, or re-export from `index.ts` with appropriate sub-barrel files.

---

### Info (nice to have)

---

#### IN-01: `CopyAction.svelte` `$effect` cleanup closes over mutable `buttonEl` ref

**File:** `playground/svelte/src/CopyAction.svelte:30-38`

**Issue:** The `$effect` cleanup function closes over the reactive `buttonEl` variable:

```svelte
$effect(() => {
  if (buttonEl === null) return
  buttonEl.addEventListener('ctc:copy', onCopy)
  buttonEl.addEventListener('ctc:error', onError)
  return () => {
    buttonEl?.removeEventListener('ctc:copy', onCopy)   // buttonEl may be null at cleanup time
    buttonEl?.removeEventListener('ctc:error', onError)
  }
})
```

In Svelte 5, `bind:this` may nullify the ref before the `$effect` teardown runs during component destruction. The `?.` guards prevent a crash but silently skip the `removeEventListener` calls. In practice the `copyAction` `destroy()` handles its own click listener, and the custom event listeners (`ctc:copy`, `ctc:error`) are element-level listeners that go away with the element anyway — so there is no real leak. This is playground-only code but the pattern is worth hardening in adapter examples.

**Fix:** Capture `buttonEl` at effect entry time so the cleanup reference is stable:
```svelte
$effect(() => {
  const el = buttonEl
  if (el === null) return
  el.addEventListener('ctc:copy', onCopy)
  el.addEventListener('ctc:error', onError)
  return () => {
    el.removeEventListener('ctc:copy', onCopy)
    el.removeEventListener('ctc:error', onError)
  }
})
```

---

#### IN-02: `biome.json` excludes `*.vue` and `*.svelte` files from linting

**File:** `biome.json:74-75`

**Issue:** The `files.includes` list contains `"!!**/*.vue"` and `"!!**/*.svelte"` (Biome's negation syntax), meaning Vue SFC and Svelte component files are never linted. Biome does not yet support Vue/Svelte parsing natively, so this is a known limitation — but it means the `<script lang="ts">` blocks in `App.vue`, `App.svelte`, `CopyAction.svelte`, and `CopyRune.svelte` are not subject to any of the configured TypeScript rules (no-explicit-any, no-unused-imports, etc.).

This is acceptable given Biome's current capabilities, but worth noting so future tooling additions (e.g. `eslint-plugin-svelte` or `eslint-plugin-vue`) can fill this gap.

**Fix:** No action required now. Track as a linting coverage gap until Biome adds Vue/Svelte support.

---

## Files Reviewed

| File | Status |
|------|--------|
| `playground/vanilla/src/main.ts` | Clean |
| `playground/vanilla/index.html` | Clean |
| `playground/react/src/App.tsx` | Clean |
| `playground/react/src/main.tsx` | Clean |
| `playground/vue/src/App.vue` | Clean |
| `playground/vue/src/main.ts` | Clean |
| `playground/vue/src/env.d.ts` | Clean |
| `playground/svelte/src/App.svelte` | Clean |
| `playground/svelte/src/CopyAction.svelte` | IN-01 |
| `playground/svelte/src/CopyRune.svelte` | Clean |
| `playground/svelte/src/main.ts` | Clean |
| `packages/react/src/use-copy-to-clipboard.ts` | WR-01, WR-02 |
| `packages/react/src/index.ts` | Clean |
| `packages/react/tests/use-copy-to-clipboard.test.ts` | Clean |
| `packages/svelte/src/action/copy-action.ts` | Clean |
| `packages/svelte/src/runes/use-copy-to-clipboard.svelte.ts` | WR-01, WR-02 |
| `packages/svelte/src/stores/use-copy-to-clipboard.ts` | WR-01, WR-02 |
| `packages/svelte/src/index.ts` | WR-03 |
| `packages/svelte/tests/copy-action.test.ts` | Clean |
| `packages/svelte/tests/use-copy-to-clipboard.test.ts` | Clean |
| `packages/core/playwright.config.ts` | Clean |
| `packages/core/tests/e2e/clipboard.spec.ts` | Clean |

---

_Reviewed: 2026-04-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
