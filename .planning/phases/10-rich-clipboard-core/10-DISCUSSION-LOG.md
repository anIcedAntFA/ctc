# Phase 10: Rich Clipboard Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 10-rich-clipboard-core
**Areas discussed:** copyRichContent signature, readRichContent failure return, File structure, isRichClipboardSupported detection scope

---

## copyRichContent Signature

| Option | Description | Selected |
|--------|-------------|----------|
| Positional args | `copyRichContent(html, plainText, options?)` — matches ROADMAP spec, consistent with copyToClipboard(text, options?) | |
| Named object first arg | `copyRichContent({ html, text }, options?)` — groups both MIMEs together, makes dual-MIME nature explicit | ✓ |

**User's choice:** Named object first arg

---

### Both fields required?

| Option | Description | Selected |
|--------|-------------|----------|
| Both required | `{ html: string, text: string }` — enforces dual MIME always, no auto-strip | ✓ |
| html required, text optional | `{ html: string, text?: string }` — library auto-strips HTML for plain text fallback | |
| Each field optional, at least one | `{ html?: string, text?: string }` — maximum flexibility | |

**User's choice:** Both required

**Notes:** User asked for clarification on *why* dual MIME is needed. Explained: ClipboardItem writes multiple MIME types simultaneously. Pasting into rich text editors uses `text/html`; pasting into plain text apps uses `text/plain`. Without `text/plain`, plain text apps paste raw HTML markup. Auto-stripping HTML was rejected because strip quality is unreliable (loses whitespace, list formatting, etc.) — caller knows their own content best.

---

## readRichContent Failure Return

| Option | Description | Selected |
|--------|-------------|----------|
| Return null | Complete failure → `null`; partial → `{ html: null, text: null }`. Consistent with readFromClipboard(). | ✓ |
| Always return the object | `{ html: null, text: null }` on failure. Ambiguous: can't distinguish failure from empty clipboard. | |

**User's choice:** Return null on complete failure

---

## File Structure

| Option | Description | Selected |
|--------|-------------|----------|
| New files, rich- prefix | `rich-copy.ts`, `rich-read.ts`, `rich-detect.ts` — existing files untouched | ✓ |
| Extend existing files | Add rich functions to copy.ts, read.ts, detect.ts — fewer files but mixed concerns | |
| Single rich.ts file | All 3 functions in one file — breaks one-concern-per-file pattern | |

**User's choice:** New files with `rich-` prefix

---

## isRichClipboardSupported Detection Scope

| Option | Description | Selected |
|--------|-------------|----------|
| ClipboardItem + write check | `typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function'` — most accurate | ✓ |
| ClipboardItem only | `typeof ClipboardItem !== 'undefined'` — simpler, but technically less precise | |

**User's choice:** Both checks (ClipboardItem + navigator.clipboard.write)

---

## Claude's Discretion

- TSDoc comment style and @example content for new functions
- Whether `readRichContent` iterates clipboard items via `getType()` with individual try/catch per MIME type
- Exact error message strings

## Deferred Ideas

None.
