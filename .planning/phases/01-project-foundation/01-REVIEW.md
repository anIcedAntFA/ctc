---
phase: 01-project-foundation
reviewed: 2026-04-08T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - biome.json
  - .changeset/config.json
  - commitlint.config.ts
  - .gitignore
  - lefthook.yml
  - LICENSE
  - package.json
  - src/clipboard/index.ts
  - src/clipboard/types.ts
  - src/index.ts
  - src/utils/env.ts
  - src/utils/errors.ts
  - src/utils/types.ts
  - tsconfig.json
  - tsdown.config.ts
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This phase establishes the project foundation: TypeScript config, bundler config, linting, git hooks, and the shared type/utility layer. The code quality is solid overall — strict TypeScript is correctly configured, the error handling contract is well-defined, and the toolchain choices are coherent.

Four warnings were found, all of which affect correctness of the published package or the development workflow in non-obvious ways. Four info items cover API surface and tooling hygiene.

---

## Warnings

### WR-01: `exports` map is missing `types` conditions — TypeScript will not resolve sub-path types correctly

**File:** `package.json:61-70`
**Issue:** The `exports` map does not include a `"types"` condition for either `"."` or `"./clipboard"`. Without it, TypeScript 5+ (`moduleResolution: "bundler"` or `"node16"`) will not find declaration files for consumers who import via these paths. The top-level `"types": "./dist/index.d.cts"` field is the legacy fallback and only covers the root `.` path; it is not consulted for sub-paths. The `typesVersions` workaround for `"clipboard"` is the old approach and does not cover all toolchain configurations.

**Fix:**
```json
"exports": {
  ".": {
    "import": {
      "types": "./dist/index.d.mts",
      "default": "./dist/index.mjs"
    },
    "require": {
      "types": "./dist/index.d.cts",
      "default": "./dist/index.cjs"
    }
  },
  "./clipboard": {
    "import": {
      "types": "./dist/clipboard/index.d.mts",
      "default": "./dist/clipboard/index.mjs"
    },
    "require": {
      "types": "./dist/clipboard/index.d.cts",
      "default": "./dist/clipboard/index.cjs"
    }
  },
  "./package.json": "./package.json"
}
```
Also remove `typesVersions` once `"types"` conditions are in place, as it is superseded. Verify with `attw --pack` after the change.

---

### WR-02: Internal utilities are leaked onto the public API surface

**File:** `src/clipboard/index.ts:1-8`
**Issue:** `createError`, `handleError`, `isBrowser`, and `isSecureContext` are re-exported from the `./clipboard` barrel, and then again from `src/index.ts`. These are internal implementation helpers, not part of the intended public API (the PRD and API design only lists `copyToClipboard`, `readFromClipboard`, `isClipboardSupported`, etc.). Exposing internals via the public entry points:
- Widens the API surface, creating an implicit contract that is hard to break without a semver major bump.
- Forces consumers to see internal helpers in autocomplete and docs.
- Violates the "minimal API surface" design principle stated in the PRD.

**Fix:** Move utility exports behind an internal barrel that is not part of the published `exports` map. Keep `src/utils/` files importable only from within `src/clipboard/` implementation files. Remove `createError`, `handleError`, `isBrowser`, `isSecureContext` from `src/clipboard/index.ts` and `src/index.ts` until a deliberate decision is made to expose them publicly.

```ts
// src/clipboard/index.ts — only export public API types
export type { ClipboardOptions } from './types.ts'
// Add public function exports here when implemented:
// export { copyToClipboard } from './copy.ts'
```

---

### WR-03: `lefthook.yml` `format` command does not write changes — contributors will see false failures

**File:** `lefthook.yml:7-9`
**Issue:** The `format` command runs `pnpm biome format --no-errors-on-unmatched {staged_files}` without `--write`. This prints a diff but does not apply formatting. On a `pre-commit` hook, this means a file with a formatting issue will cause the hook to output a diff and exit non-zero (failing the commit), but the files will not be fixed automatically. Contributors unfamiliar with the setup will be confused because the staged file is not fixed in place, requiring a manual extra step.

This is particularly disruptive when combined with the `parallel: true` directive — both `lint` and `format` run simultaneously, so contributors see two failures for the same file.

