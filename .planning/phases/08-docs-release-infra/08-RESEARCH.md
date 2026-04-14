# Phase 8: Docs & Release Infrastructure - Research

**Researched:** 2026-04-14
**Domain:** Documentation authoring, GitHub repo housekeeping, Changesets custom changelog formatters
**Confidence:** HIGH

## Summary

Phase 8 is documentation + config work with one genuinely technical piece: writing a local `@changesets`-compatible changelog formatter that prepends emoji by bump type while preserving the GitHub PR/commit link behaviour of `@changesets/changelog-github`. Everything else (READMEs, CONTRIBUTING, SECURITY, GitHub templates) is content authoring constrained by CONTEXT.md decisions.

The custom formatter approach is straightforward: export an object matching the `ChangelogFunctions` type from `@changesets/types`, reference it from `.changeset/config.json` via a relative path like `"./changelog.cjs"`, and the changesets CLI will resolve it via `resolve-from` at version time. The simplest implementation wraps `@changesets/changelog-github` and prepends the emoji — no need to re-implement GitHub API fetching.

**Primary recommendation:** Keep `@changesets/changelog-github@0.6.0` as a dev dependency and write `.changeset/changelog.cjs` as a thin CommonJS wrapper that delegates to it, then transforms the returned release line by prepending the emoji for the given `type`. Pin `$schema` to `@changesets/config@3.1.3` (latest release, verified on npm registry).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Root README Structure**
- **D-01:** Hub/landing page style — not a comprehensive API reference at root. Root README navigates readers to the right package, then they read that package's README for API detail.
- **D-02:** Sections at root:
  1. Title + one-liner description (what the library is)
  2. Package table — all 4 packages (`@ngockhoi96/ctc`, `@ngockhoi96/ctc-react`, `@ngockhoi96/ctc-vue`, `@ngockhoi96/ctc-svelte`) with: one-liner, `npm install` command, link to package README
  3. Quick-start for core — one minimal `copyToClipboard()` snippet to hook developers landing on the repo
  4. Monorepo structure section — short directory tree or description of `packages/` and `playground/` layout
  5. Browser support / requirements — ES2020+, >95% global support, secure context note (currently in root README, stays here)
  6. Existing badges stay (npm version, bundle size, CI, license)
- **D-03:** Core API detail (full function signatures, options, error codes) moves to `packages/core/README.md` — this file must be created as part of this phase. Its content is the detailed API reference section extracted from the current root README.

**CONTRIBUTING.md**
- **D-04:** Lean guide — under ~150 lines, practical and scannable. Required sections:
  1. Prerequisites (Node, pnpm, clone command)
  2. Setup (`pnpm install`, `pnpm setup` for lefthook)
  3. Running tests (`pnpm test`, `pnpm test:e2e`, per-package filter commands)
  4. Adding a new package (scaffold steps, workspace registration, turbo pipeline)
  5. Creating a changeset (what triggers a changeset, `pnpm changeset`, bump types)
  6. Release flow — step-by-step walkthrough (see D-05)
- **D-05:** Release flow section is a step-by-step walkthrough covering: when to create a changeset, what bump types mean, how version PRs work, what happens during publish, independent mode note.

**Changeset Emoji Format**
- **D-06:** Custom changelog formatter — bespoke `@changesets/changelog-*`-compatible formatter (or local module) that auto-prepends an emoji based on bump type. Replaces `@changesets/changelog-github` reference in `.changeset/config.json`.
- **D-07:** Emoji map:
  - `major` → 💥
  - `minor` → ✨
  - `patch` → 🐞
- **D-08:** The formatter must preserve GitHub PR and commit links (same as `@changesets/changelog-github` behavior) — emoji is prepended, not substituted for link content.
- **D-09:** Schema warning fix: update `$schema` in `.changeset/config.json` to pin to the latest released version of `@changesets/config`.

**GitHub Templates**
- **D-10:** PR template (`.github/PULL_REQUEST_TEMPLATE.md`) contains four sections: Summary, Type of change (checkboxes), Test plan, reminder about `pnpm changeset`.
- **D-11:** Issue templates — markdown format (not YAML issue forms):
  - `.github/ISSUE_TEMPLATE/bug_report.md`: Describe / Steps / Expected / Actual / Environment
  - `.github/ISSUE_TEMPLATE/feature_request.md`: Problem / Solution / Alternatives
  - No custom labels, dropdowns, or required fields

