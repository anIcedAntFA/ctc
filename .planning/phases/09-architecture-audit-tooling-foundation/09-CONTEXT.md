# Phase 9: Architecture Audit & Tooling Foundation - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Settle the `src/clipboard/` folder shape, wire CI validation tooling as a dedicated job, update size-limit budgets for the rich clipboard era, and add the `RICH_CLIPBOARD_NOT_SUPPORTED` error code — so Phase 10's rich content work builds on a clean, documented foundation.

Scope is infrastructure only. No new clipboard functions ship in this phase.

</domain>

<decisions>
## Implementation Decisions

### CI Validate Job Structure
- **D-01:** Extract `validate` (publint + attw) from the `unit-test` job into a dedicated `validate` CI job
- **D-02:** The `validate` job depends on `lint-and-build` (needs dist/) and runs **parallel** to `unit-test` and `e2e-test` — not sequential after them, to keep CI fast
- **D-03:** Run validate on **all 4 packages** (core, react, vue, svelte) — each package must have a `validate` script (`publint && attw --pack`)

### Flat Structure Documentation
- **D-04:** Primary rationale for keeping `src/clipboard/` flat: **discoverability** — all clipboard functions live at the same level, consumers see a flat predictable surface without needing to know an internal rich/ vs plain split
- **D-05:** The KEY DECISIONS entry in PROJECT.md must include a **forward-looking rule**: all new clipboard functions go into the flat `src/clipboard/` until an explicit architectural decision is made to reorganise — Phase 10+ authors should not create subfolders

### size-limit Budgets
- **D-06:** Raise `dist/clipboard/index.mjs` from 1KB → **1.5KB** gzip (ARCH-03 requirement — rich clipboard doubles the API surface)
- **D-07:** Also raise `dist/index.mjs` (root barrel) from 1KB → **1.5KB** gzip — the root barrel re-exports everything from clipboard/, so it grows with the same additions; raising now prevents a broken size check when Phase 10 lands
- **D-08:** Adapter package size-limit configs deferred to **Phase 11** — set limits when the actual rich adapter additions are known

### Error Code Addition
- **D-09:** Add `RICH_CLIPBOARD_NOT_SUPPORTED` to the `ErrorCode` union in `packages/core/src/lib/types.ts`
- **D-10:** No additional JSDoc section needed beyond the existing type comment pattern — consistent with how other error codes are documented

### Claude's Discretion
- Exact validate script command in each adapter's package.json (adapt to match what attw supports per package)
- Whether to add `validate` to Turborepo pipeline config or run it as a direct pnpm command in CI
- Node version used in the validate job (single version, not matrix — validation is not Node-version-sensitive)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Architecture & Tooling — ARCH-01 through ARCH-04 define exact acceptance criteria

### Existing CI Pipeline
- `.github/workflows/ci.yml` — current job structure (validate currently inside unit-test job)

### Types to Modify
- `packages/core/src/lib/types.ts` — ErrorCode union and BrowserUtilsError (add RICH_CLIPBOARD_NOT_SUPPORTED here)

### size-limit Config to Modify
- `packages/core/package.json` — `"size-limit"` key with current 1KB limits

### PROJECT.md KEY DECISIONS Table
- `.planning/PROJECT.md` — KEY DECISIONS table where flat structure rationale must be documented

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/core/src/lib/types.ts`: ErrorCode union — new error code appended here, same pattern as existing codes
- `packages/core/package.json` `"size-limit"`: two entries to update (index.mjs and clipboard/index.mjs)
- `.github/workflows/ci.yml`: existing job structure — new validate job follows same checkout/pnpm/setup-node pattern

### Established Patterns
- validate script: `publint && attw --pack` (already in packages/core, needs replication to react/vue/svelte)
- CI jobs: all use `ubuntu-latest`, `pnpm/action-setup@v4`, `actions/setup-node@v4` with `node-version: 22`
- Turbo pipeline: validate is a turbo task in packages/core; extending to adapters follows same pattern

### Integration Points
- CI yaml: add `validate` job block, update `unit-test` to remove the validate step
- Turbo config: check if `validate` is already a pipeline task, extend to adapters if needed
- Four adapter package.json files: each needs a `validate` script entry

</code_context>

<specifics>
## Specific Ideas

- No specific UI or behavioral references — this is a pure infrastructure phase
- Keep CI parallel structure: lint-and-build → [unit-test | validate | e2e-test] in parallel

</specifics>

<deferred>
## Deferred Ideas

- Adapter package size-limit configurations — Phase 11 (when actual rich adapter additions are known)
- Any codebase restructuring beyond flat clipboard/ — not in scope until post-v0.4.0

</deferred>

---

*Phase: 09-architecture-audit-tooling-foundation*
*Context gathered: 2026-04-16*