**Fix:** Either auto-fix and re-stage, or remove the separate `format` command and rely solely on `biome check` (which covers formatting):
```yaml
# Option A: auto-fix formatting and re-stage
format:
  run: pnpm biome format --write --no-errors-on-unmatched {staged_files} && git add {staged_files}
  glob: "*.{ts,js,json}"

# Option B: remove format command; lint (biome check) already covers formatting
# Just keep the lint command and remove format entirely.
```

---

### WR-04: `biome.json` enables `nursery` recommended rules — unstable rules will break CI on Biome minor upgrades

**File:** `biome.json:20-22`
**Issue:** `"nursery": { "recommended": true }` enables all experimental/unstable linting rules that Biome marks as nursery. These rules can be added, changed, or removed between Biome minor or patch releases. This means a routine `pnpm update @biomejs/biome` could introduce new lint errors in otherwise unchanged code, causing CI to fail unexpectedly.

**Fix:** Remove the blanket nursery recommended block. If specific nursery rules are needed, opt in to them individually so upgrade breakage is explicit and visible:
```json
"nursery": {
  // Only opt into specific nursery rules you deliberately want:
  // "useExplicitType": "error"
}
```
If no nursery rules are needed yet, remove the block entirely.

---

## Info

### IN-01: Top-level `"types"` field points to `.d.cts` — inconsistent with `"type": "module"` library convention

**File:** `package.json:53`
**Issue:** `"types": "./dist/index.d.cts"` points to the CJS declaration file. For a package with `"type": "module"`, the conventional top-level `"types"` would point to the ESM declaration (`.d.mts` or `.d.ts`). This is a minor inconsistency that `attw` will likely flag. Once WR-01 is resolved (adding `"types"` to exports conditions), this field becomes redundant for modern toolchains but should be kept as `.d.ts` or `.d.mts` for the legacy fallback case.

**Fix:** Either remove the field (if the exports map fully covers all toolchains) or change it to the ESM declaration:
```json
"types": "./dist/index.d.mts"
```

---

### IN-02: `tsconfig.json` uses `"module": "nodenext"` for a browser library

**File:** `tsconfig.json:5-6`
**Issue:** `"module": "nodenext"` and `"moduleResolution": "nodenext"` are semantically tied to Node.js runtime module loading. For a browser utility library, `"module": "esnext"` with `"moduleResolution": "bundler"` is more idiomatic and reflects how consumers (Vite, webpack, Rollup) will actually resolve the package. The current setting is not incorrect — it works because `allowImportingTsExtensions` and `noEmit` are set — but it may produce confusing errors if tests or playground code is added under the `tsconfig` scope.

Note: `"include": ["src"]` with `"exclude": ["tests"]` means tests run under a separate config (or vitest's implicit config), which is fine. This is an informational note, not a breaking issue.

**Fix:** Consider switching to bundler-mode resolution for clarity:
```json
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}
```
Verify Biome and tsdown still work correctly after the change.

---

### IN-03: `src/index.ts` main entry point currently exports only infrastructure — no user-facing functions

**File:** `src/index.ts:1-12`
**Issue:** The main package entry (`"."` in exports) currently only exports types and internal utilities. There are no `copyToClipboard`, `isClipboardSupported`, or similar user-facing functions. This is expected for a foundation phase, but it means `publint` and `attw` validation runs will test an entry point that exports nothing useful. Consumers importing from `@browser-utils/core` get only types and internal helpers.

**Fix:** No immediate code change needed — this resolves naturally when clipboard functions are implemented. Track this as a known state: the `"."` entry point will remain sparse until Phase 2 clipboard functions land. When adding the first clipboard function, ensure it is exported from both `src/clipboard/index.ts` and `src/index.ts`.

---

### IN-04: `.changeset/config.json` uses `@changesets/changelog-github` but no GitHub repo is configured in `package.json`

**File:** `.changeset/config.json:3`
**Issue:** The `@changesets/changelog-github` changelog generator requires a GitHub repository to be configured (via `package.json` `"repository"` field or the `GITHUB_TOKEN` environment variable in CI). Without a `"repository"` field in `package.json`, the changelog generator will either fail or produce incomplete changelogs when running locally via `changeset version`.

**Fix:** Add a `"repository"` field to `package.json`:
```json
"repository": {
  "type": "git",
  "url": "https://github.com/your-org/your-repo.git"
}
```
Or switch to `@changesets/changelog-git` for local-friendly changelogs until the GitHub repo is established.

---

_Reviewed: 2026-04-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
