# Browser Utilities Library

## What This Is

A modular, tree-shakeable browser utilities library starting with clipboard operations. Framework-agnostic core with zero dependencies, designed to scale into storage, media, DOM, and other browser APIs over time. Published as an npm package (name TBD — "cttc" is a placeholder).

## Core Value

Developers can copy, read, and detect clipboard support in any browser environment with a single import — no framework lock-in, no bloat, no surprises.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] `copyToClipboard(text, options?)` — copy text to clipboard via modern Clipboard API
- [ ] `readFromClipboard()` — read text from clipboard
- [ ] `copyRichContent(data)` — copy HTML/images to clipboard
- [ ] `isClipboardSupported()` — detect Clipboard API availability
- [ ] `isClipboardReadSupported()` — detect read permission availability
- [ ] Explicit execCommand fallback function for HTTP/older browser compatibility
- [ ] `onError` callback with typed error codes (`BrowserUtilsError`) on all clipboard functions
- [ ] SSR-safe guards (`typeof navigator !== 'undefined'`)
- [ ] TypeScript strict mode, full `.d.ts` declarations
- [ ] ESM + CJS output via tsdown (Rolldown-based bundler)
- [ ] Tree-shakeable with `"sideEffects": false`
- [ ] Bundle size < 1KB gzip for core
- [ ] Unit tests (Vitest) — 100% coverage on core functions
- [ ] E2E tests (Playwright) — Chromium + Firefox
- [ ] CI pipeline: lint (Biome) → build (tsdown) → test (Vitest + Playwright) → validate (publint, size-limit, attw)
- [ ] Ubuntu + Node 20/22 + Chromium/Firefox CI matrix
- [ ] README with quick start, API docs, browser support table
- [ ] MIT License
- [ ] npm publish workflow via changesets
- [ ] Semantic versioning (pre-1.0: breaking at minor)

### Out of Scope

- VitePress/Starlight documentation site — defer to v0.2.0+, README sufficient for v0.1.0
- React hook (`useCopyToClipboard`) — Phase 2, v0.2.0+
- Vue composable — Phase 2, v0.2.0+
- Monorepo migration — only when framework adapters are needed
- Vite playground/demo — rely on unit/E2E tests
- Server-side / Node-only utilities — browser-only library
- Polyfills for legacy browsers — document limitations instead
- CLI tool — no real need identified
- Transparent/auto fallback — fallback is explicit, separate function

## Context

- **Motivation:** Learning the full JS library lifecycle (bundling, publishing, testing, CI/CD, API design) while building something genuinely useful for OSS.
- **Bundler choice:** tsdown over tsup because it wraps Rolldown — learning Rolldown internals with a stable API.
- **Error philosophy:** Functions return `boolean`/`null` for failures, never throw. Optional `onError` callback provides typed error details when callers need them.
- **Fallback strategy:** execCommand fallback is an explicit, separate function — keeps modern `copyToClipboard()` clean while providing HTTP/legacy escape hatch.
- **Competitive landscape:** Existing libs are either write-only (clipboard-copy), use deprecated APIs (copy-to-clipboard), or are framework-locked (@vueuse, usehooks-ts). This library targets the gap: framework-agnostic, modern, modular.
- **Package name:** "cttc" is a placeholder. Final name TBD before npm publish.

## Constraints

- **Zero dependencies**: Only browser native APIs — no runtime deps in package.json
- **Bundle size**: < 1KB gzip for core clipboard module
- **Browser target**: ES2020+ (>95% global support)
- **Secure context**: Clipboard API requires HTTPS — detect and warn, fallback available separately
- **No default exports**: Named exports only, always

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| tsdown over tsup/raw Rolldown | Learn Rolldown internals via stable wrapper API | — Pending |
| Explicit fallback function (not transparent) | Keep modern API clean; caller controls when to use deprecated path | — Pending |
| Include onError callbacks in v0.1.0 | Typed error codes provide actionable detail without throwing | — Pending |
| Include read + rich copy in v0.1.0 | Ship a complete clipboard module, not just write-only | — Pending |
| No execCommand auto-fallback | Separate function keeps API honest about what it uses | — Pending |
| Medium CI matrix (Ubuntu, Node 20/22, Chromium/Firefox) | Lean enough to iterate fast, broad enough to catch real issues | — Pending |
| README-only docs for v0.1.0 | Defer docs site until API stabilizes | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-08 after initialization*
