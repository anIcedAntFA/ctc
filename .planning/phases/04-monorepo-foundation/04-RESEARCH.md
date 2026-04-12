# Phase 4: Monorepo Foundation - Research

**Researched:** 2026-04-13
**Domain:** pnpm workspaces + Turborepo + brownfield single-package migration
**Confidence:** HIGH (stack is stable, findings verified via official docs and npm registry)

---

## Summary

This is a brownfield migration of a working single-package TypeScript library (`@ngockhoi96/ctc`) into a pnpm workspaces + Turborepo monorepo. The library moves to `packages/core/` but continues publishing as `@ngockhoi96/ctc` — the npm package name is set in `package.json`, not the directory name.

The migration is largely mechanical: add `pnpm-workspace.yaml`, `turbo.json`, extract the root `tsconfig.json` into a `tsconfig.base.json`, update CI to use `pnpm turbo run`, and adjust the `biome.json` includes glob to cover `packages/**`. No library code changes are needed. Changesets does not need a mode flag — independent versioning is the default.

The one significant decision is whether to use tsdown's built-in `--workspace` mode (runs tsdown from the root across all packages) or the Turborepo-idiomatic pattern (run `pnpm build` inside each package, orchestrated by `turbo run build`). The Turborepo-idiomatic pattern is recommended because it keeps caching per-package and avoids tsdown workspace pitfalls reported in monorepos.

**Primary recommendation:** Run tsdown per-package via `packages/core/package.json` scripts, orchestrated by Turborepo. Do not use tsdown's `--workspace` flag. Keep a single root `biome.json` with updated `files.includes` to cover `packages/**`.

---

## Project Constraints (from CLAUDE.md)

- NEVER add runtime dependencies to `package.json`
- Named exports only — no default exports
- Zero dependencies — only browser native APIs
- Bundle size < 1KB gzip for core clipboard module
- ALWAYS verify tree-shaking after adding new exports (`pnpm build && pnpm size`)
- `tsconfig.json` covers `src/` only; `tsconfig.node.json` covers config files
- Conventional commits: `feat/fix/chore/docs/test/ci(scope): description`
- Run `pnpm lint && pnpm test && pnpm build` before any commit
- Never commit to main directly

---

## Research Findings by Question

### Q1: tsdown in monorepo — does `exports:true` still work from `packages/core`?

**Conclusion:** Yes, with no changes needed. [VERIFIED: tsdown.dev/options/package-exports]

`exports: true` in `tsdown.config.ts` tells tsdown to auto-analyze entry points and update the collocated `package.json` with `exports`, `main`, `module`, and `types` fields. It resolves paths relative to the `package.json` it finds alongside the config file. Since `packages/core/tsdown.config.ts` sits next to `packages/core/package.json`, it writes to the correct file.

The current `tsdown.config.ts` (with explicit `exports: true`, two entry points, `format: ['esm', 'cjs']`, `dts: true`) can be moved to `packages/core/` unchanged.

