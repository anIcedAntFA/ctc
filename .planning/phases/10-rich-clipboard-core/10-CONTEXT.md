# Phase 10: Rich Clipboard Core - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship `isRichClipboardSupported`, `copyRichContent`, and `readRichContent` — three new core functions using the `ClipboardItem` API for HTML + plain text clipboard operations. Same ergonomics and error contract as the existing text clipboard functions.

Scope: core package only. Framework adapters (React, Vue, Svelte) are Phase 11.

</domain>

<decisions>
## Implementation Decisions

### `copyRichContent` Signature
- **D-01:** Accept a named content object as the first argument: `copyRichContent({ html, text }, options?)`
- **D-02:** Both `html` and `text` fields are **required** in the content object — no auto-stripping of HTML to generate plain text. Callers provide both explicitly. This enforces the "dual MIME always" contract from RICH-02.
- **D-03:** Define a `RichContent` interface (in `types.ts` alongside `ClipboardOptions`):
  ```ts
  export interface RichContent {
    html: string
    text: string
  }
  ```
- **D-04:** Full signature: `copyRichContent(content: RichContent, options?: ClipboardOptions): Promise<boolean>`

### `readRichContent` Return Type
- **D-05:** On **complete failure** (ClipboardItem not supported, permission denied, secure context missing): return `null` — consistent with `readFromClipboard()` which returns `string | null`.
- **D-06:** On **success or partial clipboard content**: return `{ html: string | null, text: string | null }` — `null` fields indicate the clipboard held no MIME entry of that type (not a failure).
- **D-07:** Full return type: `Promise<{ html: string | null; text: string | null } | null>`
- **D-08:** This gives callers a clean two-level check: `result === null` → operation failed; `result.html === null` → no HTML in clipboard (but read succeeded).

### `isRichClipboardSupported` Detection
- **D-09:** Check both `typeof ClipboardItem !== 'undefined'` AND `typeof navigator.clipboard?.write === 'function'` — both checks required for accuracy. ClipboardItem alone is insufficient.
- **D-10:** Also gates on `isBrowser()` and `isSecureContext()` — same guard pattern as all existing detect functions.
- **D-11:** Full implementation shape:
  ```ts
  return (
    isBrowser() &&
    isSecureContext() &&
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function'
  )
  ```

### File Structure
- **D-12:** Three new files in `src/clipboard/` with `rich-` prefix — **no changes to existing files**:
  - `rich-detect.ts` — `isRichClipboardSupported()`
  - `rich-copy.ts` — `copyRichContent()`
  - `rich-read.ts` — `readRichContent()`
- **D-13:** `types.ts` gains the `RichContent` interface — exported alongside `ClipboardOptions`.
- **D-14:** All three new functions re-exported from `src/clipboard/index.ts` and `src/index.ts`.

### Error Handling
- **D-15:** Add `'RICH_CLIPBOARD_NOT_SUPPORTED'` to `EXPECTED_ERROR_CODES` set in `lib/errors.ts` (the Phase 9 TODO comment). Expected errors use `console.warn`, not `console.error`.
- **D-16:** Error codes used by the new functions:
  - `CLIPBOARD_NOT_SUPPORTED` — not in a browser (SSR)
  - `INSECURE_CONTEXT` — HTTP page
  - `RICH_CLIPBOARD_NOT_SUPPORTED` — ClipboardItem API absent
  - `CLIPBOARD_PERMISSION_DENIED` — NotAllowedError from browser
  - `CLIPBOARD_WRITE_FAILED` — unexpected write failure
  - `CLIPBOARD_READ_FAILED` — unexpected read failure

### Claude's Discretion
- TSDoc comment style and @example content for new functions
- Whether `readRichContent` iterates clipboard items via `getType()` with individual try/catch per MIME type
- Exact error message strings

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Rich Clipboard Core — RICH-01 through RICH-06 define exact acceptance criteria

### Existing Patterns to Follow
- `packages/core/src/clipboard/copy.ts` — guard pattern, error handling, async return boolean
- `packages/core/src/clipboard/read.ts` — guard pattern, null return on failure
- `packages/core/src/clipboard/detect.ts` — isBrowser() + isSecureContext() + feature check pattern
- `packages/core/src/clipboard/types.ts` — where to add RichContent interface
- `packages/core/src/lib/errors.ts` — createError, handleError, EXPECTED_ERROR_CODES (add RICH_CLIPBOARD_NOT_SUPPORTED here)
- `packages/core/src/lib/types.ts` — ErrorCode union (RICH_CLIPBOARD_NOT_SUPPORTED already present from Phase 9)
- `packages/core/src/lib/env.ts` — isBrowser(), isSecureContext()

### Test Patterns
- `packages/core/tests/unit/clipboard/copy.test.ts` — unit test structure for copy functions
- `packages/core/tests/unit/clipboard/read.test.ts` — unit test structure for read functions

### Phase 9 Context (architectural decisions)
- `.planning/phases/09-architecture-audit-tooling-foundation/09-CONTEXT.md` — flat structure rationale, size-limit budgets, RICH_CLIPBOARD_NOT_SUPPORTED addition

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `isBrowser()` (`lib/env.ts`) — SSR guard, used by all new functions
- `isSecureContext()` (`lib/env.ts`) — HTTPS guard, used by all new functions
- `createError()` + `handleError()` (`lib/errors.ts`) — error creation and dispatch, used by all new functions
- `ClipboardOptions` interface (`clipboard/types.ts`) — reused as the `options?` parameter type on all three new functions
- `EXPECTED_ERROR_CODES` set (`lib/errors.ts`) — add `RICH_CLIPBOARD_NOT_SUPPORTED` here (Phase 9 TODO)

### Established Patterns
- Guard order: `isBrowser()` → `isSecureContext()` → feature check → try/catch
- Return `false` (copy) or `null` (read) at each guard failure after calling `handleError`
- `NotAllowedError` → `CLIPBOARD_PERMISSION_DENIED`; other DOMException → `CLIPBOARD_WRITE/READ_FAILED`
- All public exports have TSDoc with `@param`, `@returns`, `@remarks`, `@example`

### Integration Points
- `src/clipboard/index.ts` — add new exports for all three functions + `RichContent` type
- `src/index.ts` — re-exports everything from `src/clipboard/index.ts` (no changes needed if index.ts re-exports *)
- `lib/errors.ts` EXPECTED_ERROR_CODES — add `RICH_CLIPBOARD_NOT_SUPPORTED`

</code_context>

<specifics>
## Specific Ideas

- The content object approach (`{ html, text }`) was chosen over positional args because it makes the dual-MIME nature of the call explicit at the call site — callers can't confuse the argument order.
- `readRichContent` returning `null` vs the object mirrors how `readFromClipboard` works — users of the existing API will find the mental model familiar.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-rich-clipboard-core*
*Context gathered: 2026-04-16*