### Claude's Discretion
- Exact wording and formatting of each document
- Whether to add `.github/ISSUE_TEMPLATE/config.yml` to disable blank issues
- Whether `packages/core/README.md` includes browser support table or links to root README's table
- Exact directory tree depth shown in root README's monorepo structure section

### Deferred Ideas (OUT OF SCOPE)
- VitePress/Starlight documentation site — deferred to v0.4.0+
- Playground deployment (Netlify/Vercel preview) — not in Phase 8 scope
- Automated release notes with richer categorization (feat/fix/perf sections) — deferred
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DX-05 | Root README updated for monorepo structure with links to each package | D-01/D-02 lock the hub/landing structure; current root README audited (300 lines, single-package era); API detail relocates per D-03. |
| DX-06 | Per-package README for each adapter (react, vue, svelte) | All three already exist with solid Phase 5/6 content — audit shows they need only: cross-link to root README, confirm peer dep ranges (react `>=18 <20`, vue `>=3.0.0 <4.0.0`, svelte `>=4.0.0`), and confirm `@ngockhoi96/ctc` range (`>=0.1.0`). A fourth per-package README for `packages/core` does NOT exist and must be created (D-03). |
| DX-07 | `CONTRIBUTING.md` with monorepo workflow | D-04/D-05 prescribe six required sections; lean (~150 lines); references existing `pnpm setup`, `pnpm test`, `pnpm test:e2e` commands from root CLAUDE.md. |
| DX-08 | `SECURITY.md` with vulnerability reporting process | Standard GitHub-recognized file at repo root; content is contact + scope + disclosure timeline. No canonical template mandated. |
| DX-09 | GitHub PR template + issue templates | D-10/D-11 fully specify content. Standard `.github/` discovery applies (verified: GitHub auto-discovers `PULL_REQUEST_TEMPLATE.md` and `ISSUE_TEMPLATE/*.md` — no config.yml needed unless disabling blank issues). |
| DX-10 | Emoji icons in changeset summaries; schema warning resolved | Custom formatter at `.changeset/changelog.cjs` wrapping `@changesets/changelog-github`; `$schema` pinned to `@changesets/config@3.1.3`. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Named exports only, no default exports (affects formatter file — use `module.exports = { ... }` not `module.exports.default`).
- Conventional commits: `feat/fix/chore/docs/test/ci(scope): description` — CONTRIBUTING.md must reference this.
- Zero runtime dependencies in published packages — the changelog formatter is dev-only tooling so this doesn't apply, but CONTRIBUTING.md should still state the rule.
- Commands: `pnpm setup` installs lefthook hooks; `pnpm lint && pnpm test && pnpm build` before commit.
- GSD workflow enforcement: CONTRIBUTING.md should point contributors at the GSD commands for feature work.
- TypeScript strict, `interface` for object shapes, `type` for unions — the formatter is CommonJS `.cjs` so this applies to README code snippets only.

## Standard Stack

### Core (already in the repo)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@changesets/cli` | 2.30.0 | Version + publish orchestration | Already in devDependencies; drives the changelog formatter |
| `@changesets/changelog-github` | 0.6.0 | PR link + commit link + user attribution for release notes | Already a transitive dep via `.changeset/config.json`; we wrap it instead of replacing it |
| `@changesets/config` | 3.1.3 | Config schema + normalization | Transitive via CLI; used only for the `$schema` URL pin |
| `@changesets/types` | 6.1.0 (`ChangelogFunctions`) | Type definition for custom formatters | Reference only — formatter is `.cjs`, types consumed via JSDoc if desired |

**No new runtime dependencies required.** The only config change is the `changelog` field in `.changeset/config.json` and the presence of the new `.changeset/changelog.cjs` file.

### Version verification

All versions verified against npm registry on 2026-04-14 `[VERIFIED: npm view]`:

- `@changesets/cli@2.30.0` (already installed, current)
- `@changesets/changelog-github@0.6.0` — latest
- `@changesets/config@3.1.3` — latest (current repo has outdated `$schema` pin to `3.1.1`)
- `@changesets/types@6.1.0` — latest

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Wrapping `@changesets/changelog-github` | Re-implement from scratch using `@changesets/get-github-info` directly | More code to maintain, more surface for breakage when upstream changes; wrapping is a 20-line function |
| Custom formatter | Post-process `CHANGELOG.md` files after `changeset version` in a git hook | Fragile — runs after the fact, can be skipped, breaks the single-command release flow |
| Emoji prefix via `@changesets/changelog-git` + sed | Use the minimal git formatter | Loses PR/commit links, which D-08 explicitly forbids |

