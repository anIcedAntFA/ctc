# Phase 1: Project Foundation - Research

**Researched:** 2026-04-08
**Domain:** TypeScript library scaffolding, bundling (tsdown), package validation, git hooks
**Confidence:** HIGH

## Summary

Phase 1 establishes the complete project scaffold: TypeScript config, tsdown bundler producing ESM+CJS+.d.ts, Biome for linting/formatting, Lefthook+commitlint for git hooks, size-limit/publint/attw for package validation, and changesets for versioning. Skeleton source files validate the full build pipeline end-to-end.

The prior research (STACK.md, ARCHITECTURE.md, PITFALLS.md) already covers the stack deeply. This research synthesizes those findings into actionable guidance for the planner, verifies current package versions against npm, and fills gaps around Lefthook configuration, commitlint setup, and Biome v2 formatting.

**Primary recommendation:** Follow the locked decisions (D-01 through D-19) exactly. The stack research has verified versions and configs. Focus implementation on correct ordering: (1) package.json + tsconfig, (2) source skeletons, (3) tsdown build, (4) validation tools, (5) Biome, (6) Lefthook + commitlint, (7) changesets, (8) LICENSE file.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use TypeScript 6.0. Fall back to 5.8 if tsdown or other tools break.
- **D-02:** Enable `isolatedDeclarations: true` for fast Oxc-based .d.ts generation in tsdown. All exported functions must have explicit return types.
- **D-03:** Maximum strict mode: `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + all available strict flags.
- **D-04:** `module: "nodenext"` + `moduleResolution: "nodenext"` -- required for library consumer compatibility. NOT "bundler".
- **D-05:** `target: "ES2020"` -- >95% global browser support.
- **D-06:** Minimum Node.js version: 20 (Node 18 is EOL).
- **D-07:** Two subpath exports from day 1: root `"."` and `"./clipboard"`. Validates the full exports map early.
- **D-08:** Use tsdown's `exports: true` auto-generation for the package.json exports map. Validate with publint + attw.
- **D-09:** Create skeleton source files in Phase 1 so the build pipeline can be fully validated end-to-end. Includes `src/index.ts`, `src/clipboard/index.ts` with placeholder exports.
- **D-10:** Include `src/utils/` skeleton: `env.ts` (isBrowser, isSecureContext), `errors.ts` (BrowserUtilsError type), `types.ts` (shared types). All clipboard functions will depend on these.
- **D-11:** Formatting: tabs for indentation, single quotes, 80 character line width.
- **D-12:** Lint rules: recommended + nursery rules enabled for early warnings.
- **D-13:** Pre-commit hooks: Biome lint, Biome format check, TypeScript type check (`tsc --noEmit`), and unit tests (`vitest run`).
- **D-14:** Pre-push hooks: full build (`pnpm build`), all tests (`pnpm test`), and validate (`publint` + `attw`).
- **D-15:** Commitlint with `@commitlint/config-conventional` preset. Standard types: feat/fix/chore/docs/refactor/test/ci/perf.
- **D-16:** size-limit threshold: 1KB gzip for core bundle. CI fails if exceeded.
- **D-17:** publint, attw, and size-limit failures block CI -- no merge with broken package.
- **D-18:** Pre-1.0 versioning: `0.x.y` -- breaking changes at minor, patches at patch.
- **D-19:** npm publish access: public (no scope restriction).

### Claude's Discretion
- Exact tsdown config options beyond entry points and exports
- Biome nursery rule selection (which specific nursery rules to enable)
- tsconfig paths and other non-critical compiler options
- Lefthook parallel vs sequential hook execution
- Changeset commit message format

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUILD-01 | ESM + CJS + .d.ts output via tsdown | tsdown 0.21.7 verified; config documented in STACK.md and ARCHITECTURE.md. Use `format: ['esm', 'cjs']`, `dts: true`. |
| BUILD-02 | Tree-shakeable with `"sideEffects": false` | Set in package.json. Barrel files must contain re-exports only (ARCHITECTURE.md anti-pattern 1). |
| BUILD-03 | Core bundle < 1KB gzip | size-limit 12.0.1 with @size-limit/file preset. Skeleton exports will be well under 1KB. |
| BUILD-04 | package.json exports map (root + clipboard subpath) | tsdown `exports: true` auto-generates. `"types"` must be FIRST in each entry (PITFALLS.md pitfall 4). |
| BUILD-05 | Validated with publint + arethetypeswrong | publint 0.3.18 + @arethetypeswrong/cli 0.18.2 verified. Run post-build. |
| DX-01 | Lefthook for git hooks (pre-commit: lint+test, commit-msg: commitlint) | lefthook 2.1.5 verified. Config via `lefthook.yml`. |
| DX-02 | Commitlint enforcing conventional commit format | @commitlint/cli 20.5.0 + @commitlint/config-conventional 20.5.0 verified. |
| DX-04 | MIT License | Create LICENSE file with MIT text, current year, author name. |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Zero runtime dependencies** -- only devDependencies allowed
- **ES modules** (import/export), never CommonJS in source
- **No default exports** -- always named exports (enforced by Biome rule)
- **Strict TypeScript** -- no `any`, no `as` casts unless documented why
- **Functions return boolean/null for failure, never throw** for expected errors
- **Every exported function has TSDoc comments**
- **Conventional commits:** feat/fix/chore/docs(scope): description
- **Run `pnpm lint && pnpm test && pnpm build` before any commit**
- File naming: kebab-case for files, camelCase for functions, PascalCase for types

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript | 6.0.2 | Language, type safety, declarations | Latest stable. `isolatedDeclarations` stable for Oxc .d.ts path. [VERIFIED: npm registry] |
| tsdown | 0.21.7 | Library bundler (ESM + CJS + .d.ts) | Rolldown-based, tsup-compatible API, Oxc declarations. [VERIFIED: npm registry] |
| @biomejs/biome | 2.4.10 | Linting + formatting | Single Rust binary replaces ESLint+Prettier. [VERIFIED: npm registry] |
| vitest | 4.1.3 | Unit testing | Vite-native, ESM-first. Needed for pre-commit hook. [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| size-limit | 12.0.1 | Bundle size enforcement | CI gate + pre-push hook. [VERIFIED: npm registry] |
| @size-limit/file | 12.0.1 | size-limit file preset | Measures raw file size (gzip). [VERIFIED: npm registry] |
| publint | 0.3.18 | package.json exports validation | Post-build validation. [VERIFIED: npm registry] |
| @arethetypeswrong/cli | 0.18.2 | TypeScript declaration validation | Post-build validation. [VERIFIED: npm registry] |
| @changesets/cli | 2.30.0 | Versioning + changelog | Manages semver bumps. [VERIFIED: npm registry] |
| @changesets/changelog-github | 0.6.0 | GitHub-linked changelogs | Links PRs/commits in changelog. [VERIFIED: npm registry] |
| lefthook | 2.1.5 | Git hooks manager | Pre-commit, commit-msg, pre-push hooks. [VERIFIED: npm registry] |
| @commitlint/cli | 20.5.0 | Commit message linting | Enforces conventional commits. [VERIFIED: npm registry] |
| @commitlint/config-conventional | 20.5.0 | Commitlint preset | Standard types: feat/fix/chore/docs/etc. [VERIFIED: npm registry] |
| @vitest/coverage-v8 | 4.1.3 | Code coverage | V8-based coverage for vitest. [VERIFIED: npm registry] |

### Alternatives Considered
None -- all decisions are locked by CONTEXT.md.

**Installation:**
```bash
# Core build + types
pnpm add -D typescript tsdown