**tsdown workspace mode vs. Turborepo:** tsdown has a `--workspace` flag (`-W`) that can build all packages from the root, but there is a known issue (#544 on GitHub) where internal `workspace:*` dependencies are not bundled as expected when using this mode. [VERIFIED: github.com/rolldown/tsdown/issues/544] For this project, there are no internal workspace deps to worry about (core has zero dependencies), but the Turborepo-idiomatic approach (each package runs its own `pnpm build` → tsdown) is cleaner and provides per-package caching.

**devExports / publishConfig:** `exports: true` without `exports.devExports` does NOT write to `publishConfig`. It directly updates the `exports` field in `package.json`. The `publishConfig` behavior only activates when `devExports` is enabled. Since the project's `package.json` already has a hand-crafted `exports` map that matches what tsdown generates, `exports: true` will confirm or regenerate it on build — this is safe. [VERIFIED: tsdown.dev/options/package-exports]

**Package name:** `packages/core/package.json` must keep `"name": "@ngockhoi96/ctc"` — the directory name is irrelevant to npm.

---

### Q2: Turborepo `turbo.json` configuration for this library

**Conclusion:** Simple task graph; no remote caching needed for a library with one package. [VERIFIED: turborepo.dev/repo/docs/reference/configuration, turborepo.dev/repo/docs/crafting-your-repository/configuring-tasks]

**Recommended `turbo.json`:**

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsdown.config.ts", "tsconfig.json", "package.json"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "tests/unit/**", "vitest.config.*", "package.json"],
      "outputs": []
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "inputs": ["tests/e2e/**", "playwright.config.*", "package.json"],
      "outputs": [],
      "cache": false
    },
    "lint": {
      "inputs": ["src/**", "tests/**", "biome.json"],
      "outputs": []
    },
    "validate": {
      "dependsOn": ["build"],
      "inputs": ["dist/**", "package.json"],
      "outputs": []
    },
    "size": {
      "dependsOn": ["build"],
      "inputs": ["dist/**", "package.json"],
      "outputs": []
    }
  }
}
```

**Key design decisions:**

- `build.dependsOn: ["^build"]` — means "build all workspace dependencies first." With only one package, this is a no-op but correct for future packages.
- `test.dependsOn: ["build"]` — unit tests import from `src/` directly (Vitest resolves TypeScript), so build is NOT strictly required for unit tests. However, `validate` (publint + attw) requires `dist/`. Keeping `dependsOn: ["build"]` for `test` is optional; remove it if unit test speed matters.
- `test:e2e.cache: false` — E2E tests hit real browsers; do not cache. [VERIFIED: turborepo.dev docs — persistent/side-effectful tasks should not be cached]
- `lint.outputs: []` — linting produces no files to cache; Turborepo will still cache the exit code (lint result) based on inputs.
- Vitest does not produce `dist/` — correct to have `outputs: []` for test tasks. If `--coverage` is run, add `"outputs": ["coverage/**"]`.

**Why NOT `outputs: ["dist/**", ".next/**"]` etc.:** Only the `build` task needs file output caching. Tests and lint cache only their exit codes.

---

### Q3: Biome 2.x in monorepo

**Conclusion:** Single root `biome.json` is correct; update `files.includes` to cover `packages/**`. [VERIFIED: biomejs.dev/guides/big-projects]

Biome 2.x supports nested `biome.json` files with `"extends": "//"` syntax, where `//` means "extend from the root config." However, for this project there is no reason to add per-package configs — the current root `biome.json` already has the correct rules, and `packages/core/src/**` will follow the same standards.

**Required change:** Update the `files.includes` array in the root `biome.json` from:

```json
"files": {
  "includes": [
    "src/**",
    "*.config.ts",
    "*.config.js",
    "*.json",
    "!!**/dist/",
    "!!**/node_modules/",
    "!!**/.changeset/"
  ]
}
```

To:

```json
"files": {
  "includes": [
    "src/**",
    "packages/*/src/**",
    "packages/*/tests/**",
    "*.config.ts",
    "*.config.js",
    "packages/*/*.config.ts",
    "packages/*/*.config.js",
    "*.json",
    "packages/*/*.json",
    "!!**/dist/",
    "!!**/node_modules/",
    "!!**/.changeset/"
  ]
}
```

**Running from root:** `pnpm biome check` from the repo root will traverse all matched paths. This is how the current `lefthook.yml` runs it. No change to the biome invocation is needed — only the `includes` patterns.

**Note:** The current `biome.json` has `"root": true`. Keep this. Per-package `biome.json` files would set `"root": false` with `"extends": "//"`, but they are not needed here.

---

### Q4: TypeScript tsconfig structure

**Conclusion:** Extract shared options into `tsconfig.base.json` at root; each package extends it. Turborepo explicitly discourages TypeScript Project References. [VERIFIED: turborepo.dev/docs/guides/tools/typescript]

**Root `tsconfig.base.json`** (new file):

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "isolatedDeclarations": true,
    "declaration": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

This is identical to the current `tsconfig.json` but without `include`/`exclude` (those are package-specific).

**`packages/core/tsconfig.json`** (replaces current root `tsconfig.json`):

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {},
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**`packages/core/tsconfig.node.json`** (replaces current root `tsconfig.node.json`):

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["node"],
    "noEmit": true,
    "isolatedDeclarations": false,
    "declaration": false
  },
  "include": ["*.config.ts", "commitlint.config.ts"]
}
```

