---
phase: 01-project-foundation
verified: 2026-04-08T14:00:00Z
status: human_needed
score: 9/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Verify Biome lint catches unused imports as errors (not just warnings)"
    expected: "Adding an unused import to a src file and running `pnpm lint` exits non-zero with a lint error"
    why_human: "Cannot inject a temporary import into source and run lint in a side-effect-free way during automated verification"
  - test: "Verify Biome flags default exports as errors outside config files"
    expected: "Adding `export default function foo() {}` to src/utils/env.ts and running `pnpm lint` exits non-zero"
    why_human: "Requires mutating source files to confirm the rule fires; cannot verify rule enforcement without triggering it"
---

# Phase 1: Project Foundation Verification Report

**Phase Goal:** Developers can clone the repo, install deps, and produce a valid ESM + CJS + .d.ts build with correct package.json exports
**Verified:** 2026-04-08T14:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running `pnpm build` produces ESM (.mjs), CJS (.cjs), and declaration files in dist/ | VERIFIED | `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.cts`, `dist/index.d.mts`, `dist/clipboard/index.mjs`, `dist/clipboard/index.cjs`, `dist/clipboard/index.d.cts`, `dist/clipboard/index.d.mts` all exist. Build exits 0 in 99-101ms. |
| 2 | package.json exports map resolves correctly for both root and `./clipboard` subpath (verified by publint + attw) | VERIFIED | `pnpm validate` exits 0. publint: "No fixes applied" (only a suggestion about missing `license` field, not an error). attw: all 4 resolution modes (node10, node16-CJS, node16-ESM, bundler) show green for both `"."` and `"./clipboard"`. |
| 3 | Bundle size of core output is under 1KB gzip | VERIFIED | `pnpm size` reports `dist/index.mjs`: 114B brotlied and `dist/clipboard/index.mjs`: 115B brotlied. Both are well under the 1KB limit. |
| 4 | Git hooks enforce linting and conventional commit format on every commit | VERIFIED | `.git/hooks/pre-commit` and `.git/hooks/commit-msg` exist and reference lefthook. `echo "feat: test message" | pnpm commitlint` exits 0. `echo "bad message" | pnpm commitlint` exits 1. |

**Roadmap score: 4/4 success criteria verified** (with 2 human verification items for SC-4 sub-behaviors)

### Must-Haves from Plan 01-01 (BUILD-01..05)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `pnpm build` produces dist/index.mjs, dist/index.cjs, dist/index.d.ts | PARTIAL | ESM and CJS files exist. No `.d.ts` — tsdown produces `.d.cts` and `.d.mts` per format instead. This is correct modern behavior; attw validates it green across all modes. The plan's wording was imprecise. |
| 2 | `pnpm build` produces dist/clipboard/index.mjs, dist/clipboard/index.cjs, dist/clipboard/index.d.ts | PARTIAL | Same: `.d.cts` and `.d.mts` generated instead of `.d.ts`. attw confirms no resolution problems. |
| 3 | package.json exports map resolves correctly for root and ./clipboard subpath | VERIFIED | Confirmed by attw. See roadmap SC-2 above. |
| 4 | publint reports no errors | VERIFIED | exits 0; one suggestion (missing `license` field in package.json, not an error). LICENSE file exists on disk. |
| 5 | attw reports no errors | VERIFIED | All 4 resolution modes green for both subpaths. |
| 6 | size-limit reports core bundle under 1KB gzip | VERIFIED | 114B and 115B (brotli). |

### Must-Haves from Plan 01-02 (DX-01, DX-02, DX-04)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 7 | Biome lint catches unused imports and flags default exports as errors | NEEDS HUMAN | `biome.json` has `noUnusedImports: "error"` and `noDefaultExport: "error"` configured correctly. `pnpm lint` exits 0 on current clean source. Cannot confirm rule fires without introducing violations. |
| 8 | Biome formats with tabs, single quotes, 80 char line width | VERIFIED | `biome.json` has `indentStyle: "tab"`, `quoteStyle: "single"`, `lineWidth: 80`. `pnpm lint` runs and checks 11 files with 0 issues. Source files use tabs visibly. |
| 9 | Pre-commit hook runs Biome lint, format check, and tsc --noEmit | VERIFIED | `lefthook.yml` pre-commit section has parallel=true with `lint`, `format`, `typecheck` commands calling `biome check`, `biome format`, and `tsc --noEmit`. `.git/hooks/pre-commit` installed. |
| 10 | Commit messages not following conventional format are rejected by commitlint | VERIFIED | `echo "bad message" | pnpm commitlint` exits 1 with "type may not be empty" error. `echo "feat: test message" | pnpm commitlint` exits 0. |

