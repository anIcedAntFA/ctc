---
phase: 12-benchmarks-ci-hardening
plan: 01
subsystem: testing
tags: [vitest, benchmark, clipboard, react, jsdom]

# Dependency graph
requires:
  - phase: 05-react-adapter
    provides: useCopyToClipboard and useCopyRichContent hooks
  - phase: 10-rich-clipboard
    provides: copyRichContent and readRichContent core functions
provides:
  - benchmarks/ workspace with vitest bench infrastructure
  - Core function benchmarks (copyToClipboard, copyRichContent, readFromClipboard)
  - React hook overhead benchmarks (useCopyToClipboard, useCopyRichContent)
  - bench task in turbo.json and root package.json
affects: [12-benchmarks-ci-hardening]

# Tech tracking
tech-stack:
  added: [clipboard-copy, copy-to-clipboard, esbuild, tsx]
  patterns: [vitest-bench-setup-teardown, clipboard-mock-factory]

key-files:
  created:
    - benchmarks/package.json
    - benchmarks/vitest.config.ts
    - benchmarks/tsconfig.json
    - benchmarks/src/helpers/clipboard-mock.ts
    - benchmarks/src/core.bench.ts
    - benchmarks/src/react.bench.ts
  modified:
    - pnpm-workspace.yaml
    - turbo.json
    - package.json
    - .gitignore

key-decisions:
  - "Use bench setup/teardown options instead of beforeEach for jsdom mock compatibility in vitest bench mode"
  - "Competitor packages (clipboard-copy, copy-to-clipboard) as devDeps in private benchmarks package only"

patterns-established:
  - "Vitest bench setup/teardown: In vitest bench mode, window/globalThis inside bench() differs from beforeAll/beforeEach scope. Use bench options setup/teardown for mock installation."
  - "Clipboard mock factory: createClipboardMock/createRichClipboardMock/createReadClipboardMock with mockResolvedValue for bench iterations"

requirements-completed: [BENCH-01, BENCH-03]

# Metrics
duration: 10min
completed: 2026-04-17
---

# Phase 12 Plan 01: Benchmarks Workspace Summary

**Vitest bench infrastructure with 5 benchmarks measuring core clipboard ops/sec and React hook overhead using mocked navigator.clipboard**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-17T03:09:14Z
- **Completed:** 2026-04-17T03:19:01Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Created benchmarks/ workspace package registered in pnpm-workspace.yaml with turbo bench task
- Core benchmarks: copyToClipboard (~877K ops/sec), copyRichContent (~803K ops/sec), readFromClipboard (~823K ops/sec)
- React benchmarks: useCopyToClipboard (~1,625 ops/sec), useCopyRichContent (~1,877 ops/sec) measuring hook render + copy overhead
- All benchmarks use mocked clipboard API -- no real browser needed
- bench-results.json output generated and added to .gitignore

## Task Commits

Each task was committed atomically:

1. **Task 1: Create benchmarks/ workspace package and monorepo wiring** - `de550d0` (chore)
2. **Task 2: Create clipboard mock helper and benchmark files** - `7d78ae0` (feat)

## Files Created/Modified
- `benchmarks/package.json` - Private workspace with vitest bench, competitor devDeps, workspace deps
- `benchmarks/vitest.config.ts` - Vitest bench config with jsdom environment and JSON output
- `benchmarks/tsconfig.json` - Extends tsconfig.base.json for src/ and scripts/
- `benchmarks/src/helpers/clipboard-mock.ts` - 3 mock factories using mockResolvedValue for bench iterations
- `benchmarks/src/core.bench.ts` - 3 core function benchmarks (copyToClipboard, copyRichContent, readFromClipboard)
- `benchmarks/src/react.bench.ts` - 2 React hook overhead benchmarks (useCopyToClipboard, useCopyRichContent)
- `pnpm-workspace.yaml` - Added benchmarks workspace entry
- `turbo.json` - Added bench task with cache:false and ^build dependency
- `package.json` - Added bench script to root
- `.gitignore` - Added bench-results.json

## Decisions Made
- **bench setup/teardown over beforeEach:** Vitest bench mode runs bench functions in a different window/globalThis scope than beforeAll/beforeEach hooks. Object.defineProperty on window.isSecureContext set in beforeEach is not visible inside the bench function. Using the bench options `setup`/`teardown` callbacks runs in the correct scope and properly mocks isSecureContext for the success path.
- **No fake timers in React benchmarks:** vi.useFakeTimers() inside bench setup causes worker timeout crashes. React hook benchmarks run with real timers since the hooks use setTimeout internally for the copied state reset.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed isSecureContext mock not working in vitest bench mode**
- **Found during:** Task 2 (benchmark file creation)
- **Issue:** Plan specified using beforeEach/afterEach for mock install/uninstall, but vitest bench mode runs bench() in a different window/globalThis scope. Object.defineProperty(window, 'isSecureContext', ...) set in beforeEach was invisible inside bench(), causing all core functions to hit the INSECURE_CONTEXT error path instead of the success path.
- **Fix:** Changed from beforeEach/afterEach pattern to using bench options `setup`/`teardown` callbacks, which run in the same scope as the bench function.
- **Files modified:** benchmarks/src/core.bench.ts, benchmarks/src/react.bench.ts
- **Verification:** `pnpm bench` runs with 0 INSECURE_CONTEXT warnings, all 5 benchmarks produce success-path ops/sec
- **Committed in:** 7d78ae0

**2. [Rule 1 - Bug] Removed vi.useFakeTimers from React bench setup**
- **Found during:** Task 2 (benchmark file creation)
- **Issue:** Using vi.useFakeTimers() in React bench setup caused vitest worker timeout and crash ("Worker exited unexpectedly")
- **Fix:** Removed fake timers from React bench setup/teardown -- hooks work correctly with real timers in bench context
- **Files modified:** benchmarks/src/react.bench.ts
- **Verification:** `pnpm bench` completes all 5 benchmarks without worker crashes
- **Committed in:** 7d78ae0

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for benchmarks to measure the intended success path. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Benchmark infrastructure ready for plan 12-02 (CI hardening)
- `pnpm bench` produces JSON output at benchmarks/bench-results.json for future CI integration
- Competitor packages installed as devDeps for comparison benchmarks in future plans

## Self-Check: PASSED

- All 6 created files exist on disk
- Commit de550d0 (Task 1) found in git log
- Commit 7d78ae0 (Task 2) found in git log

---
*Phase: 12-benchmarks-ci-hardening*
*Completed: 2026-04-17*
