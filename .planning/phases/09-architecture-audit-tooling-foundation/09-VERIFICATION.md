---
phase: 09-architecture-audit-tooling-foundation
verified: 2026-04-16T12:00:00Z
status: passed
score: 4/4
overrides_applied: 0
---

# Phase 9: Architecture Audit & Tooling Foundation — Verification Report

**Phase Goal:** Establish architectural documentation, tooling foundation, and error taxonomy to support Phase 10+ rich clipboard work cleanly.
**Verified:** 2026-04-16T12:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Developer reading PROJECT.md KEY DECISIONS table finds a row explaining why `src/clipboard/` is flat, with a forward-looking rule | VERIFIED | `.planning/PROJECT.md` line 100: `src/clipboard/ flat structure` row with "Discoverability" rationale and "new clipboard functions go flat into `src/clipboard/` until an explicit architectural decision is made to reorganize" forward rule. Status: "Active -- enforced from Phase 9 onward" |
| 2 | size-limit check passes with 1.5KB budget for both `dist/index.mjs` and `dist/clipboard/index.mjs` | VERIFIED | `packages/core/package.json` size-limit array: both entries set to `"limit": "1.5 KB"`. Built dist/ files measured at 293-294 bytes uncompressed, well under 1.5KB gzip threshold |
| 3 | `RICH_CLIPBOARD_NOT_SUPPORTED` is a valid member of the `ErrorCode` union and can be imported | VERIFIED | `packages/core/src/lib/types.ts` line 10: `\| 'RICH_CLIPBOARD_NOT_SUPPORTED'` in ErrorCode union (6th member). Re-exported via `src/clipboard/index.ts` → `src/index.ts`, so importable from both `@ngockhoi96/ctc` and `@ngockhoi96/ctc/clipboard` |
| 4 | CI runs a dedicated `validate` job separate from the unit-test job, running parallel to unit-test and e2e-test (all depending on lint-and-build), running publint + attw | VERIFIED | `.github/workflows/ci.yml`: `validate:` job at line 61, `needs: lint-and-build`, runs `pnpm turbo run build` + `pnpm turbo run validate`. unit-test job contains no validate step (grep confirms only one occurrence of `pnpm turbo run validate`, inside validate job). Pipeline header comment updated to reflect `[unit-test (matrix) \| validate \| e2e-test]` |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/PROJECT.md` | Flat clipboard structure rationale in KEY DECISIONS table | VERIFIED | Contains `src/clipboard/ flat structure` row with Discoverability rationale and forward-looking rule |
| `packages/core/package.json` | Updated size-limit budgets to 1.5 KB | VERIFIED | Both `dist/index.mjs` and `dist/clipboard/index.mjs` entries set to `"limit": "1.5 KB"` |
| `packages/core/src/lib/types.ts` | `RICH_CLIPBOARD_NOT_SUPPORTED` error code in ErrorCode union | VERIFIED | Present as 6th union member; ErrorCode union has exactly 6 members as planned |
| `.github/workflows/ci.yml` | Dedicated `validate:` CI job | VERIFIED | `validate:` job exists with `name: Validate Packages (publint + attw)`, `needs: lint-and-build`, single Node 22 runner, `pnpm turbo run validate` step |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/core/src/lib/types.ts` | `ErrorCode` union | type union member | WIRED | `RICH_CLIPBOARD_NOT_SUPPORTED` is line 10 of ErrorCode union; exported from `src/lib/types.ts`, re-exported through `src/clipboard/index.ts` and `src/index.ts` |
| `.github/workflows/ci.yml validate job` | `lint-and-build job` | `needs: lint-and-build` | WIRED | Line 63 of ci.yml: `needs: lint-and-build` on validate job. Pattern `needs:\s*lint-and-build` matches. unit-test and e2e-test also `needs: lint-and-build` confirming parallel topology |

### Data-Flow Trace (Level 4)

Not applicable. This phase modifies documentation, config, a type definition, and CI YAML. No components rendering dynamic data were added.

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| `ErrorCode` type includes `RICH_CLIPBOARD_NOT_SUPPORTED` | `grep "RICH_CLIPBOARD_NOT_SUPPORTED" packages/core/src/lib/types.ts` | Match found at line 10 | PASS |
| size-limit budget is 1.5 KB for both entries | `grep "1.5 KB" packages/core/package.json` | Two matches (both entries) | PASS |
| validate job is separate from unit-test | `grep -c "pnpm turbo run validate" .github/workflows/ci.yml` | 1 (only in validate job) | PASS |
| dist/ files well under 1.5KB | `ls -la dist/index.mjs dist/clipboard/index.mjs` | 293/294 bytes uncompressed | PASS |
| `ErrorCode` re-exported from package barrel | `grep "ErrorCode" packages/core/src/index.ts` | Present on line 4 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ARCH-01 | 09-01-PLAN.md | Developer can reason about `src/clipboard/` flat structure — rationale documented in KEY DECISIONS | SATISFIED | KEY DECISIONS row in PROJECT.md with Discoverability rationale and forward rule |
| ARCH-02 | 09-02-PLAN.md | CI runs attw + publint in a dedicated `validate` job (not buried in test job) | SATISFIED | Dedicated `validate:` job in ci.yml, separate from unit-test, validate step removed from unit-test |
| ARCH-03 | 09-01-PLAN.md | size-limit budget raised to 1.5KB gzip for `dist/clipboard/index.mjs` (rich clipboard doubles API surface) | SATISFIED | Both size-limit entries set to "1.5 KB" in package.json (core and clipboard subpath) |
| ARCH-04 | 09-01-PLAN.md | `RICH_CLIPBOARD_NOT_SUPPORTED` error code added to `ErrorCode` union in `src/lib/types.ts` | SATISFIED | Present as 6th union member; re-exported from both package entry points |

All 4 Phase 9 requirements (ARCH-01, ARCH-02, ARCH-03, ARCH-04) are satisfied. No orphaned requirements found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/core/src/lib/errors.ts` | 11-15 | `RICH_CLIPBOARD_NOT_SUPPORTED` not added to `EXPECTED_ERROR_CODES` set | Info | This is intentional — Phase 9 adds only the type union member. Phase 10 will add the function that uses this code and can add it to EXPECTED_ERROR_CODES at that time. No impact on Phase 9 goal. |

No blockers or warnings found. The single info-level item is by design — the error code classification (expected vs unexpected) belongs in Phase 10 when the function consuming this code is built.

### Human Verification Required

None. All must-haves are verifiable programmatically. The dist/ files are already built and well under budget.

### Gaps Summary

No gaps. All 4 must-haves verified. All 4 requirements (ARCH-01 through ARCH-04) satisfied. Phase 9 goal is fully achieved.

The architectural documentation is in place (PROJECT.md KEY DECISIONS), the tooling foundation is established (CI validate job), the error taxonomy is extended (`RICH_CLIPBOARD_NOT_SUPPORTED` in `ErrorCode`), and the size budget is updated for the rich clipboard era. Phase 10 rich clipboard work can proceed without structural debates or config changes mid-feature.

---
_Verified: 2026-04-16T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
