---
phase: 13-documentation-positioning-overhaul
fixed_at: 2026-04-17T00:00:00Z
review_path: .planning/phases/13-documentation-positioning-overhaul-update-root-and-package-r/13-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 13: Code Review Fix Report

**Fixed at:** 2026-04-17T00:00:00Z
**Source review:** .planning/phases/13-documentation-positioning-overhaul-update-root-and-package-r/13-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-01: Root `lint:fix` only runs against `packages/core`, silently skipping all adapters

**Files modified:** `package.json`
**Commit:** 05b991c
**Applied fix:** Changed the root `lint:fix` script from `pnpm --filter=./packages/core exec biome check --fix` to `turbo run lint:fix`, making it consistent with `lint`, `build`, and `test` — all delegated to Turborepo across all packages.

---

### WR-02: `packages/react` and `packages/vue` exports map missing `types` condition

**Files modified:** `packages/react/package.json`, `packages/vue/package.json`
**Commit:** cda5669
**Applied fix:** Added a `types` condition with `{ "import": "./dist/index.d.mts", "require": "./dist/index.d.cts" }` inside the `exports["."]` map of both packages, mirroring the pattern already present in `packages/svelte/package.json`. This ensures TypeScript in `bundler`/`node16`/`nodenext` resolution mode resolves dual-format type declarations correctly instead of falling back to the top-level `types` field.

---

### WR-03: `packages/svelte` `./runes` export points to a source `.ts` file under the `svelte` condition

**Files modified:** `packages/svelte/package.json`
**Commit:** 9e11e82
**Applied fix:** Changed the `svelte` condition under `./runes` from `./src/runes/index.ts` to `./dist/runes.mjs` (the built output, consistent with `./stores`). Also removed `src/runes` from the `files` array since shipping raw TypeScript source is no longer needed.

---

_Fixed: 2026-04-17T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