# Testing
pnpm add -D vitest @vitest/coverage-v8

# Linting + formatting
pnpm add -D @biomejs/biome

# Package validation + bundle analysis
pnpm add -D size-limit @size-limit/file publint @arethetypeswrong/cli

# Versioning
pnpm add -D @changesets/cli @changesets/changelog-github

# Git hooks + commit linting
pnpm add -D lefthook @commitlint/cli @commitlint/config-conventional
```

**Total dev dependencies: 14 packages. Zero runtime dependencies.**

## Architecture Patterns

### Recommended Project Structure
```
src/
├── clipboard/
│   ├── index.ts             # barrel re-export (placeholder exports)
│   └── types.ts             # ClipboardOptions, ClipboardItemData (placeholder)
├── utils/
│   ├── env.ts               # isBrowser(), isSecureContext()
│   ├── errors.ts            # BrowserUtilsError, createError(), handleError()
│   └── types.ts             # ErrorCode, OnErrorCallback, BrowserUtilsError
└── index.ts                 # root barrel: re-exports from clipboard/
```

### Pattern 1: Skeleton Source Files for Build Validation

**What:** Create minimal but real source files that exercise the full build pipeline: TypeScript compilation, dual format output, declaration generation, subpath exports resolution.

**When to use:** Phase 1 -- before any real implementation.

**Example:**
```typescript
// src/utils/types.ts
/**
 * Error codes for browser utility operations.
 */
