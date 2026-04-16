---
plan: 09-02
phase: 09-architecture-audit-tooling-foundation
status: complete
requirements: [ARCH-02]
self_check: PASSED
---

## Summary

Extracted the `publint + attw` validation step from the `unit-test` job matrix into a dedicated `validate` CI job. The new job runs parallel to `unit-test` and `e2e-test` (all three depend on `lint-and-build`), uses a single Node 22 runner (no matrix needed for validation), and runs `pnpm turbo run validate` which covers all 4 packages.

## What Was Built

- **New `validate` CI job** in `.github/workflows/ci.yml` — dedicated job for package correctness checks (publint + attw) running parallel to unit-test and e2e-test
- **Removed validate step from `unit-test`** — validation no longer duplicates across Node 20 and 22 matrix runs
- **Updated pipeline header comment** — reflects new parallel job structure

## Key Files

### Modified
- `.github/workflows/ci.yml` — added `validate` job, removed `Validate package (publint + attw)` step from `unit-test` job, updated header comment

## Verification

- `validate:` job key exists in ci.yml ✓
- `needs: lint-and-build` on validate job (parallel to unit-test and e2e-test) ✓
- `pnpm turbo run validate` in validate job (covers all 4 packages via turbo) ✓
- `pnpm turbo run build` in validate job (dist/ needed for attw) ✓
- `Validate package (publint + attw)` step removed from unit-test ✓
- Header comment updated to reflect `[unit-test (matrix) | validate | e2e-test]` ✓

## Self-Check: PASSED
