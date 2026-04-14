# Phase 6: Svelte Adapter - Research

**Researched:** 2026-04-13
**Domain:** Svelte 4 + 5 framework adapter (action + reactive state)
**Confidence:** HIGH

## Summary

Phase 6 ships `@ngockhoi96/ctc-svelte`, a dual-pattern adapter built on top of `@ngockhoi96/ctc`. The package mirrors the React/Vue adapter scaffold (tsdown, vitest+jsdom, root biome, size-limit < 2KB) but introduces two new patterns specific to Svelte: a `use:`-directive **action** for declarative DOM integration, and a stateful **`useCopyToClipboard`** helper exposed through two subpath exports — `/stores` (Svelte 4 + 5, built on `svelte/store`) and `/runes` (Svelte 5 only, built on `$state`/`$effect`). All three exports share one peer dep (`svelte >=4.0.0`) and one shared mock helper.

The CONTEXT.md is unusually complete: every API surface (D-04 through D-23) is locked. Research here is therefore prescriptive — the planner should not re-explore alternatives. The main risks are (1) the legacy `ActionReturn` pattern vs the new attachment API, (2) `$effect` lifecycle inside `.svelte.ts` modules, and (3) Vitest configuration for `@testing-library/svelte` (it requires `@sveltejs/vite-plugin-svelte` + a vitest plugin, which is a new dependency the React/Vue packages do not need).

**Primary recommendation:** Scaffold packages/svelte by copy-modifying packages/vue (closer dep shape than React), add `svelte`, `@sveltejs/vite-plugin-svelte`, and `@testing-library/svelte@5.3.1` as devDeps, configure vitest with the `svelte()` and `svelteTesting()` plugins, and structure source as three independent files (`action/copy-action.ts`, `stores/use-copy-to-clipboard.ts`, `runes/use-copy-to-clipboard.svelte.ts`) with three tsdown entry points.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Svelte version target**
- **D-01:** peerDependencies: `"svelte": ">=4.0.0"`. Package supports Svelte 4 and 5. `/stores` works in both; `/runes` requires Svelte 5. Consumers choose subpath that matches their version.

