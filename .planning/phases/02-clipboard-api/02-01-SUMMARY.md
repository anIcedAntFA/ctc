---
phase: 02-clipboard-api
plan: 01
subsystem: clipboard
tags: [typescript, clipboard, browser-detection, error-handling]

# Dependency graph
requires:
  - phase: 01-project-foundation
    provides: src/utils/env.ts with isBrowser() and isSecureContext()
provides:
  - Updated handleError() routing expected errors to console.warn and unexpected to console.error
  - isClipboardSupported() synchronous detection function
  - isClipboardReadSupported() synchronous detection function
affects: [02-clipboard-api, copyToClipboard, readFromClipboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - EXPECTED_ERROR_CODES Set pattern for classifying error severity
    - Synchronous feature detection with guard order (isBrowser -> isSecureContext -> typeof API check)
    - Optional chaining on navigator.clipboard for HTTP safety

key-files:
  created:
    - src/clipboard/detect.ts
  modified:
    - src/utils/errors.ts
    - src/clipboard/index.ts
    - src/index.ts

key-decisions:
  - "EXPECTED_ERROR_CODES is an unexported module-level Set — internal classification, not part of public API"
  - "Detection functions are pure with no side effects — no console.warn/error, no imports from errors.ts"
  - "Guard order in detection: isBrowser() first, isSecureContext() second, typeof clipboard API third"
  - "Optional chaining navigator.clipboard?.writeText handles Chrome setting clipboard=undefined on HTTP"

patterns-established:
  - "Pattern 1: Error routing — EXPECTED_ERROR_CODES.has(code) branches warn vs error"
  - "Pattern 2: Detection guard chain — isBrowser() && isSecureContext() && typeof API check"

requirements-completed: [DETECT-01, DETECT-02, DETECT-03, DETECT-04, ERR-01, ERR-02]

# Metrics
duration: 10min
completed: 2026-04-08
---

# Phase 2 Plan 1: handleError routing and clipboard detection functions

**handleError() updated with warn/error severity routing via EXPECTED_ERROR_CODES Set; isClipboardSupported() and isClipboardReadSupported() added as SSR-safe synchronous detection functions**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-08T17:18:05Z
- **Completed:** 2026-04-08T17:28:05Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Updated `handleError()` to route `CLIPBOARD_NOT_SUPPORTED`, `INSECURE_CONTEXT`, `CLIPBOARD_PERMISSION_DENIED` to `console.warn` and `CLIPBOARD_WRITE_FAILED`, `CLIPBOARD_READ_FAILED` to `console.error` with cause attached
- Created `src/clipboard/detect.ts` with two synchronous, SSR-safe boolean detection functions using proper guard order
- Both detection functions exported from clipboard and root barrel files

## Task Commits

Each task was committed atomically:

1. **Task 1: Update handleError() with expected/unexpected error routing** - `734eb33` (feat)
2. **Task 2: Create detect.ts with isClipboardSupported and isClipboardReadSupported** - `ec74963` (feat)

**Plan metadata:** (docs commit after SUMMARY)

## Files Created/Modified

- `src/utils/errors.ts` - Added EXPECTED_ERROR_CODES Set, updated handleError() to branch warn vs error
- `src/clipboard/detect.ts` - New file with isClipboardSupported() and isClipboardReadSupported()
- `src/clipboard/index.ts` - Added exports for both detection functions
- `src/index.ts` - Added exports for both detection functions

## Decisions Made

- EXPECTED_ERROR_CODES is not exported — it's an internal classification detail, callers don't need to know how errors are routed
- Detection functions import only from `../utils/env.ts` — pure checks with no side effects
- Guard order uses isBrowser() before isSecureContext() for proper short-circuit in SSR environments
- Optional chaining `navigator.clipboard?.writeText` handles Chrome behavior of setting clipboard to undefined on HTTP (even when isBrowser() returns true)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed import order in barrel files to satisfy Biome organize-imports rule**

- **Found during:** Task 2 (detect.ts creation and barrel wiring)
- **Issue:** Biome enforce sorted export order in barrel files; newly added exports were appended at the end out-of-order
- **Fix:** Reordered exports in `src/clipboard/index.ts` and `src/index.ts` to alphabetical order as required by Biome
- **Files modified:** src/clipboard/index.ts, src/index.ts
- **Verification:** `pnpm lint` exits 0 after reorder
- **Committed in:** ec74963 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - import organization)
**Impact on plan:** Minor fixup required by Biome linter. No scope creep.

## Issues Encountered

None beyond the import order auto-fix above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `handleError()` is now ready for use in `copyToClipboard()` and `readFromClipboard()` (Plan 02)
- `isClipboardSupported()` and `isClipboardReadSupported()` are exported and ready for consumers
- `pnpm build`, `pnpm lint`, and SSR safety (`node -e "require('./dist/index.cjs')"`) all pass

---
*Phase: 02-clipboard-api*
*Completed: 2026-04-08*
