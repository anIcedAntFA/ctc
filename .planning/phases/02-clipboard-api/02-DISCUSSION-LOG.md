# Phase 2: Clipboard API - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion.

**Date:** 2026-04-08
**Phase:** 02-clipboard-api
**Mode:** discuss
**Areas discussed:** Detection function semantics, copyToClipboardLegacy design, Utils API surface, Error logging policy

## Areas Discussed

### Detection function semantics

| Question | Answer |
|----------|--------|
| What should `isClipboardSupported()` return on HTTP? | `false` — checks API existence + secure context |
| Rationale | "Supported" means "usable right now" — most useful for consumers calling before attempting copy |
| What should `isClipboardReadSupported()` check? | API existence + `isSecureContext()`, synchronous |
| Clarification requested | User asked: does the Permissions API option affect Firefox copy/read capability? |
| Clarification given | Firefox supports `writeText()`/`readText()` fine. Only `navigator.permissions.query({name:'clipboard-read'})` is unsupported — which would require try/catch and still fall back to the same check |
| Final decision | Synchronous, no Permissions API query — permission denial surfaced at call time via error code |

### copyToClipboardLegacy design

| Question | Answer |
|----------|--------|
| Implementation pattern | textarea + `execCommand('copy')` |
| Scope | Text-only: `(text: string, options?: ClipboardOptions): boolean` |
| Rationale | execCommand cannot handle rich content; keeping signature honest prevents consumer confusion |

### Utils API surface

| Question | Answer |
|----------|--------|
| Should `isBrowser`, `isSecureContext`, `createError`, `handleError` be public? | Internal-only — remove from public barrel exports |
| Rationale | Implementation details; keeping them public locks API surface and makes future refactors breaking changes |

### Error logging policy

| Question | Answer |
|----------|--------|
| How to log when no `onError` provided? | Differentiated: `console.warn` for expected, `console.error` for unexpected |
| Expected (warn) | `CLIPBOARD_NOT_SUPPORTED`, `INSECURE_CONTEXT`, `CLIPBOARD_PERMISSION_DENIED` |
| Unexpected (error) | `CLIPBOARD_WRITE_FAILED`, `CLIPBOARD_READ_FAILED` |

## Corrections Made

No corrections — all recommendations accepted.

## Deferred Ideas

- `copyRichContent()` / `readRichContent()` — v2 requirements, not Phase 2
- Permissions API in `isClipboardReadSupported()` — decided against due to Firefox incompatibility
- Debug mode flag for console output — decided against, warn/error split sufficient