**Root `tsconfig.json`** (kept at root for tools that expect it — tsc, editors):

The Turborepo docs say "you likely don't need a root tsconfig.json." However, `lefthook.yml` runs `pnpm tsc --noEmit` from the root. Options:
- Keep a minimal root `tsconfig.json` that includes the config files at root level (for `commitlint.config.ts` etc.).
- Or run tsc with `--project` flag pointing to the package tsconfig.

Recommended: Keep a thin root `tsconfig.json` extending `tsconfig.base.json` for root-level config files only:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "types": ["node"],
    "noEmit": true,
    "isolatedDeclarations": false,
    "declaration": false
  },
  "include": ["*.config.ts", "commitlint.config.ts"]
}
```

Then remove the current `tsconfig.node.json` from root (it becomes `packages/core/tsconfig.node.json`).

**No TypeScript Project References:** Turborepo explicitly says they "introduce another point of configuration as well as another caching layer" and are unnecessary when using Turborepo's task orchestration. Do not add `composite: true` or `references`. [VERIFIED: turborepo.dev/docs/guides/tools/typescript]

---

### Q5: Changesets for monorepo with independent versioning

**Conclusion:** Changesets uses independent versioning by default — no mode flag exists. Minor config adjustment needed. [VERIFIED: github.com/changesets/changesets/blob/main/docs/config-file-options.md]

**What "independent versioning" means in changesets:** Each package in the monorepo gets its own version bump independently. This is the default behavior. The `fixed` and `linked` arrays constrain this to shared versioning. Since both arrays are currently empty, the existing config already does independent versioning.

**Current `.changeset/config.json`** is almost correct for monorepo use. No changes strictly needed. The `access: "public"` is correct for scoped packages published to npm.

For a monorepo with private packages (e.g., playgrounds, docs), add them to `ignore`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "anIcedAntFA/ctc" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "master",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

**If playground packages are added later** (private, non-published), add them to `ignore`:

```json
"ignore": ["@ngockhoi96/playground-react"]
```

**`@changesets/changelog-github`** continues to work unchanged. It reads the `repo` field and generates PR links. [VERIFIED: npm registry shows @changesets/changelog-github@0.6.0 is current]

**`pnpm-workspace.yaml`** (new file at root):

```yaml
packages:
  - "packages/*"
```

If playgrounds are added later:

```yaml
packages:
  - "packages/*"
  - "playgrounds/*"
```

**Release workflow change:** The `changesets/action` in `release.yml` uses `pnpm changeset publish` which publishes all non-ignored packages. For a single publishable package this is identical to the current behavior. No CI change needed for changesets itself.

---

### Q6: CI workflow update for Turborepo

**Conclusion:** Minimal changes. Replace direct script calls with `pnpm turbo run`. The matrix strategy for unit tests can stay. [VERIFIED: turborepo.dev/docs/guides/ci-vendors/github-actions]

**Key insight for this project:** With only `packages/core` as the single workspace package, Turborepo's task orchestration in CI is primarily used for:
1. Caching (avoids rebuilding if inputs unchanged)
2. Correct task ordering (lint before build, build before e2e)

**Recommended CI changes:**

Replace in `lint-and-build` job:
```yaml
- name: Lint
  run: pnpm lint          # becomes: pnpm turbo run lint
- name: Build
  run: pnpm build         # becomes: pnpm turbo run build
