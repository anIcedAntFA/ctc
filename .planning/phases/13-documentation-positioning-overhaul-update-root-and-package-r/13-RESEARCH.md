# Phase 13: Documentation & Positioning Overhaul - Research

**Researched:** 2026-04-17
**Domain:** Documentation, npm metadata, shields.io badges, competitor analysis
**Confidence:** HIGH (all findings verified from live sources or codebase inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01–D-07:** Badge updates (React, Vue, Svelte, TypeScript, npm downloads, tree-shakeable static, Codecov/placeholder, Release workflow) apply to root README only.
- **D-08–D-10:** BENCHMARKS.md gets new columns (API style, Last updated, TypeScript support, SSR-safe) + more libraries. Root README gets a short "Why ctc?" narrative (2–3 sentences) linking to BENCHMARKS.md — full table stays in BENCHMARKS.md.
- **D-11–D-14:** "Similar / Related Projects" section added to root README, grouped by framework: Framework-agnostic, React, Vue, Svelte. Neutral tone only.
- **D-15–D-18:** `keywords` + `description` updates to all five package.json files (root + core + react + vue + svelte). Root needs `homepage` + `repository` verified.
- **D-19–D-20:** CONTRIBUTING.md: explain esbuild role + verify `pnpm bench` and other commands are listed.
- **D-21–D-22:** CLAUDE.md: populate Conventions + Architecture sections.
- **D-23:** Commit `.planning/phases/11-framework-adapters/11-PATTERNS.md` (untracked).
- **D-24:** Create/update `doc-local/temp-plan.md` with esbuild answer + decision summary.
- **D-25:** Add emoji icon/logo to root README title.

### Claude's Discretion

- Exact badge order (group by: version → size → framework → quality → license)
- Specific wording of "Why ctc?" narrative
- Which Svelte community lib to reference if `svelte-use-copy` is unmaintained
- Whether to use static "100% coverage" badge or set up Codecov

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

This phase is entirely documentation and metadata — no source code changes. The core tasks are: (1) upgrade the root README with new badges, a "Why ctc?" positioning narrative, and a "Similar / Related Projects" section; (2) expand BENCHMARKS.md with competitor data; (3) update all five package.json files with keywords/descriptions; (4) populate CLAUDE.md's empty Conventions and Architecture sections; (5) add esbuild explanation to CONTRIBUTING.md; and (6) commit the untracked 11-PATTERNS.md artifact.

The research confirms: Codecov is NOT integrated (no codecov.yml, no Codecov step in ci.yml) — use a static coverage badge as placeholder per D-05. Competitor library data has been verified from npm registry. The esbuild role has been verified from source code inspection. All badge URL patterns are confirmed against shields.io conventions.

**Primary recommendation:** Plan this phase as a sequence of self-contained file edits, each committed independently. No dependencies between tasks except CLAUDE.md (which should be updated after seeing all other changes).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Badge URLs | Static docs | — | shields.io dynamic badges, no code layer |
| Competitor comparison | Static docs | — | BENCHMARKS.md is the canonical location |
| npm discoverability | Package metadata | — | keywords/description in package.json |
| Developer onboarding | Static docs | — | CONTRIBUTING.md + CLAUDE.md |
| Git hygiene | Version control | — | Commit untracked artifact |

---

## Project Constraints (from CLAUDE.md)

- Named exports only — no default exports (not applicable this phase)
- Zero runtime dependencies (not applicable this phase)
- Conventional commits: `feat/fix/chore/docs/test/ci(scope): description`
- Run `pnpm lint && pnpm test && pnpm build` before any commit
- Never commit to main directly
- ALWAYS verify tree-shaking after adding new exports (not applicable — no source changes)

---

## Standard Stack

No new libraries required. All work is file editing.

**Tools already in place:**
- shields.io (already used for existing badges) [VERIFIED: README.md line 5–8]
- GitHub Actions badge URL pattern already established [VERIFIED: README.md line 7]

---

## Verified Facts

### Codecov Integration Status
**NOT integrated.** [VERIFIED: codebase inspection]
- No `codecov.yml` or `.codecov.yml` at repo root
- No Codecov upload step in `.github/workflows/ci.yml`
- The CI workflow runs `pnpm turbo run test -- --coverage` but does not upload results anywhere
- **Consequence for D-05:** Use a static badge placeholder: `https://img.shields.io/badge/coverage-100%25-brightgreen`

### CI Workflow Badges
[VERIFIED: .github/workflows/ci.yml and README.md]
- CI badge already exists: `https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml/badge.svg`
- Release badge URL to add: `https://github.com/anIcedAntFA/ctc/actions/workflows/release.yml/badge.svg`
- Release workflow file confirmed: `.github/workflows/release.yml` exists

### esbuild Role in Benchmarks
[VERIFIED: benchmarks/scripts/measure-bundle-size.ts]
- esbuild is used **only for bundle size measurement** — it is the measurement instrument, not the build tool
- The script calls `buildSync({ bundle: true, minify: true, format: 'esm', platform: 'browser' })` to produce a single minified ESM bundle for each competitor library
- After building, Node.js `zlib.gzipSync` and `zlib.brotliCompressSync` measure compressed sizes
- The output feeds `BENCHMARKS.md`'s "Bundle Size Comparison" table
- tsdown remains the build tool for the library itself
- This distinction should be documented in CONTRIBUTING.md under a "Benchmarks" subsection

### Current package.json Keywords State
[VERIFIED: file inspection]

| Package | Has `keywords` | Current keywords |
|---------|---------------|-----------------|
| Root (`@ngockhoi96/ctc-monorepo`) | No | — |
| `@ngockhoi96/ctc` (core) | No | — |
| `@ngockhoi96/ctc-react` | No | — |
| `@ngockhoi96/ctc-vue` | No | — |
| `@ngockhoi96/ctc-svelte` | No | — |

No package has a `keywords` array. All need to be added fresh.

### Current package.json Descriptions
[VERIFIED: file inspection]

| Package | Current Description |
|---------|-------------------|
| Root | "pnpm + Turborepo monorepo for @ngockhoi96/ctc and future framework adapters" |
| Core | "Modular, tree-shakeable browser utilities library" |
| React | "React hook for @ngockhoi96/ctc clipboard utilities" |
| Vue | "Vue 3 composable for @ngockhoi96/ctc clipboard utilities" |
| Svelte | "Svelte action and reactive helpers for @ngockhoi96/ctc clipboard utilities" |

Root description is monorepo-internal and not end-user facing — needs update per D-16. Others are acceptable but terse.

### Current package.json `homepage` and `repository` Fields
[VERIFIED: file inspection]

| Package | homepage | repository |
|---------|----------|------------|
| Root | absent | present (`git+https://github.com/anIcedAntFA/ctc.git`) |
| Core | present (`https://github.com/anIcedAntFA/ctc#readme`) | present |
| React | present | present (with directory) |
| Vue | present | present (with directory) |
| Svelte | present | present (with directory) |

Root package.json is missing `homepage`. All others are fine.

### Competitor Library Data
[VERIFIED: npm registry, 2026-04-17]

| Library | Version | Last Published | TypeScript | SSR-safe | API Style |
|---------|---------|---------------|------------|----------|-----------|
| `clipboard-copy` | 4.0.1 | 2020-11-18 | No bundled types; no `@types` pkg | No (accesses DOM directly) | Function call |
| `copy-to-clipboard` | 3.3.3 | 2022-11-13 | Bundled `index.d.ts` | No (uses `document.execCommand`) | Function call |
| `react-copy-to-clipboard` | 5.1.1 | 2026-03-07 | Via `@types/react-copy-to-clipboard@5.0.7` | No — wraps `copy-to-clipboard` | Render-prop component |
| `usehooks-ts` | 3.1.1 | 2025-02-05 | Yes (TypeScript-native) | Partial — depends on hook usage | React hook |
| `@vueuse/core` | 14.2.1 | 2026-02-10 | Yes (TypeScript-native) | Partial — SSR guards per-composable | Vue composable |

**Notes:**
- `clipboard-copy` has no TypeScript types at all [VERIFIED: npm view clipboard-copy types = none, no @types package on registry]
- `copy-to-clipboard` ships `index.d.ts` but no typings field in package.json — types are included [VERIFIED: npm view copy-to-clipboard types = "index.d.ts"]
- `react-copy-to-clipboard` has no bundled types but `@types/react-copy-to-clipboard@5.0.7` exists [VERIFIED: npm registry]
- `usehooks-ts` and `@vueuse/core` are TypeScript-native but are large multi-utility packages (not clipboard-only) — different scope than ctc

### Current README Badge Row
[VERIFIED: README.md lines 5–8]
```
[![npm version](https://img.shields.io/npm/v/@ngockhoi96/ctc)](https://www.npmjs.com/package/@ngockhoi96/ctc)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@ngockhoi96/ctc)](https://bundlephobia.com/package/@ngockhoi96/ctc)
[![CI](https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml/badge.svg)](https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

### CONTRIBUTING.md Commands State
[VERIFIED: CONTRIBUTING.md inspection]
- `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, `pnpm validate` — all listed
- `pnpm bench` — **NOT listed** (added in Phase 12 alongside benchmarks workspace)
- `pnpm size` — **NOT listed** explicitly (present in package.json scripts)
- Need to add a "Benchmarks" section explaining `pnpm bench` and `pnpm size`

---

## Badge URL Patterns
[VERIFIED: shields.io conventions + existing README pattern]

Recommended badge row (ordered: version → size → framework → quality → license):

```markdown
[![npm version](https://img.shields.io/npm/v/@ngockhoi96/ctc)](https://www.npmjs.com/package/@ngockhoi96/ctc)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@ngockhoi96/ctc)](https://bundlephobia.com/package/@ngockhoi96/ctc)
[![npm downloads](https://img.shields.io/npm/dm/@ngockhoi96/ctc)](https://www.npmjs.com/package/@ngockhoi96/ctc)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB?logo=react)](https://www.npmjs.com/package/@ngockhoi96/ctc-react)
[![Vue](https://img.shields.io/badge/Vue-3%2B-4FC08D?logo=vue.js)](https://www.npmjs.com/package/@ngockhoi96/ctc-vue)
[![Svelte](https://img.shields.io/badge/Svelte-4%2B%20%7C%205-FF3E00?logo=svelte)](https://www.npmjs.com/package/@ngockhoi96/ctc-svelte)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![tree-shakeable](https://img.shields.io/badge/tree--shakeable-yes-brightgreen)](https://bundlephobia.com/package/@ngockhoi96/ctc)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](./packages/core)
[![CI](https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml/badge.svg)](https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml)
[![Release](https://github.com/anIcedAntFA/ctc/actions/workflows/release.yml/badge.svg)](https://github.com/anIcedAntFA/ctc/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

Notes:
- npm downloads badge: `img.shields.io/npm/dm/@ngockhoi96/ctc` — `dm` = monthly downloads [ASSUMED from shields.io convention — verify at shields.io/badges/npm-downloads if needed]
- Svelte badge shows "4+ | 5" to reflect the peer dep range `>=4.0.0` [VERIFIED: packages/svelte/package.json peerDependencies]
- Coverage badge is static (100%) — Codecov is not integrated, per finding above
- React badge version "18+" matches peer dep `>=18 <20` [VERIFIED: packages/react/package.json]

---

## Recommended Keywords Per Package

Based on D-15/D-18 decisions and package purpose:

**Root (monorepo, private — keywords less important but good hygiene):**
```json
["clipboard", "react", "vue", "svelte", "typescript", "tree-shakeable", "browser", "ssr-safe", "monorepo"]
```

**Core (`@ngockhoi96/ctc`):**
```json
["clipboard", "copy-to-clipboard", "read-clipboard", "clipboard-api", "browser", "typescript", "tree-shakeable", "ssr-safe", "zero-dependencies", "esm"]
```

**React (`@ngockhoi96/ctc-react`):**
```json
["clipboard", "react", "react-hook", "copy-to-clipboard", "typescript", "tree-shakeable", "ssr-safe"]
```

**Vue (`@ngockhoi96/ctc-vue`):**
```json
["clipboard", "vue", "vue3", "composable", "copy-to-clipboard", "typescript", "tree-shakeable", "ssr-safe"]
```

**Svelte (`@ngockhoi96/ctc-svelte`):**
```json
["clipboard", "svelte", "svelte-action", "svelte-runes", "copy-to-clipboard", "typescript", "tree-shakeable", "ssr-safe"]
```

---

## Recommended Description Updates

| Package | Recommended Description |
|---------|------------------------|
| Root | "Monorepo for @ngockhoi96/ctc — zero-dependency clipboard utilities with React, Vue, and Svelte adapters" |
| Core | "Zero-dependency clipboard utilities for modern browsers — copy, read, and detect support. SSR-safe, TypeScript-native, tree-shakeable." |
| React | "React hook for clipboard operations using @ngockhoi96/ctc — useCopyToClipboard with TypeScript, SSR-safe" |
| Vue | "Vue 3 composable for clipboard operations using @ngockhoi96/ctc — useCopyToClipboard as shallowRefs, SSR-safe" |
| Svelte | "Svelte action and runes for clipboard operations using @ngockhoi96/ctc — SSR-safe, TypeScript-native" |

---

## BENCHMARKS.md Expansion

### New columns to add to Bundle Size Comparison table

Per D-08, add: **API style**, **Last updated**, **TypeScript support**, **SSR-safe**

Extended table structure:
```markdown
| Package | Version | Raw | Gzip | Brotli | API Style | Last Updated | TypeScript | SSR-safe |
```

### Libraries to add per D-09

| Library | Version to use | Data source |
|---------|---------------|------------|
| `react-copy-to-clipboard` | 5.1.1 | Run measurement script |
| `usehooks-ts` | 3.1.1 | Run measurement script (clipboard module only if tree-shakeable) |
| `@vueuse/core` | 14.2.1 | Run measurement script (useClipboard only if tree-shakeable) |

**Planner note:** The bundle size for `usehooks-ts` and `@vueuse/core` should measure only the `useClipboard` export tree-shaken, not the whole package. The benchmarks/scripts/measure-bundle-size.ts script accepts an `entryPoint` — use the specific export path.

---

## CLAUDE.md Conventions Section (D-21)

Patterns confirmed from codebase that should be documented:

1. **Flat `src/clipboard/` structure** — all clipboard functions live flat in `src/clipboard/`, no subfolders. Rationale: keeps tree-shaking simple, avoids import path churn as API grows. (ARCH-01 requirement)
2. **Adapter return type shape** — all framework adapters return `{ copy/copyRich, copied, error, reset }` — consistent across React/Vue/Svelte hooks/composables/actions.
3. **esbuild-for-measurement vs tsdown-for-build** — esbuild is a devDependency in `benchmarks/` only, used to produce minified bundles for size comparison. The library itself is built with tsdown. Never confuse these roles.
4. **SSR guard pattern** — all functions guard with `typeof navigator !== 'undefined'` (or `typeof ClipboardItem !== 'undefined'` for rich clipboard) inside the function body. Never at module level.
5. **Error callback pattern** — `onError?: (error: BrowserUtilsError) => void` optional callback on all public functions; never throw for expected failures.

---

## CLAUDE.md Architecture Section (D-22)

Current monorepo shape (verified from filesystem):
```
packages/
  core/      — @ngockhoi96/ctc (clipboard utilities, zero deps)
  react/     — @ngockhoi96/ctc-react (React hook, peer: react >=18 <20)
  vue/       — @ngockhoi96/ctc-vue (Vue 3 composable, peer: vue >=3 <4)
  svelte/    — @ngockhoi96/ctc-svelte (Svelte action + runes/stores, peer: svelte >=4)
playground/  — standalone Vite apps per framework (dev only)
benchmarks/  — Vitest bench + bundle size measurement scripts
.changeset/  — versioning + changelog config
```

---

## Common Pitfalls

### Pitfall 1: Breaking existing badge row format
**What goes wrong:** Inserting new badges changes line count, breaking the tight badge row above the description.
**How to avoid:** Keep all badges on consecutive lines without blank lines between them. Test by viewing rendered markdown.

### Pitfall 2: Wrong package name in badges
**What goes wrong:** Using `@ngockhoi96/ctc-monorepo` (the root private package name) instead of `@ngockhoi96/ctc` in npm badges.
**How to avoid:** All npm badges reference `@ngockhoi96/ctc` (the published core package). Root package is private and not on npm.

### Pitfall 3: npm downloads badge for an early-stage package showing 0
**What goes wrong:** If the package has very low downloads, the downloads badge looks bad.
**How to avoid:** This is acceptable — it will grow. The decision (D-03) is locked. Use `dm` (monthly) rather than `dw` (weekly) to show a larger number.

### Pitfall 4: Claiming Codecov when it's not set up
**What goes wrong:** Adding a Codecov badge URL that returns "unknown" or broken image.
**How to avoid:** Use the static badge `https://img.shields.io/badge/coverage-100%25-brightgreen` until Codecov is integrated. Per D-05 this is explicitly allowed as a placeholder.

### Pitfall 5: Missing `pnpm bench` in CONTRIBUTING.md
**What goes wrong:** New contributors don't know how to run benchmarks.
**How to avoid:** Add a "Benchmarks" section to CONTRIBUTING.md after the "Running tests" section.

---

## Git Artifact

**Untracked file to commit:**
- `.planning/phases/11-framework-adapters/11-PATTERNS.md` — planning artifact from gsd-pattern-mapper agent, valid to track [VERIFIED: git status output in conversation context]

**Commit command:**
```bash
git add .planning/phases/11-framework-adapters/11-PATTERNS.md
git commit -m "docs(planning): add 11-PATTERNS.md framework adapter pattern map"
```

---

## Validation Architecture

> workflow.nyquist_validation status: not explicitly false in config — include section.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | packages/core/vitest.config.ts (per package) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test -- --coverage` |

### Phase Requirements → Test Map

This phase has no source code changes. No automated tests are required or applicable. All verification is manual review (visual inspection of rendered markdown, JSON validity of package.json edits).

| Req | Behavior | Test Type | Automated Command |
|-----|----------|-----------|-------------------|
| D-15–D-18 | package.json valid JSON after edits | manual | `node -e "JSON.parse(require('fs').readFileSync('packages/core/package.json','utf8'))"` |
| D-01–D-07 | Badge URLs resolve | manual | Open README in GitHub preview |

### Wave 0 Gaps
None — existing test infrastructure is sufficient. This phase does not require new test files.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is documentation and metadata edits only. No external runtime dependencies beyond git and a text editor.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `img.shields.io/npm/dm/` is the correct shields.io path for monthly downloads badge | Badge URL Patterns | Badge shows broken image — easy to fix |
| A2 | `svelte-use-copy` is the Svelte community library to reference (or note ecosystem is sparse) | Similar/Related Projects | Incorrect library recommended — low risk, neutral tone section |

---

## Open Questions

1. **Svelte community library for "Similar / Related Projects"**
   - What we know: The decision (D-14) suggests `svelte-use-copy` with a note if sparse
   - What's unclear: Whether `svelte-use-copy` is maintained or abandoned in 2026
   - Recommendation: Note the ecosystem is sparse; reference official Svelte docs for clipboard action pattern as the de-facto alternative

2. **Codecov future setup**
   - What we know: Not currently integrated
   - What's unclear: Whether the user wants Codecov set up in this phase or just the static badge
   - Recommendation: D-05 says "set up if not already done, or use static badge as placeholder" — research confirms it's NOT done, so use static badge and note Codecov setup as follow-up task. No Codecov integration in this phase.

---

## Sources

### Primary (HIGH confidence)
- Codebase files: README.md, BENCHMARKS.md, CONTRIBUTING.md, all package.json files — direct inspection
- `.github/workflows/ci.yml` — direct inspection (no Codecov step found)
- `benchmarks/scripts/measure-bundle-size.ts` — direct inspection (esbuild role confirmed)

### Secondary (MEDIUM confidence)
- npm registry (`npm view` commands) — competitor versions and publish dates verified live
- npm registry — TypeScript fields for competitor packages verified live

### Tertiary (LOW confidence — assumptions)
- shields.io badge URL path patterns (`/npm/dm/`) — based on training knowledge, not verified against shields.io docs this session [A1]

---

## Metadata

**Confidence breakdown:**
- Badge URLs: MEDIUM — patterns follow established conventions; exact shields.io paths are [ASSUMED] for the new badges
- Competitor data: HIGH — verified from npm registry live
- Codecov status: HIGH — verified by absence in codebase
- esbuild role: HIGH — verified from source code
- package.json current state: HIGH — verified from file inspection

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (competitor publish dates may change; npm data is live)