## Architecture Patterns

### Recommended File Layout

```
.
├── README.md                       # UPDATED — hub/landing page per D-02
├── CONTRIBUTING.md                 # NEW — lean ~150 line guide
├── SECURITY.md                     # NEW
├── .changeset/
│   ├── config.json                 # UPDATED — changelog path + $schema pin
│   └── changelog.cjs               # NEW — custom formatter
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md    # NEW
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md           # NEW
│       ├── feature_request.md      # NEW
│       └── config.yml              # OPTIONAL — disables blank issues (Claude's discretion)
└── packages/
    ├── core/
    │   └── README.md               # NEW — extracted from current root README
    ├── react/README.md             # EXISTING — audit only
    ├── vue/README.md               # EXISTING — audit only
    └── svelte/README.md            # EXISTING — audit only
```

### Pattern 1: Custom Changelog Formatter (wrapper approach)

**What:** A thin CommonJS module that delegates to `@changesets/changelog-github` and mutates the returned release line to prepend an emoji based on the release type.

**When to use:** Always — this is the only pattern that satisfies D-06/D-07/D-08 without duplicating the GitHub API fetching logic.

**How changesets loads it:**

- In `.changeset/config.json`: `"changelog": ["./changelog.cjs", { "repo": "anIcedAntFA/ctc" }]`
- At version time, `@changesets/apply-release-plan` calls:
  `resolveFrom(changesetPath, config.changelog[0])` → resolves relative to `.changeset/` directory first, then falls back to repo root `[CITED: node_modules/@changesets/apply-release-plan/dist/changesets-apply-release-plan.cjs.js:399-401]`.
- So `"./changelog.cjs"` resolves to `.changeset/changelog.cjs` — the file lives next to `config.json`.
- The loader does `await import(changelogPath)`, so either CJS or ESM works; `.cjs` is unambiguous.

**Type signature** `[CITED: node_modules/@changesets/types/dist/declarations/src/index.d.ts]`:

```typescript
type GetReleaseLine = (
  changeset: NewChangesetWithCommit,
  type: VersionType,           // "major" | "minor" | "patch" | "none"
  changelogOpts: null | Record<string, any>,
) => Promise<string>;

type GetDependencyReleaseLine = (
  changesets: NewChangesetWithCommit[],
  dependenciesUpdated: ModCompWithPackage[],
  changelogOpts: any,
) => Promise<string>;

type ChangelogFunctions = {
  getReleaseLine: GetReleaseLine;
  getDependencyReleaseLine: GetDependencyReleaseLine;
};
```

**Example implementation** `.changeset/changelog.cjs`:

```javascript
// Custom changeset changelog formatter.
// Wraps @changesets/changelog-github and prepends an emoji by bump type.
// Preserves GitHub PR/commit links and user attribution.

const githubChangelog = require('@changesets/changelog-github').default;

const EMOJI_BY_TYPE = {
  major: '💥',
  minor: '✨',
  patch: '🐞',
};

/** @type {import('@changesets/types').ChangelogFunctions['getReleaseLine']} */
async function getReleaseLine(changeset, type, options) {
  const line = await githubChangelog.getReleaseLine(changeset, type, options);
  const emoji = EMOJI_BY_TYPE[type];
  if (!emoji) return line;
  // Upstream returns a string that begins with "\n\n- " followed by the entry.
  // We inject the emoji right after the leading "- " bullet so the PR link
  // (which comes after the bullet on the same line) stays intact.
  return line.replace(/^(\n\n- )/, `$1${emoji} `);
}

/** @type {import('@changesets/types').ChangelogFunctions['getDependencyReleaseLine']} */
async function getDependencyReleaseLine(changesets, dependenciesUpdated, options) {
  // Delegate unchanged — dependency bumps don't get a top-level emoji.
  return githubChangelog.getDependencyReleaseLine(changesets, dependenciesUpdated, options);
}

module.exports = { getReleaseLine, getDependencyReleaseLine };
```

**Note on the leading newlines:** The upstream `getReleaseLine` returns a string shaped like:
```
\n\n- [#123](https://github.com/.../pull/123) [`abc1234`](...) Thanks [@user](...)! - My change summary
```
`[CITED: github.com/changesets/changesets/blob/main/packages/changelog-github/src/index.ts]`. Injecting the emoji after `\n\n- ` and before the PR link keeps the structure intact. Verify by running `pnpm changeset version` with a test changeset after installation.