export type ErrorCode =
  | 'CLIPBOARD_NOT_SUPPORTED'
  | 'CLIPBOARD_PERMISSION_DENIED'
  | 'CLIPBOARD_WRITE_FAILED'
  | 'CLIPBOARD_READ_FAILED'

/**
 * Structured error for browser utility operations.
 */
export interface BrowserUtilsError {
  code: ErrorCode
  message: string
  cause?: unknown
}

/**
 * Callback invoked when an operation fails.
 */
export type OnErrorCallback = (error: BrowserUtilsError) => void
```

```typescript
// src/utils/env.ts
/**
 * Check if code is running in a browser environment.
 */
export function isBrowser(): boolean {
  return typeof navigator !== 'undefined' && typeof window !== 'undefined'
}

/**
 * Check if the current context is secure (HTTPS or localhost).
 */
export function isSecureContext(): boolean {
  return isBrowser() && window.isSecureContext === true
}
```

```typescript
// src/clipboard/index.ts
export { isBrowser, isSecureContext } from '../utils/env'
export type { BrowserUtilsError, ErrorCode, OnErrorCallback } from '../utils/types'
```

```typescript
// src/index.ts
export * from './clipboard'
```

[ASSUMED: Exact skeleton content -- planner can adjust as long as it exercises the full build pipeline]

### Pattern 2: tsdown exports auto-generation

**What:** tsdown's `exports: true` option auto-writes the `exports` field in package.json based on entry points. This prevents manual drift between tsdown config and package.json.

**When to use:** Always for this project.

**Key detail:** After running `pnpm build` with `exports: true`, tsdown modifies package.json in-place. The `"types"` condition is placed first automatically by tsdown. Validate the result with publint + attw. [CITED: tsdown.dev/options/package-exports]

### Anti-Patterns to Avoid
- **Logic in barrel files:** Barrel files (`index.ts`) must contain ONLY re-export statements. Any logic breaks tree-shaking.
- **Module-level browser global access:** Never reference `navigator`, `window`, `document` outside function bodies. Causes SSR crashes.
- **`moduleResolution: "bundler"` in tsconfig:** Produces .d.ts files incompatible with consumers using `nodenext`. Libraries MUST use `nodenext`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Git hooks | Shell scripts in .git/hooks | lefthook | Cross-platform, version-controlled, parallel execution |
| Commit message validation | Custom regex | commitlint + config-conventional | Handles edge cases (multi-line, breaking change footer, scope validation) |
| Bundle size checks | Manual gzip + wc -c | size-limit + @size-limit/file | CI integration, threshold enforcement, historical tracking |
| Package.json exports validation | Manual import tests | publint + attw | Catches .d.ts resolution bugs, export map ordering issues |
| Changelog generation | Manual CHANGELOG.md | @changesets/cli | Semver automation, PR-based workflow, monorepo-ready |

## Common Pitfalls

### Pitfall 1: package.json exports map types condition ordering
**What goes wrong:** `"types"` placed after `"import"` in exports entries causes TypeScript consumers to silently fail type resolution.
**Why it happens:** JSON object key order matters for Node.js conditional exports. TypeScript checks conditions in order and stops at the first match.
**How to avoid:** tsdown's `exports: true` handles this correctly. Validate with `pnpm attw` after every build. [CITED: PITFALLS.md, publint.dev/rules]
**Warning signs:** `attw` reports "FalseESM" or "FalseCJS" resolution errors.

### Pitfall 2: Biome formatter config mismatch with CONTEXT decisions
**What goes wrong:** The STACK.md research shows `indentStyle: "space"` but CONTEXT.md D-11 specifies tabs.
**Why it happens:** Research was done before user decisions were locked.
**How to avoid:** Use `indentStyle: "tab"` in biome.json per D-11. The locked decision overrides research defaults.

### Pitfall 3: TS 6.0 strict-by-default behavior change
**What goes wrong:** TypeScript 6.0 defaults `strict` to `true` (unlike 5.x). Developers may see unexpected errors if they assume non-strict defaults.
**Why it happens:** TS 6.0 changed the default value of `strict` from `false` to `true`.
**How to avoid:** Explicitly set `strict: true` in tsconfig.json anyway for clarity. Add `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` which are NOT included in `strict`. [CITED: TypeScript 6.0 announcement via STACK.md sources]
**Warning signs:** No visible issue -- but document the explicit setting for contributor clarity.

### Pitfall 4: Lefthook not activating after install
**What goes wrong:** Lefthook hooks don't run after `pnpm install` because the install hook wasn't configured.
**Why it happens:** Lefthook requires `lefthook install` to be run after dependency installation to set up git hooks.
**How to avoid:** Add `"prepare": "lefthook install"` to package.json scripts. This runs automatically after `pnpm install`. [ASSUMED]
**Warning signs:** Commits go through without lint/format checks.

### Pitfall 5: size-limit measuring wrong metric
**What goes wrong:** size-limit with `@size-limit/preset-small-lib` measures time-to-interactive, not file size. The <1KB target is for gzipped file size.
**Why it happens:** size-limit has multiple presets for different use cases.
**How to avoid:** Use `@size-limit/file` preset, which measures file size with gzip. Do NOT use `@size-limit/preset-small-lib`. [ASSUMED]
**Warning signs:** size-limit reports time (ms) instead of size (KB).

### Pitfall 6: tsdown version drift from STACK.md research
**What goes wrong:** STACK.md documents tsdown 0.20.x but current npm version is 0.21.7. Config options may have changed.
**Why it happens:** tsdown is pre-1.0 and evolving rapidly.
**How to avoid:** Use 0.21.7 (latest verified). The core API (`entry`, `format`, `dts`, `exports`) is stable across 0.20-0.21. [VERIFIED: npm registry]
**Warning signs:** Build errors referencing unknown config options.

## Code Examples

### tsdown.config.ts
```typescript
// Source: tsdown.dev/options/ [CITED]
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'clipboard/index': 'src/clipboard/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  exports: true,
})
```

### tsconfig.json
```jsonc
// Source: STACK.md + CONTEXT.md decisions D-01 through D-06
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "isolatedDeclarations": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### biome.json (corrected per D-11: tabs, not spaces)
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.4.10/schema.json",
  "root": true,
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      },
      "style": {
        "noDefaultExport": "error",
        "useExportType": "error",
        "useImportType": "error"
      },
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 80
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "all"
    }
  },
  "files": {
    "ignore": ["dist/", "node_modules/", ".changeset/"]
  }
}
```

### lefthook.yml
```yaml
# Source: lefthook.dev docs [ASSUMED]
pre-commit:
  parallel: true
  commands:
    lint:
      run: pnpm biome check --no-errors-on-unmatched {staged_files}
      glob: "*.{ts,js,json}"
    format:
      run: pnpm biome format --no-errors-on-unmatched {staged_files}
      glob: "*.{ts,js,json}"
    typecheck:
      run: pnpm tsc --noEmit

