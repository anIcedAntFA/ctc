# Phase 13: Documentation & Positioning Overhaul - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 13-documentation-positioning-overhaul
**Areas discussed:** Badge set, Library comparison strategy, Similar / Related Projects section, File update scope

---

## Badge set

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — show all 3 (React/Vue/Svelte) | Signals multi-framework library immediately | ✓ |
| No — packages table is enough | Badges would be redundant with existing table | |
| Yes — one combined badge | Compact single 'React \| Vue \| Svelte' badge | |

**User's choice:** Yes — show all 3 framework badges

---

| Option | Description | Selected |
|--------|-------------|----------|
| TypeScript | Strict TS badge | ✓ |
| npm downloads | Social proof badge | ✓ |
| Tree-shakeable | Static badge | ✓ |
| Codecov / test coverage | Coverage badge | ✓ |

**Notes:** User also requested "build, deploy, release" badges — clarified to CI + Release workflow badges.

---

| Option | Description | Selected |
|--------|-------------|----------|
| CI + Release badges | Two separate badges: ci.yml + release.yml | ✓ |
| CI badge only | Keep existing CI badge | |
| All workflow badges | Badge per workflow file | |

---

| Option | Description | Selected |
|--------|-------------|----------|
| Root README only | Badges at monorepo entry point | ✓ |
| Root + each package README | Each package also gets badges | |

---

## Library comparison strategy

| Option | Description | Selected |
|--------|-------------|----------|
| API style column | write-only vs read+write etc. | ✓ |
| Last updated / maintenance status | Shows staleness of competitors | ✓ |
| TypeScript support | Native TS vs @types vs none | ✓ |
| SSR-safe column | Works in Next.js/Nuxt | ✓ |

**User's choice:** All four additional columns

---

| Option | Description | Selected |
|--------|-------------|----------|
| react-copy-to-clipboard | ~3M downloads, React-locked | ✓ |
| usehooks-ts (useClipboard) | TS hooks collection | ✓ |
| @vueuse/core (useClipboard) | Vue utility, Vue-locked | ✓ |
| tinykeys / other micro-libs | Other small utilities | ✓ |

---

| Option | Description | Selected |
|--------|-------------|----------|
| Factual comparison table in README | No editorializing, facts speak | |
| Narrative 'Why ctc?' section | Prose advantages | |
| Both — narrative intro + table | 2-3 sentence intro + comparison table | ✓ |

---

| Option | Description | Selected |
|--------|-------------|----------|
| BENCHMARKS.md expanded | Full comparison in BENCHMARKS.md, README links to it | ✓ |
| Root README only | Put everything in README | |
| Both — summary in README, full in BENCHMARKS.md | | |

---

## Similar / Related Projects section

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped by type | Framework-agnostic / React / Vue / Svelte subsections | ✓ |
| Single flat table | One table with Framework column | |
| Prose with links | Narrative paragraphs | |

---

| Option | Description | Selected |
|--------|-------------|----------|
| Neutral reference list | Factual descriptions, no comparison language | ✓ |
| Explicit contrast | Each entry notes how ctc differs | |

---

| Option | Description | Selected |
|--------|-------------|----------|
| clipboard-copy + copy-to-clipboard | Core framework-agnostic libs | ✓ |
| react-copy-to-clipboard + React hook collections | React-specific solutions | ✓ |
| @vueuse/core useClipboard | Vue idiomatic solution | ✓ |
| Svelte community libs | Small Svelte clipboard utilities | ✓ |

---

## File update scope

| Option | Description | Selected |
|--------|-------------|----------|
| Add keywords | clipboard, react, vue, svelte, typescript, tree-shakeable, browser, SSR | ✓ |
| Update description | More end-user facing description | ✓ |
| Add homepage / repository fields | GitHub URL fields | ✓ |
| Update package READMEs keywords/description | Mirror to each package | ✓ |

---

| Option | Description | Selected |
|--------|-------------|----------|
| CONTRIBUTING: add esbuild explanation | Document esbuild = size measurement tool, not build tool | ✓ |
| CONTRIBUTING: update pnpm commands | Verify all commands current | ✓ |
| CLAUDE.md: update conventions section | Patterns from v0.4.0 | ✓ |
| CLAUDE.md: update architecture section | Map current monorepo shape | ✓ |

---

## Claude's Discretion

- Badge ordering in badge row
- Exact "Why ctc?" narrative wording
- Which Svelte community lib to reference if sparse ecosystem
- Codecov integration setup decision

## Deferred Ideas

None
