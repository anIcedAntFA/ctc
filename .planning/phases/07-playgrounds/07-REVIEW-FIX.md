---
phase: 07-playgrounds
fixed_at: 2026-04-13T07:53:00Z
review_path: .planning/phases/07-playgrounds/07-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 2
skipped: 1
status: partial
---

# Phase 07: Code Review Fix Report

**Fixed at:** 2026-04-13T07:53:00Z
**Source review:** .planning/phases/07-playgrounds/07-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3
- Fixed: 2
- Skipped: 1

## Fixed Issues

### WR-01: `error` reactive state is never populated on clipboard write failure

**Files modified:** `packages/react/src/use-copy-to-clipboard.ts`, `packages/svelte/src/runes/use-copy-to-clipboard.svelte.ts`, `packages/svelte/src/stores/use-copy-to-clipboard.ts`, `packages/react/tests/use-copy-to-clipboard.test.ts`, `packages/svelte/tests/use-copy-to-clipboard.test.ts`
**Commit:** a992613
**Applied fix:** Replaced the bare `onError: options?.onError` pass-through in the `copyToClipboard` call in all three hook variants with a wrapping callback that first updates reactive error state (`setError(err)` / `state.error = err` / `errorW.set(err)`) and then forwards to the consumer callback (`options?.onError?.(err)`). Updated tests in both React and Svelte packages to assert that `error` state is populated after a clipboard write failure even without a consumer-supplied `onError`, and removed the stale comment that incorrectly said error stays null without `onError`.

### WR-02: Wrong error code used for missing-text programmer error

**Files modified:** `packages/react/src/use-copy-to-clipboard.ts`, `packages/svelte/src/runes/use-copy-to-clipboard.svelte.ts`, `packages/svelte/src/stores/use-copy-to-clipboard.ts`, `packages/react/tests/use-copy-to-clipboard.test.ts`, `packages/svelte/tests/use-copy-to-clipboard.test.ts`
**Commit:** 1145a9a
**Applied fix:** Replaced the silent-failure path (returning `false` with a `CLIPBOARD_NOT_SUPPORTED` error object) with `throw new TypeError('[ctc] useCopyToClipboard: no text provided. Pass text at init or call-site.')` in all three hook variants, per the project rule "Never throw unless it is a programmer error (wrong argument type)." Updated tests to expect `TypeError` to be thrown instead of checking `error.code`. Also updated the "clears error to null" tests in both packages to use a clipboard write failure (instead of undefined text) to seed the initial error state, since that path now throws.

## Skipped Issues

### WR-03: `packages/svelte/src/index.ts` only exports `copyAction`

**File:** `packages/svelte/src/index.ts`
**Reason:** already handled via subpath exports in package.json — no fix needed
**Original issue:** The root `index.ts` barrel only re-exports `copyAction`. The reviewer flagged this as a potential gap if `package.json` did not define `./runes` and `./stores` subpath exports.

**Verification:** `packages/svelte/package.json` already contains:
```json
"exports": {
  ".":       { "import": "./dist/index.mjs",   "require": "./dist/index.cjs" },
  "./runes": { "import": "./dist/runes.mjs",   "require": "./dist/runes.cjs" },
  "./stores":{ "import": "./dist/stores.mjs",  "require": "./dist/stores.cjs" },
  "./package.json": "./package.json"
}
```
`packages/svelte/tsdown.config.ts` confirms `runes` and `stores` are explicit build entry points, so both subpath export targets are produced at build time. The `index.ts` barrel intentionally exports only the action API from the package root; consumers of the runes and stores APIs use the subpath imports (`@ngockhoi96/ctc-svelte/runes`, `@ngockhoi96/ctc-svelte/stores`) as designed.

---

_Fixed: 2026-04-13T07:53:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
