# Phase 11: Framework Adapters - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 11-framework-adapters
**Areas discussed:** Hook init shape, Supported state in return, Svelte action events, Size-limit entries

---

## Hook init shape

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror text hook | `useCopyRichContent(initContent?, options?)` — optional `{ html, text }` at init, override at call time | ✓ |
| Call-time only | `useCopyRichContent(options?)` — always supply content at `copyRich()` call time | |

**User's choice:** Mirror text hook

**Follow-up — missing content behavior:**

| Option | Description | Selected |
|--------|-------------|----------|
| Match existing per-framework | React/Svelte throw TypeError; Vue sets error state and returns false | ✓ |
| Throw in all three | TypeError everywhere | |
| Fail gracefully in all three | Vue-style everywhere — set error, return false | |

**User's choice:** Match existing per-framework

---

## Supported state in return

| Option | Description | Selected |
|--------|-------------|----------|
| No — keep return clean | `{ copyRich, copied, error, reset }` only — call `isRichClipboardSupported()` separately | ✓ |
| Yes — include supported | Add `supported` boolean (or boolean ref) to return value | |

**User's choice:** No — keep return clean

---

## Svelte action events

| Option | Description | Selected |
|--------|-------------|----------|
| Distinct events | `ctc:rich-copy` (detail: `{ html, text }`) and `ctc:rich-error` (detail: `{ error }`) | ✓ |
| Reuse ctc:copy / ctc:error | Same event names as `copyAction` | |

**User's choice:** Distinct events

**Follow-up — Svelte stores variant:**

| Option | Description | Selected |
|--------|-------------|----------|
| Action + runes only | Match ADPT-03 exactly — no `/stores` variant for rich content | |
| Action + runes + stores | Full parity — add `/stores` variant for Svelte 4 compatibility | ✓ |

**User's choice:** Yes — add /stores variant too

---

## Size-limit entries

| Option | Description | Selected |
|--------|-------------|----------|
| Keep aggregate + raise if needed | One `dist/index.mjs` entry per package; raise to 2.5KB if additions push past 2KB | ✓ |
| Add per-file entries | Separate entries for each new file | |
| Keep current 2KB and fail hard | No limit raise — optimize to fit | |

**User's choice:** Keep aggregate + raise if needed

---

## Claude's Discretion

- TSDoc comment style and @example content
- Exact interface names (`UseCopyRichContentOptions`, etc.)
- Whether `CopyRichActionParams` extends a base type
- Lifecycle cleanup pattern per framework (mirror existing)

## Deferred Ideas

None — discussion stayed within phase scope.
