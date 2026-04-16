# @ngockhoi96/ctc

## What
Modular, tree-shakeable browser utilities library. Core: clipboard APIs.
See @PRD.md for full product requirements.

## Stack
- TypeScript (strict), tsdown (bundler)
- Vitest (unit), Playwright (E2E)
- pnpm, Biome (lint+format), GitHub Actions
- changesets (versioning)

## Project Structure
```
src/clipboard/   — clipboard utilities (copy, read, detect)
src/lib/         — shared internal helpers (env, errors, types)
tests/unit/      — vitest unit tests
tests/e2e/       — playwright browser tests
```

## Commands
```
pnpm build       — build with tsdown (ESM + CJS + .d.ts)
pnpm test        — run vitest unit tests
pnpm test:e2e    — run playwright E2E tests
pnpm lint        — biome check
pnpm lint:fix    — biome check --fix
pnpm size        — check bundle size with size-limit
pnpm validate    — run publint + attw
pnpm setup       — install lefthook git hooks (run once after clone)
```

## Code Style
See @.claude/rules/code-style.md for full rules. Key points:
- Named exports only — no default exports
- Strict TypeScript — no `any`, no `as` casts unless documented
- Functions return boolean/null for failure, never throw for expected errors
- Every exported function has TSDoc comments
- Zero runtime dependencies — only browser native APIs

## Testing
See @.claude/rules/testing.md for full rules. Key points:
- Unit tests mock `navigator.clipboard` — test logic, not the browser
- E2E tests use real browsers via Playwright (Chromium / Firefox / WebKit)
- Target: 100% line + branch coverage on core functions

## Git
- Conventional commits: `feat/fix/chore/docs/test/ci(scope): description`
- Run `pnpm lint && pnpm test && pnpm build` before any commit
- Never commit to main directly

## IMPORTANT
- NEVER add runtime dependencies to `package.json`
- ALWAYS verify tree-shaking after adding new exports (`pnpm build && pnpm size`)
- `tsconfig.json` covers `src/` only; `tsconfig.node.json` covers config files

<!-- GSD:project-start source:PROJECT.md -->
## Project

**@ngockhoi96/ctc**

A modular, tree-shakeable browser utilities library starting with clipboard operations. Framework-agnostic core with zero dependencies, designed to scale into storage, media, DOM, and other browser APIs over time. Published as `@ngockhoi96/ctc` on npm.

**Core Value:** Developers can copy, read, and detect clipboard support in any browser environment with a single import — no framework lock-in, no bloat, no surprises.

**Constraints:**
- Zero dependencies — only browser native APIs
- Bundle size < 1.5KB gzip for core clipboard module
- Browser target: ES2020+ (>95% global support)
- No default exports — named exports only
<!-- GSD:project-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| implement | Implement a new browser utility function. Use when adding new API functions to the library, creating new modules, or extending existing modules with new exports. | `.claude/skills/implement/SKILL.md` |
| release | Prepare a new release with changeset, changelog, and validation. Use when versioning or publishing. | `.claude/skills/release/SKILL.md` |
| review | Review code changes for quality, security, and library best practices. Use when reviewing PRs, checking implementation quality, or auditing code. | `.claude/skills/review/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
