# Roadmap: Browser Utilities Library

## Overview

Ship a production-ready clipboard utilities library across two milestones. v0.1.0 delivered the core clipboard module. v0.3.0 migrates to a monorepo and ships framework adapters for React, Vue, and Svelte with standalone playgrounds.

## Phase Numbering

- Integer phases (1, 2, 3…): Planned milestone work
- Decimal phases (e.g. 2.1): Urgent insertions (marked INSERTED)

Phases execute in numeric order.

---

## Milestone 1 — v0.1.0 (Complete)

### Phase 1: Project Foundation ✓
**Goal**: Developers can clone the repo, install deps, and produce a valid ESM + CJS + .d.ts build with correct package.json exports
**Requirements**: BUILD-01..05, DX-01, DX-02, DX-04
**Completed**: 2026-04-08

Plans:
- [x] 01-01-PLAN.md — Package init, TypeScript config, skeleton source, tsdown build, validation
- [x] 01-02-PLAN.md — Biome linting, Lefthook hooks, commitlint, changesets, LICENSE

### Phase 2: Clipboard API ✓
**Goal**: Developers can import clipboard functions and use them to copy, read, and detect clipboard support with typed error handling
**Requirements**: CLIP-01..03, DETECT-01..04, ERR-01..02
**Completed**: 2026-04-08

Plans:
- [x] 02-01-PLAN.md — handleError() routing + detect.ts
- [x] 02-02-PLAN.md — copyToClipboard, readFromClipboard, copyToClipboardLegacy + barrel cleanup

### Phase 3: Quality & Release ✓
**Goal**: The library has full test coverage, automated CI, and is publishable to npm with a single command
**Requirements**: TEST-01..02, CI-01..03, DX-03
**Completed**: 2026-04-09

Plans:
- [x] 03-01-PLAN.md — Vitest unit tests, V8 coverage, 100% thresholds
- [x] 03-02-PLAN.md — Playwright E2E tests across Chromium, Firefox, WebKit
- [x] 03-03-PLAN.md — GitHub Actions CI + changesets release workflow
- [x] 03-04-PLAN.md — README with badges, API reference, browser support table

---

## Milestone 2 — v0.3.0 (Active)

### Phase 4: Monorepo Foundation
**Goal**: The repo is a functioning pnpm + Turborepo monorepo with `packages/core` publishing as `@ngockhoi96/ctc` and shared tooling in place — all existing tests and CI pass unchanged
**Depends on**: Phase 3 (complete)
**Requirements**: MONO-01, MONO-02, MONO-03, MONO-04, MONO-05
**Success Criteria**:
1. `pnpm -r build` produces all dist outputs via Turborepo pipeline
2. `packages/core` publishes as `@ngockhoi96/ctc` — package name and public API unchanged
3. Root-level `pnpm lint`, `pnpm test`, `pnpm build` all pass via Turbo
4. Changesets operates in independent mode; each package versions separately
5. CI workflow updated — monorepo-aware, passes on first run

Plans:
- [x] 04-01-PLAN.md — pnpm workspaces init, Turborepo config, `packages/core` migration, shared tsconfig + biome
- [x] 04-02-PLAN.md — Changesets independent mode, CI monorepo update, root scripts

### Phase 5: React & Vue Adapters
**Goal**: `@ngockhoi96/ctc-react` and `@ngockhoi96/ctc-vue` are published packages with stateful hooks/composables, full unit tests, and per-package READMEs
**Depends on**: Phase 4
**Requirements**: ADAPT-01, ADAPT-02, ADAPT-04, ADAPT-05, ADAPT-06
**Success Criteria**:
1. `useCopyToClipboard()` React hook returns `{ copy, copied, error }`; `copied` resets after configurable timeout (default 2s)
2. `useCopyToClipboard()` Vue composable returns `{ copy, copied, error }` as refs; same reset behaviour
3. Both packages declare `@ngockhoi96/ctc` as peer dep, ship zero additional runtime deps
4. Unit tests with React Testing Library and Vue Test Utils achieve 100% branch coverage on adapter logic
5. Both packages pass `publint` + `attw` validation and bundle < 2KB gzip