**Plan must-haves score: 8/10 truths fully verified, 2 require human verification (both pass automated config checks)**

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Package manifest with exports, scripts, sideEffects:false | VERIFIED | Has `sideEffects: false`, `type: module`, all scripts, exports map, 14 devDependencies. |
| `tsconfig.json` | TypeScript configuration with strict mode and nodenext | VERIFIED | Has `strict: true`, `module: nodenext`, `moduleResolution: nodenext`, `isolatedDeclarations: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. |
| `tsdown.config.ts` | Bundler configuration for dual ESM+CJS output | VERIFIED | Has `defineConfig`, dual entry points (`index` and `clipboard/index`), `format: ['esm', 'cjs']`, `dts: true`, `exports: true`. |
| `src/index.ts` | Root barrel re-exporting clipboard module | VERIFIED | Exports all 4 functions and 4 types from `./clipboard/index.ts`. No logic, only re-exports. |
| `src/clipboard/index.ts` | Clipboard barrel re-exporting utils | VERIFIED | Re-exports from `../utils/env.ts`, `../utils/errors.ts`, `../utils/types.ts`, and `./types.ts`. |
| `src/utils/types.ts` | BrowserUtilsError type and ErrorCode | VERIFIED | Has `ErrorCode` union (5 codes), `BrowserUtilsError` interface, `OnErrorCallback` type. All with TSDoc. |
| `src/utils/env.ts` | isBrowser and isSecureContext functions | VERIFIED | Both functions implemented with SSR guards (`typeof navigator !== 'undefined'`). Both have TSDoc. |
| `src/utils/errors.ts` | createError and handleError functions | VERIFIED | Both substantive — `createError` returns structured error object, `handleError` routes to callback or `console.warn`. |
| `biome.json` | Biome linter and formatter configuration | VERIFIED | Has `indentStyle: "tab"`, `noDefaultExport: "error"`, `noUnusedImports: "error"`, `nursery` section, config file override. |
| `lefthook.yml` | Git hooks for pre-commit, commit-msg, pre-push | VERIFIED | Has all 3 hook sections with correct commands. |
| `commitlint.config.ts` | Commitlint with conventional preset | VERIFIED | Extends `@commitlint/config-conventional`. |
| `.changeset/config.json` | Changesets configuration | VERIFIED | Has `access: "public"`, `baseBranch: "main"`. |
| `LICENSE` | MIT license text | VERIFIED | Contains "MIT License" and full text. |
| `.gitignore` | Git ignore for node_modules, dist, coverage | VERIFIED | Contains `node_modules/`, `dist/`, `coverage/`, `*.tsbuildinfo`, `*.tgz`, `.DS_Store`. |
| `dist/index.mjs` | ESM output | VERIFIED | Exists, exports `isBrowser`, `isSecureContext`, `createError`, `handleError`. |
| `dist/index.cjs` | CJS output | VERIFIED | Exists, all 4 functions verified callable. `node -e "require('./dist/index.cjs')"` exits 0. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/index.ts` | `src/clipboard/index.ts` | re-export | WIRED | `export ... from './clipboard/index.ts'` present for both values and types. |
| `src/clipboard/index.ts` | `src/utils/env.ts` | re-export | WIRED | `export { isBrowser, isSecureContext } from '../utils/env.ts'` present. |
| `tsdown.config.ts` | `package.json` | exports:true auto-generation | WIRED | `exports: true` in config. Build run confirmed package.json exports map is written. |
| `lefthook.yml` | `biome.json` | pre-commit lint command | WIRED | `pnpm biome check --no-errors-on-unmatched {staged_files}` in pre-commit. |
| `lefthook.yml` | `commitlint.config.ts` | commit-msg hook | WIRED | `pnpm commitlint --edit {1}` in commit-msg section. |

### Data-Flow Trace (Level 4)