commit-msg:
  commands:
    commitlint:
      run: pnpm commitlint --edit {1}

pre-push:
  commands:
    build:
      run: pnpm build
    test:
      run: pnpm test
    validate:
      run: pnpm validate
```

### commitlint.config.ts
```typescript
// Source: commitlint.js.org docs [ASSUMED]
export default {
  extends: ['@commitlint/config-conventional'],
}
```

### package.json scripts
```json
{
  "scripts": {
    "build": "tsdown",
    "lint": "biome check",
    "lint:fix": "biome check --fix",
    "format": "biome format --write",
    "test": "vitest run",
    "test:watch": "vitest",
    "size": "size-limit",
    "validate": "publint && attw --pack",
    "prepare": "lefthook install",
    "changeset": "changeset"
  }
}
```

### size-limit config (in package.json)
```json
{
  "size-limit": [
    {
      "path": "dist/index.mjs",
      "limit": "1 KB"
    },
    {
      "path": "dist/clipboard/index.mjs",
      "limit": "1 KB"
    }
  ]
}
```

### .changeset/config.json
```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/changelog-github",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tsup (esbuild) | tsdown (Rolldown) | 2025 | Rolldown becoming Vite ecosystem standard. tsdown wraps it with stable API. |
| ESLint + Prettier | Biome | 2024-2025 | Single tool, 10-100x faster, simpler config. Biome v2 adds type-aware linting. |
| husky | lefthook | 2023-2024 | Faster, parallel hooks, better config format. No `.husky/` directory clutter. |
| TS 5.x strict:false default | TS 6.0 strict:true default | 2026 | Libraries no longer need to remember to enable strict. |
| `moduleResolution: "node"` | `moduleResolution: "nodenext"` | TS 5.x+ | `"node"` deprecated in TS 6.0. `"nodenext"` understands exports map. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Exact skeleton source file contents | Architecture Patterns | LOW -- planner adjusts; only needs to exercise build pipeline |
| A2 | Lefthook `prepare` script pattern | Pitfall 4 | LOW -- standard npm lifecycle hook; easy to verify |
| A3 | @size-limit/file measures gzip by default | Pitfall 5 | MEDIUM -- if wrong, size check may pass/fail incorrectly |
| A4 | Lefthook.yml syntax for staged files and commitlint | Code Examples | MEDIUM -- yaml format may differ slightly by version |
| A5 | commitlint.config.ts as config file format | Code Examples | LOW -- commitlint supports multiple config formats |
| A6 | Biome v2 nursery rules can be enabled via `"nursery": true` shorthand | D-12 | LOW -- worst case, specify rules individually |

