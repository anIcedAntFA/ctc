# Phase 8: Docs & Release Infrastructure - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Root and per-package documentation is complete, GitHub repo housekeeping is done, and the release workflow handles multi-package publishing correctly. This covers: root README overhaul, a new `packages/core/README.md`, CONTRIBUTING.md, SECURITY.md, GitHub PR + issue templates, and changeset emoji config. No documentation site (VitePress deferred to v0.4.0+).

**Note on per-package adapter READMEs:** `packages/react/README.md`, `packages/vue/README.md`, and `packages/svelte/README.md` already exist with solid content from Phase 5 and 6 execution. The planner should audit them for any needed updates (cross-links to root, peer dep range accuracy) but they do NOT need to be written from scratch.

</domain>

<decisions>
## Implementation Decisions

### Root README Structure
- **D-01:** Hub/landing page style — not a comprehensive API reference at root. Root README navigates readers to the right package, then they read that package's README for API detail.
- **D-02:** Sections at root:
  1. Title + one-liner description (what the library is)
  2. Package table — all 4 packages (`@ngockhoi96/ctc`, `@ngockhoi96/ctc-react`, `@ngockhoi96/ctc-vue`, `@ngockhoi96/ctc-svelte`) with: one-liner, `npm install` command, link to package README
  3. Quick-start for core — one minimal `copyToClipboard()` snippet to hook developers landing on the repo
  4. Monorepo structure section — short directory tree or description of `packages/` and `playground/` layout
  5. Browser support / requirements — ES2020+, >95% global support, secure context note (currently in root README, stays here)
  6. Existing badges stay (npm version, bundle size, CI, license)
- **D-03:** Core API detail (full function signatures, options, error codes) moves to `packages/core/README.md` — this file must be created as part of this phase. Its content is the detailed API reference section extracted from the current root README.

### CONTRIBUTING.md
- **D-04:** Lean guide — under ~150 lines, practical and scannable. Required sections (per DX-07):
  1. Prerequisites (Node, pnpm, clone command)
  2. Setup (`pnpm install`, `pnpm setup` for lefthook)
  3. Running tests (`pnpm test`, `pnpm test:e2e`, per-package filter commands)
  4. Adding a new package (scaffold steps, workspace registration, turbo pipeline)
  5. Creating a changeset (what triggers a changeset, `pnpm changeset`, bump types)
  6. Release flow — step-by-step walkthrough (not just command list, see D-05)
- **D-05:** Release flow section is a step-by-step walkthrough covering:
  - When to create a changeset (per PR that changes public API or behavior)
  - What bump types mean (patch = bug fix, minor = new feature, major = breaking change)
  - How version PRs work (changesets bot opens a PR merging pending changesets)
  - What happens during publish (`pnpm changeset publish` → npm, GitHub release created)
  - Independent mode note: each package versions separately, a single PR can bump multiple packages at different levels

### Changeset Emoji Format
- **D-06:** Custom changelog formatter — write a bespoke `@changesets/changelog-*`-compatible formatter (or local module) that auto-prepends an emoji based on bump type. This replaces `@changesets/changelog-github` in `.changeset/config.json`.
- **D-07:** Emoji map:
  - `major` → 💥
  - `minor` → ✨
  - `patch` → 🐞
- **D-08:** The formatter must preserve GitHub PR and commit links (same as `@changesets/changelog-github` behavior) — emoji is prepended, not substituted for link content.
- **D-09:** Schema warning fix: update `$schema` in `.changeset/config.json` to pin to the latest released version of `@changesets/config`. Researcher should verify the current latest version.

### GitHub Templates
- **D-10:** PR template (`.github/PULL_REQUEST_TEMPLATE.md`) contains four sections:
  1. `## Summary` — bullet-point description of what the PR does
  2. `## Type of change` — checkboxes: `[ ] Bug fix`, `[ ] New feature`, `[ ] Breaking change`, `[ ] Documentation update`
  3. `## Test plan` — checklist of how to verify (unit tests, manual steps, etc.)
  4. A note reminding authors to run `pnpm changeset` if the PR introduces a breaking change or new feature
