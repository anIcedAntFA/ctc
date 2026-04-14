---
phase: 06-svelte-adapter
plan: 01
subsystem: framework-adapters
tags: [svelte, action, custom-events, tsdown, vitest, testing-library-svelte, vite-plugin-svelte]

requires:
  - phase: 05-react-vue-adapters
    provides: "Adapter scaffold template (tsdown + vitest + size-limit + biome) and createClipboardMock test helper pattern"
  - phase: 02-clipboard-core
    provides: "copyToClipboard, BrowserUtilsError, OnErrorCallback peer API consumed via @ngockhoi96/ctc"
provides:
  - "@ngockhoi96/ctc-svelte workspace package (publishable)"
  - "copyAction Svelte action (D-04 through D-11) with bubbling ctc:copy / ctc:error CustomEvents"
  - "Reusable createClipboardMock helper for the Svelte adapter test suite"
  - "Svelte vitest harness (vite-plugin-svelte + svelteTesting plugin)"
affects: [06-02-svelte-stores-runes, 07-playgrounds, 08-release]

tech-stack:
  added:
    - "svelte ^5.55.3 (devDep, peer >=4.0.0)"
    - "@sveltejs/vite-plugin-svelte 7.0.0"
    - "@testing-library/svelte 5.3.1"
  patterns:
    - "Svelte action with ActionReturn { update, destroy } closure (Svelte 4 + 5 compatible)"
    - "Wrapping user onError to dispatch a typed CustomEvent that carries BrowserUtilsError detail (Pitfall 1)"
    - "Bubbling CustomEvents (`ctc:copy`, `ctc:error`) for action state feedback"
    - "TDD: write tests against stub → RED → implement → GREEN with 100% branch coverage"

key-files:
  created:
    - "packages/svelte/package.json"
    - "packages/svelte/tsconfig.json"
    - "packages/svelte/tsconfig.node.json"
    - "packages/svelte/tsdown.config.ts"
    - "packages/svelte/vitest.config.ts"
    - "packages/svelte/src/index.ts"
    - "packages/svelte/src/action/copy-action.ts"
    - "packages/svelte/tests/copy-action.test.ts"
    - "packages/svelte/tests/fixtures/CopyButton.svelte"
    - "packages/svelte/tests/helpers/create-clipboard-mock.ts"
  modified:
    - "biome.json (root) — exclude *.svelte from biome includes"
    - "pnpm-lock.yaml"

key-decisions:
  - "Wrap user onError to dispatch ctc:error from inside the wrapper (eliminates a defensive `else if` branch and yields 100% branch coverage while preserving Pitfall 1 semantics)"
  - "Exclude *.svelte from root biome.json includes — Biome 2.x cannot parse Svelte SFCs and there is no nested biome config per D-27"
  - "Use a tiny CopyButton.svelte fixture mounted via @testing-library/svelte to exercise the real Svelte action lifecycle (so update() actually fires on prop rerender)"

patterns-established:
  - "Svelte adapter scaffold mirrors React/Vue (tsdown + vitest + size-limit + validate)"
  - "Svelte vitest config requires plugins: [svelte(), svelteTesting()] — distinct from React/Vue configs"
  - "Action onError wrapper centralises ctc:error dispatch and forwards to the user callback"

requirements-completed: [ADAPT-03, ADAPT-04, ADAPT-06]

duration: ~5 min
completed: 2026-04-13
---

# Phase 6 Plan 1: Svelte Action — packages/svelte Scaffold + copyAction

**Shipped @ngockhoi96/ctc-svelte scaffold and the copyAction Svelte action with bubbling ctc:copy / ctc:error CustomEvents and 100% branch coverage on the action source.**

## Performance

- **Duration:** ~5 min (298 s wall-clock)
- **Started:** 2026-04-13T08:47:57Z
- **Completed:** 2026-04-13T08:52:55Z
- **Tasks:** 2 (both TDD)
- **Files created:** 10
- **Files modified:** 2

## Accomplishments

