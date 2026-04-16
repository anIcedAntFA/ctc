# Phase 11: Framework Adapters - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Add `useCopyRichContent` hook/composable and `copyRichAction` Svelte action across the React, Vue, and Svelte adapter packages. These wrap Phase 10's `copyRichContent` core function with the same ergonomics and return shape as the existing text clipboard adapters.

Scope: adapter packages only (`packages/react`, `packages/vue`, `packages/svelte`). Core package (`packages/core`) was settled in Phase 10.

</domain>

<decisions>
## Implementation Decisions

### Hook Initialization Shape (React & Vue)
- **D-01:** `useCopyRichContent(initContent?, options?)` — mirrors `useCopyToClipboard(initText?, options?)`. Accepts an optional `RichContent` object (`{ html: string, text: string }`) at init time; `copyRich(content?)` can override it at call time.
- **D-02:** Missing content at both init and call time follows per-framework convention: React and Svelte throw `TypeError`; Vue sets `error` state and returns `false`. Keeps each adapter consistent with its own `useCopyToClipboard` implementation.
- **D-03:** Return shape for React and Vue: `{ copyRich, copied, error, reset }` — same structure as `useCopyToClipboard` with `copy` replaced by `copyRich`. No `supported` field.

### Supported State
- **D-04:** `useCopyRichContent` does NOT expose a `supported` or `isSupported` field in its return value. Callers who need to conditionally render UI call `isRichClipboardSupported()` directly. Keeps the hook surface minimal and consistent with the text hook.

### Svelte: copyRichAction
- **D-05:** `copyRichAction` dispatches distinct custom events — NOT the same events as `copyAction`:
  - `ctc:rich-copy` — detail: `{ html: string, text: string }` — fired on success
  - `ctc:rich-error` — detail: `{ error: BrowserUtilsError }` — fired on failure
  - Distinct names prevent collisions when both actions are used on the same parent element.
- **D-06:** Action params: `{ html: string, text: string, onError?: OnErrorCallback }` — parallel to `CopyActionParams { text, onError? }`.
- **D-07:** Action implements `update()` for reactive param changes and `destroy()` for click listener cleanup — same lifecycle pattern as `copyAction`.

### Svelte: useCopyRichContent Scope
- **D-08:** Ship both a `/runes` variant and a `/stores` variant for `useCopyRichContent` — full parity with `useCopyToClipboard` which already has both. `/runes` uses `$state`; `/stores` uses Svelte `writable`. Svelte 4 users get stores; Svelte 5 users get runes.
- **D-09:** Return shape for both Svelte variants: `{ copyRich, copied, error, reset }` — runes variant exposes reactive getters (same pattern as existing `useCopyToClipboard` runes); stores variant exposes writable refs.

### File Naming & Location
- **D-10:** React — one new file: `packages/react/src/use-copy-rich-content.ts`
- **D-11:** Vue — one new file: `packages/vue/src/use-copy-rich-content.ts`
- **D-12:** Svelte — three new files:
  - `packages/svelte/src/action/copy-rich-action.ts` — `copyRichAction`
  - `packages/svelte/src/runes/use-copy-rich-content.svelte.ts` — runes variant
  - `packages/svelte/src/stores/use-copy-rich-content.ts` — stores variant
- **D-13:** All new exports added to each package's `src/index.ts` (and subpath index files for Svelte `/runes` and `/stores`).

### Size-limit
- **D-14:** Keep one aggregate `dist/index.mjs` size-limit entry per adapter package. If Phase 11 additions push a package past 2KB brotli, raise its limit to 2.5KB. ADPT-05 intent is no excessive bloat — 2.5KB is a firm ceiling.
- **D-15:** Svelte package may need separate size-limit entries for `/runes` and `/stores` subpath outputs if those grow beyond 2KB independently — confirm after building and running `pnpm size`.

