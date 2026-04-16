---
phase: 09
status: findings
files_reviewed: 3
findings:
  critical: 0
  warning: 2
  info: 0
  total: 2
---

## Code Review — Phase 09

### WR-01 — `RICH_CLIPBOARD_NOT_SUPPORTED` not registered in `EXPECTED_ERROR_CODES`

**File:** `packages/core/src/lib/errors.ts`
**Related:** `packages/core/src/lib/types.ts`
**Confidence:** 82

The new `RICH_CLIPBOARD_NOT_SUPPORTED` union member is absent from the `EXPECTED_ERROR_CODES` set in `errors.ts`. Every other `*_NOT_SUPPORTED` code (`CLIPBOARD_NOT_SUPPORTED`, `INSECURE_CONTEXT`) is in that set and routes to `console.warn`. `RICH_CLIPBOARD_NOT_SUPPORTED` falls through to the `else` branch and will log via `console.error`, contradicting the code-style rule: "console.warn for 'not supported', console.error for unexpected failures".

The intentional deferral to Phase 10 should be marked with a TODO comment so the gap is not forgotten.

**Fix:** Add TODO at `EXPECTED_ERROR_CODES` in `errors.ts`:
```ts
// TODO(phase-10): add 'RICH_CLIPBOARD_NOT_SUPPORTED' when copyRichContent is implemented
```

---

### WR-02 — `CLAUDE.md` size constraint not updated to match new 1.5 KB budget

**File:** `CLAUDE.md`
**Related:** `packages/core/package.json`
**Confidence:** 85

`CLAUDE.md` still reads "Bundle size < 1KB gzip for core clipboard module". The `size-limit` entries now enforce `"limit": "1.5 KB"`. The contradiction will cause incorrect rejections of valid bundle size increases during Phase 10 work.

**Fix:** Update `CLAUDE.md` to read:
```
- Bundle size < 1.5KB gzip for core clipboard module
```
