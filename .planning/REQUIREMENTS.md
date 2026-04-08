# Requirements: Browser Utilities Library

**Defined:** 2026-04-08
**Core Value:** Developers can copy, read, and detect clipboard support in any browser environment with a single import — no framework lock-in, no bloat, no surprises.

## v1 Requirements

Requirements for v0.1.0 release. Each maps to roadmap phases.

### Clipboard Operations

- [ ] **CLIP-01**: User can copy text to clipboard via `copyToClipboard(text, options?)`
- [ ] **CLIP-02**: User can read text from clipboard via `readFromClipboard()`
- [ ] **CLIP-03**: User can copy text on HTTP/legacy browsers via explicit `copyToClipboardLegacy()`

### Detection & Safety

- [ ] **DETECT-01**: User can check Clipboard API availability via `isClipboardSupported()`
- [ ] **DETECT-02**: User can check clipboard read support via `isClipboardReadSupported()`
- [ ] **DETECT-03**: All exports are SSR-safe (importable in Node.js without crash)
- [ ] **DETECT-04**: Secure context (HTTPS) detection with specific error code

### Error Handling

- [ ] **ERR-01**: All clipboard functions accept optional `onError` callback with typed `BrowserUtilsError`
- [ ] **ERR-02**: All clipboard functions return `boolean`/`null` for failures, never throw

### Build & Package

- [x] **BUILD-01**: ESM + CJS + .d.ts output via tsdown
- [x] **BUILD-02**: Tree-shakeable with `"sideEffects": false`
- [x] **BUILD-03**: Core bundle < 1KB gzip
- [x] **BUILD-04**: package.json exports map (root + clipboard subpath)
- [x] **BUILD-05**: Validated with publint + arethetypeswrong

### Testing

- [ ] **TEST-01**: Unit tests (Vitest) with 100% coverage on core functions
- [ ] **TEST-02**: E2E tests (Playwright) across Chromium, Firefox, WebKit

### CI/CD & Release

- [ ] **CI-01**: CI pipeline: lint → build → test → validate
- [ ] **CI-02**: npm publish workflow via changesets
- [ ] **CI-03**: Ubuntu + Node 20/22 + Chromium/Firefox/WebKit CI matrix

### Dev Tooling

- [ ] **DX-01**: Lefthook for git hooks (pre-commit: lint+test, commit-msg: commitlint)
- [ ] **DX-02**: Commitlint enforcing conventional commit format
- [ ] **DX-03**: README with quick start, API docs, browser support
- [ ] **DX-04**: MIT License

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Rich Content

- **RICH-01**: Copy rich content (HTML/images) via `copyRichContent()`
- **RICH-02**: Read rich content via `readRichContent()`

### Node.js Support

- **NODE-01**: Node.js clipboard support (system clipboard via platform commands)

### Framework Adapters

- **ADAPT-01**: React hook `useCopyToClipboard()`
- **ADAPT-02**: Vue composable `useCopyToClipboard()`

### Documentation

- **DOCS-01**: VitePress documentation site with guides, API docs, examples

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Transparent/auto execCommand fallback | Keeps modern API clean; fallback is explicit separate function |
| Polyfills for legacy browsers | Document limitations instead |
| CLI tool | No need identified |
| Vite playground | Rely on unit/E2E tests for v0.1.0 |
| clipboardchange events | Unstable spec, no cross-browser support |
| Clipboard polling | Anti-pattern, use events instead |
| Built-in copy UI components | Library, not UI kit |
| Automatic permission management | Respect browser security model, document limitations |
| Paste event handling | Different concern — DOM events, not Clipboard API |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUILD-01 | Phase 1 | Complete |
| BUILD-02 | Phase 1 | Complete |
| BUILD-03 | Phase 1 | Complete |
| BUILD-04 | Phase 1 | Complete |
| BUILD-05 | Phase 1 | Complete |
| DX-01 | Phase 1 | Pending |
| DX-02 | Phase 1 | Pending |
| DX-04 | Phase 1 | Pending |
| CLIP-01 | Phase 2 | Pending |
| CLIP-02 | Phase 2 | Pending |
| CLIP-03 | Phase 2 | Pending |
| DETECT-01 | Phase 2 | Pending |
| DETECT-02 | Phase 2 | Pending |
| DETECT-03 | Phase 2 | Pending |
| DETECT-04 | Phase 2 | Pending |
| ERR-01 | Phase 2 | Pending |
| ERR-02 | Phase 2 | Pending |
| TEST-01 | Phase 3 | Pending |
| TEST-02 | Phase 3 | Pending |
| CI-01 | Phase 3 | Pending |
| CI-02 | Phase 3 | Pending |
| CI-03 | Phase 3 | Pending |
| DX-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after roadmap creation*
