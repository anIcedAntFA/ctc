# Phase 6: Svelte Adapter - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship `@ngockhoi96/ctc-svelte` under `packages/svelte/` — a single package with two exports:

1. **`copyAction`** — Svelte action for `use:` directive. Triggers a clipboard copy on click and dispatches typed custom events for success/failure state feedback.
2. **`useCopyToClipboard`** — Available via two subpath exports:
   - `@ngockhoi96/ctc-svelte/stores` — writable store implementation (Svelte 4 + 5 compatible)
   - `@ngockhoi96/ctc-svelte/runes` — $state rune implementation (Svelte 5 only)

Both exports are unit-tested in a single unified test file using `@testing-library/svelte`. Package includes a README. No playground (Phase 7), no E2E tests.

</domain>

<decisions>
## Implementation Decisions

### Svelte Version Target
- **D-01:** peerDependencies: `"svelte": ">=4.0.0"`. The package supports Svelte 4 and 5. The `/stores` subpath works in both; the `/runes` subpath requires Svelte 5. Consumers choose the subpath that matches their version.

### Package Exports Map (subpath design)
- **D-02:** Two named subpaths, both exporting `useCopyToClipboard` (same function name, different implementations):
  - `@ngockhoi96/ctc-svelte/stores` → `src/stores/use-copy-to-clipboard.ts` (writable stores)
  - `@ngockhoi96/ctc-svelte/runes` → `src/runes/use-copy-to-clipboard.ts` ($state runes)
  - `@ngockhoi96/ctc-svelte` (root) → `src/index.ts` — re-exports `copyAction` only. The root export does NOT include `useCopyToClipboard` to avoid ambiguity (consumer picks the right subpath).
- **D-03:** `src/` structure:
  ```
  packages/svelte/
    src/
      action/
        copy-action.ts
      stores/
        use-copy-to-clipboard.ts
      runes/
        use-copy-to-clipboard.ts
      index.ts           ← exports copyAction only
    tests/
      copy-action.test.ts
      use-copy-to-clipboard.test.ts   ← unified: imports both stores + runes exports
      helpers/
        create-clipboard-mock.ts
    tsdown.config.ts
    tsconfig.json
    tsconfig.node.json
    package.json
  ```

### `copyAction` API
- **D-04:** Signature: `copyAction(node: HTMLElement, params: CopyActionParams)` where:
  ```ts
  interface CopyActionParams {
    text: string
    onError?: OnErrorCallback
  }
  ```
  Consumer usage: `use:copyAction={{ text: 'Hello world' }}` or `use:copyAction={{ text, onError: handleErr }}`.
- **D-05:** Trigger: `click` event on the bound element (non-configurable).
- **D-06:** Implements `update(params: CopyActionParams)` so reactive text changes (`$derived`, bound variables) are picked up without re-mounting the action.
- **D-07:** Returns `{ destroy() }` that removes the click listener.

### `copyAction` State Feedback (Custom Events)
- **D-08:** On success: `node.dispatchEvent(new CustomEvent('ctc:copy', { detail: { text: string }, bubbles: true }))`.
- **D-09:** On failure: `node.dispatchEvent(new CustomEvent('ctc:error', { detail: { error: BrowserUtilsError }, bubbles: true }))`.
- **D-10:** Consumer listens via `<button use:copyAction={{ text }} on:ctc:copy={handleCopy} on:ctc:error={handleErr}>`.
- **D-11:** `copyAction` is fire-and-forget for state — no `copied` tracking inside the action. Consumers who need copied state use `useCopyToClipboard` separately.

### `useCopyToClipboard` — Stores Implementation (`/stores`)
- **D-12:** Returns `{ copy, copied, error, reset }` where:
  - `copied: Readable<boolean>` — a svelte/store readable. `true` immediately after successful copy; auto-resets after `timeout` ms.
  - `error: Readable<BrowserUtilsError | null>` — readable store. `null` when no error. Cleared before each `copy()` call.
  - `copy(text?: string): Promise<boolean>` — same call-site override pattern as React/Vue.
  - `reset(): void` — resets `copied` to `false` and `error` to `null`. Cancels pending auto-reset timer.
- **D-13:** Internal writable stores (`writable(false)`, `writable(null)`) exposed as readable. Compatible with Svelte 4 and 5.
- **D-14:** No `onUnmounted` equivalent in stores implementation — timer cleanup is caller's responsibility via `reset()` or the component's `onDestroy` lifecycle. The `reset` function exists for programmatic cleanup.

### `useCopyToClipboard` — Runes Implementation (`/runes`)
- **D-15:** Uses `$state` for `copied` and `error` — Svelte 5 runes only. Returns plain `{ copy, copied, error, reset }` where `copied: boolean` and `error: BrowserUtilsError | null` are reactive state (not refs, not stores — accessed directly).
- **D-16:** Timer cleanup via `$effect` with a return function (replaces `onUnmounted`). The `$effect` runs when the component mounts and the returned cleanup runs on unmount.
- **D-17:** `reset()` sets `$state` variables directly — same contract as React/Vue (clears copied/error, cancels timer).

### Shared Decisions (both implementations)
- **D-18:** `UseCopyToClipboardOptions` extends `ClipboardOptions` with `timeout?: number` (default 2000). `timeout: 0` = never auto-reset.
- **D-19:** D-02 from Phase 5 applies: if text is `undefined` at both init and call-site, `copy()` returns `false` and calls `onError` with `CLIPBOARD_NOT_SUPPORTED` code.

