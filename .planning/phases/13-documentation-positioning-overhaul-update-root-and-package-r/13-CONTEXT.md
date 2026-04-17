# Phase 13: Documentation & Positioning Overhaul - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve discoverability, positioning, and accuracy of all published documentation — root README, per-package READMEs, BENCHMARKS.md, CONTRIBUTING.md, CLAUDE.md, and package.json metadata. No source code changes. Includes fixing the untracked 11-PATTERNS.md git artifact and answering the open esbuild question.

</domain>

<decisions>
## Implementation Decisions

### Badges (root README only)

- **D-01:** Add framework compatibility badges for all three adapter packages: React, Vue, Svelte (separate badges, not combined).
- **D-02:** Add TypeScript badge (signals strict TS, no `any`).
- **D-03:** Add npm downloads badge (`img.shields.io/npm/dm/@ngockhoi96/ctc`) for social proof.
- **D-04:** Add tree-shakeable static badge (`tree-shakeable | yes`).
- **D-05:** Add Codecov/coverage badge (requires Codecov integration — set up if not already done, or use a coverage static badge as placeholder).
- **D-06:** Add Release workflow badge (for `release.yml`). CI badge already exists; keep it.
- **D-07:** Badge updates apply to root README only — per-package READMEs are more API-focused and do not need badge updates.

### Library Comparison (BENCHMARKS.md expansion)

- **D-08:** Expand BENCHMARKS.md comparison table with four additional columns: **API style**, **Last updated / maintenance status**, **TypeScript support**, **SSR-safe**.
- **D-09:** Add these libraries to the comparison: `react-copy-to-clipboard`, `usehooks-ts` (clipboard hook), `@vueuse/core` (useClipboard), and one or two other micro-libs (tinykeys or similar as available data allows).
- **D-10:** Framing in root README: short narrative "Why ctc?" intro (2-3 sentences) followed by a reference to BENCHMARKS.md for the full comparison table. Do NOT put the full comparison table in README — BENCHMARKS.md is the canonical location.

### Similar / Related Projects Section (root README)

- **D-11:** Add a new "Similar / Related Projects" section to root README.
- **D-12:** Structure: grouped by framework type. Subsections: "Framework-agnostic", "React", "Vue", "Svelte".
- **D-13:** Tone: neutral reference list. Each entry gets a short factual description — no comparison language. (The BENCHMARKS.md table handles explicit comparison.)
- **D-14:** Libraries to include:
  - Framework-agnostic: `clipboard-copy`, `copy-to-clipboard`
  - React: `react-copy-to-clipboard`, `usehooks-ts` (useClipboard), `react-use` (useClipboard)
  - Vue: `@vueuse/core` (useClipboard)
  - Svelte: community libs such as `svelte-use-copy` (note if ecosystem is sparse)

### package.json Updates

- **D-15:** Root `package.json`: add `keywords` array — include: `clipboard`, `react`, `vue`, `svelte`, `typescript`, `tree-shakeable`, `browser`, `ssr-safe`, `monorepo`.
- **D-16:** Root `package.json`: update `description` to something more end-user facing (current is monorepo-internal: "pnpm + Turborepo monorepo...").
- **D-17:** Root `package.json`: add or verify `homepage` and `repository` fields point to GitHub.
- **D-18:** Mirror keyword/description updates to each package's `package.json` (core, react, vue, svelte).

### CONTRIBUTING.md Updates

- **D-19:** Add a clear explanation of why `esbuild` is in `devDependencies`: it is the bundle size *measurement* tool (produces a minified ESM bundle for esbuild+zlib size measurement against competitors), not the build tool — tsdown builds the library. This answers the open question from `doc-local/discuss.md`.
- **D-20:** Verify and update all pnpm commands listed in CONTRIBUTING are current (`pnpm bench`, `pnpm size`, etc. from v0.4.0 additions).

### CLAUDE.md Updates