**Config update** `.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.3/schema.json",
  "changelog": ["./changelog.cjs", { "repo": "anIcedAntFA/ctc" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "master",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

**Note:** The existing config uses `"baseBranch": "master"` — preserve this; don't change to `main`. The schema URL pin to `3.1.3` resolves D-09 (verified reachable at `https://unpkg.com/@changesets/config@3.1.3/schema.json`).

### Pattern 2: GitHub Templates Discovery

**What:** GitHub automatically discovers templates from standard paths — no config file required.

**Paths GitHub checks** `[VERIFIED: github.com/anIcedAntFA/ctc currently has no .github templates]`:
- `.github/PULL_REQUEST_TEMPLATE.md` — single PR template (used automatically)
- `.github/ISSUE_TEMPLATE/*.md` — individual issue templates (each shows on the "New issue" chooser)
- `.github/ISSUE_TEMPLATE/config.yml` — OPTIONAL, used to disable blank issues (`blank_issues_enabled: false`) or add contact links

**Markdown issue template frontmatter** (required for GitHub to recognize the file):

```markdown
---
name: Bug report
about: Report a reproducible bug in the library
title: '[Bug] '
labels: bug
assignees: ''
---

## Describe the bug
...
```

Without the frontmatter, the file renders as a regular markdown document and doesn't appear in the "New issue" chooser. `[CITED: docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests]`

### Pattern 3: Per-Package README Structure

