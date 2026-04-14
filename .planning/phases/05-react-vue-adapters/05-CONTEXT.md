# Phase 5: React & Vue Adapters - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship `@ngockhoi96/ctc-react` and `@ngockhoi96/ctc-vue` as published npm packages. Each delivers a single stateful hook/composable (`useCopyToClipboard`) with full unit test coverage and a per-package README. Both packages live under `packages/react` and `packages/vue` in the monorepo. Playgrounds and Svelte adapter are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Hook / Composable Signature
- **D-01:** `useCopyToClipboard(text?: string, options?: ClipboardOptions)` — text is optional at init. `copy(text?: string)` — text is optional at call-site. Call-site value overrides init value.
- **D-02:** If text is undefined at both init AND call-site, `copy()` returns `false` and calls `onError` with an appropriate error code (programmer error — no text to copy).
- **D-03:** Return value: `{ copy, copied, error, reset }` — four fields, no more.

### `copied` State & Reset Behavior
- **D-04:** `copied: boolean` — `true` immediately after a successful copy, auto-resets to `false` after `timeout` ms (default 2000).
- **D-05:** `timeout: 0` means "never auto-reset" — `copied` stays `true` until the next `copy()` call or `reset()` is called explicitly.
- **D-06:** `reset()` clears `copied` to `false` and `error` to `null` immediately. Useful when consumers need to programmatically dismiss copy state (e.g., modal close, route change).

### Error Field
- **D-07:** `error: BrowserUtilsError | null` — the same typed error object that `@ngockhoi96/ctc` core functions produce. `null` when no error. Cleared to `null` on each new `copy()` call (before the attempt).
- **D-08:** Consumers can branch on `error?.code` using the typed `ErrorCode` union from `@ngockhoi96/ctc`.

### React Package (`packages/react`)
- **D-09:** Testing library: `@testing-library/react` with `renderHook`. Framework: Vitest (same as core).
- **D-10:** Shared mock helper: `createClipboardMock()` utility in `packages/react/tests/helpers/create-clipboard-mock.ts`. Imported by test files — no per-file `vi.stubGlobal` repetition.
- **D-11:** peerDependencies: `"react": ">=18 <20"` and `"react-dom": ">=18 <20"`. Zero runtime deps of its own (only `@ngockhoi96/ctc` as peer dep).

### Vue Package (`packages/vue`)
- **D-12:** Testing library: `@vue/test-utils` with Vitest. A `withSetup` or mount-wrapper pattern for testing composables.
- **D-13:** Shared mock helper: `createClipboardMock()` utility in `packages/vue/tests/helpers/create-clipboard-mock.ts` — mirrors the React pattern.
- **D-14:** peerDependencies: `"vue": ">=3.0.0 <4.0.0"`. Zero runtime deps of its own (only `@ngockhoi96/ctc` as peer dep).

### Package Scaffold Structure (both packages)
- **D-15:** Flat `src/` — no subdirectories. Single hook/composable file + barrel:
  ```
  packages/{react,vue}/
    src/
      use-copy-to-clipboard.ts
      index.ts
    tests/
      use-copy-to-clipboard.test.ts
      helpers/
        create-clipboard-mock.ts
    tsdown.config.ts
    tsconfig.json
    tsconfig.node.json
    biome.json
    package.json
  ```
- **D-16:** Own `biome.json` extending root `biome.json`. Own `tsconfig.node.json` covering config files (`tsdown.config.ts`). Consistent with `packages/core` layout.
- **D-17:** No `tests/e2e/` in adapter packages — E2E coverage is `packages/core`'s responsibility. Adapter tests are unit tests only.

### Version Targets
- **D-18:** React: `>=18 <20` in peerDependencies. Covers React 18 and 19. Bounded against unknown v20 API changes.
- **D-19:** Vue: `>=3.0.0 <4.0.0` in peerDependencies. Vue 3.x only (Vue 2 is EOL). No 3.2+ floor required — composable uses no 3.2-specific APIs.

### Claude's Discretion
- Exact timer implementation in React (`useRef` + `clearTimeout` vs `useEffect` cleanup)
- Vue composable reactivity internals (`ref` vs `shallowRef` for `copied` and `error`)
- Whether to use `useCallback`/`useMemo` for `copy` and `reset` in React
- `tsdown.config.ts` content for adapter packages (expected to mirror `packages/core` config closely)
- Exact `size-limit` config for adapters (budget < 2KB gzip per ROADMAP.md success criteria)

