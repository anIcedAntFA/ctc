# Phase 2: Clipboard API - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement all clipboard functions: `copyToClipboard`, `readFromClipboard`, `copyToClipboardLegacy`, `isClipboardSupported`, `isClipboardReadSupported`. All functions must have typed error handling via `onError` callback, return `boolean`/`null` on failure (never throw), and be SSR-safe. This phase delivers the complete clipboard API surface. Testing and CI are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Detection Function Semantics
- **D-01:** `isClipboardSupported()` checks API existence AND `isSecureContext()`. Returns `false` on HTTP, in SSR, or when `navigator.clipboard` is absent. "Supported" means "usable right now" — the most useful interpretation for consumers calling this before attempting a write.
- **D-02:** `isClipboardReadSupported()` checks `navigator.clipboard.readText` existence AND `isSecureContext()`. Synchronous boolean — no `navigator.permissions.query()`. Firefox supports `readText` fine; it's the Permissions API that Firefox doesn't support, so querying it would require try/catch and fall back to the same check anyway.
- **D-03:** Actual permission denial state (user previously denied access) is surfaced at call time via `CLIPBOARD_PERMISSION_DENIED` error code, not by the detection functions.

### copyToClipboardLegacy Design
- **D-04:** Implementation uses textarea + `document.execCommand('copy')` pattern: create hidden textarea, set its value, select all, call `execCommand('copy')`, remove the textarea.
- **D-05:** Signature: `copyToClipboardLegacy(text: string, options?: ClipboardOptions): boolean`. Text-only — `execCommand` cannot handle rich content. Returns `boolean`, same as `copyToClipboard`.
- **D-06:** Same `ClipboardOptions` / `onError` callback pattern as `copyToClipboard`. Failures return `false` and call `onError` (or `console.warn`) — never throw.

### Utils API Surface
- **D-07:** `isBrowser`, `isSecureContext`, `createError`, `handleError` are **internal-only**. Remove them from `src/clipboard/index.ts` and `src/index.ts` public barrel exports. Phase 1 skeleton exports them — Phase 2 cleans this up. These are implementation details; keeping them public locks the API surface unnecessarily.
- **D-08:** Public API exports from Phase 2: `copyToClipboard`, `readFromClipboard`, `copyToClipboardLegacy`, `isClipboardSupported`, `isClipboardReadSupported`, and all public types (`ClipboardOptions`, `BrowserUtilsError`, `ErrorCode`, `OnErrorCallback`).

### Error Logging Policy
- **D-09:** Expected failures (`CLIPBOARD_NOT_SUPPORTED`, `INSECURE_CONTEXT`, `CLIPBOARD_PERMISSION_DENIED`) → `console.warn` when no `onError` is provided. These are part of the normal app lifecycle.
- **D-10:** Unexpected failures (`CLIPBOARD_WRITE_FAILED`, `CLIPBOARD_READ_FAILED`) → `console.error` when no `onError` is provided. These represent an operation that should have worked but didn't.
- **D-11:** `handleError()` in `src/utils/errors.ts` must be updated to differentiate between expected and unexpected error codes and route accordingly.

### Claude's Discretion
- Exact textarea implementation details (z-index, position, visibility approach for the hidden textarea in `copyToClipboardLegacy`)
- Whether to add a `document.body` guard in `copyToClipboardLegacy` (reasonable to include as defensive measure)
- Internal set/array of expected vs unexpected error codes used by `handleError`
- File naming within `src/clipboard/` (e.g., `copy.ts`, `read.ts`, `detect.ts`, `fallback.ts` — per architecture research)
- Whether to add `copyRichContent` / `readRichContent` stubs (deferred to v2 per REQUIREMENTS.md)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `PRD.md` §4 — Core API Design: function signatures, design principles
- `PRD.md` §5 — Error Handling Strategy: `BrowserUtilsError` structure, `onError` pattern
- `PRD.md` §6 — Edge Cases & Security: SSR guards, HTTP detection, iframe limits
- `.planning/REQUIREMENTS.md` — CLIP-01..03, DETECT-01..04, ERR-01..02 with acceptance criteria
- `.planning/PROJECT.md` — Core constraints (zero deps, bundle < 1KB, named exports only)