- **D-21:** Populate the "Conventions" section with patterns that emerged from v0.4.0 development (e.g., flat `src/clipboard/` structure rule, adapter return type `{ copy, copied, error, reset }`, esbuild-for-measurement vs tsdown-for-build distinction).
- **D-22:** Populate the "Architecture" section with the current monorepo shape: packages/core, packages/react, packages/vue, packages/svelte, playground/, benchmarks/.

### Git Artifact Fix

- **D-23:** Commit the untracked file `.planning/phases/11-framework-adapters/11-PATTERNS.md` — it is a valid planning artifact (pattern map from the gsd-pattern-mapper agent) and should be tracked.

### doc-local/temp-plan.md

- **D-24:** Create or update `doc-local/temp-plan.md` with answers to the questions in `doc-local/discuss.md` (particularly the esbuild explanation) and a summary of decisions made in this context phase.

### Root README: Emoji Icon

- **D-25:** Add an emoji icon/logo to the root README title (e.g., 📋 or 🗂️) — consistent with the request in `doc-local/discuss.md`.

### Claude's Discretion

- Exact badge order in the badge row (group by category: version → size → framework → quality → license)
- Specific wording of the "Why ctc?" narrative (2-3 sentences)
- Which Svelte community lib to reference if `svelte-use-copy` is no longer maintained
- Whether Codecov is already integrated — if not, use a static "100% coverage" badge as a placeholder and note Codecov setup as a follow-up

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source of requirements
- `doc-local/discuss.md` — Original questions and task list that defines this phase's scope
- `doc-local/temp-plan.md` — Existing Q&A context (read before updating)

### Current docs to update
- `README.md` — Root README (current state: version/size/CI/MIT badges, packages table, quick start)
- `BENCHMARKS.md` — Current bundle size + ops/sec table (needs new columns + more libraries)
- `CONTRIBUTING.md` — Contributor guide (needs esbuild explanation + command updates)
- `CLAUDE.md` — Project instructions (conventions + architecture sections are empty)

### Per-package READMEs and package.json files
- `packages/core/README.md`, `packages/core/package.json`
- `packages/react/README.md`, `packages/react/package.json`
- `packages/vue/README.md`, `packages/vue/package.json`
- `packages/svelte/README.md`, `packages/svelte/package.json`

### Git artifact to commit
- `.planning/phases/11-framework-adapters/11-PATTERNS.md` — untracked planning artifact

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BENCHMARKS.md` — already has bundle size table and ops/sec table; expand in place
- `README.md` — existing badge row and packages table; extend, don't replace
- `.github/workflows/ci.yml` — badge URL: `https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml/badge.svg`
- `.github/workflows/release.yml` — badge URL: `https://github.com/anIcedAntFA/ctc/actions/workflows/release.yml/badge.svg`

### Established Patterns
- Badges use `img.shields.io` — keep consistent
- README quick start shows TypeScript import style — maintain
- CONTRIBUTING.md structure: setup → commands → PR workflow (preserve, extend)

### Integration Points
- Codecov: needs a `.codecov.yml` or token if not already integrated — check `codecov.yml` existence before adding coverage badge
- npm downloads badge links to `@ngockhoi96/ctc` — verify package name spelling in all badges

</code_context>

<specifics>
## Specific Ideas

- "Add emoji icon in root README.md" — user explicitly asked for this (doc-local/discuss.md)
- Libraries like `copy-to-clipboard` and `clipboard-copy` have high downloads but are old — the comparison table should include the last commit date or maintenance status to surface this
- "Clarify the comparison so users can clearly see the strengths of our library" — the "Why ctc?" narrative in README should specifically call out: modern Clipboard API, SSR-safe, TypeScript-native, multi-framework, tree-shakeable
- `doc-local/temp-plan.md` should be updated with answers to the discuss.md questions (as a Q&A document, in Vietnamese as the existing content suggests)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-documentation-positioning-overhaul*
*Context gathered: 2026-04-17*
