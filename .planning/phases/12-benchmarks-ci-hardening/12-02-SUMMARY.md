---
phase: 12-benchmarks-ci-hardening
plan: 02
subsystem: testing
tags: [esbuild, zlib, benchmarks, bundle-size, markdown-generation]

# Dependency graph
requires:
  - phase: 12-benchmarks-ci-hardening
    plan: 01
    provides: benchmarks/ workspace with vitest bench infrastructure and bench-results.json output
provides:
  - Bundle size measurement script (esbuild + zlib)
  - Generate-benchmarks orchestrator producing BENCHMARKS.md
  - Published BENCHMARKS.md at repo root with size + performance data
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [esbuild-buildSync-bundle-measure, zlib-gzip-brotli-compression, vitest-bench-json-parsing]

key-files:
  created:
    - benchmarks/scripts/measure-bundle-size.ts
    - benchmarks/scripts/generate-benchmarks.ts
    - BENCHMARKS.md
  modified: []

key-decisions:
  - "Use sampleCount field from vitest bench JSON (not samples array length) for sample count in BENCHMARKS.md"
  - "Walker-based JSON extraction resilient to vitest bench output structure changes"

patterns-established:
  - "Bundle size measurement: esbuild buildSync with platform:browser + format:esm + minify:true, then zlib gzipSync/brotliCompressSync on output"
  - "Benchmark report generation: execFileSync for vitest bench, then measureAllBundleSizes, then write markdown"

requirements-completed: [BENCH-02, BENCH-04]

# Metrics
duration: 2min
completed: 2026-04-17
---

# Phase 12 Plan 02: Bundle Size & Benchmark Report Summary

**esbuild + zlib bundle size measurement and BENCHMARKS.md generation with ops/sec performance data for ctc vs clipboard-copy vs copy-to-clipboard**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-17T03:22:19Z
- **Completed:** 2026-04-17T03:24:11Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- Created bundle size measurement script using esbuild buildSync + Node.js zlib for gzip/brotli comparison
- Created generate-benchmarks orchestrator that runs vitest bench + bundle size measurement and writes BENCHMARKS.md
- BENCHMARKS.md at repo root contains: bundle size comparison (3 packages), core function performance (3 functions), React adapter overhead (2 hooks), methodology section, and "Generated on" date stamp
- Bundle sizes: ctc 0.99KB brotli, clipboard-copy 0.43KB brotli, copy-to-clipboard 0.88KB brotli
- Core ops/sec: copyToClipboard ~670K, readFromClipboard ~824K, copyRichContent ~17K
- React hook ops/sec: useCopyToClipboard ~1,634, useCopyRichContent ~1,878

## Task Commits

Each task was committed atomically:

1. **Task 1: Create bundle size measurement script** - `3b6f009` (feat)
2. **Task 2: Create generate-benchmarks script and produce BENCHMARKS.md** - `6cc8ada` (feat)

## Files Created

- `benchmarks/scripts/measure-bundle-size.ts` - esbuild + zlib bundle size measurement with SizeResult interface
- `benchmarks/scripts/generate-benchmarks.ts` - Orchestrator: vitest bench + size measurement -> BENCHMARKS.md
- `BENCHMARKS.md` - Published benchmark results at repo root

## Decisions Made

- **sampleCount over samples array:** The vitest bench JSON uses `sampleCount` (number) for the count, while `samples` is an empty array in the output. Used `sampleCount` for accurate sample reporting.
- **Walker-based JSON extraction:** Used a recursive walker to find benchmark entries with `hz`/`mean`/`name` fields, making the parser resilient to vitest version changes in the JSON structure.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - scripts run locally via `pnpm bench:size` and `pnpm bench:generate`.

## Self-Check: PASSED

- All 3 created files exist on disk
- Commit 3b6f009 (Task 1) found in git log
- Commit 6cc8ada (Task 2) found in git log

---
*Phase: 12-benchmarks-ci-hardening*
*Completed: 2026-04-17*