```

Replace in `unit-test` job:
```yaml
- name: Unit tests with coverage
  run: pnpm test -- --coverage    # becomes: pnpm turbo run test -- --coverage
- name: Validate package
  run: pnpm validate              # becomes: pnpm turbo run validate
```

Replace in `e2e-test` job:
```yaml
- name: Build (needed for E2E)
  run: pnpm build          # becomes: pnpm turbo run build (Turbo caches it)
- name: E2E tests
  run: pnpm test:e2e       # stays as pnpm test:e2e OR pnpm turbo run test:e2e
```

**`--filter` flag:** Not needed here because the root `package.json` scripts become thin wrappers delegating to `turbo run`. Only use `--filter=./packages/core` if you need to scope turbo to a specific package. With one publishable package, this is unnecessary.

**Turbo + coverage flag:** `pnpm turbo run test -- --coverage` passes `--coverage` to the underlying `vitest run` command. This works. [ASSUMED — turbo passthrough args; standard documented behavior]

**`.turbo` in gitignore:** Must add `.turbo` to `.gitignore` to exclude Turborepo's local cache directory. [VERIFIED: turborepo.dev/repo/docs/getting-started/add-to-existing-repository]

**Root `package.json` scripts** should be updated to delegate to turbo:

```json
"scripts": {
  "build": "turbo run build",
  "lint": "turbo run lint",
  "test": "turbo run test",
  "test:e2e": "turbo run test:e2e",
  "validate": "turbo run validate",
  "size": "turbo run size",
  "changeset": "changeset",
  "setup": "lefthook install"
}
```

The `format` and `lint:fix` scripts cannot be usefully orchestrated by Turbo (they mutate files); run them directly: `pnpm --filter=./packages/core exec biome check --fix` or keep as a root-level alias.

---

### Q7: Lefthook in monorepo

**Conclusion:** Lefthook runs from the git root and needs no structural changes. Minor adjustments for changed working paths. [VERIFIED: lefthook.dev/configuration, github.com/evilmartians/lefthook discussions #852]

Lefthook installs hooks at the git root (`.git/hooks/`). In a monorepo, `lefthook.yml` remains at the repo root and hooks continue to fire on every git operation, repo-wide. The `{staged_files}` token still filters to changed files.

**Changes needed:**

1. The `typecheck` command currently runs `pnpm tsc --noEmit` from root. In the monorepo, this should reference the correct tsconfig:
   ```yaml
   typecheck:
     run: pnpm tsc --noEmit --project tsconfig.json
   ```
   This will check root config files. Package-level typechecking:
   ```yaml
   typecheck:
     run: pnpm turbo run typecheck
   ```
   Requires adding a `typecheck` script to `packages/core/package.json` → `tsc --noEmit`.

2. The `build` pre-push hook currently runs `pnpm build`. Update to:
   ```yaml
   build:
     run: pnpm turbo run build
   ```

3. The `test` pre-push hook currently runs `pnpm test`. Update to:
   ```yaml
   test:
     run: pnpm turbo run test
   ```

4. `validate` in pre-push: Update to `pnpm turbo run validate`.

5. The lint/format pre-commit hooks pass `{staged_files}` directly to biome. This pattern continues to work from the root — biome resolves from the file's location upward to find `biome.json`.

**pnpm workspace compatibility note:** The search results indicate that for pnpm workspaces, `pnpm.onlyBuiltDependencies` may need `lefthook` added to ensure the `postinstall` script runs. Verify this if `pnpm install` stops auto-installing hooks. [MEDIUM confidence — observed in community reports, not in official lefthook docs]

---

### Q8: npm package name preservation

**Conclusion:** The npm package name is defined in `packages/core/package.json` as `"name": "@ngockhoi96/ctc"`. The directory name `packages/core` is irrelevant to npm. [VERIFIED: npm registry semantics]

No changes needed to the published package identity:
- Package name stays `@ngockhoi96/ctc`
- Version stays at whatever the current version is (migrated from root `package.json`)
- `"files": ["dist"]` stays unchanged — npm publishes only `dist/`
- `"repository"` field stays unchanged
- OIDC trusted publishing config on npmjs.com is keyed to the package name + workflow file name, not the directory

The root `package.json` becomes a workspace root manifest. It should:
- Be marked `"private": true` to prevent accidental root publish
- Have no `"name"` with scoped publishing, or use a distinct name like `"@ngockhoi96/ctc-monorepo"` with `"private": true`
- Remove `"files"`, `"exports"`, `"main"`, `"module"`, `"types"`, `"typesVersions"`, `"size-limit"` — these move to `packages/core/package.json`
- Keep `"devDependencies"` for root-level tools (turbo, biome, lefthook, changesets, commitlint)
- Keep `"scripts"` for turbo-delegating commands

---

## Standard Stack

### Core Tools to Add

| Tool | Version | Purpose | Source |
|------|---------|---------|--------|
| turbo | 2.9.6 | Task orchestration and caching | [VERIFIED: npm registry] |
| pnpm workspaces | built-in (pnpm 10.29.3) | Multi-package management | [VERIFIED: pnpm.io] |

### Already Present (Move to Root devDeps)

| Tool | Version | Current Location | Notes |
|------|---------|-----------------|-------|
| @biomejs/biome | 2.4.10 | root devDeps | stays at root |
| lefthook | 2.1.5 | root devDeps | stays at root |
| @changesets/cli | 2.30.0 | root devDeps | stays at root |
| @changesets/changelog-github | 0.6.0 | root devDeps | stays at root |
| @commitlint/cli | 20.5.0 | root devDeps | stays at root |
| @commitlint/config-conventional | 20.5.0 | root devDeps | stays at root |

### Stays in `packages/core/devDependencies`

| Tool | Version | Purpose |
|------|---------|---------|
| tsdown | 0.21.7 | Library bundler |
| typescript | 6.0.2 | Type checker |
| vitest | 4.1.3 | Unit tests |
| @vitest/coverage-v8 | 4.1.3 | Coverage |
| @playwright/test | ^1.59.1 | E2E tests |
| publint | 0.3.18 | Package validation |
| @arethetypeswrong/cli | 0.18.2 | Types validation |
| size-limit | 12.0.1 | Bundle size check |
| @size-limit/file | 12.0.1 | Bundle size check |
| http-server | ^14.1.1 | E2E test server |
| @types/node | ^25.6.0 | Node types for config files |

**Installation (root):**
```bash
pnpm add -Dw turbo
```

---

## Architecture Patterns

### Recommended Directory Structure

```
ctc/                          # repo root
├── package.json              # private:true, root scripts delegating to turbo
├── pnpm-workspace.yaml       # packages: ["packages/*"]
├── turbo.json                # task pipeline
├── tsconfig.base.json        # shared compiler options (extracted from current tsconfig.json)
├── tsconfig.json             # root-level only (commitlint.config.ts etc.)
├── biome.json                # updated includes to cover packages/**
├── lefthook.yml              # updated script calls to turbo
├── .changeset/
│   └── config.json           # unchanged (already correct for monorepo)
├── .github/
│   └── workflows/
│       ├── ci.yml            # updated to pnpm turbo run
│       └── release.yml       # unchanged (changesets/action works as-is)
└── packages/
    └── core/                 # was: src/, tests/, tsdown.config.ts at root
        ├── package.json      # @ngockhoi96/ctc — moved from root
        ├── tsconfig.json     # extends ../../tsconfig.base.json
        ├── tsconfig.node.json
        ├── tsdown.config.ts  # moved unchanged from root
        ├── vitest.config.ts  # moved from root
        ├── playwright.config.ts  # moved from root
        ├── src/
        │   ├── clipboard/
        │   └── index.ts
        ├── tests/
        │   ├── unit/
        │   └── e2e/
        └── dist/             # build output (gitignored)
