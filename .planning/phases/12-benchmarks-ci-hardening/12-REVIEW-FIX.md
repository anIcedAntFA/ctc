---
phase: 12
fixed_at: 2026-04-17T10:42:00Z
review_path: .planning/phases/12-benchmarks-ci-hardening/12-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 12: Code Review Fix Report

**Fixed at:** 2026-04-17T10:42:00Z
**Source review:** .planning/phases/12-benchmarks-ci-hardening/12-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### CR-01: `as string` cast violates no-cast rule

**Files modified:** `benchmarks/scripts/measure-bundle-size.ts`
**Commit:** 3c3c9da
**Applied fix:** Replaced `pkg.version as string` with `typeof pkg.version === 'string' ? pkg.version : 'unknown'` in `getPackageVersion`. Also exported `formatBytes` in this same file (prerequisite for WR-01).

### WR-01: `formatBytes` duplicated across two script files

**Files modified:** `benchmarks/scripts/measure-bundle-size.ts`, `benchmarks/scripts/generate-benchmarks.ts`
**Commit:** 685d891
**Applied fix:** Added `export` to `formatBytes` in `measure-bundle-size.ts`. Removed the duplicate definition from `generate-benchmarks.ts` and added `formatBytes` to the existing import from `./measure-bundle-size.ts`.

### WR-02: `uninstall()` does not restore `isSecureContext`

**Files modified:** `benchmarks/src/helpers/clipboard-mock.ts`
**Commit:** c6cb182
**Applied fix:** Added a four-line comment above `vi.unstubAllGlobals()` in `createClipboardMock`'s `uninstall` method documenting that `window.isSecureContext` (set via `Object.defineProperty`) is not restored by `vi.unstubAllGlobals()`, and that callers needing `isSecureContext === false` must reset it explicitly after calling `uninstall()`. The reviewer's finding cited lines 50-53 which correspond to that factory only.

### WR-03: `import.meta.dirname!` non-null assertion

**Files modified:** `benchmarks/scripts/generate-benchmarks.ts`
**Commit:** a8cb121
**Applied fix:** Added `import { fileURLToPath } from 'node:url'` and replaced `resolve(import.meta.dirname!, '..')` with `resolve(fileURLToPath(new URL('.', import.meta.url)), '..')`, eliminating the non-null assertion.

---

_Fixed: 2026-04-17T10:42:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