**Package exports map (subpath design)**
- **D-02:** Two named subpaths, both exporting `useCopyToClipboard` (same function name, different implementations):
  - `@ngockhoi96/ctc-svelte/stores` → `src/stores/use-copy-to-clipboard.ts` (writable stores)
  - `@ngockhoi96/ctc-svelte/runes` → `src/runes/use-copy-to-clipboard.ts` ($state runes)
  - `@ngockhoi96/ctc-svelte` (root) → `src/index.ts` — re-exports `copyAction` only. Root does NOT include `useCopyToClipboard` (avoids ambiguity).
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
      use-copy-to-clipboard.test.ts   ← unified: imports both stores + runes
      helpers/
        create-clipboard-mock.ts
    tsdown.config.ts
    tsconfig.json
    tsconfig.node.json
    package.json
  ```

**`copyAction` API**
- **D-04:** `copyAction(node: HTMLElement, params: CopyActionParams)` where `CopyActionParams = { text: string; onError?: OnErrorCallback }`. Usage: `use:copyAction={{ text: 'Hello world' }}`.
- **D-05:** Trigger: `click` on bound element (non-configurable).
- **D-06:** Implements `update(params)` so reactive text changes are picked up without re-mounting.
- **D-07:** Returns `{ destroy() }` that removes click listener.

**`copyAction` state feedback (custom events)**
- **D-08:** Success: `node.dispatchEvent(new CustomEvent('ctc:copy', { detail: { text }, bubbles: true }))`.
- **D-09:** Failure: `node.dispatchEvent(new CustomEvent('ctc:error', { detail: { error }, bubbles: true }))`.
- **D-10:** Consumer: `<button use:copyAction={{ text }} on:ctc:copy={...} on:ctc:error={...}>`.
- **D-11:** Action is fire-and-forget — no `copied` tracking inside it.

**`useCopyToClipboard` — stores (`/stores`)**
- **D-12:** Returns `{ copy, copied, error, reset }`:
  - `copied: Readable<boolean>` — readable, auto-resets after `timeout` ms.
  - `error: Readable<BrowserUtilsError | null>` — cleared before each `copy()`.
  - `copy(text?: string): Promise<boolean>` — same call-site override pattern as React/Vue.
  - `reset(): void` — resets state, cancels timer.
- **D-13:** Internal `writable(false)` / `writable(null)`, exposed as readable. Svelte 4 + 5 compatible.
- **D-14:** No `onUnmounted` equivalent — caller responsible via `reset()` or component's `onDestroy`.

**`useCopyToClipboard` — runes (`/runes`)**
- **D-15:** Uses `$state` for `copied` and `error` — Svelte 5 only. Returns plain `{ copy, copied, error, reset }` where `copied: boolean` and `error: BrowserUtilsError | null` are reactive state (accessed directly).
- **D-16:** Timer cleanup via `$effect` with return function.
- **D-17:** `reset()` sets `$state` directly.

**Shared decisions**
- **D-18:** `UseCopyToClipboardOptions extends ClipboardOptions` with `timeout?: number` (default 2000). `timeout: 0` = never auto-reset.
- **D-19:** D-02 from Phase 5 applies: undefined text at both init + call → returns false, `onError` with `CLIPBOARD_NOT_SUPPORTED`.

**Testing**
- **D-20:** `@testing-library/svelte` (Svelte 5 mode, v5+).
- **D-21:** Unified `tests/use-copy-to-clipboard.test.ts` runs identical scenarios for both exports. 100% branch coverage required on both.
- **D-22:** Shared mock `createClipboardMock()` mirrors React/Vue (Object.defineProperty for navigator + isSecureContext).
- **D-23:** Separate `tests/copy-action.test.ts`. Tests: triggers copy on click, dispatches `ctc:copy`/`ctc:error`, `update()` picks up new text, `destroy()` removes listener.

**Package scaffold**
- **D-24:** peerDeps: `"@ngockhoi96/ctc": "workspace:*"` and `"svelte": ">=4.0.0"`. Zero additional runtime deps.
- **D-25:** devDeps: `svelte@5.x`, `@testing-library/svelte@5`. Vitest with `jsdom`.
- **D-26:** `size-limit`: `dist/index.mjs` < 2KB gzip.
- **D-27:** No nested `biome.json` — root covers `packages/*` (Biome 2.x).

### Claude's Discretion
- Whether stores implementation uses `derived` or exposes writable internals as readonly
- Exact `tsdown.config.ts` (mirror packages/core and packages/react)
- Exact `vitest.config.ts` content (mirror existing adapter configs)
- TypeScript type for `copied` in runes export (bare `boolean` or class-based reactive type)
- Whether `copy-action.test.ts` uses a real Svelte component wrapper or direct DOM manipulation

### Deferred Ideas (OUT OF SCOPE)
- Svelte 4-specific testing with `@testing-library/svelte@4` — Svelte 5 mode sufficient
- SSR compatibility testing — clipboard is browser-only, core handles guards
- Playground (`playground/svelte`) — Phase 7
- `copyAction` with configurable trigger event — out of scope for v0.3.0
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADAPT-03 | `@ngockhoi96/ctc-svelte` — Svelte action `copyAction(node, text)` for DOM integration + `useCopyToClipboard()` rune/store returning `{ copy, copied, error }`; `copied` auto-resets | Standard Stack (svelte/action, svelte/store, $state runes), Architecture Patterns (action ActionReturn pattern, store readonly pattern, runes module pattern), Code Examples sections |
| ADAPT-04 | All adapters declare `@ngockhoi96/ctc` as peer dep; ship zero runtime deps | Locked D-24; tsdown config with `external` not needed (peer deps not bundled by default) |
| ADAPT-05 | All adapters have unit tests — Svelte Testing Library | `@testing-library/svelte@5.3.1` confirmed Svelte 5 compatible; vitest config requires `@sveltejs/vite-plugin-svelte` + `svelteTesting()` plugin |
| ADAPT-06 | All adapters published as separate public npm packages with ESM + CJS + `.d.ts` | tsdown handles all three; subpath exports require multiple `entry` keys in tsdown.config.ts |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `svelte` | `5.55.3` (devDep), `>=4.0.0` (peerDep) | Compiler + runtime + types; provides `svelte/action`, `svelte/store`, runes | [VERIFIED: npm view svelte version → 5.55.3] Only canonical Svelte runtime. Peer dep range D-01. |
| `@testing-library/svelte` | `5.3.1` | Component rendering for action tests; `render()` API parallels RTL/VTU | [VERIFIED: npm view @testing-library/svelte version → 5.3.1] [CITED: github.com/testing-library/svelte-testing-library] Supports Svelte 3, 4, and 5. Latest stable. |
| `@sveltejs/vite-plugin-svelte` | `7.0.0` | Compiles `.svelte` and `.svelte.ts` files inside vitest; required by `@testing-library/svelte` | [VERIFIED: npm view @sveltejs/vite-plugin-svelte version → 7.0.0] [CITED: testing-library.com/docs/svelte-testing-library/setup] Required vite plugin so vitest can compile components and rune modules. |
| `tsdown` | `0.21.7` | Build (ESM + CJS + .d.ts) | [VERIFIED: packages/react/package.json] Same as core/react/vue. |
| `vitest` | `4.1.3` | Test runner | [VERIFIED: packages/react/package.json] Same as core/react/vue. |
| `jsdom` | `^26.0.0` | DOM environment for vitest | [VERIFIED: packages/react/package.json] Same as core/react/vue. |
| `@vitest/coverage-v8` | `4.1.3` | Coverage thresholds | [VERIFIED: packages/react/package.json] Same as core/react/vue. |

### Supporting (devDeps continuing the React/Vue scaffold)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@arethetypeswrong/cli` | `0.18.2` | `attw --pack` validation | Per `pnpm validate` |
| `publint` | `0.3.18` | Package.json validation | Per `pnpm validate` |
| `size-limit` + `@size-limit/file` | `12.0.1` | Bundle budget per D-26 | < 2KB gzip on `dist/index.mjs` |
| `typescript` | `6.0.2` | `tsc --noEmit` | Same as React/Vue |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Legacy `ActionReturn { update, destroy }` (D-06, D-07) | Svelte 5 attachments (`@attach`) with `$effect` | [CITED: svelte.dev/docs/svelte/svelte-action] "Actions have been superseded by attachments." But attachments are Svelte 5 only — using them would break D-01 (Svelte 4 support). **The locked legacy ActionReturn pattern is correct for the >=4.0.0 peer dep window.** |
| `derived` for `copied`/`error` exposure in `/stores` | `readonly()` helper from `svelte/store` | [CITED: svelte.dev/docs/svelte/svelte-store] Both work. `readonly()` is more explicit about intent ("this is just a read-only view"). `derived` adds an unnecessary projection layer. **Recommendation: use `readonly()`** — it's the dedicated API for "expose writable as readable." |
| Returning bare `boolean` from runes export (D-15) | Class-based reactive container (`class State { copied = $state(false) }`) | [CITED: svelte.dev/docs/svelte/$state] In `.svelte.ts` modules, you "can only export state if it's not directly reassigned." Bare `let copied = $state(false); export function() { return { copied }; }` does NOT work because returning `copied` snapshots the value. **Must wrap in object** — either a plain object with reactive properties (e.g. `const state = $state({ copied: false, error: null })`) or a class. Plain object with `$state` is simplest and matches D-15 ("accessed directly"). |
| `.svelte.ts` filename for `runes/use-copy-to-clipboard.ts` | Plain `.ts` | [CITED: svelte.dev/docs/svelte/$state] **Must use `.svelte.ts` extension** — only `.svelte`, `.svelte.ts`, `.svelte.js` files have rune syntax compiled by `@sveltejs/vite-plugin-svelte`. The CONTEXT.md D-03 lists `runes/use-copy-to-clipboard.ts` but rune syntax in a plain `.ts` file will fail to compile. **Planner must rename to `runes/use-copy-to-clipboard.svelte.ts`** and update tsdown entry + subpath export to match. |

**Installation (planner will run from packages/svelte/):**
```bash
pnpm add -D svelte @testing-library/svelte @sveltejs/vite-plugin-svelte \
  jsdom vitest @vitest/coverage-v8 tsdown typescript \
  publint @arethetypeswrong/cli size-limit @size-limit/file
```

(`@ngockhoi96/ctc` added as both peer + dev with `workspace:*` like React/Vue.)

**Version verification (run by planner before locking devDeps):**
```bash
npm view svelte version                          # current: 5.55.3
npm view @testing-library/svelte version         # current: 5.3.1
npm view @sveltejs/vite-plugin-svelte version    # current: 7.0.0
```

## Architecture Patterns

### Recommended Project Structure

Mirrors D-03 with one filename correction (`.svelte.ts` for runes):

```
packages/svelte/
├── src/
│   ├── action/
│   │   └── copy-action.ts            # plain .ts — no runes, just DOM + svelte/action types
│   ├── stores/
│   │   └── use-copy-to-clipboard.ts  # plain .ts — uses svelte/store only
│   ├── runes/
│   │   └── use-copy-to-clipboard.svelte.ts  # .svelte.ts — REQUIRED for $state/$effect
│   └── index.ts                      # re-exports copyAction only
├── tests/
│   ├── copy-action.test.ts
│   ├── use-copy-to-clipboard.test.ts # unified: imports both stores + runes
│   └── helpers/
│       └── create-clipboard-mock.ts
├── tsdown.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vitest.config.ts
└── package.json
```

### Pattern 1: Svelte Action with `update()` and `destroy()`

**What:** Function that returns `ActionReturn<Parameter>` — the legacy pattern that supports both Svelte 4 and 5 and reacts to parameter changes.

**When to use:** Always for this phase — D-01 requires Svelte 4 compatibility, which rules out attachments.

**Example:**
```ts
// Source: https://svelte.dev/docs/svelte/svelte-action
import type { Action, ActionReturn } from 'svelte/action'
import type { BrowserUtilsError, OnErrorCallback } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'

export interface CopyActionParams {
  text: string
  onError?: OnErrorCallback
}

interface CopyActionAttributes {
  'on:ctc:copy': (e: CustomEvent<{ text: string }>) => void
  'on:ctc:error': (e: CustomEvent<{ error: BrowserUtilsError }>) => void
}

export const copyAction: Action<HTMLElement, CopyActionParams, CopyActionAttributes> = (
  node,
  params,
): ActionReturn<CopyActionParams, CopyActionAttributes> => {
  let current = params

  async function handleClick() {
    const success = await copyToClipboard(current.text, { onError: current.onError })
    if (success) {
      node.dispatchEvent(
        new CustomEvent('ctc:copy', { detail: { text: current.text }, bubbles: true }),
      )
    }
    // failure path: copyToClipboard already invoked onError; we still dispatch ctc:error
    // by capturing through onError wrapper — see Pitfall 1 below.
  }

  node.addEventListener('click', handleClick)

  return {
    update(newParams) {
      current = newParams
    },
    destroy() {
      node.removeEventListener('click', handleClick)
    },
  }
}
```

**Important nuance:** `copyToClipboard` returns `false` on failure but doesn't expose the error to the caller — the error is only delivered via `onError`. To dispatch `ctc:error` (D-09), the action must wrap the user's `onError` to capture the error, then dispatch the custom event AND forward to the user's callback. This is a real implementation subtlety — see Pitfall 1.

### Pattern 2: Stores-based reactive helper (Svelte 4 + 5)

**What:** Internal `writable` stores exposed as `readonly()` for type safety.

**When to use:** `/stores` subpath — works in any Svelte version >=4.0.0.

**Example:**
```ts
// Source: https://svelte.dev/docs/svelte/svelte-store
import type { Readable } from 'svelte/store'
import { readonly, writable } from 'svelte/store'
import type { BrowserUtilsError, ClipboardOptions } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'

export interface UseCopyToClipboardOptions extends ClipboardOptions {
  timeout?: number | undefined
}

export interface UseCopyToClipboardResult {
  copy: (text?: string) => Promise<boolean>
  copied: Readable<boolean>
  error: Readable<BrowserUtilsError | null>
  reset: () => void
}

export function useCopyToClipboard(
  initText?: string,
  options?: UseCopyToClipboardOptions,
): UseCopyToClipboardResult {
  const copiedW = writable(false)
  const errorW = writable<BrowserUtilsError | null>(null)
  const timeout = options?.timeout ?? 2000
  let timer: ReturnType<typeof setTimeout> | null = null

  async function copy(callText?: string): Promise<boolean> {
    const text = callText ?? initText
    if (text === undefined) {
      const err: BrowserUtilsError = {
        code: 'CLIPBOARD_NOT_SUPPORTED',
        message: 'No text provided to copy. Pass text at init or call-site.',
      }
      errorW.set(err)
      options?.onError?.(err)
      return false
    }

    errorW.set(null)
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }

    const success = await copyToClipboard(text, { onError: options?.onError })
    if (success) {
      copiedW.set(true)
      if (timeout > 0) {
        timer = setTimeout(() => {
          copiedW.set(false)
          timer = null
        }, timeout)
      }
    } else {
      copiedW.set(false)
    }
    return success
  }

  function reset(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    copiedW.set(false)
    errorW.set(null)
  }

  return { copy, copied: readonly(copiedW), error: readonly(errorW), reset }
}
```

**Note D-14:** No `onUnmounted` here — caller is responsible. The `reset()` API is the escape hatch.

### Pattern 3: Runes-based reactive helper (Svelte 5 only, `.svelte.ts`)

**What:** Reactive object built with `$state`. Cleanup via `$effect` return function.

**When to use:** `/runes` subpath. **File MUST end in `.svelte.ts`**.

**Example:**
```ts
// Source: https://svelte.dev/docs/svelte/$state and svelte/$effect
// File: src/runes/use-copy-to-clipboard.svelte.ts
import type { BrowserUtilsError, ClipboardOptions } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'

export interface UseCopyToClipboardOptions extends ClipboardOptions {
  timeout?: number | undefined
}

export interface UseCopyToClipboardResult {
  copy: (text?: string) => Promise<boolean>
  readonly copied: boolean
  readonly error: BrowserUtilsError | null
  reset: () => void
}

export function useCopyToClipboard(
  initText?: string,
  options?: UseCopyToClipboardOptions,
): UseCopyToClipboardResult {
  // Wrap reactive state in an object — exporting/returning `$state` primitives
  // directly snapshots the value, breaking reactivity.
  const state = $state({
    copied: false,
    error: null as BrowserUtilsError | null,
  })
  const timeout = options?.timeout ?? 2000
  let timer: ReturnType<typeof setTimeout> | null = null

  // $effect cleanup runs on parent component unmount (mirrors React useEffect cleanup
  // and Vue onUnmounted). Only valid when this function is called inside a component
  // setup or another $effect — same constraint as Vue's onUnmounted.
  $effect(() => {
    return () => {
      if (timer !== null) clearTimeout(timer)
    }
  })

  async function copy(callText?: string): Promise<boolean> {
    const text = callText ?? initText
    if (text === undefined) {
      const err: BrowserUtilsError = {
        code: 'CLIPBOARD_NOT_SUPPORTED',
        message: 'No text provided to copy. Pass text at init or call-site.',
      }
      state.error = err
      options?.onError?.(err)
      return false
    }

    state.error = null
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }

    const success = await copyToClipboard(text, { onError: options?.onError })
    if (success) {
      state.copied = true
      if (timeout > 0) {
        timer = setTimeout(() => {
          state.copied = false
          timer = null
        }, timeout)
      }
    } else {
      state.copied = false
    }
    return success
  }

  function reset(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    state.copied = false
    state.error = null
  }

  // Return a getter-based object so consumers see live reactive state,
  // not snapshot values. Plain { copied: state.copied } would snapshot.
  return {
    copy,
    reset,
    get copied() {
      return state.copied
    },
    get error() {
      return state.error
    },
  }
}
```

**Critical:** the return must use **getter syntax** (`get copied()`). Plain `{ copied: state.copied }` evaluates once at return time and the value is no longer reactive. This is the runes equivalent of Vue's "you must return refs, not `.value`."

### Pattern 4: tsdown multi-entry (subpath exports)

**What:** Multiple `entry` keys produce one bundle per export, each with its own `.d.ts`/`.d.cts`.

**Example:**
```ts
// Source: packages/react/tsdown.config.ts (extended)
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    stores: 'src/stores/use-copy-to-clipboard.ts',
    runes: 'src/runes/use-copy-to-clipboard.svelte.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  exports: true, // auto-generates exports map — manual edits will be overwritten
})
```

**Pitfall:** with `exports: true`, the planner does NOT manually edit the `exports` block in package.json — tsdown overwrites it on every build (Phase 01 decision in STATE.md). The runes entry must be present in `tsdown.config.ts` for the subpath to appear.

**Subpath verification:** after build, `pnpm validate` (publint + attw) confirms:
- `@ngockhoi96/ctc-svelte/stores` resolves
- `@ngockhoi96/ctc-svelte/runes` resolves
- All three exports have ESM + CJS + `.d.ts`/`.d.cts`

### Pattern 5: Vitest config with svelte plugins

**What:** `vitest.config.ts` MUST register `svelte()` (compile components) and `svelteTesting()` (DOM cleanup, register Svelte 5 matchers).

**Example:**
```ts
// Source: testing-library.com/docs/svelte-testing-library/setup
import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.{test,test.svelte}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts', 'src/**/*.svelte.ts'],
      exclude: ['src/index.ts'],
      thresholds: {
        'src/action/copy-action.ts': { 100: true },
        'src/stores/use-copy-to-clipboard.ts': { 100: true },
        'src/runes/use-copy-to-clipboard.svelte.ts': { 100: true },
      },
    },
  },
})
```

This is the only adapter that needs vite plugins — React/Vue tests just import functions and call them; Svelte component tests need the compiler in the loop because actions are tested through a host component.

### Anti-Patterns to Avoid
- **Returning `{ copied: state.copied }` from runes export.** Snapshots the value; reactivity is lost. Use getters.
- **Putting `$state` in a plain `.ts` file.** Compile error — runes only work inside `.svelte`, `.svelte.ts`, `.svelte.js`.
- **Manually editing `exports` map in package.json.** Tsdown overwrites on every build (STATE.md Phase 01 decision).
- **Calling `copyToClipboard` and ignoring `onError` in the action.** Without wrapping `onError`, the action cannot dispatch `ctc:error` because `copyToClipboard` only signals failure via the callback. See Pitfall 1.
- **Using `@attach` instead of `use:`.** Attachments are Svelte 5 only — would break peer dep range.
- **Adding a `biome.json` to `packages/svelte/`.** Biome 2.x rejects nested root configs. Root biome.json covers `packages/*`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reactive boolean state in Svelte 4+5 | Custom subscriber pattern | `writable()` + `readonly()` from `svelte/store` | Stable since Svelte 3, works in both versions, zero footprint when tree-shaken |
| Reactive state in Svelte 5 modules | Custom signals/proxies | `$state` rune in `.svelte.ts` file | First-class compiler support, fine-grained reactivity |
| Action lifecycle | Manually attaching/detaching listeners in component scripts | `Action<>` type from `svelte/action` + `ActionReturn` | The `update()` callback gives you reactive parameter changes for free |
| Component cleanup of timers | Tracking unmount in user code | Vue: `onUnmounted`. Svelte 5: `$effect` return. Svelte stores: caller's `reset()` (D-14) | Idiomatic, no off-by-one cleanup bugs |
| Read-only views over writable stores | Wrapping in derived | `readonly(writable)` | Dedicated single-purpose helper |
| DOM mocking for clipboard | Replacing window | Reuse `createClipboardMock()` (Object.defineProperty pattern from React/Vue helper) | Already validated in Phase 5; preserves jsdom globals |
| Component test harness for actions | Manual DOM `createElement` + dispatchEvent loops | `@testing-library/svelte` `render()` of a tiny `<button use:copyAction={...}>` host | Native lifecycle wiring — `update()` actually fires when bound props change |

**Key insight:** Svelte's `svelte/action` and `svelte/store` modules are stable, two-version-compatible, and stupendously small. The runes API is the only Svelte 5-specific surface, and it's the reason `/runes` is a separate subpath.

## Common Pitfalls

### Pitfall 1: `copyAction` cannot dispatch `ctc:error` without wrapping `onError`
**What goes wrong:** `copyToClipboard()` returns `false` on failure but only delivers the structured `BrowserUtilsError` via the `onError` callback. If the action just checks the return value, it knows there was a failure but does NOT have the error object to put in `event.detail.error` (D-09).
**Why it happens:** Library design — `copyToClipboard` doesn't return errors, it routes them via callback (ERR-02).
**How to avoid:** Wrap user's `onError`:
```ts
let capturedError: BrowserUtilsError | null = null
const success = await copyToClipboard(current.text, {
  onError: (err) => {
    capturedError = err
    current.onError?.(err)
  },
})
if (success) {
  node.dispatchEvent(new CustomEvent('ctc:copy', { detail: { text: current.text }, bubbles: true }))
} else if (capturedError) {
  node.dispatchEvent(new CustomEvent('ctc:error', { detail: { error: capturedError }, bubbles: true }))
}
```
**Warning signs:** If `tests/copy-action.test.ts` finds that `ctc:error` event has `event.detail.error === undefined`.

### Pitfall 2: Runes return value snapshots
**What goes wrong:** `return { copied: state.copied }` evaluates `state.copied` at return time — consumers receive a frozen `false`, never updated.
**Why it happens:** `$state` proxies are reactive on access, not on copy. Destructuring or property-spread snapshots.
**How to avoid:** Return getters: `return { get copied() { return state.copied } }`. This re-reads the proxy on every access.
**Warning signs:** Test for "copied flips to true after successful copy" fails on the runes export but passes on the stores export.

### Pitfall 3: Rune file extension
**What goes wrong:** `src/runes/use-copy-to-clipboard.ts` (no `.svelte.ts`) — the `$state` syntax fails to compile because `@sveltejs/vite-plugin-svelte` only processes rune syntax inside `.svelte`, `.svelte.ts`, `.svelte.js` files.
**Why it happens:** The CONTEXT.md D-03 lists the file as `.ts`. This is a typo to correct, not a decision to honor.
**How to avoid:** Use `runes/use-copy-to-clipboard.svelte.ts` and update tsdown entry, vitest coverage path, and any imports.
**Warning signs:** Build error: `$state is not defined` or `Cannot use $state outside a .svelte/.svelte.[jt]s file`.

### Pitfall 4: `$effect` only runs inside an effect context
**What goes wrong:** Calling `useCopyToClipboard()` from `/runes` outside a component setup — `$effect` throws/no-ops.
**Why it happens:** `$effect` is component-lifecycle scoped. Same constraint as Vue's `onUnmounted` (D-14 acknowledges this for stores).
**How to avoid:** Document in the runes README/TSDoc: "must be called inside a Svelte 5 component `<script>` block." Don't try to support arbitrary call sites.
**Warning signs:** Tests that call the runes export outside a host component fail with effect-context errors.

### Pitfall 5: tsdown overwrites manual exports map
**What goes wrong:** Manually adding `./stores` and `./runes` to package.json `exports` block — overwritten on next `pnpm build`.
**Why it happens:** Phase 01 decision: `tsdown exports:true auto-generates exports map` (STATE.md).
**How to avoid:** Add the entries to `tsdown.config.ts`'s `entry` object only. Let tsdown manage `exports`. Verify after build that `./stores` and `./runes` are present.
**Warning signs:** publint reports missing subpaths after a clean build.

### Pitfall 6: `@testing-library/svelte` requires the vite plugins, even for non-component tests
**What goes wrong:** Importing `useCopyToClipboard` from `runes/use-copy-to-clipboard.svelte.ts` in a vitest test fails because vitest can't compile the rune syntax without `@sveltejs/vite-plugin-svelte` registered.
**Why it happens:** `vite-plugin-svelte` is what teaches vite (and therefore vitest) how to handle `.svelte.ts` files.
**How to avoid:** Always register `svelte()` + `svelteTesting()` in `vitest.config.ts`. Even if tests never `render()` a component, the plugin is needed to compile the runes module being imported.
**Warning signs:** "Unexpected token" errors when vitest loads the runes module.

### Pitfall 7: Custom event names with colons require `on:ctc:copy` (Svelte 4) vs `oncolons` (Svelte 5)
**What goes wrong:** Svelte 4 dispatches custom events via `on:ctc:copy=`. Svelte 5 changed event syntax to lowercase `on*` props (`onctc:copy` is NOT valid identifier). For DOM-dispatched custom events (which is what we use — D-08), Svelte 5 still supports `on:ctc:copy` listener syntax for backwards compatibility.
**Why it happens:** Svelte 5 prefers component prop callbacks; DOM events with custom names use the legacy `on:` syntax.
**How to avoid:** Document the consumer pattern as `<button use:copyAction={{ text }} on:ctc:copy={handler}>` and verify it works in both Svelte 4 and 5 mode (Phase 7 playground will validate this end-to-end). Actions dispatching CustomEvents bubble through normal DOM, so this works.
**Warning signs:** Consumers report "event handler not firing" — they likely tried `onctccopy` style.

## Code Examples

(Patterns 1–5 above are the primary examples. They are ready to copy into source files.)

### Test pattern: action via host component
```ts
// Source: testing-library.com/docs/svelte-testing-library/intro (adapted)
// tests/copy-action.test.ts
import { render, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createClipboardMock } from './helpers/create-clipboard-mock'
import CopyButton from './fixtures/CopyButton.svelte' // tiny harness component

const mock = createClipboardMock()
beforeEach(() => { mock.install(); vi.useFakeTimers() })
afterEach(() => { mock.uninstall(); vi.useRealTimers(); vi.clearAllMocks() })

it('dispatches ctc:copy on successful click', async () => {
  mock.writeText.mockResolvedValueOnce(undefined)
  const onCopy = vi.fn()
  const { getByRole } = render(CopyButton, { props: { text: 'hello', onCopy } })
  await fireEvent.click(getByRole('button'))
  await vi.waitFor(() => expect(onCopy).toHaveBeenCalledWith(expect.objectContaining({
    detail: { text: 'hello' },
  })))
})
```

The `CopyButton.svelte` fixture lives in `tests/fixtures/` and is a 5-line component:
```svelte
<script>
  import { copyAction } from '../../src/action/copy-action'
  export let text
  export let onCopy
</script>
<button use:copyAction={{ text }} on:ctc:copy={onCopy}>Copy</button>
```

### Test pattern: runes export inside `$effect.root` (no component needed)
```ts
// tests/use-copy-to-clipboard.test.ts (runes branch)
import { useCopyToClipboard as useRunes } from '../src/runes/use-copy-to-clipboard.svelte'
// $effect inside a function-call context requires either a component render
// OR an explicit $effect.root() to provide an effect scope.
// Use $effect.root for pure-function tests:
import { flushSync } from 'svelte'

it('flips copied to true after successful copy (runes)', async () => {
  mock.writeText.mockResolvedValueOnce(undefined)
  let api: ReturnType<typeof useRunes> | undefined
  const cleanup = $effect.root(() => {
    api = useRunes('hello')
  })
  await api!.copy()
  flushSync()
  expect(api!.copied).toBe(true)
  cleanup()
})
```

Alternatively (and probably simpler), the unified test file can define a host `.svelte` component that calls `useCopyToClipboard()` in its `<script>` and exposes the result, then `render()` the component. **Both options are within Claude's discretion (CONTEXT.md).** Recommendation: use a tiny host component for runes too — keeps the test file uniform with the action tests and avoids `$effect.root` boilerplate.

### Stores test (no host component needed)
```ts
// tests/use-copy-to-clipboard.test.ts (stores branch)
import { get } from 'svelte/store'
import { useCopyToClipboard as useStores } from '../src/stores/use-copy-to-clipboard'

it('flips copied to true after successful copy (stores)', async () => {
  mock.writeText.mockResolvedValueOnce(undefined)
  const { copy, copied } = useStores('hello')
  await copy()
  expect(get(copied)).toBe(true)
})
```

`get(store)` from `svelte/store` synchronously reads a store's current value — perfect for tests.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Svelte 4 `createEventDispatcher` for custom events | DOM `CustomEvent` via `dispatchEvent` | Svelte 5 (component events removed; props/callbacks preferred) | We use raw `dispatchEvent` already (D-08) — works in both 4 and 5 |
| `use:` actions with `update`/`destroy` return | `@attach` attachments with `$effect` | Svelte 5 | We stay on `use:` because D-01 requires Svelte 4 support |
| `<script lang="ts">` + manual reactive declarations (`$:`) | `$state`/`$derived` runes | Svelte 5 | Only used in `/runes` subpath (D-15) |
| `@testing-library/svelte@4.x` (Svelte 3/4 only) | `@testing-library/svelte@5.3.1` (Svelte 3/4/5) | v5 release | Single dependency for both subpaths (D-20) |

**Deprecated/outdated:**
- `createEventDispatcher` — removed in Svelte 5 components. We don't use it.
- `svelte` v3 — out of support; v4 still common in production, v5 stable.
- `@sveltejs/vite-plugin-svelte` v3 — current is v7 (matches Vite 7 / Svelte 5).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@sveltejs/vite-plugin-svelte` v7.0.0 is required; older versions don't support Svelte 5 + Vite 7 | Standard Stack | Wrong version → vitest fails to load `.svelte` fixtures. Verifiable with `npm view @sveltejs/vite-plugin-svelte peerDependencies`. |
| A2 | `$state.root` exists and works in vitest jsdom for testing rune modules without a host component | Code Examples | If wrong, tests must use a `.svelte` host component (already documented as the alternative). Low risk. |
| A3 | Returning getters from a runes function preserves reactivity across module boundaries (the consumer destructures `{ copied }` and still sees updates) | Pattern 3, Pitfall 2 | If reactivity is lost on destructure, consumers must access via `result.copied` (no destructuring). Should be verified during implementation with a 5-line spike test. |
| A4 | `tsdown exports: true` correctly emits subpath exports for `./stores` and `./runes` when listed as `entry` keys | Pattern 4 | If wrong, manual `exports` map workaround needed (contradicts STATE.md Phase 01 decision). Verify after first build. |
| A5 | The CONTEXT.md filename `runes/use-copy-to-clipboard.ts` is a typo and should be `.svelte.ts` | Pitfall 3, Architecture Patterns | HIGH risk if not corrected — runes won't compile. Planner MUST flag this for the user or just rename. |

**A5 is the highest-impact assumption.** The locked decisions in CONTEXT.md don't explicitly say `.svelte.ts`, but rune syntax cannot live in a plain `.ts` file. The planner should treat this as a typo correction and rename in the plan, OR escalate to the user via discuss-phase before locking the plan.

## Open Questions

1. **Should the runes test pattern use `$effect.root()` or a host component?**
   - What we know: Both work. CONTEXT.md leaves it to Claude's discretion.
   - What's unclear: Whether `$effect.root` is stable enough for test code or whether a host component is more idiomatic in `@testing-library/svelte` patterns.
   - Recommendation: Use a host component for both action and runes tests; use direct calls for stores. Three test "modes" but each is the most idiomatic for its respective pattern.

2. **Does the stores test need a host component for the timer auto-reset assertion?**
   - What we know: `vi.useFakeTimers()` + `vi.advanceTimersByTime(2000)` works for direct function calls. No component needed.
   - What's unclear: None — direct call + `get(copied)` is sufficient.
   - Recommendation: Direct call pattern for all stores tests; mirrors React/Vue.

3. **Does `@testing-library/svelte` need `@testing-library/jest-dom` matchers?**
   - What we know: Setup docs recommend it for `toBeInTheDocument()` etc.
   - What's unclear: Whether our tests (action + state) need DOM matchers — they mostly assert function call args and store values.
   - Recommendation: Skip jest-dom for now. If a test wants `toBeInTheDocument`, add later. Keeps devDeps minimal.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| pnpm | Workspace install | ✓ | (project standard) | — |
| Node 20+ | All packages | ✓ | (engines field) | — |
| jsdom | Vitest | ✓ (already installed in react/vue) | ^26 | — |
| svelte (compiler) | Build + tests | ✗ (must add as devDep) | 5.55.3 (target) | — |
| @sveltejs/vite-plugin-svelte | Vitest compile of .svelte/.svelte.ts | ✗ (must add) | 7.0.0 | — |
| @testing-library/svelte | Tests | ✗ (must add) | 5.3.1 | — |

**Missing dependencies with no fallback:** None — all are standard pnpm installs at package scope.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.3 + @testing-library/svelte 5.3.1 |
| Config file | `packages/svelte/vitest.config.ts` (Wave 0 — does not exist yet) |
| Quick run command | `pnpm --filter @ngockhoi96/ctc-svelte test` |
| Full suite command | `pnpm -r test` (from root) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADAPT-03 (action) | `copyAction` triggers `copyToClipboard` on click | unit (component host) | `pnpm --filter @ngockhoi96/ctc-svelte test copy-action` | ❌ Wave 0 |
| ADAPT-03 (action) | Dispatches `ctc:copy` with `{ text }` detail on success | unit | same | ❌ Wave 0 |
| ADAPT-03 (action) | Dispatches `ctc:error` with `{ error }` detail on failure | unit | same | ❌ Wave 0 |
| ADAPT-03 (action) | `update()` picks up new text without remount | unit | same | ❌ Wave 0 |
| ADAPT-03 (action) | `destroy()` removes click listener | unit | same | ❌ Wave 0 |
| ADAPT-03 (stores) | `copy()` flips `copied` store to `true`, then auto-resets after timeout | unit | `pnpm --filter @ngockhoi96/ctc-svelte test use-copy-to-clipboard` | ❌ Wave 0 |
| ADAPT-03 (stores) | `error` store populated on failure, cleared before next call | unit | same | ❌ Wave 0 |
| ADAPT-03 (stores) | `reset()` cancels timer and clears state | unit | same | ❌ Wave 0 |
| ADAPT-03 (stores) | undefined-text guard returns false + dispatches `CLIPBOARD_NOT_SUPPORTED` | unit | same | ❌ Wave 0 |
| ADAPT-03 (runes) | Same five behaviors as stores, asserted via reactive object access | unit | same | ❌ Wave 0 |
| ADAPT-04 | peerDeps declared correctly; no runtime deps | static | `pnpm --filter @ngockhoi96/ctc-svelte validate` (publint) | ❌ Wave 0 |
| ADAPT-05 | 100% branch coverage on all three source files | unit | `pnpm --filter @ngockhoi96/ctc-svelte test --coverage` | ❌ Wave 0 |
| ADAPT-06 | ESM + CJS + .d.ts emitted; subpath exports valid | build + static | `pnpm --filter @ngockhoi96/ctc-svelte build && pnpm --filter @ngockhoi96/ctc-svelte validate` | ❌ Wave 0 |
| ADAPT-06 | Bundle ≤ 2KB gzip on `dist/index.mjs` | static | `pnpm --filter @ngockhoi96/ctc-svelte size` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @ngockhoi96/ctc-svelte test`
- **Per wave merge:** `pnpm --filter @ngockhoi96/ctc-svelte test && pnpm --filter @ngockhoi96/ctc-svelte build && pnpm --filter @ngockhoi96/ctc-svelte validate && pnpm --filter @ngockhoi96/ctc-svelte size`
- **Phase gate:** Full suite green from root: `pnpm -r build && pnpm -r test && pnpm -r validate`

### Wave 0 Gaps
- [ ] `packages/svelte/package.json` — scaffold (mirror packages/vue, swap deps)
- [ ] `packages/svelte/tsconfig.json` + `tsconfig.node.json`
- [ ] `packages/svelte/tsdown.config.ts` (3 entry points)
- [ ] `packages/svelte/vitest.config.ts` (svelte + svelteTesting plugins, jsdom)
- [ ] `packages/svelte/src/action/copy-action.ts`
- [ ] `packages/svelte/src/stores/use-copy-to-clipboard.ts`
- [ ] `packages/svelte/src/runes/use-copy-to-clipboard.svelte.ts` (note `.svelte.ts`)
- [ ] `packages/svelte/src/index.ts` (re-exports `copyAction` only)
- [ ] `packages/svelte/tests/helpers/create-clipboard-mock.ts` (copy from packages/react/tests/helpers/)
- [ ] `packages/svelte/tests/copy-action.test.ts` + host fixture component
- [ ] `packages/svelte/tests/use-copy-to-clipboard.test.ts` (unified)
- [ ] `packages/svelte/README.md`

## Project Constraints (from CLAUDE.md)

The following CLAUDE.md directives apply to Phase 6 implementation. The planner must verify each task complies:

- **Named exports only** — no `export default` in any source file (verified by Biome `noDefaultExport`).
- **Strict TypeScript** — no `any`, no `as` casts unless documented inline.
- **Functions return boolean/null for failure, never throw** — `copy()` returns `boolean`; the `CLIPBOARD_NOT_SUPPORTED` guard returns `false` (D-19), it does not throw.
- **Every exported function has TSDoc comments** — `copyAction`, `useCopyToClipboard` (×2), `reset`, `copy` all need TSDoc. Mirror the format used in `packages/react/src/use-copy-to-clipboard.ts`.
- **Zero runtime dependencies** — only `@ngockhoi96/ctc` (peer) and `svelte` (peer). Verified by D-24.
- **Conventional commits** — `feat(svelte): scaffold @ngockhoi96/ctc-svelte`, `feat(svelte): add copyAction`, etc.
- **`pnpm lint && pnpm test && pnpm build` before any commit** — pre-commit hook will block otherwise.
- **File naming kebab-case** — `copy-action.ts`, `use-copy-to-clipboard.ts`, `use-copy-to-clipboard.svelte.ts`.
- **Function naming verb-first camelCase** — `copyAction`, `useCopyToClipboard`, `reset`.
- **Type/Interface PascalCase** — `CopyActionParams`, `UseCopyToClipboardOptions`, `UseCopyToClipboardResult`.
- **Error handling: typed error codes, not strings** — reuse `BrowserUtilsError` from core; only `CLIPBOARD_NOT_SUPPORTED` code is introduced by adapter (matches Phase 5).
- **Project skill `implement` applies** — read `.claude/skills/implement/SKILL.md` before writing source files.
- **Tree-shaking verification** — after build, `pnpm size` confirms `dist/index.mjs` < 2KB gzip per D-26.
- **`tsconfig.json` covers `src/`, `tsconfig.node.json` covers config files** — same split as core/react/vue.

## Sources

### Primary (HIGH confidence)
- [packages/react/](file:///home/ngockhoi96/workspace/github.com/anIcedAntFA/ctc/packages/react) — full reference scaffold (tsdown, vitest, package.json, mock helper)
- [packages/vue/use-copy-to-clipboard.ts](file:///home/ngockhoi96/workspace/github.com/anIcedAntFA/ctc/packages/vue/src/use-copy-to-clipboard.ts) — composable reference (`onUnmounted`, `shallowRef`)
- [.planning/phases/06-svelte-adapter/06-CONTEXT.md](file:///home/ngockhoi96/workspace/github.com/anIcedAntFA/ctc/.planning/phases/06-svelte-adapter/06-CONTEXT.md) — locked decisions D-01..D-27
- [svelte.dev/docs/svelte/svelte-action](https://svelte.dev/docs/svelte/svelte-action) — Action / ActionReturn types, update()/destroy() pattern
- [svelte.dev/docs/svelte/svelte-store](https://svelte.dev/docs/svelte/svelte-store) — writable, readable, readonly, derived
- [svelte.dev/docs/svelte/$state](https://svelte.dev/docs/svelte/$state) — `.svelte.ts` extension requirement, export rules
- [svelte.dev/docs/svelte/$effect](https://svelte.dev/docs/svelte/$effect) — cleanup return function, lifecycle scope
- [testing-library.com/docs/svelte-testing-library/setup](https://testing-library.com/docs/svelte-testing-library/setup) — vitest config with `svelte()` + `svelteTesting()` plugins
- npm registry: `svelte@5.55.3`, `@testing-library/svelte@5.3.1`, `@sveltejs/vite-plugin-svelte@7.0.0` — verified live

### Secondary (MEDIUM confidence)
- [github.com/testing-library/svelte-testing-library](https://github.com/testing-library/svelte-testing-library) — v5.3.1 supports Svelte 3/4/5

### Tertiary (LOW confidence)
- (none)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified against npm registry today
- Architecture patterns: HIGH — code examples derived from official Svelte docs and Phase 5 reference implementations
- Pitfalls: HIGH (Pitfalls 1, 2, 3, 5) and MEDIUM (Pitfalls 4, 6, 7) — runtime behavior of `$effect.root` in vitest (P4) and Svelte 4 vs 5 event listener syntax (P7) would benefit from spike validation during Wave 0

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (30 days — Svelte 5 is stable, ecosystem moves slowly)
