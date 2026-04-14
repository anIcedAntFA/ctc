---
phase: 04-monorepo-foundation
plan: "01"
subsystem: infra
tags: [pnpm-workspaces, turborepo, monorepo, tsconfig, biome]

requires:
  - phase: 03-quality-release
    provides: Root package.json, src/, tests/, tsdown/vitest/playwright configs, biome.json, lefthook

provides:
  - pnpm workspace root config (pnpm-workspace.yaml) listing packages/* and playground/*
  - Turborepo pipeline (turbo.json) with build/test/test:e2e/lint/validate/size/typecheck/dev tasks
  - Shared TypeScript base config (tsconfig.base.json) extracted from old root tsconfig
  - Root tsconfig.json slimmed to cover only root config files (extends tsconfig.base.json)
  - packages/core/ as self-contained publishable package (@ngockhoi96/ctc)
  - Root package.json as private workspace root manifest (@ngockhoi96/ctc-monorepo)
  - biome.json updated to cover packages/*/src/** and playground/**

affects:
  - 04-02 (adapter packages depend on packages/core/ being in place)
  - Any phase adding new packages to the monorepo

tech-stack:
  added: [turbo@2.9.6]
  patterns:
    - pnpm workspaces with Turborepo task orchestration
    - Shared tsconfig.base.json extended by per-package tsconfigs
    - Root package.json as private workspace root, packages as publishable packages

key-files:
  created:
    - pnpm-workspace.yaml
    - turbo.json
    - tsconfig.base.json
    - packages/core/package.json
    - packages/core/tsconfig.json
    - packages/core/tsconfig.node.json
  modified:
    - tsconfig.json (root — slimmed to root config files only, added types:node)
    - package.json (root — rewritten as private workspace root manifest)
    - biome.json (files.includes and overrides updated for monorepo paths)
    - .gitignore (added .turbo)

key-decisions:
  - "Root tsconfig.json adds types:node — commitlint.config.ts and other root configs need Node types"
  - "pnpm-workspace.yaml includes playground/* (added by Phase 7 before Phase 4 execution — correct for current state)"
  - "turbo.json has typecheck and dev tasks beyond the 6 in the plan — added by Phase 7 playground work, kept as correct"
  - "tsdown exports:true auto-generates exports map — types field in exports cannot be manually maintained (overwritten on each build)"

patterns-established:
  - "Per-package tsconfig.json extends ../../tsconfig.base.json — all packages follow this pattern"
  - "Per-package tsconfig.node.json extends ./tsconfig.json — covers config files like tsdown.config.ts"
  - "Root package.json is private:true with no publish fields — workspace root never published"

requirements-completed: [MONO-01, MONO-02, MONO-03, MONO-04]

duration: 15min
completed: 2026-04-14
---

# Phase 4, Plan 1: Workspace Scaffold + Core Migration Summary

**pnpm workspaces + Turborepo monorepo with packages/core as the self-contained @ngockhoi96/ctc package, shared tsconfig.base.json, and turbo-orchestrated build/test/lint pipeline**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-14T10:20:00Z
- **Completed:** 2026-04-14T10:35:00Z
- **Tasks:** 4 (verified as already-complete; 1 gap filled)
- **Files modified:** 1 (tsconfig.json — gap fill only)

## Accomplishments

- Verified all plan post-conditions against disk state: pnpm-workspace.yaml, turbo.json (8 tasks), tsconfig.base.json, packages/core/ with all required files, root package.json as private workspace root, biome.json covering packages paths, .gitignore with .turbo, root tsconfig.node.json deleted
- Identified and filled one gap: root `tsconfig.json` was missing `"types": ["node"]` from compilerOptions
- Confirmed `pnpm build`, `pnpm test`, and `pnpm lint` all exit 0 from repo root via Turborepo

## Context: Phase Order Inversion

Phase 7 (playgrounds) was executed before Phase 4 (monorepo foundation). As a result, the entire monorepo scaffold was already in place when this plan ran. This plan's executor role was to audit all post-conditions and fill any genuine gaps rather than perform the original migration work.

Notable additions Phase 7 made beyond the Phase 4 plan spec:
- `pnpm-workspace.yaml` includes `playground/*` (Phase 4 plan specified only `packages/*`)
- `turbo.json` has `typecheck` and `dev` tasks beyond the 6 task plan spec
- `biome.json` covers `playground/**` paths in files.includes and overrides

All are correct for the current repository state and do not violate plan intent.

## Task Commits

Audit and gap-fill committed atomically:

1. **Gap fill: root tsconfig.json types:node** - `a04ad37` (chore)

All other post-conditions were already satisfied by prior Phase 7 execution — no additional commits required.

## Files Created/Modified

- `/home/ngockhoi96/workspace/github.com/anIcedAntFA/ctc/tsconfig.json` - Added `"types": ["node"]` to compilerOptions (gap from plan spec)

All other files listed in plan post-conditions were already correct:
- `pnpm-workspace.yaml` - workspace config listing packages/* and playground/*
- `turbo.json` - all 6 plan tasks present (plus typecheck and dev from Phase 7)
- `tsconfig.base.json` - shared compiler options (strict, ES2020, nodenext)
- `packages/core/package.json` - publishable @ngockhoi96/ctc manifest
- `packages/core/tsconfig.json` - extends ../../tsconfig.base.json
- `packages/core/tsconfig.node.json` - covers packages/core config files
- `packages/core/src/`, `packages/core/tests/`, `packages/core/*.config.ts` - migrated from root
- `package.json` (root) - private workspace root, @ngockhoi96/ctc-monorepo, no publish fields
- `biome.json` - covers packages/*/src/**, playground/**, overrides for config files
- `.gitignore` - .turbo present

## Decisions Made

- The `types:node` gap was a genuine spec miss — root `tsconfig.json` must have Node types for `commitlint.config.ts` and other root Node-environment config files to type-check correctly.
- `pnpm-workspace.yaml` with `playground/*` is intentionally kept — Phase 7 added this and it is correct for the repository as it currently stands.
- `turbo.json` extra tasks (`typecheck`, `dev`) are kept — they were added during Phase 7 for playground dev server support and are non-breaking additions.
- `tsdown exports:true` continues to auto-generate exports map without `types` field — this is established behavior from Phase 1 (STATE.md decision log).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added types:node to root tsconfig.json**
- **Found during:** Post-condition verification
- **Issue:** Plan spec for root `tsconfig.json` included `"types": ["node"]` in compilerOptions; the existing file was missing this field
- **Fix:** Added `"types": ["node"]` to root tsconfig.json compilerOptions
- **Files modified:** `tsconfig.json`
- **Verification:** `pnpm build`, `pnpm test`, `pnpm lint` all exit 0
- **Committed in:** `a04ad37`

---

**Total deviations:** 1 auto-fixed (missing critical — types:node in root tsconfig)
**Impact on plan:** Minimal — single field addition ensuring Node type availability for root config files.

## Issues Encountered

- Phase order inversion (Phase 7 before Phase 4) meant all major structural work was already done. Execution focused on verification and gap-filling rather than migration. No blocking issues encountered.

## Known Stubs

None — packages/core is fully wired with real source code, not placeholder/stub content.

## Next Phase Readiness

- packages/core is a self-contained, buildable, testable package with correct workspace integration
- turbo pipeline orchestrates build/test/lint correctly from repo root
- Ready for Plan 04-02: adapter packages (packages/react, packages/vue, packages/svelte) scaffold

---
*Phase: 04-monorepo-foundation*
*Completed: 2026-04-14*