All three adapter READMEs follow the same shape (verified by reading them):
1. Title + one-line description with link back to root
2. Install command (adapter + peer dep in one command)
3. Peer dependencies table
4. Quick start code sample
5. Variant examples (override text, disable timeout, reset, custom timeout, error handling)
6. API reference (function signature, parameters, options, return value)
7. TypeScript types re-exports
8. Browser support (links back to root README's table)
9. License

`packages/core/README.md` should follow the same shape for consistency. Its content is the extraction from the current root README sections: Installation, Quick Start, API Reference (all 5 functions), Error Handling, Browser Support.

### Anti-Patterns to Avoid

- **Forking `@changesets/changelog-github` source into the repo.** Wrapping via `require()` is 20 lines; forking creates 200+ lines to maintain and drops upstream bug fixes.
- **Using YAML issue forms instead of markdown.** D-11 explicitly locks markdown — YAML forms add structured fields/dropdowns that are deliberately out of scope.
- **Re-documenting the core API in root README.** D-01/D-03 make root a hub — API details live in `packages/core/README.md`, root links there.
- **Duplicating the browser support table.** Put it in `packages/core/README.md` (or root, per Claude's discretion D-02 item 5) — not both. The existing adapter READMEs already link to the root anchor `#browser-support`; whichever location keeps that anchor valid wins. Recommendation: keep the table at root (it applies to all packages uniformly) and link from `packages/core/README.md` via `[Browser support](../../README.md#browser-support)`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub PR link + user attribution in changelog entries | Custom GitHub API fetcher | `@changesets/changelog-github` (wrapped) | Handles rate limiting, auth via `GITHUB_TOKEN`, summary metadata parsing (`pr: #123`, `commit: abc`, `author: @foo`) |
| Issue template rendering on GitHub | Custom issue form schemas | Markdown files with frontmatter | Standard, zero config, matches D-11 |
| Schema validation for `.changeset/config.json` | Custom lint rule | The `$schema` URL pin to latest `@changesets/config` version | Editor (VS Code, JSON Schema Store) validates in-editor automatically |

## Common Pitfalls

### Pitfall 1: Changelog formatter returns wrong string shape

**What goes wrong:** Custom formatter builds the line from scratch and forgets the leading `\n\n- ` bullet, breaking `CHANGELOG.md` structure.

**Why it happens:** Developer reads the `GetReleaseLine` type signature but not the upstream implementation, assumes they return a plain sentence.

**How to avoid:** Wrap upstream and mutate its output (as shown in Pattern 1). Only the emoji is prepended; the bullet structure is preserved by upstream.

**Warning signs:** `CHANGELOG.md` after `pnpm changeset version` has malformed bullets, missing PR links, or runs lines together.

### Pitfall 2: `resolveFrom` path ambiguity

**What goes wrong:** Formatter path `"./changelog.cjs"` not found; `pnpm changeset version` errors with "Could not resolve changelog generation functions".

**Why it happens:** User thinks `"./"` is relative to repo root, puts the file there, but changesets resolves from `.changeset/` first.

**How to avoid:** Always place the formatter at `.changeset/changelog.cjs` (next to `config.json`). Never use an absolute path.

**Warning signs:** Error at version time; fix by moving the file or adjusting the path to `"../changelog.cjs"` (not recommended — use the sibling convention).

### Pitfall 3: Default export vs. named export mismatch

**What goes wrong:** `const githubChangelog = require('@changesets/changelog-github')` returns `{ default: { getReleaseLine, ... } }` instead of the direct object, and `githubChangelog.getReleaseLine` is undefined.

**Why it happens:** `@changesets/changelog-github` is authored as ESM and compiled to dual CJS/ESM — the CJS build wraps the default export under `.default`.

**How to avoid:** Use `require('@changesets/changelog-github').default` (as shown in Pattern 1). Verify by `console.log(require('@changesets/changelog-github'))` during smoke test.

**Warning signs:** Error at version time: `TypeError: Cannot read properties of undefined (reading 'getReleaseLine')`.

### Pitfall 4: Frontmatter missing from issue templates

**What goes wrong:** Files exist in `.github/ISSUE_TEMPLATE/` but GitHub's "New issue" button shows a blank form, no template chooser.

**Why it happens:** GitHub requires YAML frontmatter (`name:`, `about:`) at the top of each markdown template to register it.

**How to avoid:** Always include the frontmatter block shown in Pattern 2. Test by opening "New issue" on the GitHub UI after the PR merges (or preview via a fork).

### Pitfall 5: `.changeset/changelog.cjs` tracked vs ignored

**What goes wrong:** The formatter file is gitignored by a wildcard rule and fails on CI even though it works locally.

**Why it happens:** Some `.gitignore` configurations ignore `*.cjs` at root. The current `.changeset/` directory contains only markdown + JSON.

**How to avoid:** Verify with `git check-ignore -v .changeset/changelog.cjs` after creating the file. If ignored, add an exception `!.changeset/changelog.cjs` or rename to `.changeset/changelog.js` with `"type": "commonjs"` context (not applicable here — root `package.json` is `"type": "module"`, which is why `.cjs` is the safer extension).

## Code Examples

### Formatter wrapper (complete)
See Pattern 1 above — the full `.changeset/changelog.cjs` implementation.

### Smoke test for the formatter
After creating the file, validate with a dummy changeset:

```bash
# Create a test changeset
cat > .changeset/test-emoji.md <<'EOF'
---
'@ngockhoi96/ctc': minor
---

test: verify emoji prefix renders correctly
EOF

# Run version (this modifies CHANGELOG.md and deletes the changeset)
pnpm changeset version

# Inspect the generated CHANGELOG.md
head -20 packages/core/CHANGELOG.md

# Revert
git checkout -- packages/core/CHANGELOG.md packages/core/package.json
git clean -f .changeset/
```

Expected output in `CHANGELOG.md`:
```markdown
## 0.3.0

### Minor Changes

- ✨ test: verify emoji prefix renders correctly
```

(with a PR link and user attribution prepended between the bullet and the emoji if the changeset was committed).

### Issue template frontmatter

```markdown
---
name: Bug report
about: Report a reproducible bug
title: '[Bug] '
labels: bug
---

## Describe the bug
A clear and concise description.

## Steps to reproduce
1. ...
2. ...

## Expected behavior
What you expected to happen.

## Actual behavior
What actually happened.

## Environment
- OS:
- Browser + version:
- Package + version:
```

### Optional `ISSUE_TEMPLATE/config.yml` (Claude's discretion)

```yaml
blank_issues_enabled: false
contact_links:
  - name: Questions & Discussion
    url: https://github.com/anIcedAntFA/ctc/discussions
    about: For general questions, ask in Discussions.
```

Recommendation: **include this file** to prevent blank bug reports. It's 6 lines and improves signal/noise significantly.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-file root README with full API | Hub/landing root + per-package READMEs | Monorepo era (Phase 4+) | Root README becomes navigation; packages own their own docs |
| YAML issue forms | Still valid, but markdown is simpler for lean projects | N/A — parallel options | Markdown chosen per D-11 for simplicity |
| Changelog formatters as published packages | Local wrapper `.cjs` files | Always supported | Nothing to publish, nothing to version |

**Deprecated/outdated:**
- Schema URL pinned to `@changesets/config@3.1.1` in current `.changeset/config.json` — outdated, should pin to `3.1.3`.

## Audit Results: Existing Adapter READMEs

Confirmed by reading all three (2026-04-14). All three are in good shape from Phase 5/6 execution:

| File | Peer deps correct? | Links to root? | Cross-links to siblings? | Needs changes? |
|------|---------------------|----------------|--------------------------|----------------|
| `packages/react/README.md` | ✓ (`react >=18 <20`, `@ngockhoi96/ctc >=0.1.0`) | ✓ link in title + browser support section | ✗ no cross-links | Minor: add "See also" footer linking to vue/svelte adapters + `packages/core` |
| `packages/vue/README.md` | ✓ (`vue >=3.0.0 <4.0.0`) | ✓ link in title + browser support section | ✗ no cross-links | Same minor addition; also has an SSR section that's more complete than react/svelte — don't remove, consider porting the pattern to others if planner wants consistency |
| `packages/svelte/README.md` | ✓ (`svelte >=4.0.0`) | ✓ link in title + browser support section | ✗ no cross-links | Same minor addition; unique in covering three exports (action, stores, runes) — keep as-is |

**None of the three need a rewrite.** The planner should scope this to a lightweight audit pass: add a "See also" section (one paragraph) to each, verify the browser-support link anchor still resolves once root README is restructured, and confirm peer dep ranges against current `packages/*/package.json` files.

## `packages/core/README.md` Extraction Plan

The new core README is lifted from the current root README sections. Concrete mapping:

| Current root README section | Goes to `packages/core/README.md`? | Stays at root? |
|-----------------------------|-------------------------------------|----------------|
| Title + one-liner + badges | No (root gets new hub-style title) | Yes — badges stay at root |
| SSR-safe note | Yes (in intro) | Optional — can stay at root as a universal claim |
| Installation | Yes | No — root has the package table instead |
| Quick Start | Yes (full) | Yes (minimal one-snippet version per D-02 item 3) |
| API Reference (all 5 functions) | Yes — verbatim | No |
| Error Handling (`BrowserUtilsError`, codes, examples) | Yes — verbatim | No |
| Browser Support table | Optional (Claude's discretion) | Yes — D-02 item 5 locks this at root |
| Contributing section | No — moves to `CONTRIBUTING.md` | No |
| Versioning section | Yes (adapted for monorepo) | Optional — short note at root |
| Publishing section | No — moves to `CONTRIBUTING.md` under release flow | No |
| License | Yes | Yes |

Follow the adapter README structure (Pattern 3 above) so all four package READMEs look consistent.

## CONTRIBUTING.md Skeleton

Based on D-04/D-05 and the existing commands in CLAUDE.md:

```markdown
# Contributing

Thanks for your interest! This repo is a pnpm + Turborepo monorepo. Below is everything
you need to set up, run tests, and ship a change.

## Prerequisites
- Node.js >= 20
- pnpm >= 9 (install: `npm i -g pnpm`)
- Git

## Setup
```bash
git clone https://github.com/anIcedAntFA/ctc.git
cd ctc
pnpm install
pnpm setup    # installs lefthook git hooks
```

## Running tests
From the repo root, via Turborepo:
```bash
pnpm lint              # biome check across all packages
pnpm test              # vitest unit tests across all packages
pnpm test:e2e          # playwright tests (core package)
pnpm build             # tsdown builds
```
Run for a single package:
```bash
pnpm --filter @ngockhoi96/ctc-react test
```

## Adding a new package
1. Create `packages/<name>/` with `package.json`, `tsconfig.json`, `tsdown.config.ts`.
2. Register it in `pnpm-workspace.yaml` (auto via `packages/*`).
3. Add its build/lint/test scripts so `turbo` picks them up via `turbo.json` pipeline.
4. Add a README following the structure of existing packages.

## Creating a changeset
Every PR that changes public API or behavior needs a changeset:
```bash
pnpm changeset
```
Pick bump type(s):
- `patch` — bug fix, no API change
- `minor` — new feature, backwards compatible
- `major` — breaking change

Write a one-line summary — it becomes the CHANGELOG entry. Emoji prefix is added
automatically by the custom formatter (💥 major, ✨ minor, 🐞 patch).

## Release flow
We use changesets in independent mode — each package versions separately.

1. You open a PR with a changeset. CI runs lint/test/build.
2. After merge, the `changesets/action` bot opens (or updates) a "Version Packages" PR.
3. The Version PR consumes pending changesets, bumps affected package versions, and
   updates each package's `CHANGELOG.md`.
4. Merging the Version PR triggers `changeset publish` in CI, which:
   - Publishes bumped packages to npm
   - Creates a GitHub Release per published package
5. Independent mode note: a single Version PR can bump multiple packages at
   different levels — for example, `@ngockhoi96/ctc@0.3.0` (minor) alongside
   `@ngockhoi96/ctc-react@0.2.1` (patch) — they never have to be in lockstep.

## Code style
- TypeScript strict, no `any`, no default exports
- Named exports only
- Biome handles lint + format (`pnpm lint:fix`)
- Conventional commits enforced by commitlint: `feat|fix|chore|docs|test|ci(scope): summary`

## Security
For vulnerability reports, see [SECURITY.md](./SECURITY.md) — do not open a public issue.
```

Rough line count: ~85 lines — well under the ~150 line target.

## SECURITY.md Template

Standard minimal GitHub-recognized format:

```markdown
# Security Policy

## Supported Versions
Only the latest minor version of each package is supported with security updates.

| Package              | Version  | Supported |
| -------------------- | -------- | --------- |
| @ngockhoi96/ctc        | Latest   | ✅        |
| @ngockhoi96/ctc-react  | Latest   | ✅        |
| @ngockhoi96/ctc-vue    | Latest   | ✅        |
| @ngockhoi96/ctc-svelte | Latest   | ✅        |

## Reporting a Vulnerability
Please do NOT open a public GitHub issue for security reports.

Instead, email: **<maintainer-email>** with subject `[SECURITY] ctc`.

Include:
- A description of the vulnerability
- Steps to reproduce
- Affected package(s) and version(s)
- Suggested fix (if any)

You'll receive an acknowledgment within 72 hours. Fixes are coordinated privately
before public disclosure.
```

**Planner action:** confirm the maintainer email with the user (or substitute GitHub
private vulnerability reporting if preferred — enable via repo Settings → Security).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| `@changesets/cli` | Custom formatter | ✓ | 2.30.0 | — |
| `@changesets/changelog-github` | Formatter wrapper | ✓ | 0.6.0 | — |
| `pnpm` | All commands in CONTRIBUTING | ✓ | — | — |
| Internet for `unpkg.com` | `$schema` validation in IDE | ✓ | — | Schema still validates at changesets runtime; IDE-only dependency |

No missing dependencies. This phase is entirely content/config — no new installs beyond what's already in the repo.

## Validation Architecture

### Test Framework
Phase 8 is content + config. There are no functional test targets for documentation. The validation signals are:

| Property | Value |
|----------|-------|
| Markdown lint | None configured (project doesn't use `markdownlint` — confirmed by checking repo root for `.markdownlint*`) |
| JSON schema validation | Editor-side via `$schema` URL pin (D-09) |
| Changeset formatter smoke test | Manual run of `pnpm changeset` + `pnpm changeset version` against a throwaway changeset, then git-revert |
| Link checking | None configured; manual pass recommended |

### Phase Requirements → Validation Map

| Req ID | Behavior | Validation Type | Command | Automated? |
|--------|----------|-----------------|---------|------------|
| DX-05 | Root README hub structure | Visual review | Read `README.md` | ❌ Manual |
| DX-06 | Adapter READMEs audited + `packages/core/README.md` exists | File existence + content review | `ls packages/*/README.md` | Partial |
| DX-07 | CONTRIBUTING.md present with required sections | File existence + grep for section headers | `test -f CONTRIBUTING.md && grep -q "## Release flow" CONTRIBUTING.md` | ✓ |
| DX-08 | SECURITY.md present | File existence | `test -f SECURITY.md` | ✓ |
| DX-09 | PR + issue templates present with frontmatter | File existence + frontmatter check | `test -f .github/PULL_REQUEST_TEMPLATE.md && test -f .github/ISSUE_TEMPLATE/bug_report.md && test -f .github/ISSUE_TEMPLATE/feature_request.md` | ✓ |
| DX-10 | Emoji in changelog + schema warning resolved | Smoke test + VS Code validation | Run test changeset flow above; open config.json in editor (no warning) | Partial |

### Wave 0 Gaps
- [ ] None for test infrastructure — this phase has none.
- [ ] One pre-flight check: run `git check-ignore -v .changeset/changelog.cjs` before writing the formatter to confirm it won't be ignored.

### Sampling Rate
- **Per task commit:** `pnpm lint` (catches JSON syntax errors in `config.json`)
- **Per wave merge:** Manual README review + smoke test of changeset formatter
- **Phase gate:** `pnpm changeset version` with a dummy changeset on a throwaway branch renders emoji correctly

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | Docs phase — no auth surface |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | — |
| V6 Cryptography | no | — |
| V14 Configuration | yes | `.changeset/config.json` schema validation via pinned `$schema` URL |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Publishing sensitive info in SECURITY.md | Info Disclosure | Use a private contact method; don't reveal infrastructure details |
| Executing malicious code via `changelog.cjs` | Tampering/RCE | The file runs only during `changeset version` in the contributor's local shell and in CI after merge; it's sandboxed to normal Node execution. Standard code review on the PR that introduces it. |
| Leaked `GITHUB_TOKEN` via formatter | Info Disclosure | `@changesets/changelog-github` reads `GITHUB_TOKEN` from env; our wrapper just delegates. No token is logged. |

No security-sensitive data flows in this phase. The only "runtime" code added is the changelog formatter, which executes in well-defined changesets tooling contexts.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The existing adapter READMEs' peer dep ranges are accurate vs. their `package.json` files | Audit Results | Low — if wrong, the mismatch is a minor doc fix, not a functional bug. Planner should grep `packages/*/package.json` for `peerDependencies` and diff against the README tables as one of the audit tasks. |
| A2 | GitHub recognises markdown issue templates without a `config.yml` | Pattern 2 | Low — documented GitHub behavior; if the chooser doesn't appear, add `config.yml`. |
| A3 | Maintainer email for SECURITY.md is known to the user | SECURITY.md Template | Medium — if user prefers private vulnerability reporting via GitHub Security Advisories, the file content changes (drop email, point at "Report a vulnerability" button). Planner must confirm with user before writing final SECURITY.md. |
| A4 | The `@changesets/changelog-github` CJS build exposes functions under `.default` | Pattern 1 / Pitfall 3 | Low — easy to verify during smoke test; the test changeset flow will error at version time if wrong, and the fix is one line. `[ASSUMED]` but very likely correct based on how preconstruct (changesets' build tool) compiles ESM defaults. Verify by running `node -e "console.log(require('@changesets/changelog-github'))"` before committing the formatter. |

## Open Questions (RESOLVED)

1. **Maintainer email for SECURITY.md**
   - RESOLVED: Use GitHub private vulnerability reporting (no email). SECURITY.md links to the repo's Security tab ("Report a vulnerability" button). Confirmed by user.

2. **Browser support table location**
   - RESOLVED: Stays at root README (per D-02 item 5). `packages/core/README.md` links to `../../README.md#browser-support` — no duplication. Claude's discretion per CONTEXT.md.

3. **Optional `ISSUE_TEMPLATE/config.yml`**
   - RESOLVED: Include it with `blank_issues_enabled: false`. Confirmed by user.

## Sources

### Primary (HIGH confidence)
- Local node_modules: `@changesets/types@4.1.0/dist/declarations/src/index.d.ts` — `ChangelogFunctions`, `GetReleaseLine`, `GetDependencyReleaseLine` type definitions
- Local node_modules: `@changesets/config@3.1.3/dist/changesets-config.cjs.js` — validates `changelog` option accepts `"./some-module"` paths
- Local node_modules: `@changesets/apply-release-plan@7.1.0/dist/changesets-apply-release-plan.cjs.js:399-403` — `resolveFrom(changesetPath, config.changelog[0])` loader
- Local node_modules: `@changesets/config@3.1.3/schema.json` — current schema definition
- `github.com/changesets/changesets/blob/main/packages/changelog-github/src/index.ts` — upstream `getReleaseLine` source, string shape `\n\n- {pr} {commit} Thanks {user}! - {summary}`
- npm registry: `@changesets/config@3.1.3`, `@changesets/changelog-github@0.6.0`, `@changesets/types@6.1.0` (all latest as of 2026-04-14)
- Local files: current `README.md`, `packages/{react,vue,svelte}/README.md`, `.changeset/config.json`

### Secondary (MEDIUM confidence)
- GitHub docs: Issue template frontmatter requirements (`docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests`)
- GitHub docs: `.github/ISSUE_TEMPLATE/config.yml` schema (`blank_issues_enabled`, `contact_links`)

### Tertiary (LOW confidence)
- None — all claims verified against local source or canonical docs.

## Metadata

**Confidence breakdown:**
- Changelog formatter mechanism: HIGH — read the actual changesets source in node_modules
- Type signatures: HIGH — read `.d.ts` files directly
- Schema URL: HIGH — verified reachable via curl
- GitHub templates: HIGH — standard documented behavior
- README content shape: HIGH — audited all files in repo
- A4 (default export wrapping): MEDIUM — very likely based on preconstruct conventions, verifiable in ~10 seconds during implementation

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (30 days — stable documentation tooling, slow-moving ecosystem)
