---
phase: 13-documentation-positioning-overhaul
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - BENCHMARKS.md
  - CLAUDE.md
  - CONTRIBUTING.md
  - README.md
  - package.json
  - packages/core/package.json
  - packages/react/package.json
  - packages/svelte/package.json
  - packages/vue/package.json
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-04-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Phase 13 overhauled documentation positioning and package metadata across all published packages and root artifacts. Changes include: enriched `description` and `keywords` fields in all five `package.json` files, a new `homepage` field in the root `package.json`, expanded `BENCHMARKS.md` comparison table with API-style and SSR columns, populated `Conventions` and `Architecture` sections in `CLAUDE.md`, a new Benchmarks section in `CONTRIBUTING.md`, and a significantly expanded `README.md` with badges and a "Similar / Related Projects" section.

The documentation quality is high overall. Three warnings were found: a scope bug in the root `lint:fix` script that silently leaves adapter packages unlinted, an export inconsistency in `packages/react` and `packages/vue` where `types` is missing from the `exports` map (unlike `packages/svelte`), and a stale source path in `packages/svelte`'s `./runes` export. Two info items cover minor accuracy and consistency issues.

## Warnings

### WR-01: Root `lint:fix` only runs against `packages/core`, silently skipping all adapters

**File:** `package.json:32`
**Issue:** The `lint:fix` script is scoped to `--filter=./packages/core`, which means `packages/react`, `packages/vue`, and `packages/svelte` are never auto-fixed when a contributor runs `pnpm lint:fix` from the repo root. `CONTRIBUTING.md` (line 140) documents `pnpm lint:fix` as a repo-wide command with no mention of this scope restriction. This creates a silent discrepancy: lint errors in adapter packages will pass `lint:fix` unaddressed.
**Fix:**
```json
"lint:fix": "turbo run lint:fix"
```
This makes `lint:fix` consistent with how `lint`, `build`, and `test` are handled — delegated to Turborepo across all packages.

---

### WR-02: `packages/react` and `packages/vue` exports map missing `types` condition

**File:** `packages/react/package.json:71-77` | `packages/vue/package.json:69-75`
**Issue:** Both packages declare top-level `"types": "./dist/index.d.cts"` but their `exports["."]` map has no `types` condition. The `packages/svelte` package correctly includes `"types": { "import": "./dist/index.d.mts", "require": "./dist/index.d.cts" }` inside its exports map. Without the `types` condition in `exports`, TypeScript in `bundler` or `node16`/`nodenext` resolution mode may resolve types from the top-level `types` field instead of the correct dual-format `.d.mts`/`.d.cts` pair. Tools like `arethetypeswrong` will flag this.
**Fix:** Add `types` to each export condition, mirroring the svelte package pattern:
```json
"exports": {
  ".": {
    "types": {
      "import": "./dist/index.d.mts",
      "require": "./dist/index.d.cts"
    },
    "import": "./dist/index.mjs",
    "require": "./dist/index.cjs"
  },
  "./package.json": "./package.json"
}
```
Apply to both `packages/react/package.json` and `packages/vue/package.json`.

---

### WR-03: `packages/svelte` `./runes` export points to a source `.ts` file under the `svelte` condition

**File:** `packages/svelte/package.json:79-85`
**Issue:** The `./runes` export entry has `"svelte": "./src/runes/index.ts"` — a raw TypeScript source file. The `./stores` export correctly uses `"svelte": "./dist/stores.mjs"`. Publishing a package with a `svelte` condition pointing to `.ts` source means consumers using a Svelte-aware bundler (SvelteKit, Vite + vite-plugin-svelte) will attempt to process raw TypeScript, which may fail depending on their toolchain configuration. The `src/runes` directory is included in `"files"`, confirming this is intentional, but it is inconsistent with the other exports and fragile.
**Fix:** Build the runes entry to `dist/` (like stores) and update the export:
```json
"./runes": {
  "types": {
    "import": "./dist/runes.d.mts",
    "require": "./dist/runes.d.cts"
  },
  "svelte": "./dist/runes.mjs",
  "import": "./dist/runes.mjs",
  "require": "./dist/runes.cjs"
}
```
If keeping the source path is intentional for Svelte runes preprocessing, add a comment in the package explaining the rationale (e.g., in the package README), and verify the behavior is tested in the Svelte playground.

---

## Info

### IN-01: `BENCHMARKS.md` raw bundle size for `@ngockhoi96/ctc` (4.52 KB) is inconsistent with the 1.17 KB gzip claim in `README.md` badges

**File:** `BENCHMARKS.md:9` | `README.md:6`
**Issue:** The Bundle Size badge in `README.md` links to Bundlephobia and shows the live minzipped size. `BENCHMARKS.md` reports 4.52 KB raw / 1.17 KB gzip for the entire package bundle. The `size-limit` threshold in `packages/core/package.json` is 1.5 KB per entry point. The raw 4.52 KB figure covers the full bundle (all exports combined), while per-entry-point sizes are under the 1.5 KB threshold — this is not a bug, but the table has no explanatory note, which could confuse readers comparing this to single-function libraries like `clipboard-copy` (0.93 KB raw). Consider adding a footnote: "Full-bundle raw size; individual entry points are under 1.5 KB gzip per size-limit thresholds."

---

### IN-02: `CONTRIBUTING.md` references `pnpm bench` as orchestrated via Turborepo but root `package.json` `bench` script does not use `turbo run`

**File:** `CONTRIBUTING.md:51` | `package.json:38`
**Issue:** `CONTRIBUTING.md` says "From the repo root, all tasks are orchestrated by Turborepo" and lists `pnpm bench` in that section. However, the root `package.json` `bench` script is `"turbo run bench"`, which is correct. This is actually consistent — the issue is minor: `CONTRIBUTING.md` groups `pnpm bench` under "Running tests" intro text (line 26-35) but documents it in a separate "Benchmarks" section (line 46-66). No action required if the current structure is intentional; otherwise consider moving the `bench` script documentation into its own top-level section separate from "Running tests" to reduce ambiguity.

---

_Reviewed: 2026-04-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
