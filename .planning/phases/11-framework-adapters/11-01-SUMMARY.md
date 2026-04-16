---
phase: 11-framework-adapters
plan: "01"
subsystem: testing
tags: [react, hooks, clipboard, vitest, typescript]

requires:
  - phase: 10-core-rich-clipboard
    provides: copyRichContent function and RichContent type from @ngockhoi96/ctc core

provides:
  - useCopyRichContent React hook with copyRich, copied, error, reset return shape
  - RichContent type re-exported from @ngockhoi96/ctc-react
  - UseCopyRichContentOptions and UseCopyRichContentResult interfaces
  - createRichClipboardMock test helper with ClipboardItem stub and clipboard.write mock
  - 100% branch coverage on use-copy-rich-content.ts

affects:
  - 11-02 (Vue adapter — same pattern for useCopyRichContent composable)
  - 11-03 (Svelte adapter — same pattern for runes/stores/action)
  - release phase (new exports in @ngockhoi96/ctc-react require changeset)

tech-stack:
  added: []
  patterns:
    - React hook wrapping async core function with useState/useRef/useCallback/useEffect
    - ClipboardItem global stub pattern for jsdom-compatible rich clipboard testing
    - Per-file coverage thresholds in vitest.config.ts for new hook files

key-files:
  created:
    - packages/react/src/use-copy-rich-content.ts
    - packages/react/tests/helpers/create-rich-clipboard-mock.ts
    - packages/react/tests/use-copy-rich-content.test.ts
  modified:
    - packages/react/src/index.ts
    - packages/react/vitest.config.ts

key-decisions:
  - "Hook returns { copyRich, copied, error, reset } — copyRich aligns with useCopyToClipboard's copy naming convention (verb-first)"
  - "TypeError thrown (not graceful return false) when content undefined at init+call-site — consistent with React/Svelte pattern, diverges from Vue"
  - "vitest.config.ts updated to add 100% threshold for use-copy-rich-content.ts alongside existing use-copy-to-clipboard.ts threshold"
  - "Biome organizeImports requires alphabetical sort of local module exports — use-copy-rich-content.ts exports sorted before use-copy-to-clipboard.ts in index.ts"

patterns-established:
  - "Rich clipboard mock: use vi.stubGlobal for ClipboardItem class and navigator.clipboard.write; use Object.defineProperty for isSecureContext to preserve jsdom HTMLElement"
  - "Hook test structure: 22 cases across initial-state, happy-path, auto-reset, TypeError, error-handling, reset, unmount-cleanup describe blocks"

requirements-completed: [ADPT-01, ADPT-04, ADPT-05]

duration: 4min
completed: 2026-04-16
---

# Phase 11 Plan 01: useCopyRichContent React Hook Summary

**React useCopyRichContent hook with ClipboardItem-based rich clipboard write, 100% branch coverage via ClipboardItem-stubbed jsdom mock, and RichContent type re-exported from @ngockhoi96/ctc-react**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-16T15:59:43Z
- **Completed:** 2026-04-16T16:03:26Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Implemented `useCopyRichContent` hook mirroring `useCopyToClipboard` with `copyRich(content?: RichContent)` API
- Created `createRichClipboardMock` test helper that stubs `ClipboardItem` global and `navigator.clipboard.write` without breaking jsdom's `HTMLElement` for React DOM
- 36 tests pass across both hooks (22 new + 14 existing), 100% branch coverage enforced via per-file vitest threshold
- Package stays at 954B brotli (well under 2KB limit); publint + attw all green

## Task Commits

1. **Task 1: Implement useCopyRichContent hook and update barrel exports** - `2b195d6` (feat)
2. **Task 2: Create rich clipboard mock helper and comprehensive unit tests** - `e854e44` (test)

**Plan metadata:** (committed below with SUMMARY.md)

## Files Created/Modified

- `packages/react/src/use-copy-rich-content.ts` - Hook implementation: `useCopyRichContent`, `UseCopyRichContentOptions`, `UseCopyRichContentResult`
- `packages/react/src/index.ts` - Added `RichContent` to core re-exports, added new hook exports sorted per Biome organizeImports
- `packages/react/tests/helpers/create-rich-clipboard-mock.ts` - `createRichClipboardMock` factory with `ClipboardItem` stub and `write` spy
- `packages/react/tests/use-copy-rich-content.test.ts` - 22 test cases with full branch coverage
- `packages/react/vitest.config.ts` - Added `src/use-copy-rich-content.ts: { 100: true }` to thresholds

## Decisions Made

- Hook returns `{ copyRich, copied, error, reset }` — `copyRich` chosen as verb matching the `copyRich*` naming family in the core package
- TypeError thrown (not graceful `false` return) when content is undefined at both init and call-site — consistent with React/Svelte convention
- Added vitest per-file coverage threshold for the new hook file alongside the existing one
- Biome's `organizeImports` requires local module exports sorted alphabetically — `use-copy-rich-content.ts` exports appear before `use-copy-to-clipboard.ts` in `index.ts`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Biome organizeImports violation in index.ts**
- **Found during:** Task 1 (lint verification)
- **Issue:** Initial barrel export ordering put `useCopyToClipboard` before `useCopyRichContent`, but Biome's `organizeImports` requires alphabetical sort — lint exited 1
- **Fix:** Reordered local module exports alphabetically (`use-copy-rich-content.ts` before `use-copy-to-clipboard.ts`)
- **Files modified:** `packages/react/src/index.ts`
- **Verification:** `pnpm --filter @ngockhoi96/ctc-react lint` exits 0
- **Committed in:** `2b195d6` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added vitest coverage threshold for new hook**
- **Found during:** Task 2 (post-test verification)
- **Issue:** Plan required 100% branch coverage but `vitest.config.ts` only had threshold for `use-copy-to-clipboard.ts` — new hook would not be enforced
- **Fix:** Added `'src/use-copy-rich-content.ts': { 100: true }` to coverage thresholds
- **Files modified:** `packages/react/vitest.config.ts`
- **Verification:** All tests pass with threshold enforced
- **Committed in:** `e854e44` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both auto-fixes were necessary for lint compliance and coverage enforcement. No scope creep.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## Known Stubs

None — hook wires directly to `copyRichContent` from `@ngockhoi96/ctc`; no placeholder data.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced. Hook delegates all clipboard writes to the core `copyRichContent` function, which was already in the threat model.

## Next Phase Readiness

- `useCopyRichContent` is importable from `@ngockhoi96/ctc-react` and fully tested
- `RichContent` type is re-exported so consumers don't need a separate core import
- Pattern established: `createRichClipboardMock` is the template for Vue and Svelte adapter tests in plans 11-02 and 11-03
- No blockers for next wave agents

---
*Phase: 11-framework-adapters*
*Completed: 2026-04-16*