```

### Root `package.json` Pattern

```json
{
  "name": "@ngockhoi96/ctc-monorepo",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "packageManager": "pnpm@10.29.3",
  "scripts": {
    "build": "turbo run build",
    "lint": "turbo run lint",
    "lint:fix": "pnpm --filter=./packages/core exec biome check --fix",
    "format": "pnpm --filter=./packages/core exec biome format --write",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "validate": "turbo run validate",
    "size": "turbo run size",
    "changeset": "changeset",
    "setup": "lefthook install"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.10",
    "@changesets/changelog-github": "0.6.0",
    "@changesets/cli": "2.30.0",
    "@commitlint/cli": "20.5.0",
    "@commitlint/config-conventional": "20.5.0",
    "lefthook": "2.1.5",
    "turbo": "2.9.6"
  }
}
```

### `packages/core/package.json` Pattern

```json
{
  "name": "@ngockhoi96/ctc",
  "version": "0.2.1",
  "license": "MIT",
  "type": "module",
  "private": false,
  "description": "Modular, tree-shakeable browser utilities library",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/anIcedAntFA/ctc.git"
  },
  "sideEffects": false,
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "tsdown",
    "lint": "biome check",
    "lint:fix": "biome check --fix",
    "format": "biome format --write",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit",
    "size": "size-limit",
    "validate": "publint && attw --pack"
  },
  "files": ["dist"],
  "size-limit": [
    { "path": "dist/index.mjs", "limit": "1 KB" },
    { "path": "dist/clipboard/index.mjs", "limit": "1 KB" }
  ],
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.cts",
  "typesVersions": {
    "*": { "clipboard": ["./dist/clipboard/index.d.cts"] }
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./clipboard": {
      "types": "./dist/clipboard/index.d.ts",
      "import": "./dist/clipboard/index.mjs",
      "require": "./dist/clipboard/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "devDependencies": {
    "@arethetypeswrong/cli": "0.18.2",
    "@playwright/test": "^1.59.1",
    "@size-limit/file": "12.0.1",
    "@types/node": "^25.6.0",
    "@vitest/coverage-v8": "4.1.3",
    "http-server": "^14.1.1",
    "publint": "0.3.18",
    "size-limit": "12.0.1",
    "tsdown": "0.21.7",
    "typescript": "6.0.2",
    "vitest": "4.1.3"
  }
}
```

---

## Common Pitfalls

### Pitfall 1: Root `package.json` not marked `private: true`
**What goes wrong:** Running `pnpm changeset publish` or `npm publish` at root publishes the workspace root manifest as a package to npm.
**Why it happens:** Changesets publishes all non-ignored packages with `access: "public"`. If root has no `"private": true`, it gets published.
**How to avoid:** Add `"private": true` to root `package.json` immediately.
**Warning signs:** Changesets lists the root manifest as a package to be released.

### Pitfall 2: Config files left at root without updating `tsconfig.node.json`
**What goes wrong:** `tsdown.config.ts`, `vitest.config.ts`, `playwright.config.ts` move to `packages/core/` but references in root `tsconfig.node.json` still point to root. `tsc --noEmit` fails on root-level check.
**Why it happens:** Root `tsconfig.node.json` `include` still has `["*.config.ts"]`.
**How to avoid:** After moving config files, ensure the root `tsconfig.json` only includes what actually stays at root (`commitlint.config.ts`).

### Pitfall 3: Biome `files.includes` not updated — packages/core skipped
**What goes wrong:** `pnpm lint` reports no errors on files in `packages/core/src/` because biome ignores paths not in its `includes`.
**Why it happens:** Current `biome.json` only includes `src/**`. After moving source to `packages/core/src/`, biome silently skips it.
**How to avoid:** Update `files.includes` to add `packages/*/src/**` before running any lint.
**Warning signs:** `pnpm lint` exits 0 with 0 files checked.

### Pitfall 4: Playwright config references wrong paths after move
**What goes wrong:** E2E tests fail to find fixtures or the `dist/` directory because `playwright.config.ts` uses relative paths resolved from the root.
**Why it happens:** `playwright.config.ts` moves to `packages/core/` but retains paths like `./dist` which now resolve from `packages/core/` (which is correct) — but the CI `pnpm test:e2e` still runs from root.
**How to avoid:** Update CI `e2e-test` job to run `pnpm --filter=@ngockhoi96/ctc test:e2e` or use `turbo run test:e2e`. Verify `webServer.command` in playwright config points to the correct serve path.
**Warning signs:** Playwright cannot find `dist/index.mjs` during E2E server startup.

### Pitfall 5: `pnpm install --frozen-lockfile` fails after workspace restructure
**What goes wrong:** CI fails at install step because `pnpm-lock.yaml` references the old flat structure.
**Why it happens:** pnpm lockfile records exact workspace package paths. After restructuring, the lockfile is stale.
**How to avoid:** After all file moves, run `pnpm install` locally (without `--frozen-lockfile`) to regenerate the lockfile. Commit the updated lockfile before pushing.
**Warning signs:** CI shows "ERR_PNPM_LOCKFILE_BREAKING_CHANGE" or similar.

### Pitfall 6: `lefthook typecheck` fails because `tsc` finds no config
**What goes wrong:** `pnpm tsc --noEmit` from the git root hook fails after `tsconfig.json` at root is simplified to only cover config files (which no longer exist there after moving to `packages/core/`).
**How to avoid:** Keep a root `tsconfig.json` covering the few files that remain at root. Or update the lefthook command to: `pnpm turbo run typecheck` (requires a `typecheck` script in `packages/core/package.json`).

### Pitfall 7: `.turbo` directory committed to git
**What goes wrong:** Build cache bloats the repository.
**How to avoid:** Add `.turbo` to `.gitignore` immediately.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Task orchestration with caching | Shell scripts with `&&` | `turbo run` | Turbo handles parallelism, caching, task ordering |
| Package publishing in monorepo | Custom publish scripts | `changesets/action` + `pnpm changeset publish` | Handles versioning, changelogs, npm publish atomically |
| Monorepo package management | Symlink management | pnpm workspaces | pnpm handles hoisting, symlinks, lockfile |
| tsconfig deduplication | Copy-paste compiler options | `tsconfig.base.json` + `extends` | Single source of truth for strict settings |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Turborepo `pipeline` key | `tasks` key | Turbo v2 | `pipeline` still works but deprecated; use `tasks` |
| `turbo.build` in package.json | `turbo.json` at root | Turbo v1.10+ | Root config is the canonical location |
| `npm publish` in CI | OIDC Trusted Publishing | 2023+ | No token storage; provenance attestation |
| Per-package Biome installs | Root Biome + `extends: "//"` | Biome v2 | Single install, nested override where needed |

**Note on Biome version:** The project uses `@biomejs/biome: 2.4.10`. Biome 2.x introduced the `extends: "//"` microsyntax. The current install is already the right major version. [VERIFIED: npm registry — latest is 2.4.11; 2.4.10 is current within a patch]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `pnpm turbo run test -- --coverage` correctly passes `--coverage` to vitest | Q6/CI | Unit tests run without coverage in CI; easily fixed by using `pnpm --filter=@ngockhoi96/ctc test -- --coverage` directly |
| A2 | Lefthook's `{staged_files}` token resolves to absolute paths, so biome check works on files in subdirectories | Q7/Lefthook | Pre-commit lint may silently skip package files; verify by staging a file in `packages/core/src/` and running pre-commit hook |
| A3 | pnpm's `onlyBuiltDependencies` does not need explicit `lefthook` entry with current pnpm 10.29.3 | Q7/Lefthook | `lefthook install` may not auto-run on `pnpm install`; workaround is running `pnpm setup` explicitly |

---

## Open Questions

1. **Vitest config path resolution after move**
   - What we know: `vitest.config.ts` moves to `packages/core/`. Vitest resolves paths relative to the config file location.
   - What's unclear: Whether any vitest config paths reference root-level items (e.g., test setup files in a root `tests/` dir vs. `tests/unit/`).
   - Recommendation: Audit `vitest.config.ts` content before moving; check `include`, `exclude`, and `coverage` paths.

2. **Playwright `webServer` config after move**
   - What we know: E2E tests use `http-server` to serve `dist/`. The playwright config currently resolves `dist/` relative to the project root.
   - What's unclear: After moving to `packages/core/`, whether `webServer.cwd` or `command` needs updating.
   - Recommendation: Check the playwright config and adjust `command` to `cd packages/core && pnpm exec http-server dist` or use a relative path from the new config location.

3. **Remote caching for Turborepo**
   - What we know: Turbo supports Vercel Remote Cache or self-hosted cache.
   - What's unclear: Whether this project wants remote caching (useful if CI times become a concern).
   - Recommendation: Skip remote caching for now — with one package, local caching on CI (`~/.turbo`) is sufficient. Revisit if more packages are added.

---

## Environment Availability

| Dependency | Required By | Available | Version |
|------------|------------|-----------|---------|
| pnpm | Workspace management | Yes | 10.29.3 |
| node | Runtime | Yes | 24.13.1 |
| turbo | Task orchestration | No (to install) | — |

**Missing dependencies with no fallback:**
- `turbo` — install with `pnpm add -Dw turbo`

---

## Sources

### Primary (HIGH confidence)
- [tsdown.dev/options/package-exports](https://tsdown.dev/options/package-exports) — `exports: true` behavior, publishConfig interaction
- [tsdown.dev/guide/faq](https://tsdown.dev/guide/faq) — `--workspace` flag, monorepo support
- [turborepo.dev/repo/docs/reference/configuration](https://turborepo.dev/repo/docs/reference/configuration) — turbo.json schema, task fields
- [turborepo.dev/repo/docs/crafting-your-repository/configuring-tasks](https://turborepo.dev/repo/docs/crafting-your-repository/configuring-tasks) — inputs, outputs, dependsOn
- [turborepo.dev/docs/guides/tools/typescript](https://turborepo.dev/docs/guides/tools/typescript) — tsconfig pattern, no project references
- [turborepo.dev/docs/guides/ci-vendors/github-actions](https://turborepo.dev/docs/guides/ci-vendors/github-actions) — CI workflow pattern
- [turborepo.dev/repo/docs/getting-started/add-to-existing-repository](https://turborepo.dev/repo/docs/getting-started/add-to-existing-repository) — migration steps
- [biomejs.dev/guides/big-projects](https://biomejs.dev/guides/big-projects) — monorepo config, `extends: "//"`
- [github.com/changesets/changesets/blob/main/docs/config-file-options.md](https://github.com/changesets/changesets/blob/main/docs/config-file-options.md) — config.json options, independent versioning default
- [pnpm.io/using-changesets](https://pnpm.io/using-changesets) — pnpm + changesets setup
- npm registry — turbo@2.9.6, @biomejs/biome@2.4.10 versions confirmed

### Secondary (MEDIUM confidence)
- [github.com/rolldown/tsdown/issues/544](https://github.com/rolldown/tsdown/issues/544) — tsdown workspace:* monorepo bundling issue
- [github.com/evilmartians/lefthook/discussions/852](https://github.com/evilmartians/lefthook/discussions/852) — Lefthook monorepo support

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed via npm registry
- Architecture: HIGH — patterns from official Turborepo and Biome docs
- tsdown `exports: true` behavior: HIGH — confirmed from official tsdown docs
- Lefthook monorepo behavior: MEDIUM — confirmed from docs + community discussion
- Pitfalls: MEDIUM/HIGH — mix of official docs and community reports

**Research date:** 2026-04-13
**Valid until:** 2026-07-13 (stable tools; Biome and Turborepo release frequently but APIs are stable)