### Testing
- **D-20:** Testing library: `@testing-library/svelte` (Svelte 5 mode, `@testing-library/svelte@5+`). Single dependency for both stores and runes tests.
- **D-21:** Unified test file `tests/use-copy-to-clipboard.test.ts` runs identical behavior scenarios for both exports:
  ```ts
  import { useCopyToClipboard as useCopyToClipboardStores } from '../src/stores/use-copy-to-clipboard'
  import { useCopyToClipboard as useCopyToClipboardRunes } from '../src/runes/use-copy-to-clipboard'
  ```
  100% branch coverage required on both.
- **D-22:** Shared mock helper: `createClipboardMock()` in `tests/helpers/create-clipboard-mock.ts` — mirrors the React/Vue pattern (`Object.defineProperty` for `navigator.clipboard` and `isSecureContext`).
- **D-23:** Separate test file for `copyAction`: `tests/copy-action.test.ts`. Tests: triggers copy on click, dispatches `ctc:copy` on success, dispatches `ctc:error` on failure, `update()` picks up new text, `destroy()` removes listener.

### Package Scaffold
- **D-24:** peerDependencies: `"@ngockhoi96/ctc": "workspace:*"` and `"svelte": ">=4.0.0"`. Zero additional runtime deps.
- **D-25:** devDependencies include `svelte@5.x`, `@testing-library/svelte@5`, `svelte-testing-library` (if needed for Svelte 4 compat testing). Vitest with `jsdom` environment (same as React/Vue packages).
- **D-26:** `size-limit`: `dist/index.mjs` < 2KB gzip (per ROADMAP success criteria 5).
- **D-27:** No `biome.json` in `packages/svelte/` — root biome.json covers `packages/*` files (Biome 2.x nested root config restriction, same as React/Vue packages).

### Claude's Discretion
- Whether stores implementation uses `derived` or exposes writable internals as readonly
- Exact `tsdown.config.ts` — expected to mirror `packages/core` and `packages/react` config closely
- Exact `vitest.config.ts` content (expected to mirror existing adapter vitest configs)
- TypeScript type for `copied` in runes export (bare `boolean` or a class-based reactive type)
- Whether `copy-action.test.ts` uses a real Svelte component wrapper or direct DOM manipulation

</decisions>

<specifics>
## Specific Ideas

- The root `@ngockhoi96/ctc-svelte` import only gives `copyAction` — this is intentional to prevent "which useCopyToClipboard?" ambiguity. Consumers must explicitly pick `/stores` or `/runes`.
- `copyAction` custom events bubble (`bubbles: true`) so they work inside Svelte component hierarchies.
- `update()` in `copyAction` is important for idiomatic Svelte usage — without it, `use:copyAction={{ text: derivedText }}` would silently use the stale initial text.
- For the runes implementation, `$effect` cleanup is the Svelte 5 equivalent of React's `useEffect(() => () => clearTimeout(), [])` — the pattern is architecturally identical.
- `useCopyToClipboard` in `/stores` mirrors the Vue composable's API shape conceptually — but Vue returns `shallowRef` while Svelte returns `Readable`.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` §Phase 6 — Goal, success criteria, plan breakdown (06-01-PLAN)
- `.planning/REQUIREMENTS.md` — ADAPT-03, ADAPT-04, ADAPT-05, ADAPT-06 with acceptance criteria

### Prior adapter implementations (reference patterns)
- `packages/react/src/use-copy-to-clipboard.ts` — established hook API contract and D-01–D-09 from Phase 5
- `packages/vue/src/use-copy-to-clipboard.ts` — composable reference (shallowRef pattern, onUnmounted cleanup)
- `.planning/phases/05-react-vue-adapters/05-CONTEXT.md` — all Phase 5 locked decisions (D-01 through D-19)

### Core library (peer dep source)
- `packages/core/src/clipboard/index.ts` — public API: `copyToClipboard`, `BrowserUtilsError`, `ErrorCode`, `ClipboardOptions`
- `packages/core/src/lib/types.ts` — `BrowserUtilsError`, `ErrorCode`, `ClipboardOptions`, `OnErrorCallback`
- `packages/core/package.json` — package name (`@ngockhoi96/ctc`), exports map reference

### Monorepo infrastructure
- `pnpm-workspace.yaml` — new `packages/svelte` must be listed (or auto-detected by glob)
- `turbo.json` — build/test/lint/validate task pipeline; adapter scripts must use matching task names
- `tsconfig.base.json` — shared TypeScript base that `packages/svelte/tsconfig.json` extends
- `biome.json` (root) — covers `packages/svelte` files; no nested biome.json needed
- `packages/core/tsdown.config.ts` — reference for subpath-aware tsdown config
- `packages/react/tsdown.config.ts` — nearest reference for adapter tsdown config

### Testing patterns
- `packages/react/tests/helpers/create-clipboard-mock.ts` — `createClipboardMock()` utility to mirror
- `packages/react/tests/use-copy-to-clipboard.test.ts` — RTL test structure reference
- `.claude/rules/testing.md` — coverage targets, mock patterns, file naming
- `.claude/rules/code-style.md` — TypeScript conventions, named exports only

</canonical_refs>

<deferred>
## Deferred Ideas

- Svelte 4-specific testing with `@testing-library/svelte@4` — testing under Svelte 5 mode is sufficient for this phase; Svelte 4 backwards compat is an API guarantee, not a test matrix requirement
- SSR compatibility testing — clipboard is browser-only; SSR guards are handled by `@ngockhoi96/ctc` core
- Playground (`playground/svelte`) — Phase 7
- `copyAction` with configurable trigger event — out of scope for v0.3.0

</deferred>

---

*Phase: 06-svelte-adapter*
*Context gathered: 2026-04-13*
