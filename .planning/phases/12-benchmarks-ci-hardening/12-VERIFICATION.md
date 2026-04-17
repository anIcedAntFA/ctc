---
phase: 12-benchmarks-ci-hardening
verified: 2026-04-17T04:00:00Z
status: passed
score: 8/8
overrides_applied: 0
re_verification: false
---

# Phase 12: Benchmarks & CI Hardening — Verification Report

**Phase Goal:** Published benchmark data demonstrates ctc performance and bundle size against competing libraries
**Verified:** 2026-04-17T04:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `pnpm bench` runs Vitest bench from a `benchmarks/` workspace package and produces timing output | VERIFIED | turbo.json `bench` task with `"dependsOn": ["^build"]` and `"cache": false`; root `package.json` `"bench": "turbo run bench"`; `pnpm-workspace.yaml` includes `"benchmarks"`; vitest.config.ts configures `benchmark.include: ['src/**/*.bench.ts']`; 5 bench functions confirmed running via bench-results.json real output |
| 2 | Bundle size comparison table (gzip + brotli) covering ctc vs clipboard-copy vs copy-to-clipboard is captured | VERIFIED | `benchmarks/scripts/measure-bundle-size.ts` uses esbuild `buildSync` + `gzipSync` + `brotliCompressSync`; `BENCHMARKS.md` contains table with all 3 packages and Gzip/Brotli columns |
| 3 | Wrapper overhead benchmarks with mocked clipboard API produce ops/sec results | VERIFIED | `benchmarks/src/core.bench.ts` and `benchmarks/src/react.bench.ts` use mocked `navigator.clipboard` via `createClipboardMock/createRichClipboardMock/createReadClipboardMock`; `bench-results.json` contains real hz values (670K+ ops/sec for core, 1,634+ for React) |
| 4 | All benchmark results are published in `BENCHMARKS.md` at the repo root | VERIFIED | `BENCHMARKS.md` exists at repo root; contains `## Bundle Size Comparison`, `## Core Function Performance`, `## React Adapter Overhead`, `## Methodology`, and `> Generated on 2026-04-17` date stamp |
| 5 | Running `pnpm bench` from repo root executes vitest bench in the benchmarks workspace | VERIFIED | Root `package.json` scripts `"bench": "turbo run bench"`; turbo routes to `benchmarks/` workspace `bench` script which is `vitest bench` |
| 6 | Core benchmark file measures copyToClipboard, copyRichContent, readFromClipboard ops/sec | VERIFIED | `benchmarks/src/core.bench.ts` has 3 `bench(...)` calls for all three functions; imports from `@ngockhoi96/ctc` |
| 7 | React benchmark file measures useCopyToClipboard and useCopyRichContent hook overhead | VERIFIED | `benchmarks/src/react.bench.ts` has 2 `bench(...)` calls; uses `renderHook` from `@testing-library/react`; imports from `@ngockhoi96/ctc-react` |
| 8 | Running the generate script rewrites BENCHMARKS.md with fresh data | VERIFIED | `benchmarks/scripts/generate-benchmarks.ts` calls `execFileSync('pnpm', ['exec', 'vitest', 'bench'])` then `measureAllBundleSizes()` then `writeFileSync(BENCHMARKS_MD_PATH, markdown)` — full orchestration pipeline |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `benchmarks/package.json` | Private workspace `@ngockhoi96/ctc-benchmarks` | VERIFIED | `"private": true`, `"name": "@ngockhoi96/ctc-benchmarks"`, `"bench": "vitest bench"`, both workspace deps and competitor devDeps present |
| `benchmarks/vitest.config.ts` | Vitest bench config with jsdom environment | VERIFIED | `environment: 'jsdom'`, `benchmark.include: ['src/**/*.bench.ts']`, `outputJson: 'bench-results.json'` |
| `benchmarks/tsconfig.json` | Extends tsconfig.base.json | VERIFIED | Extends `../tsconfig.base.json`, includes `["src", "scripts"]` |
| `benchmarks/src/helpers/clipboard-mock.ts` | 3 mock factory exports | VERIFIED | Exports `createClipboardMock`, `createRichClipboardMock`, `createReadClipboardMock`; uses `mockResolvedValue` (not `mockResolvedValueOnce`) |
| `benchmarks/src/core.bench.ts` | Core function benchmarks | VERIFIED | 3 `bench()` calls for copyToClipboard, copyRichContent, readFromClipboard; imports from `@ngockhoi96/ctc`; uses bench `setup`/`teardown` options |
| `benchmarks/src/react.bench.ts` | React adapter overhead benchmarks | VERIFIED | 2 `bench()` calls; uses `renderHook` + `act`; imports from `@ngockhoi96/ctc-react`; calls `unmount()` per iteration |
| `benchmarks/scripts/measure-bundle-size.ts` | esbuild + zlib bundle size measurement | VERIFIED | Imports `buildSync` from `esbuild`; imports `gzipSync`, `brotliCompressSync` from `node:zlib`; exports `measureBundleSize` and `measureAllBundleSizes`; uses `platform: 'browser'`, `format: 'esm'`, `minify: true` |
| `benchmarks/scripts/generate-benchmarks.ts` | Orchestrator script writing BENCHMARKS.md | VERIFIED | Imports `measureAllBundleSizes`; uses `execFileSync` (not `execSync`); reads `bench-results.json`; writes `BENCHMARKS.md` via `writeFileSync` |
| `BENCHMARKS.md` | Published benchmark results at repo root | VERIFIED | Exists at repo root; contains `## Bundle Size Comparison` with 3-package table, `## Core Function Performance`, `## React Adapter Overhead`, `## Methodology`, and `Generated on 2026-04-17` date stamp |
| `pnpm-workspace.yaml` | benchmarks workspace registration | VERIFIED | Contains `- "benchmarks"` entry |
| `turbo.json` | bench task definition | VERIFIED | `"bench"` task with `"dependsOn": ["^build"]`, `"cache": false` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `benchmarks/src/core.bench.ts` | `@ngockhoi96/ctc` | workspace dependency import | VERIFIED | `from '@ngockhoi96/ctc'` on line 2 |
| `benchmarks/src/react.bench.ts` | `@ngockhoi96/ctc-react` | workspace dependency import | VERIFIED | `from '@ngockhoi96/ctc-react'` on line 3 |
| `turbo.json` bench task | `benchmarks/package.json` | routes `turbo run bench` to workspace script | VERIFIED | Task defined with `"cache": false`; workspace registered in `pnpm-workspace.yaml` |
| `benchmarks/scripts/measure-bundle-size.ts` | `esbuild` | `buildSync` API | VERIFIED | `import { buildSync } from 'esbuild'` on line 1 |
| `benchmarks/scripts/measure-bundle-size.ts` | `node:zlib` | `gzipSync` + `brotliCompressSync` | VERIFIED | `import { gzipSync, brotliCompressSync } from 'node:zlib'` on line 5 |
| `benchmarks/scripts/generate-benchmarks.ts` | `BENCHMARKS.md` | `writeFileSync` | VERIFIED | `writeFileSync(BENCHMARKS_MD_PATH, markdown, 'utf-8')` on line 144 |
| `benchmarks/scripts/generate-benchmarks.ts` | `benchmarks/scripts/measure-bundle-size.ts` | import | VERIFIED | `import { measureAllBundleSizes, type SizeResult } from './measure-bundle-size.ts'` on line 4 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `BENCHMARKS.md` | Bundle size table | `measureAllBundleSizes()` → esbuild `buildSync` + `gzipSync`/`brotliCompressSync` on real npm packages | Yes — actual bytecounts from real bundles | FLOWING |
| `BENCHMARKS.md` | ops/sec performance table | `bench-results.json` parsed by `extractBenchEntries()` → produced by `vitest bench` running against mocked clipboard | Yes — real timing data confirmed in `bench-results.json` (670K+ hz for `copyToClipboard`) | FLOWING |
| `benchmarks/src/core.bench.ts` | Bench timing | `createClipboardMock()` → `vi.stubGlobal` + `mockResolvedValue(undefined)` → real function calls to `copyToClipboard`/`copyRichContent`/`readFromClipboard` | Yes — functions execute real logic paths against mocked API | FLOWING |
| `benchmarks/src/react.bench.ts` | Bench timing | `renderHook` + `act` + `unmount` per iteration against mocked clipboard | Yes — real React render cycle measured, not hardcoded | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Module exports `measureBundleSize` and `measureAllBundleSizes` as functions | `node -e` ESM dynamic import check | Both returned `"function"` | PASS |
| `generate-benchmarks.ts` uses `execFileSync` (not shell-injectable `execSync`) | grep check | `execFileSync('pnpm', ['exec', 'vitest', 'bench'])` confirmed on line 67 | PASS |
| `bench-results.json` contains real vitest bench output | File content inspection | JSON with `hz: 670151`, `rme: 14.73%`, `totalTime: 500ms` — real measurement data | PASS |
| `BENCHMARKS.md` contains all three packages and performance sections | grep check | All 4 required sections present with populated data tables | PASS |
| All 4 task commits exist in git log | `git log --oneline` | `de550d0`, `7d78ae0`, `3b6f009`, `6cc8ada` all confirmed | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BENCH-01 | 12-01-PLAN.md | `benchmarks/` workspace with Vitest bench configured and runnable via `pnpm bench` | SATISFIED | `benchmarks/` workspace registered, `vitest bench` script wired, turbo task defined, 5 bench functions run successfully |
| BENCH-02 | 12-02-PLAN.md | Bundle size comparison table (gzip + brotli) vs `clipboard-copy` and `copy-to-clipboard` captured | SATISFIED | `measure-bundle-size.ts` produces real gzip/brotli sizes; `BENCHMARKS.md` contains comparison table with all 3 packages |
| BENCH-03 | 12-01-PLAN.md | Wrapper overhead benchmarks (mocked clipboard API) produce ops/sec results via `vitest bench` | SATISFIED | Core (3 functions) and React (2 hooks) benchmarks use mocked clipboard; `bench-results.json` confirms real timing output |
| BENCH-04 | 12-02-PLAN.md | Results published in `BENCHMARKS.md` at repo root | SATISFIED | `BENCHMARKS.md` exists at repo root with bundle size table, core performance table, React overhead table, and methodology; generated via `generate-benchmarks.ts` orchestrator |

