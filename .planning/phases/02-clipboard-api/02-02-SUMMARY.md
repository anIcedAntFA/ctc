---
phase: 02-clipboard-api
plan: 02
subsystem: clipboard
tags: [typescript, clipboard, browser-api, execCommand, error-handling, tree-shaking]

# Dependency graph
requires:
  - phase: 02-clipboard-api
    plan: 01
    provides: handleError() with warn/error routing, isClipboardSupported(), isClipboardReadSupported()
provides:
  - copyToClipboard() async function using modern Clipboard API
  - readFromClipboard() async function using modern Clipboard API
  - copyToClipboardLegacy() sync function using textarea + execCommand
  - Clean public barrel API (5 functions + 4 types, no internal utils)
affects: [03-testing, unit-tests, e2e-tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Guard-first pattern for clipboard operations (isBrowser -> typeof API -> isSecureContext -> try/catch)
    - DOMException NotAllowedError detection for permission errors vs unexpected failures
    - textarea + execCommand copy with setSelectionRange for mobile iOS reliability
    - finally block DOM cleanup to prevent orphaned textarea elements
    - Type-first barrel ordering (export type before value exports) for Biome organize-imports

key-files:
  created:
    - src/clipboard/copy.ts
    - src/clipboard/read.ts
    - src/clipboard/fallback.ts
  modified:
    - src/clipboard/index.ts
    - src/index.ts

key-decisions:
  - "INSECURE_CONTEXT code used for isSecureContext() guard, not CLIPBOARD_NOT_SUPPORTED — distinguishes unsupported API from insecure environment"
  - "copyToClipboardLegacy has no isSecureContext() guard — intentional, its purpose is to work on HTTP where modern API is unavailable"
  - "setSelectionRange(0, text.length) over textarea.select() for iOS Safari mobile selection reliability"
  - "document.body.removeChild(textarea) in finally block — runs even if execCommand throws, prevents DOM leaks"
  - "Biome organize-imports requires type-first export ordering in barrel files — value exports follow type exports"

patterns-established:
  - "Pattern 3: copyToClipboard guard chain — isBrowser() -> typeof navigator.clipboard?.writeText -> isSecureContext() -> try/catch with DOMException check"
  - "Pattern 4: copyToClipboardLegacy — textarea append -> focus -> setSelectionRange -> execCommand -> removeChild in finally"
  - "Pattern 5: DOMException handling — instanceof DOMException && error.name === 'NotAllowedError' for permission errors"

requirements-completed: [CLIP-01, CLIP-02, CLIP-03, DETECT-03, ERR-01, ERR-02]

# Metrics
duration: 15min
completed: 2026-04-09
---

# Phase 2 Plan 2: Core clipboard operation functions and public API cleanup

**copyToClipboard, readFromClipboard, and copyToClipboardLegacy implemented with guard-first pattern; barrel files cleaned to expose 5 public functions + 4 types and remove all internal utils**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-09T00:00:00Z
- **Completed:** 2026-04-09T00:15:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Implemented `copyToClipboard()` with full guard-first pattern: isBrowser check, API typeof check, secure context check, then try/catch that correctly distinguishes NotAllowedError (permission) from other DOMExceptions (unexpected failure)
- Implemented `readFromClipboard()` with identical guard-first pattern returning `string | null`
- Implemented `copyToClipboardLegacy()` using textarea + execCommand with iOS-safe `setSelectionRange`, no secure context guard, DOM cleanup in `finally`
- Cleaned both barrel files to export exactly 5 functions + 4 public types with no internal utils leaking

## Task Commits

Each task was committed atomically:

1. **Task 1: Create copy.ts and read.ts** - `a0a5b5d` (feat)
2. **Task 2: Create fallback.ts with copyToClipboardLegacy** - `321a397` (feat)
3. **Task 3: Clean barrel files — remove internal utils, add all public exports** - `46eca98` (feat)

**Plan metadata:** (docs commit after SUMMARY)

## Files Created/Modified

- `src/clipboard/copy.ts` - async copyToClipboard with guard-first pattern, Promise<boolean>
- `src/clipboard/read.ts` - async readFromClipboard with guard-first pattern, Promise<string | null>
- `src/clipboard/fallback.ts` - sync copyToClipboardLegacy via textarea+execCommand, boolean return
- `src/clipboard/index.ts` - cleaned barrel: 5 functions + 4 types, internal utils removed
- `src/index.ts` - cleaned root barrel: re-exports from ./clipboard/index.ts only

## Decisions Made

- `INSECURE_CONTEXT` error code used for the `isSecureContext()` guard in copy.ts and read.ts — differentiates "API not present" from "insecure environment" as documented in RESEARCH.md Pitfall 1
- `copyToClipboardLegacy` intentionally omits the `isSecureContext()` guard — this is the fallback specifically for HTTP pages where the modern API is unavailable
- `setSelectionRange(0, text.length)` used instead of `textarea.select()` for reliable text selection on iOS Safari mobile browsers
- `document.body.removeChild(textarea)` placed in `finally` block to guarantee DOM cleanup even if execCommand throws

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Biome formatter split long createError() call arguments to separate lines**

- **Found during:** Task 1 (copy.ts and read.ts creation)
- **Issue:** Biome print-width rule required long `createError('INSECURE_CONTEXT', '...')` single-line calls to be reformatted with each argument on its own line
- **Fix:** Ran `pnpm lint:fix` to apply Biome's auto-format before committing
- **Files modified:** src/clipboard/copy.ts, src/clipboard/read.ts
- **Verification:** `pnpm lint` exits 0 after fix
- **Committed in:** a0a5b5d (Task 1 commit)

**2. [Rule 3 - Blocking] Biome organize-imports requires type-first ordering in barrel files**

- **Found during:** Task 3 (barrel file cleanup)
- **Issue:** Biome's organize-imports rule requires `export type { ... }` blocks to appear before value `export { ... }` blocks when from the same source. The plan template had value exports first.
- **Fix:** Ran `pnpm lint:fix` to reorder exports — type exports now come first
- **Files modified:** src/clipboard/index.ts, src/index.ts
- **Verification:** `pnpm lint` exits 0 after fix
- **Committed in:** 46eca98 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — blocking format/lint requirements)
**Impact on plan:** Both auto-fixes are required by Biome conventions established in Phase 1. No scope creep, no functional changes.

## Issues Encountered

None beyond the Biome formatting auto-fixes above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full public clipboard API is now available: `copyToClipboard`, `readFromClipboard`, `copyToClipboardLegacy`, `isClipboardSupported`, `isClipboardReadSupported`
- All functions accept optional `ClipboardOptions` with typed `onError` callback
- Internal utils (`isBrowser`, `isSecureContext`, `createError`, `handleError`) are properly scoped — not exported from public API
- `pnpm build`, `pnpm lint`, `pnpm validate`, `pnpm size` all pass
- Bundle size: 125B brotli (root), 145B brotli (clipboard entry) — well under 1KB target
- Ready for Phase 3: unit tests (Vitest) and E2E tests (Playwright)

---
*Phase: 02-clipboard-api*
*Completed: 2026-04-09*
