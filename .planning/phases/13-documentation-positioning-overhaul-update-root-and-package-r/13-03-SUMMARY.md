---
plan: 13-03
status: complete
completed: 2026-04-17
commits:
  - 3233f65
---

## Summary

Overhauled root README.md with emoji title, 12-badge row, "Why ctc?" positioning narrative, and a new "Similar / Related Projects" section grouped by framework.

## What Was Built

- **Emoji title (D-25):** `# 📋 @ngockhoi96/ctc`
- **12-badge row (D-01–D-07):** Replaced 4 badges with 12: npm version, Bundle Size, npm downloads, React, Vue, Svelte, TypeScript, tree-shakeable, Coverage (static 100%), CI, Release, License — no blank lines between badges
- **"Why ctc?" blockquote (D-10):** Inserted between badge block and existing SSR-safe callout, links to `./BENCHMARKS.md`
- **"Similar / Related Projects" section (D-11–D-14):** Added before `## License` with 4 subsections:
  - Framework-agnostic: clipboard-copy, copy-to-clipboard
  - React: react-copy-to-clipboard, usehooks-ts, react-use
  - Vue: @vueuse/core
  - Svelte: note about sparse ecosystem with link to svelte-action docs

## Key Files

### Modified
- `README.md` — overhauled with all positioning content

## Deviations

None. All must-haves from the plan satisfied.

## Self-Check: PASSED

- Title: `# 📋 @ngockhoi96/ctc` ✓
- Badge count: 12 (grep returns 12) ✓
- Coverage badge uses static URL (no Codecov) ✓
- "Why ctc?" blockquote present ✓
- "Similar / Related Projects" with 4 subsections present ✓
- Section order correct: Packages → Quick Start → Monorepo Structure → Browser Support → Similar/Related → License ✓
- No full comparison table in README (link to BENCHMARKS.md only) ✓