## Open Questions

1. **Biome noDefaultExport and tsdown/vitest config files**
   - What we know: `noDefaultExport: "error"` is set per code-style rules. But `tsdown.config.ts`, `vitest.config.ts`, and `commitlint.config.ts` conventionally use default exports.
   - What's unclear: Does Biome allow per-file overrides, or should config files be excluded from this rule?
   - Recommendation: Add config files to Biome's `overrides` section to allow default exports for `*.config.ts` files.

2. **tsdown `exports: true` behavior with package.json**
   - What we know: tsdown auto-generates the exports field in package.json.
   - What's unclear: Does it also set `"main"`, `"module"`, `"types"` top-level fields, or only the `"exports"` map?
   - Recommendation: Run build, inspect output, then validate with publint. Add missing top-level fields if publint warns.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Everything | Yes | 24.13.1 | -- |
| pnpm | Package management | Yes | 10.29.3 | -- |
| git | Version control | Yes | (installed) | -- |

All external dependencies are available. All other tools (TypeScript, tsdown, Biome, etc.) will be installed as devDependencies via pnpm.

## Sources

### Primary (HIGH confidence)
- npm registry -- all 14 package versions verified via `npm view` on 2026-04-08
- `.planning/research/STACK.md` -- stack versions, tsconfig, biome config
- `.planning/research/ARCHITECTURE.md` -- project structure, tsdown config, anti-patterns
- `.planning/research/PITFALLS.md` -- exports map ordering, SSR safety, bundle validation
- tsdown.dev/options/package-exports -- exports auto-generation feature

### Secondary (MEDIUM confidence)
- TypeScript 6.0 announcement -- strict defaults, isolatedDeclarations stability
- Biome v2 announcement -- type-aware linting, nested configs

### Tertiary (LOW confidence)
- Lefthook yaml config format -- based on training data, not verified against 2.1.5 docs
- commitlint config file format -- based on training data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry
- Architecture: HIGH -- based on verified tsdown docs and established patterns
- Pitfalls: HIGH -- based on prior verified research in PITFALLS.md
- Git hooks (Lefthook/commitlint): MEDIUM -- config format assumed, not verified against latest docs

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (30 days -- stable tooling, pre-1.0 tsdown may update)
