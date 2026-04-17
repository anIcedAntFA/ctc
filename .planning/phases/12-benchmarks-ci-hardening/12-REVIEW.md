---
phase: 12
phase_name: benchmarks-ci-hardening
status: issues_found
depth: standard
files_reviewed: 13
findings:
  critical: 1
  warning: 3
  info: 0
  total: 4
reviewed: 2026-04-17
---

# Phase 12 Code Review

**Phase:** 12 — Benchmarks & CI Hardening
**Depth:** standard
**Files reviewed:** 13
**Status:** issues_found

---

## Findings

### CR-01 — `as string` cast violates no-cast rule

**Severity:** critical
**File:** `benchmarks/scripts/measure-bundle-size.ts:26`
**Confidence:** 95%

`pkg.version as string` uses a TypeScript `as` cast. Project rules in `.claude/rules/code-style.md` explicitly state "no `as` casts unless documented." `pkg` is the result of `JSON.parse(readFileSync(...))` typed as `any`; accessing `.version` on `any` already produces `any`. The `as string` cast adds no runtime safety and can mask a missing or non-string version field at runtime.

**Fix:**
```typescript
// Replace:
return pkg.version as string

// With type-safe narrowing:
return typeof pkg.version === 'string' ? pkg.version : 'unknown'
```

---

### WR-01 — `formatBytes` duplicated across two script files

**Severity:** warning
**Files:** `benchmarks/scripts/measure-bundle-size.ts:18-20`, `benchmarks/scripts/generate-benchmarks.ts:11-13`
**Confidence:** 85%

The function is identical in both files:
```typescript
function formatBytes(bytes: number): string {
  return (bytes / 1024).toFixed(2) + ' KB'
}
```

`generate-benchmarks.ts` already imports from `measure-bundle-size.ts`. Any formatting change must be applied in two places.

**Fix:** Export `formatBytes` from `measure-bundle-size.ts` and import it in `generate-benchmarks.ts`.

---

### WR-02 — `uninstall()` does not restore `isSecureContext`

**Severity:** warning
**File:** `benchmarks/src/helpers/clipboard-mock.ts:50-53`
**Confidence:** 82%

`stubSecureContext()` sets `isSecureContext` via `Object.defineProperty`, but `uninstall()` only calls `vi.unstubAllGlobals()` — which restores globals set via `vi.stubGlobal()`, not via `Object.defineProperty`. After `uninstall()`, `window.isSecureContext` remains `true`. A future "error path" benchmark needing `isSecureContext = false` would silently receive the wrong value.

**Fix:** Either reset `isSecureContext` inside `uninstall()`:
```typescript
uninstall() {
  vi.unstubAllGlobals()
  Object.defineProperty(window, 'isSecureContext', {
    value: false,
    writable: true,
    configurable: true,
  })
},
```
Or document the partial-restore limitation in a comment.

---

### WR-03 — `import.meta.dirname!` non-null assertion

**Severity:** warning
**File:** `benchmarks/scripts/generate-benchmarks.ts:6`
**Confidence:** 80%

```typescript
const BENCHMARKS_DIR = resolve(import.meta.dirname!, '..')
```

The `!` operator silences a strict null check. Prefer the assertion-free alternative:

```typescript
import { fileURLToPath } from 'node:url'

const BENCHMARKS_DIR = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
```

This works universally across all Node 20+ ESM environments without requiring non-null assertion.

---

## Config and Wiring Verification — All Correct

- `benchmarks/tsconfig.json` extends `../tsconfig.base.json` (correct relative path) with `include: ["src", "scripts"]` covering both directories
- `pnpm-workspace.yaml` correctly adds `"benchmarks"`
- `turbo.json` bench task has `"cache": false` and `"dependsOn": ["^build"]`
- Root `package.json` `"bench": "turbo run bench"` follows established turbo pattern
- `.gitignore` entry `bench-results.json` covers `benchmarks/bench-results.json`
- `benchmarks/package.json` is `"private": true`, vitest pinned at `"4.1.3"` matching other workspace packages
- `clipboard-copy` and `copy-to-clipboard` are in `devDependencies` of a private package — no published bundle contamination

## Summary

| ID | Severity | File | Issue |
|----|----------|------|-------|
| CR-01 | critical | `measure-bundle-size.ts:26` | `as string` cast violates no-cast rule |
| WR-01 | warning | `measure-bundle-size.ts:18`, `generate-benchmarks.ts:11` | `formatBytes` duplicated — export and share |
| WR-02 | warning | `clipboard-mock.ts:50-53` | `uninstall()` does not restore `isSecureContext` |
| WR-03 | warning | `generate-benchmarks.ts:6` | `!` non-null assertion on `import.meta.dirname` |

Overall implementation is solid — benchmark structure is correct, `mockResolvedValue` (not `mockResolvedValueOnce`) correctly supports thousands of iterations, monorepo wiring follows established patterns, and the generated `BENCHMARKS.md` output is clear and informative.
