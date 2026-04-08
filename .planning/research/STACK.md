# Stack Research

**Domain:** Browser utilities library (clipboard-focused, zero-dependency, tree-shakeable)
**Researched:** 2026-04-08
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 6.0 | Language, type safety, declaration generation | Latest stable. Strict-by-default aligns with project philosophy. `isolatedDeclarations` now stable for fast `.d.ts` generation via Oxc in tsdown. TS 6.0 is the last JS-based compiler release before TS 7 (Go-based) arrives mid-2026 — safe to adopt now. |
| tsdown | 0.20.x | Library bundler (ESM + CJS + .d.ts) | Purpose-built for library authoring on top of Rolldown (Rust). Sensible defaults, tsup-compatible API, generates declarations via Oxc. Rolldown is becoming the Vite ecosystem standard (Vite 8 beta). Learning Rolldown internals through a stable wrapper is the sweet spot. |
| Vitest | 4.1.x | Unit testing | Vite-native, ESM-first, fast. Browser Mode now stable in v4. Shares Vite config. V8 coverage with AST-based remapping is production-ready. |
| Playwright | 1.59.x | E2E browser testing | Industry standard for cross-browser testing. Required for clipboard operations that need real browser context (permissions, secure context, user gestures). Chromium + Firefox + WebKit support. |
| Biome | 2.4.x | Linting + formatting | Replaces ESLint + Prettier in a single Rust-based tool. 468+ rules, type-aware linting without requiring the TS compiler (Biome's own inference engine). Sub-millisecond formatting. Biome v2 supports nested configs for future monorepo. |
| pnpm | 10.x | Package manager | Content-addressable storage, strict dependency resolution, workspace support for future monorepo. Sub-second warm installs. Industry standard for library projects. |

### Package Validation & Bundle Analysis

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| size-limit | 12.0.x | Bundle size enforcement | CI gate: fail build if core exceeds 1KB gzip. Use `@size-limit/file` preset for library (measures file size, not load time). |
| publint | 0.3.x | package.json exports validation | CI gate: validates `exports` map, `main`, `module`, `types` fields are correct and resolvable. Run after every build. |
| @arethetypeswrong/cli | 0.18.x | TypeScript declaration validation | CI gate: catches ESM/CJS module resolution mismatches in `.d.ts` output. Prevents "works for me, breaks for users" type issues. |
| @changesets/cli | 2.30.x | Versioning + changelog | Manages semver bumps via PR-based workflow. Generates changelogs automatically. Works for single-package now, scales to monorepo later. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite | Dev playground (future) | Not needed for v0.1.0 — tests are sufficient. Available when demo page is needed. |
| VitePress | Documentation site (future) | Deferred to v0.2.0+. README is sufficient for initial release. |

## TypeScript Configuration

Use TypeScript 6.0 with these critical settings for library authoring:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    // TS 6.0 defaults strict to true — no need to set explicitly
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

**Key decisions:**
- `module: "nodenext"` + `moduleResolution: "nodenext"` — required for libraries so declaration file imports are compatible with all consumers' TS settings. Do NOT use `"bundler"` for libraries.
- `isolatedDeclarations: true` — enables Oxc-based fast `.d.ts` generation in tsdown without running the full TS type checker. Requires explicit return types on exported functions (enforces good API documentation).
- `target: "ES2020"` — matches the >95% browser support target from the PRD.

## tsdown Configuration

```typescript
// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/clipboard/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2020',
  // tsdown auto-reads tsconfig.json
})
```

## Biome Configuration

```jsonc
// biome.json
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
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "all"
    }
  }
}
```

**Key rule:** `noDefaultExport: "error"` enforces the project's named-exports-only policy at the linter level.

## size-limit Configuration

```jsonc
// package.json (partial)
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

## Installation

```bash
# Initialize
pnpm init

# Core dev dependencies (build + types)
pnpm add -D typescript tsdown

# Testing
pnpm add -D vitest @vitest/coverage-v8 playwright @playwright/test

# Linting + formatting
pnpm add -D @biomejs/biome

# Package validation + bundle analysis
pnpm add -D size-limit @size-limit/file publint @arethetypeswrong/cli

# Versioning
pnpm add -D @changesets/cli @changesets/changelog-github
```

**Total dev dependencies: 12 packages. Zero runtime dependencies.**

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| tsdown | tsup | If you need battle-tested stability over learning Rolldown. tsup uses esbuild — mature but esbuild is being phased out of Vite ecosystem. |
| tsdown | Rolldown (direct) | Only for experiments. Rolldown API is still in flux; tsdown wraps it with a stable, tsup-compatible API. |
| Biome | ESLint + Prettier | If you need niche ESLint plugins (e.g., eslint-plugin-security) not yet available in Biome. For a small library, Biome covers everything needed. |
| Vitest | Jest | Never for this project. Jest has poor ESM support, requires transforms, slower. Vitest is strictly better for ESM-first TS libraries. |
| pnpm | npm/yarn | If collaborators refuse pnpm. But pnpm's strict hoisting prevents phantom dependency bugs — important for a zero-dependency library. |
| TypeScript 6.0 | TypeScript 5.8 | If tsdown or other tools break on TS 6.0. TS 5.8 is the safe fallback. Pin to 5.8 if any tool incompatibility surfaces during setup. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `moduleResolution: "bundler"` in tsconfig | Produces `.d.ts` files with imports that break for consumers using `nodenext` resolution. Libraries must use `nodenext`. | `moduleResolution: "nodenext"` |
| `moduleResolution: "node"` in tsconfig | Deprecated in TS 6.0. Does not understand `exports` map in package.json. | `moduleResolution: "nodenext"` |
| Jest | Poor ESM support, requires CJS transforms, slower startup, more config. | Vitest |
| ESLint + Prettier (separately) | Two tools, two configs, slower. Biome does both in one Rust binary. | Biome |
| esbuild (direct) | Being phased out of Vite ecosystem. No `.d.ts` generation. | tsdown (Rolldown-based) |
| Rollup (direct) | Rolldown supersedes it. Slower (JS-based). tsdown handles Rolldown integration. | tsdown |
| webpack | Overkill for library bundling. Application bundler, not library bundler. | tsdown |
| `document.execCommand('copy')` as default | Deprecated API. Keep as explicit opt-in fallback function, not primary path. | Clipboard API with separate fallback function |
| default exports | Breaks tree-shaking predictability, creates naming ambiguity. | Named exports only (enforced via Biome rule) |

## Stack Patterns by Variant

**If staying single-package (v0.1.0 - v0.x):**
- Use flat project structure as defined in PRD
- tsdown with multiple entry points (`src/index.ts`, `src/clipboard/index.ts`)
- Single `biome.json` at root

**If migrating to monorepo (v0.2.0+ with framework adapters):**
- Add `pnpm-workspace.yaml` with `packages: ['packages/*']`
- Consider turborepo for build orchestration
- Biome v2 supports nested configs natively (`"extends": "//"`)
- changesets handles monorepo versioning out of the box
- Each package gets its own `tsdown.config.ts`

**If TypeScript 6.0 causes tool issues:**
- Pin to TypeScript 5.8.x (last fully stable 5.x)
- Use `module: "node18"` instead of `"nodenext"` (TS 5.8 addition)
- Everything else stays the same

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| tsdown 0.20.x | TypeScript 5.5 - 6.0 | Uses Oxc for `.d.ts`, not tsc directly. `isolatedDeclarations` required for Oxc path. |
| Vitest 4.1.x | Vite 6.x | Shares Vite config. If adding a playground, both use the same `vite.config.ts`. |
| Biome 2.4.x | TypeScript (any) | Biome has its own TS parser — not coupled to `typescript` package version. |
| Playwright 1.59.x | Node 18+ | Requires Node 18+. CI matrix should test Node 20 and 22. |
| size-limit 12.x | Any bundler output | Measures file size directly. No bundler coupling. |
| @changesets/cli 2.30.x | pnpm workspaces | Works for single-package and monorepo. |
| pnpm 10.x | Node 18+ | Corepack support via `packageManager` field in package.json. |

## Node.js Version Strategy

Target **Node 20 LTS** as minimum for development, test on **Node 20 + 22** in CI.

- Node 18 reaches EOL April 2025 — do not target it
- Node 20 LTS is active until April 2026, maintenance until April 2027
- Node 22 LTS is active until October 2027

Set in `package.json`:
```json
{
  "engines": { "node": ">=20" }
}
```

## Sources

- [tsdown npm](https://www.npmjs.com/package/tsdown) — version 0.20.3 verified
- [tsdown docs](https://tsdown.dev/guide/) — configuration, library authoring guide
- [Vitest 4.0 announcement](https://vitest.dev/blog/vitest-4) — stable browser mode, visual regression
- [Vitest npm](https://www.npmjs.com/package/vitest) — version 4.1.3 verified
- [Biome npm](https://www.npmjs.com/package/@biomejs/biome) — version 2.4.10 verified
- [Biome v2 announcement](https://biomejs.dev/blog/biome-v2/) — type-aware linting, nested configs
- [Playwright npm](https://www.npmjs.com/package/playwright) — version 1.59.1 verified
- [TypeScript 6.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) — strict defaults, last JS-based release
- [TypeScript 5.x to 6.0 Migration Guide](https://gist.github.com/privatenumber/3d2e80da28f84ee30b77d53e1693378f) — breaking changes, tsconfig updates
- [pnpm npm](https://www.npmjs.com/package/pnpm) — version 10.33.0 verified
- [size-limit npm](https://www.npmjs.com/package/size-limit) — version 12.0.1 verified
- [publint npm](https://www.npmjs.com/package/publint) — version 0.3.18 verified
- [@arethetypeswrong/cli npm](https://www.npmjs.com/package/@arethetypeswrong/cli) — version 0.18.2 verified
- [@changesets/cli npm](https://www.npmjs.com/package/@changesets/cli) — version 2.30.0 verified
- [TypeScript tsconfig reference](https://www.typescriptlang.org/tsconfig/) — module resolution options

---
*Stack research for: Browser utilities library (clipboard-focused)*
*Researched: 2026-04-08*