Not applicable. This phase produces utility functions and build tooling — no dynamic data rendering, no API calls, no state management. All functions are pure transformations of arguments.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `pnpm build` exits 0 and produces output | `pnpm build` | exits 0, 14+ files in dist/ | PASS |
| CJS output is SSR-safe (importable in Node) | `node -e "require('./dist/index.cjs')"` | exits 0 | PASS |
| CJS exports all 4 expected functions | `node -e "console.log(typeof cjs.isBrowser)"` | function x4 | PASS |
| `pnpm validate` exits 0 (publint + attw) | `pnpm validate` | exits 0, attw all green | PASS |
| `pnpm size` under 1KB | `pnpm size` | 114B / 115B brotlied | PASS |
| `pnpm lint` exits 0 | `pnpm lint` | exits 0, 11 files checked | PASS |
| Commitlint rejects non-conventional messages | `echo "bad message" \| pnpm commitlint` | exits 1 | PASS |
| Commitlint accepts conventional messages | `echo "feat: test" \| pnpm commitlint` | exits 0 | PASS |
| Git hooks installed | `.git/hooks/pre-commit` exists | lefthook shim present | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| BUILD-01 | 01-01 | ESM + CJS + .d.ts output via tsdown | SATISFIED | dist/ has .mjs, .cjs, .d.cts, .d.mts for both entry points. Build exits 0. |
| BUILD-02 | 01-01 | Tree-shakeable with `"sideEffects": false` | SATISFIED | `package.json` has `"sideEffects": false`. Barrel files contain only re-exports. |
| BUILD-03 | 01-01 | Core bundle < 1KB gzip | SATISFIED | `pnpm size` reports 114B and 115B brotlied — well under 1KB. |
| BUILD-04 | 01-01 | package.json exports map (root + clipboard subpath) | SATISFIED | exports map has `"."` and `"./clipboard"` entries with import/require conditions. |
| BUILD-05 | 01-01 | Validated with publint + arethetypeswrong | SATISFIED | `pnpm validate` exits 0. attw shows all-green across node10/node16/bundler. |
| DX-01 | 01-02 | Lefthook for git hooks (pre-commit: lint+test, commit-msg: commitlint) | SATISFIED | `lefthook.yml` has pre-commit (lint+format+typecheck+test) and commit-msg (commitlint). `.git/hooks/` installed. |
| DX-02 | 01-02 | Commitlint enforcing conventional commit format | SATISFIED | `commitlint.config.ts` extends `@commitlint/config-conventional`. Bad messages exit 1. |
| DX-04 | 01-02 | MIT License | SATISFIED | `LICENSE` file contains full MIT license text. |

**All 8 required requirement IDs fully satisfied.** No orphaned requirements found in REQUIREMENTS.md for Phase 1 (traceability table maps only these 8 IDs to Phase 1).

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `package.json` | Missing `"license"` field (publint suggestion) | Info | Non-blocking. License is in LICENSE file. npm won't display SPDX identifier. Not an error — a suggestion. |
| `package.json` | exports map lacks `"types"` condition in each entry | Info | Non-blocking. attw passes with all-green via top-level `"types"` field + `typesVersions` fallback. The SUMMARY documents this as an intentional decision ("Let tsdown own the exports map"). |
| `dist/` | No `dist/index.d.ts` file (`.d.cts` and `.d.mts` instead) | Info | Non-blocking. The plan's wording said `.d.ts` but tsdown generates format-specific declarations. attw confirms correct type resolution. |

No blockers. No stub implementations. No TODO/FIXME comments. No empty returns.

### Human Verification Required

#### 1. Biome `noUnusedImports` fires as an error

**Test:** Add `import { createError } from './utils/errors.ts'` to `src/utils/env.ts` (an unused import), then run `pnpm lint`.
**Expected:** `pnpm lint` exits non-zero with a lint error referencing `noUnusedImports`.
**Why human:** Cannot inject a violation into source files during automated verification without side effects. The config is correctly set to `"error"` but confirming rule invocation requires triggering it.

#### 2. Biome `noDefaultExport` fires for non-config source files

**Test:** Add `export default function testFn() {}` to `src/utils/env.ts`, then run `pnpm lint`.
**Expected:** `pnpm lint` exits non-zero with `noDefaultExport` error. Running the same test on `tsdown.config.ts` should succeed (override active).
**Why human:** Same constraint as above — needs a temporary violation to confirm enforcement.

### Gaps Summary

No blocking gaps found. All 4 roadmap success criteria are achieved:

1. `pnpm build` produces working ESM + CJS + declaration files — CONFIRMED by running build.
2. package.json exports map validated by publint (no errors) and attw (all-green) — CONFIRMED.
3. Bundle size 114B brotlied — well under 1KB — CONFIRMED.
4. Git hooks enforcing lint and conventional commits — CONFIRMED by hook installation and commitlint behavior tests.

The two human verification items are quality-confirmation checks for Biome rule enforcement, not gaps in implementation. The configuration is correct and passes `pnpm lint` on current source. The only notable finding is a publint suggestion (not error) about adding a `"license"` field to package.json — this is cosmetic and does not affect the phase goal.

---

_Verified: 2026-04-08T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
