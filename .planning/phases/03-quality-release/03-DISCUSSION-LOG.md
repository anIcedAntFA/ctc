> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion.

**Date:** 2026-04-09
**Phase:** 03-quality-release
**Mode:** discuss
**Areas discussed:** Unit test structure, E2E test scope, CI strategy, README depth, Changelog format, Semver policy, Publish workflow

## Decisions Made

| Area | Decision | Notes |
|------|----------|-------|
| Unit test location | `tests/unit/` directory | Not co-located — keeps src/ clean |
| Clipboard mock | `vi.stubGlobal` at module level | Per rules/testing.md pattern |
| E2E scope | Core happy paths + insecure context | Not full error-code coverage |
| E2E permissions | `grantPermissions` in browser context | Chromium + WebKit |
| CI E2E trigger | Every PR | Full pipeline on every PR |
| CI matrix | ubuntu-latest × Node 20+22 | Unit tests; E2E on Node 22 only |
| README depth | Full API reference in README | No VitePress for v0.1.0 |
| Changelog | @changesets/changelog-github | Already configured |
| Semver | 0.x.y pre-1.0 policy | Consistent with Phase 1 D-18 |
| Publish trigger | Changesets Release Action | Version PR → merge → publish |

## No Corrections
All recommended options accepted without changes.