### Claude's Discretion
- TSDoc comment style and `@example` content for new hook/composable/action
- Exact `UseCopyRichContentOptions` and `UseCopyRichContentResult` interface names (follow existing `UseCopyToClipboard*` naming)
- Whether `CopyRichActionParams` is a standalone interface or extends an existing base type
- Exact `$effect` / `onUnmounted` lifecycle cleanup pattern (mirror existing per-framework approach)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Framework Adapters — ADPT-01 through ADPT-05 define exact acceptance criteria

### Existing Adapter Patterns to Mirror
- `packages/react/src/use-copy-to-clipboard.ts` — hook structure, init/call-site content, timer lifecycle, TypeError throw pattern
- `packages/vue/src/use-copy-to-clipboard.ts` — composable structure, shallowRef usage, onUnmounted cleanup, graceful failure pattern
- `packages/svelte/src/action/copy-action.ts` — Svelte action structure, update/destroy lifecycle, custom event dispatch pattern
- `packages/svelte/src/runes/use-copy-to-clipboard.svelte.ts` — $state, $effect cleanup, reactive getter pattern
- `packages/svelte/src/stores/use-copy-to-clipboard.ts` — writable stores pattern (check file exists and read it)

### Core Functions Being Wrapped
- `packages/core/src/clipboard/rich-copy.ts` — `copyRichContent({ html, text }, options?)` — the core function the hooks wrap
- `packages/core/src/clipboard/types.ts` — `RichContent` interface (`{ html: string, text: string }`)

### Phase 10 Context (API decisions for rich core)
- `.planning/phases/10-rich-clipboard-core/10-CONTEXT.md` — D-01 through D-16 define the core API shape this phase builds on

### Package Configuration
- `packages/svelte/package.json` — existing subpath export config (`./runes`, `./stores`) to extend with rich content exports
- `packages/react/package.json` — size-limit entry to update
- `packages/vue/package.json` — size-limit entry to update

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useCopyToClipboard` (React, Vue, Svelte) — template for all three `useCopyRichContent` implementations; copy structure wholesale, swap `copyToClipboard` → `copyRichContent` and `text` → `content: RichContent`
- `copyAction` — template for `copyRichAction`; swap `ctc:copy`/`ctc:error` events → `ctc:rich-copy`/`ctc:rich-error`, extend params to `{ html, text, onError? }`
- `RichContent` interface (`packages/core/src/clipboard/types.ts`) — reused as the type for `initContent` parameter and `copyRich()` argument

### Established Patterns
- Return shape `{ copy, copied, error, reset }` → apply as `{ copyRich, copied, error, reset }` — same pattern, renamed copy function
- `timeout` option defaults to 2000ms, `0` disables auto-reset — carry forward unchanged
- React: `useState` + `useRef(timer)` + `useCallback` + `useEffect(cleanup)`
- Vue: `shallowRef` + plain `let timer` + `onUnmounted`
- Svelte runes: `$state` + `$effect` for cleanup + reactive getters
- Svelte action: `addEventListener('click', handleClick)` + `update()` + `destroy()` + `CustomEvent` dispatch

### Integration Points
- Each adapter's `src/index.ts` — add new type + function exports
- Svelte `src/runes/index.ts` (or equivalent) — add `useCopyRichContent` export to `/runes` subpath
- Svelte `src/stores/index.ts` (or equivalent) — add `useCopyRichContent` export to `/stores` subpath
- Each adapter's `package.json` `"size-limit"` — update or add entries per D-14/D-15

</code_context>

<specifics>
## Specific Ideas

- "Mirror text hook" was the explicit user choice — the init/call-time override pattern is intentional, not just cargo-culted. Rich content is usually dynamic but the option to set a default at init time is useful for static embeds (e.g., a "Copy this HTML snippet" button).
- Distinct Svelte event names (`ctc:rich-copy` vs `ctc:copy`) were chosen to prevent collisions when both actions coexist on the same DOM tree.
- Full `/stores` parity was explicitly chosen — Svelte 4 users should have the same rich clipboard capability as Svelte 5 users.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-framework-adapters*
*Context gathered: 2026-04-16*
