---
phase: 08-docs-release-infra
plan: "01"
subsystem: docs
tags: [readme, documentation, monorepo-hub, api-reference]
dependency_graph:
  requires: []
  provides: [packages/core/README.md, README.md (hub)]
  affects: [DX-05, DX-06]
tech_stack:
  added: []
  patterns: [hub-readme, per-package-readme, adapter-readme-structure]
key_files:
  created:
    - packages/core/README.md
  modified:
    - README.md
decisions:
  - "packages/core/README.md Browser Support section links to root README#browser-support rather than duplicating the table (Pattern 3 from research, per Claude's discretion per CONTEXT.md)"
  - "Root README quick start uses exactly one code fence (minimal snippet) with two prose pointers to core and framework adapters"
metrics:
  duration: ~5min
  completed: "2026-04-14"
  tasks_completed: 2
  files_changed: 2
---

# Phase 8 Plan 1: README Restructure (Hub Root + Core API Reference) Summary

Rewrote root `README.md` as a monorepo hub landing page and created `packages/core/README.md` containing the full API reference extracted verbatim from the former root README. API documentation now has a single source of truth at `packages/core/README.md`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create packages/core/README.md with full API reference | b593f98 | packages/core/README.md (created, 249 lines) |
| 2 | Rewrite root README.md as monorepo hub/landing page | 3d4a156 | README.md (68 lines, was 302) |

## What Was Built

### packages/core/README.md (new)
Full API reference for the `@ngockhoi96/ctc` core package, following the same section structure as the existing adapter READMEs (`packages/react/README.md`, `packages/vue/README.md`, `packages/svelte/README.md`):

- Title + one-liner + SSR-safe blockquote
- `## Install` — all three package managers
- `## Quick Start` — minimal copyToClipboard snippet
- `## API Reference` — all five function subsections verbatim from former root README
- `## Error Handling` — BrowserUtilsError interface, ClipboardOptions, Error Codes table, onError example
- `## Browser Support` — links to `../../README.md#browser-support` (no duplication)
- `## License` — links to `../../LICENSE`

No badges, Contributing, Publishing, or Versioning sections (per plan spec).

### README.md (rewritten hub)
Hub/landing page, 68 lines (down from 302):

- Title + monorepo one-liner
- All 4 existing badges retained verbatim
- SSR-safe blockquote retained
- `## Packages` table — 4 rows with relative links to all package READMEs
- `## Quick Start` — one minimal snippet + two prose pointers (core README, framework adapters)
- `## Monorepo Structure` — depth-2 directory tree with pnpm workspaces + Turborepo note
- `## Browser Support` — full table retained at root (per D-02 item 5)
- `## License`

Removed: `## Installation`, `## API Reference`, `## Error Handling`, `## Contributing`, `## Versioning`, `## Publishing`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both files are fully wired documentation with no placeholder content.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All links are relative paths or existing public badge URLs. Package names copied verbatim from authoritative `packages/*/package.json` name fields. No secrets or internal infra references included.

## Self-Check: PASSED

- [x] `packages/core/README.md` exists
- [x] `README.md` exists (rewritten)
- [x] Commit b593f98 exists (Task 1)
- [x] Commit 3d4a156 exists (Task 2)
- [x] Root README has exactly 2 references to `packages/core/README.md` (package table + Quick Start pointer)
- [x] Root README is 68 lines (within 60-80 target, under 100 limit)
- [x] All 5 function subsections present in packages/core/README.md
- [x] All 5 error codes present in packages/core/README.md
- [x] Browser Support table retained at root
- [x] No BrowserUtilsError in root README
- [x] DX-05 satisfied: root README reflects monorepo structure with links to all 4 packages
- [x] DX-06 satisfied (core portion): packages/core/README.md exists with full API reference
