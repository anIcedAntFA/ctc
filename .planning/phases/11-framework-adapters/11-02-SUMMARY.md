---
phase: 11-framework-adapters
plan: "02"
subsystem: vue
tags: [vue, clipboard, composable, rich-clipboard, vitest, shallowref]

# Dependency graph
requires:
  - phase: 10-core-rich-clipboard
    provides: copyRichContent function and RichContent type from @ngockhoi96/ctc
  - phase: 05-vue-adapter
    provides: useCopyToClipboard composable pattern and test infrastructure

provides:
  - useCopyRichContent composable in packages/vue/src/use-copy-rich-content.ts
  - createRichClipboardMock test helper in packages/vue/tests/helpers/create-rich-clipboard-mock.ts
  - RichContent type re-exported from @ngockhoi96/ctc-vue barrel

affects: [vue-playground, release, docs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Vue composable follows useCopyToClipboard pattern with shallowRef state"
    - "Rich clipboard mocking uses ClipboardItem stub + navigator.clipboard.write spy"
    - "Vue graceful error pattern: undefined content sets error state, returns false (no TypeError)"

key-files:
  created:
    - packages/vue/src/use-copy-rich-content.ts
    - packages/vue/tests/helpers/create-rich-clipboard-mock.ts
    - packages/vue/tests/use-copy-rich-content.test.ts
  modified:
    - packages/vue/src/index.ts

key-decisions:
  - "Vue uses graceful failure (error state + return false) instead of TypeError for missing content — mirrors useCopyToClipboard D-02 pattern"
  - "copyRich function named distinctly from useCopyToClipboard copy to avoid collision when both composables used together"
  - "RichContent type added to barrel re-exports so vue consumers get complete type surface from single import"

patterns-established:
  - "Rich clipboard mock: vi.stubGlobal ClipboardItem class + navigator.clipboard.write spy + isSecureContext=true"
  - "Vue composable test infrastructure: withSetup() wraps composable in real Vue app for lifecycle hooks"

requirements-completed: [ADPT-02, ADPT-04, ADPT-05]

# Metrics
duration: 12min
completed: 2026-04-16
---

# Phase 11 Plan 02: Vue useCopyRichContent Composable Summary

**useCopyRichContent Vue 3 composable wrapping copyRichContent core with shallowRef state management, auto-reset timer, and Vue-specific graceful error handling for missing content**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-16T23:00:00Z
- **Completed:** 2026-04-16T23:12:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Implemented useCopyRichContent composable with shallowRef state (copied, error), configurable auto-reset timer (default 2000ms, 0 to disable), and onUnmounted lifecycle cleanup
- Created createRichClipboardMock helper that stubs ClipboardItem global, navigator.clipboard.write spy, and isSecureContext=true for test isolation
- Achieved 100% statement, branch, function, and line coverage (20 tests) across all code paths including graceful failure, auto-reset, reset(), timer cancellation, and unmount cleanup
- Updated barrel exports to include RichContent type re-export and all new type/function exports; package passes publint + attw validation and stays at 941 B brotli (under 2KB limit)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement useCopyRichContent composable and update barrel exports** - `1cc5479` (feat)
2. **Task 2: Create rich clipboard mock helper and comprehensive unit tests** - `65408ed` (test)

**Plan metadata:** (committed with SUMMARY.md)

## Files Created/Modified

- `packages/vue/src/use-copy-rich-content.ts` - useCopyRichContent composable with Vue shallowRef state, auto-reset timer, graceful error handling
- `packages/vue/src/index.ts` - Barrel updated with RichContent re-export and useCopyRichContent exports
- `packages/vue/tests/helpers/create-rich-clipboard-mock.ts` - createRichClipboardMock factory for ClipboardItem + write spy
- `packages/vue/tests/use-copy-rich-content.test.ts` - 20 comprehensive unit tests with 100% branch coverage

## Decisions Made

- Vue graceful failure pattern for missing content: sets error.value with CLIPBOARD_NOT_SUPPORTED code, calls onError, returns false — no TypeError thrown. This mirrors the existing useCopyToClipboard D-02 behavior and is consistent across the Vue adapter.
- copyRich named distinctly from copy to avoid naming collision when both composables are used in the same component.
- RichContent type added to barrel re-exports alongside the existing core types so Vue package consumers get the full type surface from a single `@ngockhoi96/ctc-vue` import.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Biome formatter violations in initial implementation**
- **Found during:** Task 1 (lint verification)
- **Issue:** Multi-import type line was not expanded to multi-line format; long message string not wrapped as Biome requires; index.ts export ordering violated alphabetical sort
- **Fix:** Expanded type import block to multi-line, wrapped long string literal, reordered exports in index.ts to satisfy Biome's organizeImports
- **Files modified:** packages/vue/src/use-copy-rich-content.ts, packages/vue/src/index.ts
- **Verification:** `pnpm --filter @ngockhoi96/ctc-vue lint` exits 0 with no errors
- **Committed in:** 1cc5479 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - formatting)
**Impact on plan:** Formatting fix required before lint pass; no functional changes. No scope creep.

## Issues Encountered

None — all tests passed on first run after formatting was corrected.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None — composable delegates to live core function; no hardcoded empty values or placeholders in the implementation.

## Threat Flags

None — no new trust boundaries introduced beyond what the threat model defined (T-11-03, T-11-04 both accepted).

## Next Phase Readiness

- Vue adapter now has both useCopyToClipboard and useCopyRichContent composables with full test coverage
- Package validates cleanly with publint + attw and stays well under 2KB brotli budget
- Ready for playground integration and release phases

---
*Phase: 11-framework-adapters*
*Completed: 2026-04-16*