Plans:
- [ ] 05-01-PLAN.md — `packages/react`: scaffold, `useCopyToClipboard` implementation, RTL unit tests, README
- [ ] 05-02-PLAN.md — `packages/vue`: scaffold, `useCopyToClipboard` composable, Vue Test Utils tests, README

### Phase 6: Svelte Adapter
**Goal**: `@ngockhoi96/ctc-svelte` is a published package with both a Svelte action and a rune-based store, tested and documented
**Depends on**: Phase 4
**Requirements**: ADAPT-03, ADAPT-04, ADAPT-05, ADAPT-06
**Success Criteria**:
1. `copyAction(node, text)` Svelte action copies text on element click/activation; works with `use:` directive
2. `useCopyToClipboard()` rune/store returns `{ copy, copied, error }`; `copied` auto-resets
3. Both patterns demonstrated in the same package; consumers can use either or both
4. Unit tests with Svelte Testing Library achieve 100% branch coverage
5. Package passes `publint` + `attw`, bundles < 2KB gzip

Plans:
- [ ] 06-01-PLAN.md — `packages/svelte`: scaffold, action + rune implementation, Svelte Testing Library tests, README

### Phase 7: Playgrounds
**Goal**: Four standalone Vite apps in `playground/` demonstrate the core and each framework adapter with real interactive copy UX — copy button, copied state, error display, and secure context indicator. Playgrounds are workspace members but excluded from CI via `--filter=./packages/*`.
**Depends on**: Phase 5, Phase 6
**Requirements**: PLAY-00, PLAY-01, PLAY-02, PLAY-03
**Success Criteria**:
1. Each playground starts with `pnpm dev` from its own directory; all run via `pnpm turbo run dev` from root
2. Each shows: copy button → "Copied!" 2s state → reset; secure context badge; error code display; detection panel
3. `playground/vanilla` reuses the existing E2E fixture structure (`window.__clipboard`) — no framework overhead
4. Svelte playground shows `use:copyAction` and `useCopyToClipboard` rune patterns side-by-side
5. Playgrounds are `"private": true` — changesets never publishes them; CI filter excludes them

Plans:
- [x] 07-01-PLAN.md — `playground/vanilla`: framework-free Vite app, doubles as E2E fixture replacement
- [x] 07-02-PLAN.md — `playground/react`: Vite + React app demoing `useCopyToClipboard` hook
- [x] 07-03-PLAN.md — `playground/vue`: Vite + Vue app demoing `useCopyToClipboard` composable
- [x] 07-04-PLAN.md — `playground/svelte`: Vite + Svelte app, action + rune side-by-side

### Phase 8: Docs & Release Infrastructure
**Goal**: Root and per-package documentation is complete, GitHub repo housekeeping is done, and the release workflow handles multi-package publishing correctly
**Depends on**: Phase 5, Phase 6
**Requirements**: DX-05, DX-06, DX-07, DX-08, DX-09, DX-10
**Success Criteria**:
1. Root README reflects monorepo structure with quick-start for each package
2. Per-package READMEs (react, vue, svelte) exist with install, usage, API, and peer dep instructions
3. CONTRIBUTING.md covers: clone, workspace setup, adding a package, running tests, creating a changeset, and the release flow
4. SECURITY.md exists with vulnerability reporting contact
5. GitHub PR template and two issue templates (bug report, feature request) are in `.github/`
6. Changeset summaries include emoji category prefixes; schema warning resolved

Plans:
- [ ] 08-01-PLAN.md — Root README + per-package READMEs (react, vue, svelte)
- [ ] 08-02-PLAN.md — CONTRIBUTING.md, SECURITY.md, GitHub templates, changeset emoji config

---

## Progress

| Phase | Plans | Status | Completed |
|-------|-------|--------|-----------|
| 1. Project Foundation | 2/2 | Complete | 2026-04-08 |
| 2. Clipboard API | 2/2 | Complete | 2026-04-08 |
| 3. Quality & Release | 4/4 | Complete | 2026-04-09 |
| 4. Monorepo Foundation | 0/2 | Planned | — |
| 5. React & Vue Adapters | 0/2 | Planned | — |
| 6. Svelte Adapter | 0/1 | Planned | — |
| 7. Playgrounds | 0/4 | Planned | — |
| 8. Docs & Release Infra | 0/2 | Planned | — |

**v0.3.0 total:** 0/11 plans complete