**All 4 requirements satisfied. No orphaned requirements detected.**

---

### Anti-Patterns Found

No anti-patterns detected across any benchmark files. Scanned for: TODO/FIXME/PLACEHOLDER comments, `return null`/`return []`/`return {}` stubs, hardcoded empty values in rendering paths, console.log-only implementations.

**Notable positive patterns:**
- `mockResolvedValue` (not `mockResolvedValueOnce`) correctly used for bench iterations
- `execFileSync` used over `execSync` (no shell injection surface)
- Competitor packages isolated to private `benchmarks/` devDeps only — cannot leak into published bundles
- `bench-results.json` added to `.gitignore` — large volatile file not committed

---

### Human Verification Required

None. All truths are verifiable programmatically:

- Artifact existence and content: verified via file reads
- Data flow: confirmed via `bench-results.json` real output inspection
- Wiring: confirmed via grep and import checks
- Module exports: confirmed via ESM dynamic import

---

### Gaps Summary

No gaps found. All 8 must-have truths are verified, all 11 artifacts are substantive and wired, all 7 key links are confirmed, and all 4 requirements (BENCH-01 through BENCH-04) are satisfied.

The phase goal is achieved: published benchmark data in `BENCHMARKS.md` demonstrates ctc performance (ops/sec via Vitest bench with mocked clipboard) and bundle size (esbuild + zlib gzip/brotli) against `clipboard-copy` and `copy-to-clipboard`.

---

_Verified: 2026-04-17T04:00:00Z_
_Verifier: Claude (gsd-verifier)_
