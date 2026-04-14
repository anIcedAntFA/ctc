---
phase: 07-playgrounds
plan: 01
subsystem: infra
tags: [vite, playwright, pnpm-workspaces, turborepo, biome, vanilla-ts, e2e]

requires:
  - phase: 03-quality-release
    provides: "packages/core Playwright E2E test suite and playwright.config.ts"
provides:
  - "playground/vanilla Vite app as interactive browser fixture and E2E harness"
  - "window.__clipboard synchronously exposed for Playwright waitForFunction"
  - "pnpm workspace + Turbo dev task wired for playground/* members"
  - "biome.json extended to lint playground/*/src/** and config files"
affects:
  - "07-02 (React playground)"
  - "07-03 (Vue playground)"
  - "07-04 (Svelte playground)"

tech-stack:
  added: [vite@8.0.8, typescript@6.0.2 (playground devDep)]
  patterns:
    - "Compound webServer.command: build playground then http-server dist (Pitfall 3 — self-contained, no cross-package Turbo dep)"
    - "Synchronous top-level window.__clipboard assignment before async code (Pitfall 2)"
    - "DOM element creation instead of innerHTML for detection table rows (avoids Biome XSS warning)"
    - "playground/* workspace members with private: true — never published by changesets"

key-files:
  created:
    - playground/vanilla/package.json
    - playground/vanilla/tsconfig.json
    - playground/vanilla/vite.config.ts
    - playground/vanilla/index.html
    - playground/vanilla/src/main.ts
  modified:
    - pnpm-workspace.yaml
    - turbo.json
    - package.json
    - biome.json
    - packages/core/playwright.config.ts
    - packages/core/tests/e2e/clipboard.spec.ts
  deleted:
    - packages/core/tests/e2e/fixtures/index.html

key-decisions:
  - "isClipboardApiSupported import alias in plan mapped to isClipboardSupported (actual export name) — plan used an alias that doesn't exist"
  - "isSecureContext/isReadPermissionGranted/isWritePermissionGranted not exported from @ngockhoi96/ctc public API — used window.isSecureContext browser native for badge, removed permission check rows from detection panel"
  - "Detection panel shows 3 rows: isClipboardSupported(), isClipboardReadSupported(), window.isSecureContext — no async permission checks"

patterns-established:
  - "Playground workspace members follow playground/<name>/src/main.ts entry pattern"
  - "E2E webServer compound command: build playground first, then serve dist (not Turbo cross-package dep)"
  - "biome.json files.includes and overrides must both be updated when adding new playground"

requirements-completed: [PLAY-00, PLAY-01]

duration: 15min
completed: 2026-04-13
---

# Phase 7 Plan 01: Workspace Foundation + Playground/Vanilla Summary

**Vite vanilla-TS playground wired as pnpm workspace member and Playwright E2E fixture, replacing the old static HTML fixture with a built dist served via compound webServer command**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-13T16:00:00Z
- **Completed:** 2026-04-13T16:11:12Z
- **Tasks:** 3
- **Files modified:** 11 (5 created, 6 modified, 1 deleted)

## Accomplishments

- Wired `playground/*` into pnpm workspace + Turbo `dev` task + biome lint coverage
- Scaffolded `playground/vanilla` as a Vite app with `window.__clipboard` synchronously assigned at top of `main.ts`
- Updated `packages/core/playwright.config.ts` to build playground/vanilla then serve dist via compound `webServer.command`; all 18 E2E tests pass (6 skipped as designed for Firefox/WebKit)

## Task Commits

1. **Task 1: Update workspace config files** - `33501d7` (chore)
2. **Task 2: Scaffold playground/vanilla** - `88f5385` (feat)
3. **Task 3: Update Playwright config** - `8bf4366` (feat)

## Files Created/Modified

- `pnpm-workspace.yaml` - Added `playground/*` workspace entry
- `turbo.json` - Added `dev: { cache: false, persistent: true }` task
- `package.json` (root) - Added `dev: "turbo run dev --filter=./playground/*"` script
- `biome.json` - Added `playground/*/src/**` to files.includes and `playground/*/*.config.ts/js` to overrides
- `playground/vanilla/package.json` - Workspace member with `@ngockhoi96/ctc workspace:*` dependency
- `playground/vanilla/tsconfig.json` - Extends base with DOM lib for browser globals
- `playground/vanilla/vite.config.ts` - Vite config with dist outDir
- `playground/vanilla/index.html` - Interactive UI with inline styles, copy section, secure context badge, detection panel
- `playground/vanilla/src/main.ts` - Synchronous `window.__clipboard` assignment + UI wiring
- `packages/core/playwright.config.ts` - webServer compound command: build playground then http-server dist
- `packages/core/tests/e2e/clipboard.spec.ts` - Navigation changed from `/tests/e2e/fixtures/` to `/`
- `packages/core/tests/e2e/fixtures/index.html` - DELETED (superseded by vanilla playground)

## Decisions Made

- Plan referenced `isClipboardApiSupported` as the import name, but the actual export is `isClipboardSupported`. Used the actual name.
- Plan's `main.ts` referenced `isSecureContext`, `isReadPermissionGranted`, `isWritePermissionGranted` from `@ngockhoi96/ctc` — these are not in the public API. Used `window.isSecureContext` (browser native) for the badge. Detection panel simplified to 3 rows: `isClipboardSupported()`, `isClipboardReadSupported()`, `window.isSecureContext`.
- The `window.__clipboard` shape matches the spec exactly: `isClipboardSupported` and `isClipboardReadSupported` (not the aliased names from the plan notes).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected import names from @ngockhoi96/ctc**
- **Found during:** Task 2 (scaffold playground/vanilla)
- **Issue:** Plan's `main.ts` sample used `isClipboardApiSupported`, `isSecureContext`, `isReadPermissionGranted`, `isWritePermissionGranted` as imports — none exist in the public API. Only `isClipboardSupported` and `isClipboardReadSupported` are exported.
- **Fix:** Used `isClipboardSupported` (correct export name). Used `window.isSecureContext` (browser native) for secure context badge. Removed permission check rows from detection panel.
- **Files modified:** `playground/vanilla/src/main.ts`
- **Verification:** `pnpm --filter=@ngockhoi96/playground-vanilla build` exits 0 with no TypeScript errors
- **Committed in:** 88f5385 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - import name mismatch)
**Impact on plan:** Necessary correction — no behavioral change to E2E harness. The `window.__clipboard` shape matches the spec exactly.

## Issues Encountered

None beyond the import name correction above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Foundation ready for Plans 02-04 (React, Vue, Svelte playgrounds)
- Pattern established: add `playground/<name>` workspace member, wire `dev` script, update biome.json
- E2E suite continues to pass unchanged — playground/vanilla is the new fixture

---
*Phase: 07-playgrounds*
*Completed: 2026-04-13*
