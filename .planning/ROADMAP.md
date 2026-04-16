# Roadmap: Browser Utilities Library

## Milestones

- ✅ **v0.1.0 Core Library** — Phases 1–3 (shipped 2026-04-09) · [archive](.planning/milestones/v0.1.0-ROADMAP.md)
- ✅ **v0.3.0 Monorepo + Framework Adapters** — Phases 4–8 (shipped 2026-04-14) · [archive](milestones/v0.3.0-ROADMAP.md)
- 🚧 **v0.4.0 Rich Clipboard & Quality** — Phases 9–12 (in progress)

## Phases

<details>
<summary>✅ v0.1.0 Core Library (Phases 1–3) — SHIPPED 2026-04-09</summary>

- [x] Phase 1: Project Foundation (2/2 plans) — completed 2026-04-08
- [x] Phase 2: Clipboard API (2/2 plans) — completed 2026-04-08
- [x] Phase 3: Quality & Release (4/4 plans) — completed 2026-04-09

</details>

<details>
<summary>✅ v0.3.0 Monorepo + Framework Adapters (Phases 4–8) — SHIPPED 2026-04-14</summary>

- [x] Phase 4: Monorepo Foundation (2/2 plans) — completed 2026-04-14
- [x] Phase 5: React & Vue Adapters (2/2 plans) — completed 2026-04-13
- [x] Phase 6: Svelte Adapter (2/2 plans) — completed 2026-04-13
- [x] Phase 7: Playgrounds (4/4 plans) — completed 2026-04-13
- [x] Phase 8: Docs & Release Infra (3/3 plans) — completed 2026-04-14

</details>

### 🚧 v0.4.0 Rich Clipboard & Quality (In Progress)

**Milestone Goal:** Extend ctc with rich content clipboard support (HTML + plain text via ClipboardItem API), ship adapter updates for all three frameworks, and establish published benchmarks -- with an architecture review first to settle the right folder structure.

- [ ] **Phase 9: Architecture Audit & Tooling Foundation** - Settle clipboard/ folder shape, wire validation tooling, and prepare error codes for rich clipboard
- [ ] **Phase 10: Rich Clipboard Core** - Ship copyRichContent, readRichContent, and isRichClipboardSupported with full test coverage
- [ ] **Phase 11: Framework Adapters** - Add useCopyRichContent / copyRichAction across React, Vue, and Svelte adapters
- [ ] **Phase 12: Benchmarks & CI Hardening** - Establish benchmarks workspace with published comparison results

## Phase Details

### Phase 9: Architecture Audit & Tooling Foundation
**Goal**: Codebase structure and CI tooling are settled before new features land, so rich clipboard work builds on a clean foundation
**Depends on**: Phase 8
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04
**Success Criteria** (what must be TRUE):
  1. Developer reading `src/clipboard/` can understand the flat structure rationale from a KEY DECISIONS entry in PROJECT.md
  2. CI runs a dedicated `validate` job that executes attw + publint separately from the test job
  3. size-limit config accepts 1.5KB gzip budget for `dist/clipboard/index.mjs` and passes
  4. `RICH_CLIPBOARD_NOT_SUPPORTED` exists in the `ErrorCode` union and can be imported from the library
**Plans:** 2 plans
Plans:
- [ ] 09-01-PLAN.md — Document flat structure rationale, raise size-limit budgets, add error code
- [ ] 09-02-PLAN.md — Extract validate into dedicated CI job

### Phase 10: Rich Clipboard Core
**Goal**: Developers can copy and read rich content (HTML + plain text) via ClipboardItem API with the same ergonomics as existing clipboard functions
**Depends on**: Phase 9
**Requirements**: RICH-01, RICH-02, RICH-03, RICH-04, RICH-05, RICH-06
**Success Criteria** (what must be TRUE):
  1. Developer can call `isRichClipboardSupported()` and receive a boolean indicating ClipboardItem availability (returns false in SSR)
  2. Developer can call `copyRichContent(html, plainText)` and the clipboard receives both `text/html` and `text/plain` MIME entries
  3. Developer can call `readRichContent()` and receive `{ html: string | null, text: string | null }` from clipboard
  4. All three functions accept an `onError` callback with typed `BrowserUtilsError` and never throw for expected failures
  5. Unit tests achieve 100% line and branch coverage on all new core functions
**Plans**: TBD

### Phase 11: Framework Adapters
**Goal**: React, Vue, and Svelte developers can use rich clipboard operations through idiomatic framework APIs
**Depends on**: Phase 10
**Requirements**: ADPT-01, ADPT-02, ADPT-03, ADPT-04, ADPT-05
**Success Criteria** (what must be TRUE):
  1. React developer can call `useCopyRichContent()` and receive `{ copyRich, copied, error, reset }` with auto-reset timeout
  2. Vue developer can call `useCopyRichContent()` and receive `{ copyRich, copied, error, reset }` as shallowRefs
  3. Svelte developer can use `copyRichAction` as a Svelte action and import a runes variant from `/runes` subpath
  4. All three adapter packages maintain 100% branch coverage after additions
  5. All three adapter packages remain under 2KB brotli
**Plans**: TBD
**UI hint**: yes

### Phase 12: Benchmarks & CI Hardening
**Goal**: Published benchmark data demonstrates ctc performance and bundle size against competing libraries
**Depends on**: Phase 10
**Requirements**: BENCH-01, BENCH-02, BENCH-03, BENCH-04
**Success Criteria** (what must be TRUE):
  1. `pnpm bench` runs Vitest bench from a `benchmarks/` workspace package and produces timing output
  2. Bundle size comparison table (gzip + brotli) covering ctc vs clipboard-copy vs copy-to-clipboard is captured
  3. Wrapper overhead benchmarks with mocked clipboard API produce ops/sec results
  4. All benchmark results are published in `BENCHMARKS.md` at the repo root
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 9 -> 10 -> 11 -> 12
(Phase 11 and 12 both depend on Phase 10 and can run in parallel if desired.)

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Project Foundation | v0.1.0 | 2/2 | Complete | 2026-04-08 |
| 2. Clipboard API | v0.1.0 | 2/2 | Complete | 2026-04-08 |
| 3. Quality & Release | v0.1.0 | 4/4 | Complete | 2026-04-09 |
| 4. Monorepo Foundation | v0.3.0 | 2/2 | Complete | 2026-04-14 |
| 5. React & Vue Adapters | v0.3.0 | 2/2 | Complete | 2026-04-13 |
| 6. Svelte Adapter | v0.3.0 | 2/2 | Complete | 2026-04-13 |
| 7. Playgrounds | v0.3.0 | 4/4 | Complete | 2026-04-13 |
| 8. Docs & Release Infra | v0.3.0 | 3/3 | Complete | 2026-04-14 |
| 9. Architecture Audit & Tooling Foundation | v0.4.0 | 0/2 | Not started | - |
| 10. Rich Clipboard Core | v0.4.0 | 0/TBD | Not started | - |
| 11. Framework Adapters | v0.4.0 | 0/TBD | Not started | - |
| 12. Benchmarks & CI Hardening | v0.4.0 | 0/TBD | Not started | - |
