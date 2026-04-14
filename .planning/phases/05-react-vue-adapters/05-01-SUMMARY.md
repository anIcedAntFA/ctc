---
phase: "05-react-vue-adapters"
plan: "01"
subsystem: "packages/react"
tags: ["react", "hook", "clipboard", "adapter"]
dependency_graph:
  requires: ["packages/core"]
  provides: ["@ngockhoi96/ctc-react"]
  affects: []
tech_stack:
  added: ["@testing-library/react", "jsdom", "@types/react", "@types/react-dom", "react", "react-dom"]
  patterns: ["renderHook", "useRef+clearTimeout timer pattern", "Object.defineProperty for jsdom-safe mocking"]
key_files:
  created:
    - packages/react/package.json
    - packages/react/tsconfig.json
    - packages/react/tsconfig.node.json
    - packages/react/tsdown.config.ts
    - packages/react/vitest.config.ts
    - packages/react/src/use-copy-to-clipboard.ts
    - packages/react/src/index.ts
    - packages/react/tests/helpers/create-clipboard-mock.ts
    - packages/react/tests/use-copy-to-clipboard.test.ts
    - packages/react/README.md
  modified: []
decisions:
  - "No biome.json in packages/react — root biome.json already covers packages/* via files.includes; adding a nested config causes Biome 2.x 'nested root configuration' error"
  - "createClipboardMock uses Object.defineProperty for window.isSecureContext instead of vi.stubGlobal('window', ...) — preserves jsdom's HTMLElement/ShadowRoot constructors that React DOM needs for instanceof checks"
  - "Used CLIPBOARD_NOT_SUPPORTED error code for D-02 (no text provided) as documented in plan — no new ErrorCode added to core"
metrics:
  duration: "~20 minutes"
  completed: "2026-04-13"
  tasks: 7
  files: 10
---

# Phase 05, Plan 01: `packages/react` — scaffold, hook, tests, README

**Completed:** 2026-04-13
**Status:** Complete

## What was built

`@ngockhoi96/ctc-react` — a fully scaffolded React adapter package that wraps `@ngockhoi96/ctc`'s `copyToClipboard` function in a `useCopyToClipboard` hook. The hook exposes `{ copy, copied, error, reset }` with auto-reset timer logic, `useRef`-based timer management to avoid render lag, and full TypeScript types. Ships as ESM + CJS with `.d.cts`/`.d.mts` declaration files.

## Files created/modified

| File | Status | Description |
|------|--------|-------------|
| `packages/react/package.json` | Created | Package manifest with peerDeps, devDeps, scripts, exports map |
| `packages/react/tsconfig.json` | Created | TypeScript config covering `src/` only |
| `packages/react/tsconfig.node.json` | Created | TypeScript config for `tsdown.config.ts` |
| `packages/react/tsdown.config.ts` | Created | Build config — single entry, ESM+CJS+dts, `exports: true` |
| `packages/react/vitest.config.ts` | Created | Test config — jsdom, 100% coverage threshold |
| `packages/react/src/use-copy-to-clipboard.ts` | Created | Hook implementation — all D-01..D-08 behaviors |
| `packages/react/src/index.ts` | Created | Barrel export — hook + re-exported types |
| `packages/react/tests/helpers/create-clipboard-mock.ts` | Created | Shared mock helper — jsdom-safe clipboard mock |
| `packages/react/tests/use-copy-to-clipboard.test.ts` | Created | 18 unit tests, 100% branch coverage |
| `packages/react/README.md` | Created | User-facing npm docs |

## Verification results

| Check | Result | Notes |
|-------|--------|-------|
| build | PASS | `dist/index.mjs` (2.01 KB), `dist/index.cjs`, `dist/index.d.cts`, `dist/index.d.mts` |
| typecheck | PASS | Zero TypeScript errors |
| lint | PASS | Zero Biome errors (9 files checked) |
| test (coverage) | PASS | 18 tests, 100% stmts/branches/funcs/lines on `use-copy-to-clipboard.ts` |
| validate (publint+attw) | PASS | Zero errors, all export conditions resolve correctly |
| size (<2KB) | PASS | 737 B brotlied (well under 2 KB limit) |
| turbo pipeline | PASS | `pnpm turbo run build --filter=@ngockhoi96/ctc-react` succeeds |

## Commits

| Hash | Message |
|------|---------|
| `c37356d` | feat(react): scaffold packages/react — config files |
| `d2b844a` | feat(react): implement useCopyToClipboard hook |
| `57025b2` | feat(react): add barrel export src/index.ts |
| `57c4924` | test(react): add createClipboardMock helper |
| `80fe000` | test(react): add useCopyToClipboard unit tests |
| `b7ba4da` | docs(react): add packages/react README |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] biome.json causes Biome 2.x nested root configuration error**
- **Found during:** Task 1 commit
- **Issue:** The plan specified creating `packages/react/biome.json` extending `../../biome.json`. Biome 2.x treats any `biome.json` outside the root as a "nested root configuration" and exits with an error. `packages/core` does not have a `biome.json` (root config covers all packages via `files.includes`).
- **Fix:** Omitted `packages/react/biome.json` entirely. Root `biome.json` covers `packages/react/src/**`, `packages/react/tests/**`, and `packages/react/*.config.ts` via existing glob patterns.
- **Files modified:** None (file removed before commit)

**2. [Rule 1 - Bug] Test import paths incorrect in plan**
- **Found during:** Task 5 test run
- **Issue:** Plan's test template used `../../src/use-copy-to-clipboard.ts` and `../helpers/create-clipboard-mock.ts` as import paths. From `tests/use-copy-to-clipboard.test.ts`, correct paths are `../src/` and `./helpers/`.
- **Fix:** Corrected import paths before running tests.
- **Files modified:** `packages/react/tests/use-copy-to-clipboard.test.ts`

**3. [Rule 1 - Bug] vi.stubGlobal('window', ...) breaks jsdom's React DOM globals**
- **Found during:** Task 5 first test run
- **Issue:** The plan's `createClipboardMock` helper used `vi.stubGlobal('window', { isSecureContext: true })` which replaces the entire window object. In jsdom environment, this destroys `window.HTMLInputElement`, `window.ShadowRoot`, and other constructors that React DOM uses for `instanceof` checks, causing all 16 tests to fail with `Right-hand side of 'instanceof' is not an object`.
- **Fix:** Replaced `vi.stubGlobal('window', ...)` with `Object.defineProperty(window, 'isSecureContext', { value: true, writable: true, configurable: true })` to patch only the `isSecureContext` property while preserving all other jsdom globals.
- **Files modified:** `packages/react/tests/helpers/create-clipboard-mock.ts`

**4. [Rule 2 - Missing coverage] Added 2 tests for null-timer branches**
- **Found during:** Task 5 coverage run
- **Issue:** First coverage run showed 87.5% branch coverage. Two branches at lines 72 and 127 (the `timerRef.current !== null` guards in `useEffect` cleanup and `reset()`) were not exercised when timer was null.
- **Fix:** Added `'unmounts cleanly without a timer (no copy called)'` and `'is a no-op when called without a prior copy (no timer pending)'` tests.
- **Files modified:** `packages/react/tests/use-copy-to-clipboard.test.ts`
- **Result:** 100% branch coverage achieved

## Known Stubs

None — all data flows from real implementations.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced. Package is a pure browser-side utility wrapper.
