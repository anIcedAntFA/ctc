# Phase 1: Project Foundation - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the complete project scaffolding: TypeScript config, tsdown bundler, Biome linting, package.json with dual ESM+CJS exports, Lefthook git hooks, commitlint, size-limit, publint, attw, changesets, and skeleton source files. Developers can clone, install, build, and get a validated package output.

</domain>

<decisions>
## Implementation Decisions

### TypeScript Configuration
- **D-01:** Use TypeScript 6.0. Fall back to 5.8 if tsdown or other tools break.
- **D-02:** Enable `isolatedDeclarations: true` for fast Oxc-based .d.ts generation in tsdown. All exported functions must have explicit return types.
- **D-03:** Maximum strict mode: `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + all available strict flags.
- **D-04:** `module: "nodenext"` + `moduleResolution: "nodenext"` — required for library consumer compatibility. NOT "bundler".
- **D-05:** `target: "ES2020"` — >95% global browser support.
- **D-06:** Minimum Node.js version: 20 (Node 18 is EOL).

### Entry Points & Exports
- **D-07:** Two subpath exports from day 1: root `"."` and `"./clipboard"`. Validates the full exports map early.
- **D-08:** Use tsdown's `exports: true` auto-generation for the package.json exports map. Validate with publint + attw.

### Source Layout
- **D-09:** Create skeleton source files in Phase 1 so the build pipeline can be fully validated end-to-end. Includes `src/index.ts`, `src/clipboard/index.ts` with placeholder exports.
- **D-10:** Include `src/utils/` skeleton: `env.ts` (isBrowser, isSecureContext), `errors.ts` (BrowserUtilsError type), `types.ts` (shared types). All clipboard functions will depend on these.

### Biome Configuration
- **D-11:** Formatting: tabs for indentation, single quotes, 80 character line width.
- **D-12:** Lint rules: recommended + nursery rules enabled for early warnings.

### Git Workflow (Lefthook + Commitlint)
- **D-13:** Pre-commit hooks: Biome lint, Biome format check, TypeScript type check (`tsc --noEmit`), and unit tests (`vitest run`).
- **D-14:** Pre-push hooks: full build (`pnpm build`), all tests (`pnpm test`), and validate (`publint` + `attw`).
- **D-15:** Commitlint with `@commitlint/config-conventional` preset. Standard types: feat/fix/chore/docs/refactor/test/ci/perf.

### Bundle Validation
- **D-16:** size-limit threshold: 1KB gzip for core bundle. CI fails if exceeded.
- **D-17:** publint, attw, and size-limit failures block CI — no merge with broken package.

### Changesets & Versioning
- **D-18:** Pre-1.0 versioning: `0.x.y` — breaking changes at minor, patches at patch.
- **D-19:** npm publish access: public (no scope restriction).

### Claude's Discretion
- Exact tsdown config options beyond entry points and exports
- Biome nursery rule selection (which specific nursery rules to enable)
- tsconfig paths and other non-critical compiler options
- Lefthook parallel vs sequential hook execution
- Changeset commit message format

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `PRD.md` — Full product requirements, tech stack rationale, API design, bundle targets, testing strategy
- `.planning/PROJECT.md` — Project context, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — v1 requirements with REQ-IDs mapped to phases

### Research findings
- `.planning/research/STACK.md` — Recommended versions, tsconfig guidance, tool configs
- `.planning/research/ARCHITECTURE.md` — Module structure, tree-shaking patterns, guard-first design
- `.planning/research/PITFALLS.md` — Package.json exports mistakes, SSR crash prevention, declaration file issues

### Code style
- `.claude/rules/code-style.md` — TypeScript conventions, naming, exports, error handling
- `.claude/rules/testing.md` — Test file naming, coverage targets, mocking patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code.

### Established Patterns
- None — patterns will be established by this phase.

### Integration Points
- None — this is the foundation phase.

</code_context>

<specifics>
## Specific Ideas

- tsdown chosen specifically to learn Rolldown internals via a stable wrapper API
- Bundle validation (publint, attw, size-limit) must be in CI from day 1 — research emphasizes this prevents broken npm releases
- Research warns: `"types"` condition must be FIRST in each exports entry or TypeScript consumers break silently
- SSR safety CI step: `node -e "require('./dist/index.cjs')"` must succeed in Node.js

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-project-foundation*
*Context gathered: 2026-04-08*