- New publishable workspace package `@ngockhoi96/ctc-svelte` registered via `pnpm install` and resolvable across the monorepo
- `copyAction` Svelte action implements D-04 through D-11: click trigger, bubbling `ctc:copy` (success) and `ctc:error` (failure) CustomEvents, reactive `update(params)`, `destroy()` listener removal, fire-and-forget (no internal copied state)
- 9 unit tests via `@testing-library/svelte` + a `CopyButton.svelte` fixture — 100% statement / branch / function / line coverage on `src/action/copy-action.ts`
- tsdown emits `dist/index.{mjs,cjs,d.mts,d.cts}` with `index.mjs` at 0.82 KB gzip (well under the 2 KB size-limit budget per D-26)
- Root barrel (`src/index.ts`) re-exports `copyAction` only — does NOT export `useCopyToClipboard` (D-02), reserving the `/stores` and `/runes` subpaths for plan 02
- Full workspace `pnpm -r lint` and `pnpm -r build` remain green; no regressions in core/react/vue

## Task Commits

1. **Task 1: Scaffold packages/svelte (manifest, tsconfig, build, test config)** — `1efc7e8` (chore)
2. **Task 2: Implement copyAction with custom-event dispatch + unit tests** — `e28e308` (feat, TDD: tests written first against the Task 1 stub, watched fail, then implemented to GREEN)

**Plan metadata:** `<final-commit-hash>` (docs: complete plan)

## Files Created

- `packages/svelte/package.json` — workspace manifest with peerDeps `svelte >=4.0.0` + `@ngockhoi96/ctc workspace:*`, devDeps pinned per RESEARCH.md, size-limit budget 2 KB
- `packages/svelte/tsconfig.json` — extends root base, `include: ["src"]`, mirrors React adapter
- `packages/svelte/tsconfig.node.json` — covers `tsdown.config.ts`
- `packages/svelte/tsdown.config.ts` — single `index` entry, ESM + CJS + .d.cts/.d.mts
- `packages/svelte/vitest.config.ts` — `plugins: [svelte(), svelteTesting()]`, jsdom env, 100% threshold on `src/action/copy-action.ts`
- `packages/svelte/src/index.ts` — root barrel re-exporting `copyAction` and `CopyActionParams` only (D-02)
- `packages/svelte/src/action/copy-action.ts` — `copyAction: Action<HTMLElement, CopyActionParams, CopyActionAttributes>` with closure `current`, click handler that wraps `onError` to dispatch `ctc:error`, success path dispatches `ctc:copy`, returns `{ update, destroy }`
- `packages/svelte/tests/helpers/create-clipboard-mock.ts` — `createClipboardMock()` mirroring React adapter helper (D-22)
- `packages/svelte/tests/fixtures/CopyButton.svelte` — minimal host component using `use:copyAction={{ text, onError }}` so Svelte's mount lifecycle drives the action's `update()` on prop change
- `packages/svelte/tests/copy-action.test.ts` — 9 specs across `initial state`, `click → success`, `click → failure`, `update()`, `destroy()`, and a D-11 shape check

## Files Modified

- `biome.json` (root) — added `!**/*.svelte` to `files.includes` so Biome 2.x stops trying to parse Svelte SFCs (which it cannot)
- `pnpm-lock.yaml` — auto-updated by `pnpm install` after package.json was added

## Decisions Made