- **D-11:** Issue templates — structured but lean (markdown format, not YAML/issue forms):
  - **Bug report** (`.github/ISSUE_TEMPLATE/bug_report.md`): Describe the bug / Steps to reproduce / Expected behavior / Actual behavior / Environment (OS, browser, package version)
  - **Feature request** (`.github/ISSUE_TEMPLATE/feature_request.md`): Problem to solve / Proposed solution / Alternatives considered
  - No custom labels, dropdowns, or required fields — keeps templates lightweight

### Claude's Discretion
- Exact wording and formatting of each document
- Whether to add a `.github/ISSUE_TEMPLATE/config.yml` to disable blank issues
- Whether `packages/core/README.md` includes browser support table or links to root README's table
- Exact directory tree depth shown in root README's monorepo structure section

</decisions>

<specifics>
## Specific Ideas

- The `packages/core/README.md` is NOT a new document — it's essentially the current root README's API reference section relocated. The core API detail (function signatures, options tables, error codes, browser support) that currently lives at root moves to `packages/core/README.md`.
- The custom changelog formatter should be a local script (e.g., `.changeset/changelog.cjs`) rather than a published npm package — this is a personal project and a full npm package is overkill. It just needs to be referenced in `config.json` as a relative path.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Documentation & Release Infrastructure — DX-05 through DX-10, the acceptance criteria this phase must satisfy
- `.planning/ROADMAP.md` §Phase 8 — Success criteria and plan breakdown

### Existing docs to update/audit
- `README.md` — Current root README (single-package era, needs monorepo overhaul per D-01/D-02)
- `packages/react/README.md` — Exists, audit for cross-links and peer dep accuracy
- `packages/vue/README.md` — Exists, audit for cross-links and peer dep accuracy
- `packages/svelte/README.md` — Exists, audit for cross-links and peer dep accuracy

### Changeset config
- `.changeset/config.json` — Current config (uses `@changesets/changelog-github`, schema URL to update per D-09)

### Prior phase context (for consistency)
- `.planning/phases/05-react-vue-adapters/05-CONTEXT.md` — Hook/composable API decisions, peer dep ranges
- `.planning/phases/06-svelte-adapter/06-CONTEXT.md` — Svelte package exports, peer dep ranges
- `.planning/phases/07-playgrounds/07-CONTEXT.md` — Monorepo structure (packages/, playground/ directories)

No external specs. Requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `README.md` — Current root README is the source for `packages/core/README.md` content (API reference section). Planner should extract, not rewrite.
- `.github/workflows/ci.yml` and `release.yml` — CONTRIBUTING.md release flow section should describe what these workflows do (no changes to the workflows themselves).
- `.changeset/config.json` — To be updated with custom formatter path and pinned `$schema` URL.

### Established Patterns
- All packages use conventional commits (`feat/fix/chore/docs/test/ci(scope): description`) — CONTRIBUTING.md should reference this.
- `packages/{react,vue,svelte}/README.md` all follow the same structure (Install → Peer deps → Quick start → API examples → API reference table). `packages/core/README.md` should follow the same structure.

### Integration Points
- Custom changelog formatter is referenced from `.changeset/config.json` `changelog` field — must be a path resolvable from repo root.
- GitHub templates are discovered automatically by GitHub from `.github/` directory — no config needed beyond creating the files.
- Root `pnpm-workspace.yaml` and `turbo.json` define the workspace — CONTRIBUTING.md's "adding a package" section should describe what files need updating.

</code_context>

<deferred>
## Deferred Ideas

- VitePress/Starlight documentation site — deferred to v0.4.0+ (decided Phase 3, reaffirmed Phase 7)
- Playground deployment (Netlify/Vercel preview) — mentioned in Phase 7 context, not in Phase 8 scope
- Automated release notes with richer categorization (feat/fix/perf sections) — the custom formatter covers basic emoji prefixes; richer categorization deferred

</deferred>

---

*Phase: 08-docs-release-infra*
*Context gathered: 2026-04-14*