### Architecture & pitfalls
- `.planning/research/ARCHITECTURE.md` — Module structure, file layout, guard-first pattern, utils-internal-only decision
- `.planning/research/PITFALLS.md` — Safari async clipboard timing, Firefox ClipboardItem limitations, cross-browser behavior matrix

### Existing skeleton
- `src/utils/env.ts` — `isBrowser()`, `isSecureContext()` already implemented
- `src/utils/errors.ts` — `createError()`, `handleError()` already implemented (needs update per D-11)
- `src/utils/types.ts` — `ErrorCode`, `BrowserUtilsError`, `OnErrorCallback` already defined
- `src/clipboard/types.ts` — `ClipboardOptions` already defined
- `src/clipboard/index.ts` — barrel currently exports utils publicly (to be cleaned up per D-07)
- `src/index.ts` — root barrel (to be updated per D-07, D-08)

### Code style
- `.claude/rules/code-style.md` — TypeScript conventions, naming, exports, error handling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/utils/env.ts` — `isBrowser()` and `isSecureContext()` are the foundation guards for all Phase 2 functions. Every clipboard function starts with these checks.
- `src/utils/errors.ts` — `createError(code, message, cause?)` and `handleError(error, onError?)` are ready to use. `handleError` needs the console.warn/error split per D-11.
- `src/utils/types.ts` — `ErrorCode`, `BrowserUtilsError`, `OnErrorCallback` fully typed and ready.
- `src/clipboard/types.ts` — `ClipboardOptions` with `onError?` field ready to import in each function file.

### Established Patterns
- **Guard-first design:** Every exported function checks `isBrowser()` first, then API availability, then secure context before touching any browser API. Return false/null early on any guard failure.
- **Named exports only:** No default exports anywhere. Each function file exports its function by name; barrel re-exports by name.
- **One function per file:** `copy.ts`, `read.ts`, `detect.ts`, `fallback.ts` — strongest tree-shaking guarantee.
- **TypeScript strict:** All exported functions need explicit return types (required by `isolatedDeclarations: true`).

### Integration Points
- `src/clipboard/index.ts` barrel must export all 5 new functions + public types, removing internal utils (D-07)
- `src/index.ts` root barrel re-exports from `./clipboard/index.ts` — update to match cleaned barrel
- No external integration points — this is a pure library phase, no app dependencies

</code_context>

<specifics>
## Specific Ideas

- Safari async clipboard issue (PITFALLS.md §1): for plain text `copyToClipboard`, use `navigator.clipboard.writeText()` directly — this is called synchronously in a click handler on the consumer side, so Safari's user gesture requirement is the caller's responsibility, not the library's. Document this limitation clearly in TSDoc.
- Firefox and `ClipboardItem` (PITFALLS.md §2): `copyToClipboard` uses `writeText()` only (plain text). Rich content (`copyRichContent`) is deferred to v2 — this sidesteps the Firefox/ClipboardItem incompatibility entirely for Phase 2.
- The `INSECURE_CONTEXT` error code already exists in `src/utils/types.ts` — use it in `copyToClipboard` and `readFromClipboard` when `isSecureContext()` returns false (after `isBrowser()` passes).

</specifics>

<deferred>
## Deferred Ideas

- `copyRichContent()` / `readRichContent()` — explicitly deferred to v2 requirements (RICH-01, RICH-02). Firefox ClipboardItem incompatibility makes this non-trivial.
- Permissions API proactive query in `isClipboardReadSupported()` — decided against for v0.1.0. Firefox doesn't support `clipboard-read` in Permissions API; adds async complexity for marginal benefit.
- Debug mode flag (silent console output by default, log on flag) — raised as option for error logging, decided against for now. `console.warn`/`console.error` split is sufficient.

</deferred>

---

*Phase: 02-clipboard-api*
*Context gathered: 2026-04-08*