- **Refactored Pitfall 1 fix to dispatch `ctc:error` from inside the onError wrapper itself** rather than capturing into a local `capturedError` and dispatching after the await. This eliminates a defensive `else if (capturedError !== null)` branch that was structurally unreachable (because `copyToClipboard` always invokes `onError` before returning `false`) but counted against branch coverage. The wrapping-onError pattern still owns the structured error and forwards it to the user-supplied `onError`, so Pitfall 1's semantics (action carries the BrowserUtilsError into `ctc:error.detail`) are fully preserved — and we hit a clean 100% branch coverage threshold.
- **Excluded `*.svelte` files from root biome.json includes** rather than adding a nested `packages/svelte/biome.json` (D-27 forbids the nested config) or restructuring tests to avoid `.svelte` fixtures. Biome 2.x has no Svelte parser and produced lint/format false-positives on the host fixture; excluding the extension is the minimal-impact fix and still leaves all `.ts` files in `packages/svelte/` covered by the root config.
- **Used a real `CopyButton.svelte` host fixture** (rather than direct DOM-only invocation) so the action mounts through Svelte's component lifecycle and the `update()` test actually exercises Svelte's action update path on `rerender({ text: 'second' })`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Refactored copyAction to keep 100% branch coverage**
- **Found during:** Task 2 (coverage run on the GREEN implementation)
- **Issue:** The plan-suggested implementation (capture error into a local, dispatch from `else if (capturedError !== null)`) yielded 75% branch coverage because the `else if`'s alternate branch is structurally unreachable — `copyToClipboard` always invokes `onError` before returning `false`, so `capturedError` is never `null` when `success === false`. The vitest 100% threshold therefore failed.
- **Fix:** Moved the `node.dispatchEvent(new CustomEvent('ctc:error', ...))` call inside the wrapping `onError` callback itself. The function now has a clean `if (success) { dispatch ctc:copy }` shape with no defensive guard, and Pitfall 1 semantics are preserved (the wrapper still owns the structured error and still forwards to `current.onError?.(err)`).
- **Files modified:** `packages/svelte/src/action/copy-action.ts`
- **Verification:** vitest reports 100% / 100% / 100% / 100% (stmts/branch/funcs/lines) on `copy-action.ts`; all 9 unit tests still pass.
- **Committed in:** `e28e308` (Task 2 commit)
- **Note on acceptance criterion:** the plan's `grep -q "capturedError"` check no longer matches because the variable was eliminated by the refactor. The Pitfall 1 requirement (action wraps user `onError` to dispatch `ctc:error` with the structured error) is still satisfied — the wrapper IS the dispatcher.

**2. [Rule 3 — Blocking] Excluded `*.svelte` from root biome.json includes**
- **Found during:** Task 2 (lint after writing the `CopyButton.svelte` fixture)
- **Issue:** Biome 2.x cannot parse Svelte SFCs. Running `pnpm --filter @ngockhoi96/ctc-svelte lint` failed with formatter and `noUnusedImports` errors on `tests/fixtures/CopyButton.svelte` because Biome saw the script block as a standalone TS file and didn't recognise `use:copyAction` as usage of the imported binding. D-27 forbids a nested `packages/svelte/biome.json`, so the only correct fix was a root-level exclusion.
- **Fix:** Added `"!**/*.svelte"` to `files.includes` in the root `biome.json`. Biome now skips Svelte SFCs across the entire repo while still covering all `.ts` files in `packages/svelte/src/**` and `packages/svelte/tests/**`.
- **Files modified:** `biome.json`
- **Verification:** `pnpm --filter @ngockhoi96/ctc-svelte lint` exits 0; `pnpm -r lint` exits 0 across the whole workspace.
- **Committed in:** `e28e308` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug — coverage gap, 1 blocking — Biome cannot parse Svelte)
**Impact on plan:** Both deviations were necessary to achieve the plan's stated success criteria (100% branch coverage, green lint). No scope creep — both fixes are localised to files already in the plan, plus the documented root `biome.json` tweak.

## Issues Encountered

- vitest run from `pnpm --filter ... test -- --coverage` swallows the `--` flag and never enables coverage. Worked around by running `pnpm exec vitest run --coverage` directly inside `packages/svelte/`. Documented for future plans.
- `vite-plugin-svelte` printed an informational warning about a missing `svelte.config.js` — harmless (it falls back to its default configuration), no action needed for this plan.

## User Setup Required

None — `@ngockhoi96/ctc-svelte` is wired through the workspace and requires no external service configuration. Plan 02 will add the `/stores` and `/runes` subpath exports on top of this scaffold.

## Next Phase Readiness

- Scaffold is ready for **Plan 06-02** to add `src/stores/use-copy-to-clipboard.ts` and `src/runes/use-copy-to-clipboard.svelte.ts` plus their tsdown entries and subpath exports.
- All current tests, types, and bundle budgets are passing on the existing scaffold, so plan 02 starts from a fully green baseline.
- No blockers.

## Self-Check: PASSED

All 10 created files exist on disk and both task commits (`1efc7e8`, `e28e308`) are reachable in git history.

---
*Phase: 06-svelte-adapter*
*Completed: 2026-04-13*