</decisions>

<specifics>
## Specific Ideas

- `timeout: 0` = disabled (never auto-reset) — this is the conventional meaning, not "next tick"
- `reset()` is an escape hatch for programmatic dismissal (modal close, route change) — not for normal use
- Both React and Vue share the same mock helper pattern; naming and structure should be identical between packages for consistency

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` §Phase 5 — Goal, success criteria, plan breakdown (05-01-PLAN, 05-02-PLAN)
- `.planning/REQUIREMENTS.md` — ADAPT-01, ADAPT-02, ADAPT-04, ADAPT-05, ADAPT-06 with acceptance criteria

### Core library (peer dep source)
- `packages/core/src/clipboard/index.ts` — public API surface: exported functions and types that adapters wrap
- `packages/core/src/lib/types.ts` — `BrowserUtilsError`, `ErrorCode`, `ClipboardOptions`, `OnErrorCallback` — types re-exported or referenced by adapters
- `packages/core/package.json` — package name (`@ngockhoi96/ctc`), version, exports map

### Monorepo infrastructure
- `pnpm-workspace.yaml` — workspace package paths; new packages must be listed here
- `turbo.json` — task pipeline; adapter packages must integrate with existing build/test/lint/validate tasks
- `tsconfig.base.json` — shared TypeScript base config that adapter `tsconfig.json` files extend
- `biome.json` (root) — shared lint/format config that adapter `biome.json` files extend
- `packages/core/tsdown.config.ts` — reference implementation for adapter `tsdown.config.ts`
- `packages/core/package.json` — reference for exports map, `publint`/`attw` compliance pattern

### Testing patterns
- `.claude/rules/testing.md` — Test file naming, coverage targets, mock patterns
- `packages/core/tests/unit/` — established `vi.stubGlobal` mock pattern (adapters use shared helper instead but same underlying approach)

### Code style
- `.claude/rules/code-style.md` — TypeScript conventions, named exports, error handling
- `.planning/PROJECT.md` — Core constraints: zero deps, named exports only, no default exports

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/core/src/clipboard/copy.ts` — `copyToClipboard(text, options?)` — the function adapters call. Returns `Promise<boolean>`. Accepts `onError` callback.
- `packages/core/src/lib/types.ts` — `BrowserUtilsError`, `ErrorCode`, `ClipboardOptions` — import these in adapter packages as peer dep types.
- `packages/core/tsdown.config.ts` — copy and adapt for each adapter package's build config.
- `packages/core/vitest.config.ts` — reference for adapter vitest configs.

### Established Patterns
- **Named exports only:** `export { useCopyToClipboard }` from `index.ts` — no default exports anywhere.
- **Guard-first in core:** Adapters don't need their own guards — they delegate to `copyToClipboard()` which already handles `isBrowser()`, secure context, etc.
- **Never-throw contract:** `copyToClipboard` returns `Promise<boolean>`. Adapters catch rejections and route to `error` state — never let exceptions escape the hook.
- **`vi.stubGlobal` mock pattern:** Core tests use this per-file; adapter tests centralize it in `createClipboardMock()` helper.

### Integration Points
- New packages in `packages/react/` and `packages/vue/` must be added to `pnpm-workspace.yaml` (if not auto-detected by glob)
- Each adapter's `package.json` needs `"@ngockhoi96/ctc": "workspace:*"` as a peerDependency
- Turborepo will pick up `build`, `test`, `lint`, `validate`, `size` scripts automatically if they match `turbo.json` task names
- Changesets independent mode is already configured — each adapter gets its own changeset and version

</code_context>

<deferred>
## Deferred Ideas

- Svelte adapter (`@ngockhoi96/ctc-svelte`) — Phase 6
- Playgrounds (`playground/react`, `playground/vue`) — Phase 7
- SSR adapter variants (Next.js, Nuxt) — not in any active phase; note for backlog if interest emerges

</deferred>

---

*Phase: 05-react-vue-adapters*
*Context gathered: 2026-04-13*
