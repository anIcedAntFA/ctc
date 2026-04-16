---
phase: 10-rich-clipboard-core
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - packages/core/src/clipboard/index.ts
  - packages/core/src/clipboard/rich-copy.ts
  - packages/core/src/clipboard/rich-detect.ts
  - packages/core/src/clipboard/rich-read.ts
  - packages/core/src/clipboard/types.ts
  - packages/core/src/index.ts
  - packages/core/src/lib/errors.ts
  - packages/core/tests/unit/clipboard/rich-copy.test.ts
  - packages/core/tests/unit/clipboard/rich-detect.test.ts
  - packages/core/tests/unit/clipboard/rich-read.test.ts
  - packages/core/vitest.config.ts
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 10 adds three rich clipboard modules (`rich-copy.ts`, `rich-detect.ts`, `rich-read.ts`) plus their unit tests, type definitions, and barrel exports. The overall implementation quality is high: correct guard ordering, structured error handling, no-throw contract throughout, TSDoc coverage, and zero runtime dependencies. Two warnings were found — one is a logic issue in the read loop that can silently drop data, the other is a semantic mismatch between the detect function and the read function it is documented to guard. One informational item flags an under-specified test assertion.

## Warnings

### WR-01: Multi-item clipboard loop silently overwrites earlier results

**File:** `packages/core/src/clipboard/rich-read.ts:88-102`

**Issue:** The `for...of` loop over `items` unconditionally overwrites `result.html` and `result.text` on every iteration. If `navigator.clipboard.read()` ever returns more than one `ClipboardItem` (which the spec allows), the data from all earlier items is silently discarded in favour of the last one. This is not an obvious "last wins" design — the function is documented as returning the clipboard content, implying a deterministic single result. Any future browser or clipboard manager that returns multiple items will silently produce wrong output without any test failure.

**Fix:** Break out of the loop once both fields are populated, or explicitly take only the first item. The most defensible approach aligns with the spec's typical single-item behaviour:

```typescript
// Option A — break early once both fields are filled
for (const item of items) {
  if (result.html === null) {
    try {
      const htmlBlob = await item.getType('text/html')
      result.html = await htmlBlob.text()
    } catch {
      // text/html not present in this item — leave null
    }
  }

  if (result.text === null) {
    try {
      const textBlob = await item.getType('text/plain')
      result.text = await textBlob.text()
    } catch {
      // text/plain not present in this item — leave null
    }
  }

  if (result.html !== null && result.text !== null) break
}
```

Alternatively, if taking only the first item is the intended contract, document it explicitly and process only `items[0]`.

---

### WR-02: `isRichClipboardSupported()` checks `.write` but callers of `readRichContent` need `.read`

**File:** `packages/core/src/clipboard/rich-detect.ts:36`

**Issue:** `isRichClipboardSupported()` checks `typeof navigator.clipboard?.write === 'function'` (line 36). The TSDoc for `readRichContent` explicitly instructs callers to use `isRichClipboardSupported()` as a pre-flight check. However, `readRichContent` internally checks `navigator.clipboard.read` (not `.write`). In any browser where `.write` is available but `.read` is not (or vice versa), `isRichClipboardSupported()` will give a false positive for read operations. The detect function only reliably gates `copyRichContent`.

**Fix:** Expand the detection to check both APIs, or add a second export specifically for read support. The minimal, non-breaking fix:

```typescript
export function isRichClipboardSupported(): boolean {
  return (
    isBrowser() &&
    isSecureContext() &&
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function' &&
    typeof navigator.clipboard?.read === 'function'  // add read check
  )
}
```

If the two APIs need to be checked independently, add `isRichClipboardReadSupported()` and `isRichClipboardWriteSupported()` as separate exports and update the TSDoc on both `copyRichContent` and `readRichContent` to reference the correct guard.

---

## Info

### IN-01: `passes ClipboardItem` test does not verify MIME types or Blob contents

**File:** `packages/core/tests/unit/clipboard/rich-copy.test.ts:35-43`

**Issue:** The test titled "passes ClipboardItem with text/html and text/plain Blobs to write" only checks `writeArg.length === 1` and that the item is defined. It does not assert that the ClipboardItem was constructed with the correct MIME type keys (`text/html`, `text/plain`) or that the Blob contents match the input. A regression where MIME types are swapped or the wrong content is written would not be caught.

**Fix:** Extend the assertion to inspect the mock ClipboardItem's `data` property, which is exposed via the `public data` constructor field on the mock class:

```typescript
it('passes ClipboardItem with text/html and text/plain Blobs to write', async () => {
  mockWrite.mockResolvedValueOnce(undefined)

  await copyRichContent(testContent)

  const writeArg = mockWrite.mock.calls[0][0]
  expect(writeArg).toHaveLength(1)

  const item = writeArg[0]
  expect(item.data).toHaveProperty('text/html')
  expect(item.data).toHaveProperty('text/plain')

  // Verify Blob contents
  expect(await item.data['text/html'].text()).toBe('<b>Hello</b>')
  expect(await item.data['text/plain'].text()).toBe('Hello')
})
```

---

_Reviewed: 2026-04-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
