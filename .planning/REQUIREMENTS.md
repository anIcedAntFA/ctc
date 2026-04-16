# Requirements: Browser Utilities Library

**Defined:** 2026-04-16
**Core Value:** Developers can copy, read, and detect clipboard support in any browser environment with a single import — no framework lock-in, no bloat, no surprises. Framework adapter packages add idiomatic hooks/composables/actions on top of the same zero-dependency core.

## v0.4.0 Requirements

Requirements for the Rich Clipboard & Quality milestone. Each maps to roadmap phases.

### Architecture & Tooling

- [ ] **ARCH-01**: Developer can reason about `src/clipboard/` flat structure — rationale documented in KEY DECISIONS (no rich/ subfolder created)
- [ ] **ARCH-02**: CI runs attw + publint in a dedicated `validate` job (not buried in test job)
- [ ] **ARCH-03**: size-limit budget raised to 1.5KB gzip for `dist/clipboard/index.mjs` (rich clipboard doubles API surface)
- [ ] **ARCH-04**: `RICH_CLIPBOARD_NOT_SUPPORTED` error code added to `ErrorCode` union in `src/lib/types.ts`

### Rich Clipboard Core

- [ ] **RICH-01**: Developer can call `isRichClipboardSupported()` to detect ClipboardItem API availability (SSR-safe, returns boolean)
- [ ] **RICH-02**: Developer can call `copyRichContent(html, plainText, options?)` to write HTML + plain text via ClipboardItem (dual MIME always, returns boolean)
- [ ] **RICH-03**: Developer can call `readRichContent(options?)` to read rich clipboard content, receiving `{ html: string | null, text: string | null }`
- [ ] **RICH-04**: All three rich clipboard functions are SSR-safe (`typeof ClipboardItem !== 'undefined'` guard inside function body)
- [ ] **RICH-05**: All three rich clipboard functions accept `onError` callback with typed `BrowserUtilsError`
- [ ] **RICH-06**: Unit tests achieve 100% line + branch coverage on all new core functions

### Framework Adapters

- [ ] **ADPT-01**: React developer can call `useCopyRichContent()` hook returning `{ copyRich, copied, error, reset }` with auto-reset timeout
- [ ] **ADPT-02**: Vue developer can call `useCopyRichContent()` composable returning `{ copyRich, copied, error, reset }` as shallowRefs
- [ ] **ADPT-03**: Svelte developer can use `copyRichAction` Svelte action + runes variant exported from `/runes` subpath
- [ ] **ADPT-04**: All adapter packages maintain 100% branch coverage
- [ ] **ADPT-05**: All adapter packages remain under 2KB brotli after rich clipboard additions

### Benchmarks

- [ ] **BENCH-01**: `benchmarks/` workspace with Vitest bench configured and runnable via `pnpm bench`
- [ ] **BENCH-02**: Bundle size comparison table (gzip + brotli) vs `clipboard-copy` and `copy-to-clipboard` captured
- [ ] **BENCH-03**: Wrapper overhead benchmarks (mocked clipboard API) produce timing results via `vitest bench`
- [ ] **BENCH-04**: Results published in `BENCHMARKS.md` at repo root

## Future Requirements

Requirements acknowledged but deferred to v0.5.0+.

### Documentation Site

- **DOCS-01**: VitePress/Starlight docs site with API reference and guides
- **DOCS-02**: Interactive playground embedded in docs

### Extended Rich Clipboard

- **RICH-07**: `copyImageContent(imageBlob)` — write `image/png` via ClipboardItem
- **RICH-08**: `readRichContent` returns image blob when `image/png` is present
- **RICH-09**: `isRichClipboardMimeSupported(mimeType)` — public MIME-level detection

### CLI Code Generator

- **CLI-01**: `ctc` CLI generates adapter hooks/composables from predefined templates (shadcn-style)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Image clipboard (`image/png`) | App-specific blob handling; not a utility-library concern at this stage |
| `unsanitized` clipboard read flag | Browser-controlled sanitization; document behavior, don't circumvent |
| CI benchmark gates | Benchmark ops/sec varies across CI environments — not deterministic enough to gate on |
| CLI code generator | Explore-only idea for v0.4.0; no committed need identified yet |
| VitePress/Starlight docs site | Defer until API stabilises post-rich-clipboard |
| Server-side / Node-only utilities | Browser-only library |
| Polyfills for legacy browsers | Document limitations instead |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | Phase 9 | Pending |
| ARCH-02 | Phase 9 | Pending |
| ARCH-03 | Phase 9 | Pending |
| ARCH-04 | Phase 9 | Pending |
| RICH-01 | Phase 10 | Pending |
| RICH-02 | Phase 10 | Pending |
| RICH-03 | Phase 10 | Pending |
| RICH-04 | Phase 10 | Pending |
| RICH-05 | Phase 10 | Pending |
| RICH-06 | Phase 10 | Pending |
| ADPT-01 | Phase 11 | Pending |
| ADPT-02 | Phase 11 | Pending |
| ADPT-03 | Phase 11 | Pending |
| ADPT-04 | Phase 11 | Pending |
| ADPT-05 | Phase 11 | Pending |
| BENCH-01 | Phase 12 | Pending |
| BENCH-02 | Phase 12 | Pending |
| BENCH-03 | Phase 12 | Pending |
| BENCH-04 | Phase 12 | Pending |

**Coverage:**
- v0.4.0 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 after initial definition*
