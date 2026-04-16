---
status: partial
phase: 10-rich-clipboard-core
source: [10-VERIFICATION.md]
started: 2026-04-16T00:00:00Z
updated: 2026-04-16T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Runtime TypeScript import from real package consumer
expected: `import { isRichClipboardSupported, copyRichContent, readRichContent } from '@ngockhoi96/ctc'` resolves without TypeScript errors in a consumer project
result: [pending]

### 2. copyRichContent write in real browser
expected: Calling `copyRichContent({ html: '<b>hello</b>', text: 'hello' })` in browser with user gesture and clipboard permission returns `true` and clipboard contains both text/html and text/plain MIME entries
result: [pending]

### 3. readRichContent read from real browser
expected: After copying rich content, `readRichContent()` returns `{ html: '<b>hello</b>', text: 'hello' }` (non-null values)
result: [pending]

### 4. Firefox ClipboardItem flag disabled
expected: When `dom.events.asyncClipboard.clipboardItem=false` in Firefox, `isRichClipboardSupported()` returns `false` and `copyRichContent` calls `onError` with `RICH_CLIPBOARD_NOT_SUPPORTED`
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
