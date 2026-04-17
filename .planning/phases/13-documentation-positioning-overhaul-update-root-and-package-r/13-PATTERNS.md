# Phase 13: Documentation & Positioning Overhaul - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 10 (2 new, 8 modified)
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `README.md` | doc-update (root readme) | N/A | `README.md` (current) | exact — extend in place |
| `BENCHMARKS.md` | doc-update (comparison table) | N/A | `BENCHMARKS.md` (current) | exact — extend in place |
| `CONTRIBUTING.md` | doc-update (contributor guide) | N/A | `CONTRIBUTING.md` (current) | exact — extend in place |
| `CLAUDE.md` | doc-update (project instructions) | N/A | `CLAUDE.md` (current) | exact — fill empty sections |
| `package.json` (root) | metadata-update | N/A | `packages/core/package.json` | role-match (published pkg has keywords pattern) |
| `packages/core/package.json` | metadata-update | N/A | `packages/react/package.json` | exact — same structure |
| `packages/react/package.json` | metadata-update | N/A | `packages/react/package.json` (current) | exact — add keywords |
| `packages/vue/package.json` | metadata-update | N/A | `packages/vue/package.json` (current) | exact — add keywords |
| `packages/svelte/package.json` | metadata-update | N/A | `packages/svelte/package.json` (current) | exact — add keywords |
| `doc-local/temp-plan.md` | doc-update (Q&A notes) | N/A | `doc-local/temp-plan.md` (current) | exact — append new Q&A section |

---

## Pattern Assignments

### `README.md` (doc-update, root readme)

**Analog:** `README.md` (current state, lines 1–69)

**Title pattern** (line 1) — current title has no emoji:
```markdown
# @ngockhoi96/ctc
```
New pattern — add emoji (D-25), following per-package README convention (packages/core/README.md line 1 uses 📋, packages/react uses ⚛️):
```markdown
# 📋 @ngockhoi96/ctc
```

**Badge row pattern** (lines 5–8) — current 4 badges, all on consecutive lines, no blank lines:
```markdown
[![npm version](https://img.shields.io/npm/v/@ngockhoi96/ctc)](https://www.npmjs.com/package/@ngockhoi96/ctc)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@ngockhoi96/ctc)](https://bundlephobia.com/package/@ngockhoi96/ctc)
[![CI](https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml/badge.svg)](https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```
New pattern — replace the 4-badge block with 12-badge block, same consecutive-line format (D-01 through D-07), ordered version → size → downloads → framework → quality → license:
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
Key rules:
- All badges on consecutive lines — no blank lines between (Pitfall 1 from RESEARCH.md)
- All npm badges reference `@ngockhoi96/ctc` not `@ngockhoi96/ctc-monorepo` (Pitfall 2)
- Coverage badge is static (Pitfall 4 — Codecov not integrated)

