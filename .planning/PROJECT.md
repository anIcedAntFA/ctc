# Browser Utilities Library

## What This Is

A modular, tree-shakeable browser utilities library starting with clipboard operations. Framework-agnostic core with zero dependencies, plus framework adapters for React, Vue, and Svelte. Published as `@ngockhoi96/ctc` (core) and `@ngockhoi96/ctc-react` / `@ngockhoi96/ctc-vue` / `@ngockhoi96/ctc-svelte` on npm. Monorepo structure with pnpm workspaces + Turborepo.

## Core Value

Developers can copy, read, and detect clipboard support in any browser environment with a single import — no framework lock-in, no bloat, no surprises. Framework adapter packages add idiomatic hooks/composables/actions on top of the same zero-dependency core.

## Requirements

### Validated

- ✓ TypeScript strict mode, full `.d.ts` declarations — v0.1.0 Phase 1
- ✓ ESM + CJS output via tsdown (Rolldown-based bundler) — v0.1.0 Phase 1
- ✓ Tree-shakeable with `"sideEffects": false` — v0.1.0 Phase 1
- ✓ Bundle size < 1KB gzip for core — v0.1.0 Phase 1
- ✓ MIT License — v0.1.0 Phase 1
- ✓ Semantic versioning (pre-1.0: breaking at minor) — v0.1.0 Phase 1
- ✓ `copyToClipboard(text, options?)` — copy text via modern Clipboard API — v0.1.0 Phase 2
- ✓ `readFromClipboard()` — read text from clipboard — v0.1.0 Phase 2
- ✓ `copyToClipboardLegacy()` — explicit execCommand fallback for HTTP/older browsers — v0.1.0 Phase 2
- ✓ `isClipboardSupported()` — detect Clipboard API availability (SSR-safe) — v0.1.0 Phase 2
- ✓ `isClipboardReadSupported()` — detect read permission availability (SSR-safe) — v0.1.0 Phase 2
- ✓ `onError` callback with typed `BrowserUtilsError` on all clipboard functions — v0.1.0 Phase 2
- ✓ SSR-safe guards (`typeof navigator !== 'undefined'`) — v0.1.0 Phase 2
- ✓ Unit tests (Vitest) — 100% line + branch coverage on core functions — v0.1.0 Phase 3
- ✓ E2E tests (Playwright) — Chromium, Firefox, WebKit — v0.1.0 Phase 3
- ✓ CI pipeline: lint → build → test → validate — v0.1.0 Phase 3
- ✓ Ubuntu + Node 20/22 + Chromium/Firefox/WebKit CI matrix — v0.1.0 Phase 3
- ✓ README with quick start, API docs, browser support table — v0.1.0 Phase 3
- ✓ npm publish workflow via changesets — v0.1.0 Phase 3
- ✓ pnpm workspaces + Turborepo monorepo; packages/core remains @ngockhoi96/ctc — v0.3.0 Phase 4
- ✓ Changesets in independent mode; each package versions separately — v0.3.0 Phase 4
- ✓ `@ngockhoi96/ctc-react` — useCopyToClipboard hook, 100% coverage, <1KB brotli — v0.3.0 Phase 5
- ✓ `@ngockhoi96/ctc-vue` — useCopyToClipboard composable, 100% coverage, <1KB brotli — v0.3.0 Phase 5
- ✓ `@ngockhoi96/ctc-svelte` — copyAction action + /stores + /runes subpaths, 100% coverage — v0.3.0 Phase 6
- ✓ Four playgrounds (vanilla/react/vue/svelte); vanilla doubles as Playwright E2E fixture — v0.3.0 Phase 7
- ✓ Hub README + per-package API docs + CONTRIBUTING.md + SECURITY.md + GitHub templates — v0.3.0 Phase 8
- ✓ Emoji changeset formatter (.changeset/changelog.cjs); changeset config schema resolved — v0.3.0 Phase 8

### Active

*(No active requirements — planning next milestone)*

