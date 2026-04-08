# Roadmap: Browser Utilities Library

## Overview

Ship a production-ready clipboard utilities library (v0.1.0) in three phases: scaffold the project with build tooling and package structure, implement the complete clipboard API surface, then add tests, CI, and release infrastructure. Each phase delivers a coherent capability that the next phase builds on.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Foundation** - Build tooling, package structure, dev workflow (completed 2026-04-08)
- [ ] **Phase 2: Clipboard API** - All clipboard functions, detection, error handling
- [ ] **Phase 3: Quality & Release** - Tests, CI pipeline, publish workflow, README

## Phase Details

### Phase 1: Project Foundation
**Goal**: Developers can clone the repo, install deps, and produce a valid ESM + CJS + .d.ts build with correct package.json exports
**Depends on**: Nothing (first phase)
**Requirements**: BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05, DX-01, DX-02, DX-04
**Success Criteria** (what must be TRUE):
  1. Running `pnpm build` produces ESM (.mjs), CJS (.cjs), and declaration (.d.ts) files in dist/
  2. package.json exports map resolves correctly for both root and `./clipboard` subpath (verified by publint + attw)
  3. Bundle size of core output is under 1KB gzip (verified by size-limit)
  4. Git hooks enforce linting and conventional commit format on every commit
**Plans:** 2/2 plans complete

Plans:
- [x] 01-01-PLAN.md — Package init, TypeScript config, skeleton source, tsdown build, validation (BUILD-01..05)
- [x] 01-02-PLAN.md — Biome linting, Lefthook hooks, commitlint, changesets, LICENSE (DX-01, DX-02, DX-04)

### Phase 2: Clipboard API
**Goal**: Developers can import clipboard functions and use them to copy, read, and detect clipboard support with typed error handling
**Depends on**: Phase 1
**Requirements**: CLIP-01, CLIP-02, CLIP-03, DETECT-01, DETECT-02, DETECT-03, DETECT-04, ERR-01, ERR-02
**Success Criteria** (what must be TRUE):
  1. Importing `copyToClipboard` and calling it copies text to the clipboard, returning true on success and false on failure (never throwing)
  2. Importing `readFromClipboard` reads text from clipboard, returning the string or null on failure
  3. `copyToClipboardLegacy` copies text via execCommand on HTTP pages where the modern API is unavailable
  4. `isClipboardSupported()` and `isClipboardReadSupported()` return accurate booleans for the current browser environment
  5. All clipboard functions accept an optional `onError` callback that receives a typed `BrowserUtilsError` with specific error codes (including secure context detection), and all exports are importable in Node.js without crashing
**Plans:** 2 plans

Plans:
- [ ] 02-01-PLAN.md — Update handleError() routing + create detect.ts (DETECT-01, DETECT-02, DETECT-03, DETECT-04, ERR-01, ERR-02)
- [ ] 02-02-PLAN.md — copyToClipboard, readFromClipboard, copyToClipboardLegacy + barrel cleanup (CLIP-01, CLIP-02, CLIP-03, ERR-01, ERR-02)

### Phase 3: Quality & Release
**Goal**: The library has full test coverage, automated CI, and is publishable to npm with a single command
**Depends on**: Phase 2
**Requirements**: TEST-01, TEST-02, CI-01, CI-02, CI-03, DX-03
**Success Criteria** (what must be TRUE):
  1. Unit tests (Vitest) achieve 100% line and branch coverage on all core clipboard functions
  2. E2E tests (Playwright) verify clipboard operations work in real Chromium, Firefox, and WebKit browsers
  3. CI pipeline runs lint, build, test, and validate (publint, size-limit, attw) on every PR across Ubuntu + Node 20/22
  4. Merging a changeset to main triggers automated npm publish with changelog generation
  5. README contains quick start example, full API documentation, and browser support table
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Foundation | 2/2 | Complete    | 2026-04-08 |
| 2. Clipboard API | 0/2 | Not started | - |
| 3. Quality & Release | 0/2 | Not started | - |