**"Why ctc?" positioning narrative** (new section, insert after badge row, before ## Packages) — D-10:
```markdown
> **Why ctc?** Modern Clipboard API under the hood, SSR-safe out of the box, TypeScript-native with zero `any`, multi-framework adapters that share a zero-dependency core, and fully tree-shakeable. [See full comparison →](./BENCHMARKS.md)
```
Pattern: blockquote-style short narrative, reference to BENCHMARKS.md for the table, do NOT include the full comparison table in README.

**"Similar / Related Projects" section** (new section, add at end before ## License) — D-11 through D-14.
Section structure pattern from RESEARCH.md decisions:
```markdown
## Similar / Related Projects

### Framework-agnostic
- [**clipboard-copy**](https://github.com/feross/clipboard-copy) — ...
- [**copy-to-clipboard**](https://github.com/sudodoki/copy-to-clipboard) — ...

### React
- [**react-copy-to-clipboard**](https://github.com/nkbt/react-copy-to-clipboard) — ...
- [**usehooks-ts** `useClipboard`](https://usehooks-ts.com/react-hook/use-clipboard) — ...
- [**react-use** `useClipboard`](https://github.com/streamich/react-use) — ...

### Vue
- [**@vueuse/core** `useClipboard`](https://vueuse.org/core/useClipboard/) — ...

### Svelte
- _The Svelte clipboard ecosystem is sparse. The [Svelte docs](https://svelte.dev/docs/svelte-action) show how to build a clipboard action natively; no widely-maintained dedicated library exists as of 2026._
```
Tone: neutral factual descriptions — no comparison language. Comparison language stays in BENCHMARKS.md only.

---

### `BENCHMARKS.md` (doc-update, comparison table)

**Analog:** `BENCHMARKS.md` (current, lines 1–36)

**Current bundle size table header** (lines 7–12):
```markdown
| Package | Version | Raw | Gzip | Brotli |
|---------|---------|-----|------|--------|
| @ngockhoi96/ctc | 0.2.2 | 4.52 KB | 1.17 KB | 0.99 KB |
| clipboard-copy | 4.0.1 | 0.93 KB | 0.53 KB | 0.43 KB |
| copy-to-clipboard | 3.3.3 | 2.23 KB | 1.06 KB | 0.88 KB |
```

**New table header pattern** — add four columns to the right (D-08), add three new library rows (D-09):
```markdown
| Package | Version | Raw | Gzip | Brotli | API Style | Last Updated | TypeScript | SSR-safe |
|---------|---------|-----|------|--------|-----------|--------------|------------|----------|
| @ngockhoi96/ctc | 0.2.2 | 4.52 KB | 1.17 KB | 0.99 KB | Function / Hook / Composable | Active | Native (strict) | Yes |
| clipboard-copy | 4.0.1 | 0.93 KB | 0.53 KB | 0.43 KB | Function call | 2020-11-18 | No | No |
| copy-to-clipboard | 3.3.3 | 2.23 KB | 1.06 KB | 0.88 KB | Function call | 2022-11-13 | Bundled index.d.ts | No (execCommand) |
| react-copy-to-clipboard | 5.1.1 | TBD | TBD | TBD | Render-prop component | 2026-03-07 | @types pkg | No |
| usehooks-ts (useClipboard) | 3.1.1 | TBD | TBD | TBD | React hook | 2025-02-05 | Native | Partial |
| @vueuse/core (useClipboard) | 14.2.1 | TBD | TBD | TBD | Vue composable | 2026-02-10 | Native | Partial |
```
Notes:
- TBD bundle size values should be filled by running `pnpm bench` after adding entries to the benchmark config
- "Last Updated" = last npm publish date from npm registry (verified in RESEARCH.md)
- Extend in place — do NOT replace or restructure the `## Core Function Performance` and `## React Adapter Overhead` sections

**Methodology section** (lines 32–36) — keep as-is. The esbuild explanation belongs in CONTRIBUTING.md, not here.

---

### `CONTRIBUTING.md` (doc-update, contributor guide)

**Analog:** `CONTRIBUTING.md` (current, lines 1–136)

**Existing "Running tests" section pattern** (lines 26–44) — new section follows same style: bash code block + explanatory prose:
```markdown
## 🧪 Running tests

From the repo root, all tasks are orchestrated by Turborepo:

```bash
pnpm lint          # biome check across all packages
pnpm test          # vitest unit tests across all packages
...
```
```

**New "Benchmarks" section pattern** (insert after "Running tests", before "Adding a new package") — D-19, D-20:
```markdown
## 📊 Benchmarks

Run all benchmarks from the repo root:

```bash
pnpm bench         # vitest bench (performance) + bundle size measurement
pnpm size          # size-limit check against thresholds in package.json
```

To run benchmarks for a single package:

```bash
pnpm --filter @ngockhoi96/ctc bench
```

### Why is esbuild in devDependencies?

`esbuild` appears in `benchmarks/package.json` devDependencies but is **not** the library's build tool — that is [tsdown](https://github.com/sxzz/tsdown).

`esbuild` is used exclusively as a **bundle size measurement instrument** inside `benchmarks/scripts/measure-bundle-size.ts`. The script calls `esbuild.buildSync({ bundle: true, minify: true, format: 'esm', platform: 'browser' })` to produce a single minified ESM bundle for each competitor library, then measures compressed size with Node.js `zlib.gzipSync` and `zlib.brotliCompressSync`. The results feed the Bundle Size Comparison table in `BENCHMARKS.md`.

**Role summary:**
- `tsdown` — builds the library output in `dist/` for publication
- `esbuild` — measures minified competitor bundles for `BENCHMARKS.md` only
```

---

### `CLAUDE.md` (doc-update, project instructions)

**Analog:** `CLAUDE.md` (current, lines 73–83) — the two empty GSD-managed sections.

**Current empty Conventions block** (lines 73–77):
```markdown
<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->
```

**New Conventions content pattern** (replace the placeholder text inside the GSD block markers, D-21):
```markdown
<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

1. **Flat `src/clipboard/` structure** — all clipboard functions live flat in `src/clipboard/`, no subfolders. Rationale: keeps tree-shaking simple and avoids import path churn.
2. **Adapter return type shape** — all framework adapters return `{ copy/copyRich, copied, error, reset }` consistently across React hook, Vue composable, and Svelte action.
3. **esbuild-for-measurement vs tsdown-for-build** — `esbuild` (in `benchmarks/`) measures competitor bundle sizes. `tsdown` builds the library. Never confuse these roles.
4. **SSR guard pattern** — all public functions guard with `typeof navigator !== 'undefined'` (or `typeof ClipboardItem !== 'undefined'` for rich clipboard) inside the function body, not at module level.
5. **Error callback pattern** — `onError?: (error: BrowserUtilsError) => void` optional callback on all public functions. Never throw for expected failures.
<!-- GSD:conventions-end -->
```
Important: preserve the `<!-- GSD:conventions-start ... -->` and `<!-- GSD:conventions-end -->` HTML comment markers exactly — they are managed by the GSD toolchain.

**Current empty Architecture block** (lines 79–83):
```markdown
<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->
```

**New Architecture content pattern** (replace placeholder text, D-22):
```markdown
<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Current monorepo shape:

```
packages/
  core/      — @ngockhoi96/ctc (clipboard utilities, zero deps)
  react/     — @ngockhoi96/ctc-react (React hook, peer: react >=18 <20)
  vue/       — @ngockhoi96/ctc-vue (Vue 3 composable, peer: vue >=3 <4)
  svelte/    — @ngockhoi96/ctc-svelte (Svelte action + runes/stores, peer: svelte >=4)
playground/  — standalone Vite apps per framework (dev only, not published)
benchmarks/  — Vitest bench + bundle size measurement scripts (not published)
.changeset/  — versioning + changelog config (independent mode)
```

All packages are independently versioned via changesets. The CI pipeline runs lint → test → test:e2e → build → validate on every PR.
<!-- GSD:architecture-end -->
```

---

### `package.json` root (metadata-update)

**Analog:** `packages/core/package.json` lines 1–18 (published package with description/homepage/repository fields)

**Current root state** (lines 1–11):
```json
{
  "name": "@ngockhoi96/ctc-monorepo",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.29.3",
  "description": "pnpm + Turborepo monorepo for @ngockhoi96/ctc and future framework adapters",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/anIcedAntFA/ctc.git"
  },
```

**New fields to insert** (D-15, D-16, D-17) — insert after `"description"`, before `"repository"`:
```json
"description": "Monorepo for @ngockhoi96/ctc — zero-dependency clipboard utilities with React, Vue, and Svelte adapters",
"homepage": "https://github.com/anIcedAntFA/ctc#readme",
"repository": {
  "type": "git",
  "url": "git+https://github.com/anIcedAntFA/ctc.git"
},
"keywords": [
  "clipboard",
  "react",
  "vue",
  "svelte",
  "typescript",
  "tree-shakeable",
  "browser",
  "ssr-safe",
  "monorepo"
],
```
Note: `homepage` is absent in root currently (RESEARCH.md verified) — add it. `repository` already exists — keep value, just ensure it stays in correct position. `keywords` does not exist — add fresh array.

---

### `packages/core/package.json` (metadata-update)

**Analog:** `packages/react/package.json` (same structure — both are published packages with description/homepage/repository)

**Current core state** (lines 7–8):
```json
"description": "Modular, tree-shakeable browser utilities library",
```
No `keywords` field exists.

**New fields to add** (D-18) — insert `keywords` after `description`:
```json
"description": "Zero-dependency clipboard utilities for modern browsers — copy, read, and detect support. SSR-safe, TypeScript-native, tree-shakeable.",
"keywords": [
  "clipboard",
  "copy-to-clipboard",
  "read-clipboard",
  "clipboard-api",
  "browser",
  "typescript",
  "tree-shakeable",
  "ssr-safe",
  "zero-dependencies",
  "esm"
],
```
`homepage` and `repository` are already present — no change needed.

---

### `packages/react/package.json` (metadata-update)

**Current state** (line 7):
```json
"description": "React hook for @ngockhoi96/ctc clipboard utilities",
```
No `keywords` field.

**New fields to add** (D-18) — same position as core (after `"description"`):
```json
"description": "React hook for clipboard operations using @ngockhoi96/ctc — useCopyToClipboard with TypeScript, SSR-safe",
"keywords": [
  "clipboard",
  "react",
  "react-hook",
  "copy-to-clipboard",
  "typescript",
  "tree-shakeable",
  "ssr-safe"
],
```

---

### `packages/vue/package.json` (metadata-update)

**Current state** (line 7):
```json
"description": "Vue 3 composable for @ngockhoi96/ctc clipboard utilities",
```
No `keywords` field.

**New fields to add** (D-18):
```json
"description": "Vue 3 composable for clipboard operations using @ngockhoi96/ctc — useCopyToClipboard as shallowRefs, SSR-safe",
"keywords": [
  "clipboard",
  "vue",
  "vue3",
  "composable",
  "copy-to-clipboard",
  "typescript",
  "tree-shakeable",
  "ssr-safe"
],
```

---

### `packages/svelte/package.json` (metadata-update)

**Current state** (line 7):
```json
"description": "Svelte action and reactive helpers for @ngockhoi96/ctc clipboard utilities",
```
No `keywords` field.

**New fields to add** (D-18):
```json
"description": "Svelte action and runes for clipboard operations using @ngockhoi96/ctc — SSR-safe, TypeScript-native",
"keywords": [
  "clipboard",
  "svelte",
  "svelte-action",
  "svelte-runes",
  "copy-to-clipboard",
  "typescript",
  "tree-shakeable",
  "ssr-safe"
],
```

---

### `doc-local/temp-plan.md` (doc-update, Q&A notes)

**Analog:** `doc-local/temp-plan.md` (current, lines 1–272) — Vietnamese Q&A document with H2 question blocks and table-based action items.

**Current document pattern** (lines 1–6):
```markdown
# Giải đáp các câu hỏi về publish, dist, releases

> Ngày: 2026-04-14  
> Tham chiếu: doc-local/discuss.md
```
Each question follows `## Q{N}. Title` heading with answer body.

**New section pattern** (D-24) — append a new section at the end, following same Vietnamese Q&A style:
```markdown
## Q7. Tại sao `esbuild` có trong devDependencies khi đang dùng `tsdown`?

(Vietnamese explanation of esbuild-for-measurement vs tsdown-for-build, matching the Q&A style of existing sections)

---

## Phase 13 Decision Summary

(Brief Vietnamese summary of the decisions made in CONTEXT.md for this phase)
```
Key pattern constraints: maintain Vietnamese language, maintain `## Q{N}.` heading format, maintain horizontal rule `---` separators between questions.

---

## Shared Patterns

### JSON insertion position
**Source:** All `packages/*/package.json` files
**Apply to:** All five package.json updates
The `keywords` array must be inserted immediately after the `"description"` field and before `"homepage"` (or before `"repository"` for root). All package.json files in this project use tab indentation. Example from `packages/core/package.json` lines 6–9:
```json
  "description": "Modular, tree-shakeable browser utilities library",
  "homepage": "https://github.com/anIcedAntFA/ctc#readme",
  "repository": {
```
The new pattern inserts `keywords` array between `description` and `homepage`:
```json
  "description": "...",
  "keywords": ["..."],
  "homepage": "...",
  "repository": {
```

### Markdown section ordering
**Source:** `README.md` (current, lines 1–69)
**Apply to:** All README additions
Existing section order: Title → Tagline → Badges → Callout → Packages → Quick Start → Monorepo Structure → Browser Support → License.
New sections insert as: Title (with emoji) → Tagline → Badges → "Why ctc?" narrative → Packages → Quick Start → Monorepo Structure → Browser Support → "Similar / Related Projects" → License.

### GSD block markers in CLAUDE.md
**Source:** `CLAUDE.md` (current, lines 73–83)
**Apply to:** Conventions and Architecture section edits
The GSD-managed sections use HTML comment markers:
```
<!-- GSD:conventions-start source:CONVENTIONS.md -->
...content...
<!-- GSD:conventions-end -->
```
Only replace the inner content text. Never remove or alter the comment markers themselves.

### CONTRIBUTING.md emoji section headers
**Source:** `CONTRIBUTING.md` (current, lines 1–136)
**Apply to:** New "Benchmarks" section
All existing sections use emoji prefixes: `## 🛠️ Prerequisites`, `## 🚀 Setup`, `## 🧪 Running tests`, `## 📁 Adding a new package`, `## 📝 Creating a changeset`, `## 🚢 Release flow`, `## 🎨 Code style`.
New section should follow this pattern: `## 📊 Benchmarks`.

---

## No Analog Found

All files in this phase have direct analogs. No files require fallback to RESEARCH.md-only patterns.

---

## Git Artifact Task

**File:** `.planning/phases/11-framework-adapters/11-PATTERNS.md`
**Action:** `git add` and commit as `docs(planning): add 11-PATTERNS.md framework adapter pattern map`
**Pattern:** Conventional commit with `docs` type and `planning` scope — matches existing `docs(readme): ...` and `ci(scope): ...` patterns in CONTRIBUTING.md lines 120–125.

---

## Metadata

**Analog search scope:** `/`, `packages/core/`, `packages/react/`, `packages/vue/`, `packages/svelte/`, `doc-local/`
**Files scanned:** 14
**Pattern extraction date:** 2026-04-17