### Out of Scope

- VitePress/Starlight documentation site — defer to v0.4.0+, README sufficient until API stabilises
- Rich content clipboard (`copyRichContent`, `readRichContent`) — defer to v0.4.0+, needs Clipboard Item API design
- Server-side / Node-only utilities — browser-only library
- Polyfills for legacy browsers — document limitations instead
- CLI tool — no real need identified
- Transparent/auto fallback — fallback is explicit, separate function
- `/stores` subpath demonstrated in playground/svelte — action + runes cover primary patterns; stores is Svelte 4+5 compat path

## Context

- **Motivation:** Learning the full JS library lifecycle (bundling, publishing, testing, CI/CD, API design, monorepo tooling) while building something genuinely useful for OSS.
- **Bundler choice:** tsdown over tsup because it wraps Rolldown — learning Rolldown internals with a stable API.
- **Error philosophy:** Functions return `boolean`/`null` for failures, never throw. Optional `onError` callback provides typed error details when callers need them.
- **Fallback strategy:** execCommand fallback is an explicit, separate function — keeps modern `copyToClipboard()` clean while providing HTTP/legacy escape hatch.
- **Adapter return type:** All three adapters return `{ copy, copied, error, reset }` — `reset` was added beyond the original spec (CONTEXT.md D-03) as a useful design improvement.
- **Competitive landscape:** Existing libs are either write-only (clipboard-copy), use deprecated APIs (copy-to-clipboard), or are framework-locked (@vueuse, usehooks-ts). This library targets the gap: framework-agnostic, modern, modular.
- **Current state (v0.3.0):** 4 published packages, 13 completed plans, ~3,659 TypeScript LOC across packages/. Monorepo fully operational with turbo pipeline, independent versioning, and full CI.

## Constraints

- **Zero dependencies**: Only browser native APIs — no runtime deps in package.json
- **Bundle size**: < 1KB gzip for core clipboard module; < 2KB for each adapter
- **Browser target**: ES2020+ (>95% global support)
- **Secure context**: Clipboard API requires HTTPS — detect and warn, fallback available separately
- **No default exports**: Named exports only, always

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| tsdown over tsup/raw Rolldown | Learn Rolldown internals via stable wrapper API | ✓ Good — fast builds, clean dual output |
| Explicit fallback function (not transparent) | Keep modern API clean; caller controls when to use deprecated path | ✓ Good — cleaner API surface |
| Include onError callbacks in v0.1.0 | Typed error codes provide actionable detail without throwing | ✓ Good — used in all adapters |
| Include read + legacy copy in v0.1.0 | Ship a complete clipboard module, not just write-only | ✓ Good — complete from day one |
| No execCommand auto-fallback | Separate function keeps API honest about what it uses | ✓ Good — API clarity maintained |
| Medium CI matrix (Ubuntu, Node 20/22, Chromium/Firefox/WebKit) | Lean enough to iterate fast, broad enough to catch real issues | ✓ Good — no false failures |
| README-only docs for v0.1.0–v0.3.0 | Defer docs site until API stabilises across all adapters | ✓ Good — avoids premature investment |
| pnpm workspaces + Turborepo for monorepo | Standard modern monorepo tooling; Turbo handles caching | ✓ Good — pipeline fast and reliable |
| Changesets independent mode | Each adapter versions separately; core changes don't force adapter bumps | ✓ Good — correct for this package topology |
| Adapter return type { copy, copied, error, reset } | reset() useful for programmatic state clearing beyond auto-timeout | ✓ Good — intentional improvement over 3-field spec |
| /stores + /runes as subpath exports (not separate packages) | Single @ngockhoi96/ctc-svelte package, consumers pick compatibility tier | ✓ Good — clean, standard subpath export pattern |
| playground/vanilla as E2E fixture replacement | Eliminates separate static HTML fixture; playground is always up-to-date | ✓ Good — single source of truth for E2E |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-14 after v0.3.0 milestone*
