# Phase 9: Architecture Audit & Tooling Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 09-architecture-audit-tooling-foundation
**Areas discussed:** CI validate job structure, Flat structure documentation, size-limit scope

---

## CI Validate Job Structure

| Option | Description | Selected |
|--------|-------------|----------|
| After lint-and-build, parallel to unit-test | validate depends on lint-and-build (needs dist/). Runs concurrently with unit-test and e2e-test — fastest CI time. | ✓ |
| After unit-test, sequential | Runs only after tests pass. Safer gate — only validates a build whose tests are green. Slightly slower pipeline. | |
| Standalone, no dependency | Runs its own install + build inline. Fully independent but duplicates work and is slower. | |

**User's choice:** After lint-and-build, parallel to unit-test (recommended default)

| Option | Description | Selected |
|--------|-------------|----------|
| Core only | Only packages/core has publish-critical exports map complexity. Adapters are simpler and already validated indirectly. | |
| All 4 packages | Run attw + publint on core, react, vue, and svelte. More thorough but each adapter package must have a validate script. | ✓ |
| You decide | Let Claude pick based on what validate scripts exist across packages. | |

**User's choice:** All 4 packages
**Notes:** Each adapter package will need a `validate` script added.

---

## Flat Structure Documentation

| Option | Description | Selected |
|--------|-------------|----------|
| Discoverability — one place to look | All clipboard functions live at the same level. Developers see a flat, predictable surface without needing to know the internal rich/ vs plain split. | ✓ |
| Bundle boundary — one subpath entry point | The package exports ./clipboard as a single subpath. A subfolder would create internal module complexity without any new public entry point. | |
| Premature abstraction — API isn't proven yet | Until the rich clipboard API has shipped and stabilised, partitioning is speculative. Flat first, refactor later if needed. | |

**User's choice:** Discoverability — one place to look (recommended default)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, include forward-looking rule | Makes the decision actionable for Phase 10+ authors — they know not to create subfolders. | ✓ |
| No, document the current decision only | Simpler entry. Phase 10 can revisit if needed. | |

**User's choice:** Yes, include forward-looking rule (recommended default)

---

## size-limit Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Raise root barrel to 1.5KB too | Root barrel re-exports everything from clipboard/. Once rich functions land it will exceed 1KB. Better to raise now alongside ARCH-03 than break size check in Phase 10. | ✓ |
| Keep root barrel at 1KB, revisit in Phase 10 | Leave it for Phase 10 when the actual growth happens. Phase 9 only changes what ARCH-03 specifies. | |
| You decide | Let Claude determine the right budget based on what the root barrel currently exports. | |

**User's choice:** Raise root barrel to 1.5KB too (recommended default)

| Option | Description | Selected |
|--------|-------------|----------|
| No — defer to Phase 11 | Adapter budgets are an adapter concern. Phase 11 adds rich adapter exports — set limits then when the actual size is known. | ✓ |
| Yes — add to all 3 adapters now | Establish the 2KB brotli baseline before Phase 11 grows the adapters. Catches accidental bloat early. | |
| You decide | Let Claude add them if adapters already have size scripts, skip if not. | |

**User's choice:** No — defer to Phase 11 (recommended default)

---

## Claude's Discretion

- Node version for validate job (single version, validation is not Node-version-sensitive)
- Whether validate runs via `pnpm turbo run validate` or direct `pnpm -r --filter=./packages/* run validate`
- Exact attw command flag per adapter (some may need `--pack` adjustments)

## Deferred Ideas

- Adapter size-limit configurations — deferred to Phase 11
