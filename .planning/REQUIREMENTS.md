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

- [ ] **BUILD-01**: ESM + CJS + .d.ts output via tsdown
- [ ] **BUILD-02**: Tree-shakeable with `"sideEffects": false`
- [ ] **BUILD-03**: Core bundle < 1KB gzip
- [ ] **BUILD-04**: package.json exports map (root + clipboard subpath)
- [ ] **BUILD-05**: Validated with publint + arethetypeswrong

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
| CLIP-01 | Pending | Pending |
| CLIP-02 | Pending | Pending |
| CLIP-03 | Pending | Pending |
| DETECT-01 | Pending | Pending |
| DETECT-02 | Pending | Pending |
| DETECT-03 | Pending | Pending |
| DETECT-04 | Pending | Pending |
| ERR-01 | Pending | Pending |
| ERR-02 | Pending | Pending |
| BUILD-01 | Pending | Pending |
| BUILD-02 | Pending | Pending |
| BUILD-03 | Pending | Pending |
| BUILD-04 | Pending | Pending |
| BUILD-05 | Pending | Pending |
| TEST-01 | Pending | Pending |
| TEST-02 | Pending | Pending |
| CI-01 | Pending | Pending |
| CI-02 | Pending | Pending |
| CI-03 | Pending | Pending |
| DX-01 | Pending | Pending |
| DX-02 | Pending | Pending |
| DX-03 | Pending | Pending |
| DX-04 | Pending | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 0
- Unmapped: 23 ⚠️

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after initial definition*
