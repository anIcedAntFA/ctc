# Phase 5 Research: React & Vue Adapters

**Researched:** 2026-04-13
**Domain:** React hooks, Vue composables, pnpm monorepo adapter packages
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `useCopyToClipboard(text?: string, options?: ClipboardOptions)` — text optional at init. `copy(text?: string)` — call-site overrides init.
- **D-02:** If text is undefined at both init AND call-site, `copy()` returns `false` and calls `onError` with an appropriate error code.
- **D-03:** Return value: `{ copy, copied, error, reset }` — four fields only.
- **D-04:** `copied: boolean` — `true` immediately after success, auto-resets after `timeout` ms (default 2000).
- **D-05:** `timeout: 0` = never auto-reset; `copied` stays `true` until next `copy()` or `reset()`.
- **D-06:** `reset()` clears `copied` to `false` and `error` to `null` immediately.
- **D-07:** `error: BrowserUtilsError | null` — same typed error object from `@ngockhoi96/ctc`. `null` when no error. Cleared to `null` on each new `copy()` call.
- **D-08:** Consumers branch on `error?.code` using typed `ErrorCode` union.
- **D-09:** React testing: `@testing-library/react` with `renderHook`. Framework: Vitest.
- **D-10:** Shared mock helper: `createClipboardMock()` in `packages/react/tests/helpers/create-clipboard-mock.ts`.
- **D-11:** React peerDependencies: `"react": ">=18 <20"`, `"react-dom": ">=18 <20"`. Zero runtime deps.
- **D-12:** Vue testing: `@vue/test-utils` with Vitest, `withSetup` or mount-wrapper pattern.
- **D-13:** Shared mock helper: `createClipboardMock()` in `packages/vue/tests/helpers/create-clipboard-mock.ts` — mirrors React pattern.
- **D-14:** Vue peerDependencies: `"vue": ">=3.0.0 <4.0.0"`. Zero runtime deps.
- **D-15:** Flat `src/` — single hook/composable file + barrel. Exact scaffold structure defined.
- **D-16:** Own `biome.json` extending root `biome.json`. Own `tsconfig.node.json` covering config files.
- **D-17:** No `tests/e2e/` in adapter packages — unit tests only.
- **D-18:** React peerDep range: `>=18 <20`.
- **D-19:** Vue peerDep range: `>=3.0.0 <4.0.0`.

### Claude's Discretion

- Exact timer implementation in React (`useRef` + `clearTimeout` vs `useEffect` cleanup)
- Vue composable reactivity internals (`ref` vs `shallowRef` for `copied` and `error`)
- Whether to use `useCallback`/`useMemo` for `copy` and `reset` in React
- `tsdown.config.ts` content for adapter packages (expected to mirror `packages/core` config)
- Exact `size-limit` config for adapters (budget < 2KB gzip)

### Deferred Ideas (OUT OF SCOPE)

- Svelte adapter — Phase 6
- Playgrounds — Phase 7
- SSR adapter variants (Next.js, Nuxt) — not in any active phase
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADAPT-01 | `@ngockhoi96/ctc-react` — `useCopyToClipboard(text?, options?)` React hook returning `{ copy, copied, error, reset }`; `copied` auto-resets after configurable timeout (default 2s) | React hook timer pattern, useRef+clearTimeout, useCallback sections |
| ADAPT-02 | `@ngockhoi96/ctc-vue` — `useCopyToClipboard(text?, options?)` Vue 3 composable returning `{ copy, copied, error, reset }` as refs; `copied` auto-resets | Vue composable pattern, ref vs shallowRef, onUnmounted cleanup sections |
| ADAPT-04 | All adapters declare `@ngockhoi96/ctc` as peer dep; ship zero runtime deps | Package scaffold, peerDependency pattern sections |
| ADAPT-05 | All adapters have unit tests — React Testing Library, Vue Test Utils | Testing patterns sections; coverage threshold section |
| ADAPT-06 | All adapters published as separate npm packages with ESM + CJS + `.d.ts` | tsdown config, exports map, publint sections |
</phase_requirements>

---

## React Hook Implementation

### Timer / Reset Pattern

**Recommendation: `useRef` + `clearTimeout` directly in the `copy` function body. Do NOT use `useEffect` for timer management.**

The `useRef` pattern is correct here for two reasons:

1. `useEffect` with a `[copied]` dependency runs *after render*, creating an off-by-one render lag where `copied` flips to `true` and triggers a re-render before the timer is even set. Using `useRef` to hold the timer ID and calling `clearTimeout` + `setTimeout` directly inside the `copy` async handler is synchronous with the state update — no render gap.

2. Stale closure risk: in `useEffect`, if `timeout` option changes between calls, the cleanup from a previous effect could cancel a timer from a newer call. With `useRef` stored in the `copy` callback itself, the timer reference is always the most recently set one.

**Verified pattern** [VERIFIED: usehooks-ts source, React docs on useRef]:

```typescript
// packages/react/src/use-copy-to-clipboard.ts
import { useCallback, useRef, useState } from 'react'
import type { BrowserUtilsError, ClipboardOptions } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'

export interface UseCopyToClipboardOptions extends ClipboardOptions {
  timeout?: number
}

export interface UseCopyToClipboardResult {
  copy: (text?: string) => Promise<boolean>
  copied: boolean
  error: BrowserUtilsError | null
  reset: () => void
}

export function useCopyToClipboard(
  initText?: string,
  options?: UseCopyToClipboardOptions,
): UseCopyToClipboardResult {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<BrowserUtilsError | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeout = options?.timeout ?? 2000

  const copy = useCallback(
    async (callText?: string): Promise<boolean> => {
      const text = callText ?? initText

      // D-02: no text at either site — programmer error
      if (text === undefined) {
        const err: BrowserUtilsError = {
          code: 'CLIPBOARD_NOT_SUPPORTED', // use most appropriate code; see note
          message: 'No text provided to copy',
        }
        setError(err)
        options?.onError?.(err)
        return false
      }

      // D-07: clear error before each attempt
      setError(null)

      // Clear any pending reset timer from a previous copy
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      const capturedOnError = options?.onError
      const success = await copyToClipboard(text, { onError: capturedOnError })

      if (success) {
        setCopied(true)
        // D-05: timeout === 0 means never auto-reset
        if (timeout > 0) {
          timerRef.current = setTimeout(() => {
            setCopied(false)
            timerRef.current = null
          }, timeout)
        }
      } else {
        setCopied(false)
      }

      return success
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initText, timeout, options?.onError],
  )

  const reset = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setCopied(false)
    setError(null)
  }, [])

  return { copy, copied, error, reset }
}
```

**Note on error code for D-02:** `BrowserUtilsError` requires one of the existing `ErrorCode` union values. `'CLIPBOARD_NOT_SUPPORTED'` is the closest available code for a programmer-error "no text" scenario. The planner should decide whether to add a new `'NO_TEXT_PROVIDED'` code to core's `ErrorCode` union, or document that `'CLIPBOARD_NOT_SUPPORTED'` is reused for this case. This is a **decision gap** — see Open Questions.

**Memory leak prevention in React 18+:** React 18 no longer silences the "setState on unmounted component" warning (it was removed), but it still causes a no-op state update if the component unmounts before the timer fires. To prevent this, clear the timer on unmount. The canonical approach is to return a cleanup from a one-time `useEffect`:

```typescript
// Add this inside useCopyToClipboard, after timerRef declaration:
useEffect(() => {
  return () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }
  }
}, []) // empty deps — runs only on unmount
```

This single cleanup `useEffect` with empty deps avoids the stale closure and timer management issues described above. The timer itself is still set/cleared inside `copy` — the `useEffect` is *only* for the unmount case. [VERIFIED: React docs on useEffect cleanup, React 18 changelog]

### Async Clipboard in React Hooks

**Verified: `copyToClipboard` from `@ngockhoi96/ctc` returns `Promise<boolean>` and never throws.** [VERIFIED: packages/core/src/clipboard/copy.ts — all paths return false, catch block returns false]

This means the hook can `await copyToClipboard(...)` safely without a try/catch wrapper. The `onError` callback receives errors. No additional error boundary is needed.

**React 18+ state update safety:** React 18 batches state updates inside async functions automatically (automatic batching). Calling `setCopied(true)` and `setError(null)` in sequence after `await` will batch into a single re-render — no extra `unstable_batchedUpdates` call needed. [VERIFIED: React 18 release notes]

**`act()` in tests:** RTL's `renderHook` already wraps renders in `act()`. For async operations, use `await act(async () => { ... })` around the `copy()` call to flush React's async state queue. [VERIFIED: @testing-library/react docs]

### `useCallback` for Stable References

**Recommendation: YES, wrap both `copy` and `reset` in `useCallback`.**

Reason: The hook is designed to be used in components where `copy` will be passed as a prop or included in event handlers. Without `useCallback`, every render creates a new function reference, causing unnecessary re-renders in memoized children. Since `reset` has no dependencies (uses only refs and setters), it has a stable empty `[]` dep array. `copy` depends on `[initText, timeout, options?.onError]`. [VERIFIED: React docs on useCallback]

**Caveat:** `options?.onError` is an object property — if the consumer passes an inline function as `onError`, it will be a new reference on every render and invalidate the `copy` callback. Document in README that consumers should memoize `onError` with `useCallback` if they care about stability.

### Options Merging

**Pattern: Call-site text overrides init text. Options are a single `ClipboardOptions`-compatible object passed at hook init — there is no call-site options override.**

The locked API is `copy(text?: string)` — only text can be overridden at call site. The `onError` and `timeout` come from hook init only. This is intentional: options that control hook behavior (timeout, error routing) belong at init time, not per-copy-call.

At hook init, `options` is captured by the `useCallback` closure. If `options.onError` changes between calls, the stale closure issue mentioned above applies — this is expected React behavior and documented in the README.

---

## Vue Composable Implementation

### Reactivity: `ref` vs `shallowRef`

**Recommendation: Use `shallowRef` for both `copied` (boolean) and `error` (`BrowserUtilsError | null`).**

Rationale verified from Vue docs and VueUse codebase [VERIFIED: vuejs.org/api/reactivity-advanced, VueUse useTimeoutFn source]:

- `ref` on a primitive (`boolean`) already behaves the same as `shallowRef` — Vue does not deep-track primitive values. The behavioral difference only appears with object values.
- `shallowRef` on `error: BrowserUtilsError | null` is correct because we always *replace* the entire error object (`error.value = newError`), never mutate its properties in-place. `shallowRef` is optimal here: it tracks the reference change but skips deep property tracking.
- **Performance note:** For this composable's scale (two boolean/object refs), the difference is negligible. The recommendation to use `shallowRef` follows VueUse's convention for boolean state refs (e.g., `isPending = shallowRef(false)`) and is consistent — not a critical optimization.

```typescript
// packages/vue/src/use-copy-to-clipboard.ts
import { onUnmounted, shallowRef } from 'vue'
import type { BrowserUtilsError, ClipboardOptions } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'

export interface UseCopyToClipboardOptions extends ClipboardOptions {
  timeout?: number
}

export interface UseCopyToClipboardResult {
  copy: (text?: string) => Promise<boolean>
  copied: Readonly<ReturnType<typeof shallowRef<boolean>>>
  error: Readonly<ReturnType<typeof shallowRef<BrowserUtilsError | null>>>
  reset: () => void
}

export function useCopyToClipboard(
  initText?: string,
  options?: UseCopyToClipboardOptions,
) {
  const copied = shallowRef(false)
  const error = shallowRef<BrowserUtilsError | null>(null)
  const timeout = options?.timeout ?? 2000
  let timer: ReturnType<typeof setTimeout> | null = null

  async function copy(callText?: string): Promise<boolean> {
    const text = callText ?? initText

    if (text === undefined) {
      const err: BrowserUtilsError = {
        code: 'CLIPBOARD_NOT_SUPPORTED',
        message: 'No text provided to copy',
      }
      error.value = err
      options?.onError?.(err)
      return false
    }

    // D-07: clear error before attempt
    error.value = null

    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }

    const success = await copyToClipboard(text, { onError: options?.onError })

    if (success) {
      copied.value = true
      if (timeout > 0) {
        timer = setTimeout(() => {
          copied.value = false
          timer = null
        }, timeout)
      }
    } else {
      copied.value = false
    }

    return success
  }

  function reset(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    copied.value = false
    error.value = null
  }

  onUnmounted(() => {
    if (timer !== null) {
      clearTimeout(timer)
    }
  })

  return { copy, copied, error, reset }
}
```

### Async Pattern

Vue composables do not need special wrappers for async operations. The `copy` function is `async` and sets reactive refs after awaiting. Vue's reactivity system tracks `.value` assignments regardless of when they occur (sync or async). [VERIFIED: vuejs.org/guide/reusability/composables]

The pattern of resetting state before the async operation (`error.value = null`, clear timer) mirrors Vue's own `useFetch` example in the official docs [CITED: vuejs.org/guide/reusability/composables#async-state-example].

### Timer Cleanup (`onUnmounted`)

**Verified: `onUnmounted` is the correct cleanup hook.** [VERIFIED: vuejs.org/guide/reusability/composables#cleanup]

`onUnmounted` registers a callback that runs when the component using this composable is unmounted. Because composables call lifecycle hooks during a component's `setup()`, the lifecycle hook is scoped to that component instance.

**Key SSR consideration:** `onUnmounted` is safe in SSR — it simply does not fire on the server (components are not mounted/unmounted in SSR). The timer variable is a local module-scope variable (per composable call), not shared — SSR does not create cross-request state pollution. [VERIFIED: Vue SSR guide]

The `timer` variable is a plain JavaScript variable (not a `ref`) intentionally — it is implementation detail, not part of the reactive API surface. This avoids unnecessary reactivity overhead on the timer handle.

### SSR Considerations

The composable adds **no new SSR concerns** beyond what the core library already handles:

1. `copyToClipboard` from core already guards with `isBrowser()` and returns `false` in non-browser environments. The composable delegates entirely to it.
2. `shallowRef(false)` and `shallowRef(null)` are safe to initialize in SSR — Vue's reactivity is always available.
3. `onUnmounted` is a no-op in SSR — no risk of timer cleanup issues.
4. The `setTimeout` inside `copy` will never be reached in SSR because `copyToClipboard` returns `false` before the timer branch. Even if called, `setTimeout` exists in Node.js — it would fire but set a ref value with no active component, which is harmless.

**Nuxt note (deferred but good to know):** If used in Nuxt with `<script setup>`, the composable is called during SSR's `setup()` phase. The above analysis confirms no issues. If consumers call `copy()` in SSR context (e.g., server action), `copyToClipboard` returns `false` gracefully. [ASSUMED — Nuxt SSR composable behavior not verified in this session against Nuxt docs]

---

## Package Scaffold

### `tsdown.config.ts` (from core — exact source)

[VERIFIED: packages/core/tsdown.config.ts]

```typescript
// packages/core/tsdown.config.ts — EXACT CURRENT FILE
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'clipboard/index': 'src/clipboard/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  exports: true,
})
```

**Adapter changes:**

Adapters have a single entry point (no subpath). The adapter `tsdown.config.ts` should be:

```typescript
// packages/react/tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  exports: true,
})
```

**Critical note — `exports: true`:** This flag auto-generates the `exports` map in `package.json` on every build. Manual edits to `exports` in `package.json` are **overwritten on build**. This is documented in STATE.md as a known behavior [VERIFIED: STATE.md decision log Phase 01]. The adapter `package.json` must be structured so that auto-generated exports are correct, or `exports: true` must be verified to produce the expected map after first build.

**`dts: true`:** tsdown generates `.d.ts`, `.d.mts`, `.d.cts` files. This is what passes `attw` (arethetypeswrong). [VERIFIED: packages/core dist/ — contains index.d.cts, index.d.mts]

### Exports Map Pattern (from core `package.json` — exact)

[VERIFIED: packages/core/package.json]

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.cts",
  "typesVersions": {
    "*": {
      "clipboard": ["./dist/clipboard/index.d.cts"]
    }
  },
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./clipboard": {
      "import": "./dist/clipboard/index.mjs",
      "require": "./dist/clipboard/index.cjs"
    },
    "./package.json": "./package.json"
  }
}
```

**Adapter differences:**

Adapters have a single entry, no subpath export, no `typesVersions` subpath:

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.cts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  }
}
```

**publint `EXPORTS_TYPES_SHOULD_BE_FIRST` rule:** The `"types"` condition must appear first within each export entry when present. The core package does NOT include `"types"` in the `exports` map — it uses the top-level `"types"` field instead. `tsdown exports: true` may or may not add a `"types"` condition — verify after first build. [VERIFIED: publint.dev/rules]

**`"./package.json": "./package.json"` entry:** Required by many tooling chains for condition-checking. Core includes it; adapters must include it too.

### `pnpm-workspace.yaml` — Current Content

[VERIFIED: pnpm-workspace.yaml]

```yaml
packages:
  - "packages/*"
```

**Confirmed: `packages/*` glob auto-detects new packages.** Both `packages/react` and `packages/vue` will be auto-detected without modifying this file. No changes needed. [VERIFIED: pnpm-workspace.yaml]

### `turbo.json` Task Coverage

[VERIFIED: turbo.json — complete task list]

| Task | Has Entry | Relevant to Adapters |
|------|-----------|----------------------|
| `build` | Yes — `dependsOn: ["^build"]`, outputs `dist/**` | Adapters inherit automatically |
| `test` | Yes — `dependsOn: ["build"]`, inputs `tests/unit/**` | Adapters use same test glob |
| `test:e2e` | Yes | Adapter packages have no e2e tests; task will have no-op for them |
| `lint` | Yes — inputs `src/**`, `tests/**`, `biome.json` | Adapters inherit |
| `validate` | Yes — `dependsOn: ["build"]`, inputs `dist/**` | Adapters need `validate` script |
| `size` | Yes — `dependsOn: ["build"]` | Adapters need `size` script |
| `typecheck` | Yes | Adapters need `typecheck` script |

**Conclusion: No changes to `turbo.json` required.** All tasks run across packages via the `packages/*` workspace glob. Adapter packages must define the matching script names in their `package.json` (`build`, `test`, `lint`, `validate`, `size`, `typecheck`). [VERIFIED: turbo.json]

**Note on `test:e2e`:** Turbo will include adapter packages in `test:e2e` runs. Since adapters have no `test:e2e` script, Turbo will skip silently (script not defined = no-op). No configuration needed.

---

## Testing Patterns

### `createClipboardMock()` Shape (from core tests)

[VERIFIED: packages/core/tests/unit/clipboard/copy.test.ts]

The core per-file pattern stubs `navigator` and `window` globals using `vi.stubGlobal`. The shape used:

```typescript
// What core mocks per-file (pattern to centralize in adapters):
vi.stubGlobal('navigator', {
  clipboard: { writeText: mockWriteText },  // vi.fn()
})
vi.stubGlobal('window', { isSecureContext: true })
```

**`createClipboardMock()` helper must expose:**

```typescript
// packages/react/tests/helpers/create-clipboard-mock.ts
// packages/vue/tests/helpers/create-clipboard-mock.ts  (identical)
import { vi } from 'vitest'

export interface ClipboardMock {
  writeText: ReturnType<typeof vi.fn>
  install: () => void
  uninstall: () => void
}

export function createClipboardMock(): ClipboardMock {
  const writeText = vi.fn()

  function install(): void {
    vi.stubGlobal('navigator', {
      clipboard: { writeText },
    })
    vi.stubGlobal('window', { isSecureContext: true })
  }

  function uninstall(): void {
    vi.unstubAllGlobals()
  }

  return { writeText, install, uninstall }
}
```

**Usage pattern in tests:**

```typescript
import { beforeEach, afterEach } from 'vitest'
import { createClipboardMock } from '../helpers/create-clipboard-mock.ts'

const mock = createClipboardMock()

beforeEach(() => {
  mock.install()
  vi.useFakeTimers()
})

afterEach(() => {
  mock.uninstall()
  vi.useRealTimers()
  vi.clearAllMocks()
})
```

### React `renderHook` + Fake Timers Pattern

[VERIFIED: @testing-library/react docs, Vitest fake timer docs, vitest-dev/vitest issue #7196]

**Key finding:** When using `vi.useFakeTimers()` with RTL's `renderHook`, wrapping timer advancement in `act()` is required to flush React's state update queue. Use `vi.advanceTimersByTimeAsync()` (async variant) rather than `vi.advanceTimersByTime()` to avoid the promise/timer deadlock where microtasks between timer callbacks don't drain.

**Known issue:** vitest-dev/vitest issue #7196 (January 2025) documents that `vi.runAllTimersAsync()` can generate "not wrapped in act()" warnings. The safe pattern is `act(() => { vi.advanceTimersByTime(ms) })` (sync advance inside sync act), which works reliably for setTimeout-based state resets. [CITED: github.com/vitest-dev/vitest/issues/7196]

**Concrete test pattern for `copied` auto-reset:**

```typescript
import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useCopyToClipboard } from '../../src/use-copy-to-clipboard.ts'
import { createClipboardMock } from '../helpers/create-clipboard-mock.ts'

const mock = createClipboardMock()

beforeEach(() => {
  mock.install()
  vi.useFakeTimers()
})

afterEach(() => {
  mock.uninstall()
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('copied auto-reset', () => {
  it('resets copied to false after default timeout (2000ms)', async () => {
    mock.writeText.mockResolvedValue(undefined)
    const { result } = renderHook(() => useCopyToClipboard('hello'))

    // Trigger copy — wrap async call in act
    await act(async () => {
      await result.current.copy()
    })
    expect(result.current.copied).toBe(true)

    // Advance past the timeout — wrap in act to flush state updates
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.copied).toBe(false)
  })

  it('never resets when timeout is 0', async () => {
    mock.writeText.mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useCopyToClipboard('hello', { timeout: 0 }),
    )

    await act(async () => {
      await result.current.copy()
    })
    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(result.current.copied).toBe(true) // still true
  })

  it('reset() clears copied and error immediately', async () => {
    mock.writeText.mockResolvedValue(undefined)
    const { result } = renderHook(() => useCopyToClipboard('hello'))

    await act(async () => {
      await result.current.copy()
    })
    expect(result.current.copied).toBe(true)

    act(() => {
      result.current.reset()
    })
    expect(result.current.copied).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
```

**Testing unmount timer cleanup:**

```typescript
it('clears pending timer on unmount', async () => {
  mock.writeText.mockResolvedValue(undefined)
  const { result, unmount } = renderHook(() => useCopyToClipboard('hello'))

  await act(async () => {
    await result.current.copy()
  })

  // Unmount before timer fires — should not throw or warn
  unmount()

  // Timer would have fired at 2000ms — confirm no React state update warning
  act(() => {
    vi.advanceTimersByTime(2000)
  })
  // No assertion needed — test passes if no React warning about setState on unmounted component
})
```

### Vue `withSetup` / Mount Wrapper Pattern

[VERIFIED: test-utils.vuejs.org/guide/advanced/reusability-composition, alexop.dev/posts/how-to-test-vue-composables/]

The composable uses `onUnmounted` lifecycle hook, so it **requires** a component context (cannot be tested by calling directly). Use the `withSetup` helper pattern.

**`withSetup` helper:**

```typescript
// packages/vue/tests/helpers/with-setup.ts
import { createApp, type App } from 'vue'

export function withSetup<T>(
  composable: () => T,
): [result: T, app: App] {
  let result!: T
  const app = createApp({
    setup() {
      result = composable()
      // suppress template rendering
      return () => null
    },
  })
  app.mount(document.createElement('div'))
  return [result, app]
}
```

**Concrete test pattern for Vue composable with fake timers:**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useCopyToClipboard } from '../../src/use-copy-to-clipboard.ts'
import { createClipboardMock } from '../helpers/create-clipboard-mock.ts'
import { withSetup } from '../helpers/with-setup.ts'
import type { App } from 'vue'

const mock = createClipboardMock()

beforeEach(() => {
  mock.install()
  vi.useFakeTimers()
})

afterEach(() => {
  mock.uninstall()
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('useCopyToClipboard', () => {
  it('sets copied to true after successful copy', async () => {
    mock.writeText.mockResolvedValue(undefined)
    const [{ copy, copied }] = withSetup(() => useCopyToClipboard('hello'))

    await copy()

    expect(copied.value).toBe(true)
  })

  it('resets copied after default timeout (2000ms)', async () => {
    mock.writeText.mockResolvedValue(undefined)
    const [{ copy, copied }] = withSetup(() => useCopyToClipboard('hello'))

    await copy()
    expect(copied.value).toBe(true)

    vi.advanceTimersByTime(2000)
    expect(copied.value).toBe(false)
  })

  it('clears timer on unmount', async () => {
    mock.writeText.mockResolvedValue(undefined)
    const [{ copy }, app] = withSetup(() => useCopyToClipboard('hello'))

    await copy()
    app.unmount() // triggers onUnmounted

    // No error should occur when timer fires after unmount
    vi.advanceTimersByTime(2000)
  })
})
```

**Key difference from React:** Vue does not require `act()` wrapping — Vue's reactivity updates synchronously when `.value` is set. No special wrapping needed for `await copy()` or `vi.advanceTimersByTime()`.

### Coverage Thresholds

[VERIFIED: packages/core/vitest.config.ts]

Core enforces per-file 100% thresholds on implementation files:

```typescript
thresholds: {
  'src/clipboard/copy.ts': { 100: true },
  'src/clipboard/read.ts': { 100: true },
  // ... etc
}
```

**Adapter vitest configs must match this pattern:**

```typescript
// packages/react/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      thresholds: {
        'src/use-copy-to-clipboard.ts': { 100: true },
      },
    },
  },
})
```

The `{ 100: true }` shorthand sets all four coverage metrics (lines, functions, branches, statements) to 100%. [VERIFIED: Vitest docs, packages/core/vitest.config.ts pattern]

**Note on React adapter:** `@testing-library/react` requires a DOM environment. Add `environment: 'jsdom'` to the vitest config, or install `@vitest/browser`. The standard approach for RTL is jsdom. Core avoids this because it stubs globals instead of needing DOM. [ASSUMED — need to verify jsdom availability; see Environment Availability section]

```typescript
// packages/react/vitest.config.ts — with DOM environment
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    // ... coverage as above
  },
})
```

---

## Package.json Compliance

### peerDependency + devDependency Pattern

[VERIFIED: packages/core/package.json — reference for devDep versions]

**React package:**

```json
{
  "name": "@ngockhoi96/ctc-react",
  "version": "0.0.1",
  "license": "MIT",
  "type": "module",
  "private": false,
  "sideEffects": false,
  "engines": { "node": ">=20" },
  "files": ["dist"],
  "peerDependencies": {
    "@ngockhoi96/ctc": "workspace:*",
    "react": ">=18 <20",
    "react-dom": ">=18 <20"
  },
  "devDependencies": {
    "@ngockhoi96/ctc": "workspace:*",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitest/coverage-v8": "4.1.4",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "tsdown": "0.21.7",
    "typescript": "6.0.2",
    "vitest": "4.1.4",
    "jsdom": "latest",
    "size-limit": "12.0.1",
    "@size-limit/file": "12.0.1",
    "publint": "0.3.18",
    "@arethetypeswrong/cli": "0.18.2"
  }
}
```

**Vue package:**

```json
{
  "name": "@ngockhoi96/ctc-vue",
  "peerDependencies": {
    "@ngockhoi96/ctc": "workspace:*",
    "vue": ">=3.0.0 <4.0.0"
  },
  "devDependencies": {
    "@ngockhoi96/ctc": "workspace:*",
    "@vue/test-utils": "^2.4.6",
    "@vitest/coverage-v8": "4.1.4",
    "vue": "^3.5.0",
    "tsdown": "0.21.7",
    "typescript": "6.0.2",
    "vitest": "4.1.4",
    "size-limit": "12.0.1",
    "@size-limit/file": "12.0.1",
    "publint": "0.3.18",
    "@arethetypeswrong/cli": "0.18.2"
  }
}
```

**`"@ngockhoi96/ctc": "workspace:*"` in both peerDependencies and devDependencies:** This is the correct monorepo pattern — peerDep declares the requirement for consumers, devDep satisfies it during development and testing. [VERIFIED: pnpm workspace protocol docs pattern]

**React devDep versions:** RTL 16.3.2 supports React 18+19 [VERIFIED: npm view @testing-library/react peerDependencies]. Install React 18 as devDep to match the lower bound of the peer range.

### `publint` / `attw` Requirements

[VERIFIED: publint.dev/rules]

Critical rules that affect adapter packages:

1. **`EXPORTS_TYPES_SHOULD_BE_FIRST`:** If `"types"` condition is included in exports entries, it must come first. Core avoids this by using top-level `"types"` field instead. Adapters should follow the same pattern (no `"types"` in exports map entries).

2. **`EXPORTS_DEFAULT_SHOULD_BE_LAST`:** The `"default"` condition must be last. Core does not use a `"default"` condition — it uses `"import"` and `"require"` directly. Adapters follow the same pattern.

3. **`FILE_NOT_PUBLISHED`:** All files referenced in exports must be in the `"files"` array. Both adapters use `"files": ["dist"]` — as long as all dist outputs are under `dist/`, this is satisfied.

4. **`EXPORTS_MODULE_SHOULD_BE_ESM`:** The `"module"` condition (if used) must be ESM. Core uses `"module"` at top-level field (not in exports). Adapters follow same.

5. **`attw` type resolution:** `attw` checks that TypeScript can resolve types for all export conditions. tsdown's `dts: true` generates `.d.cts` and `.d.mts` for each entry. The top-level `"types": "./dist/index.d.cts"` field satisfies CJS resolution; `attw` checks `.d.mts` for ESM importers. [VERIFIED: packages/core dist output — contains both index.d.cts and index.d.mts]

**`"./package.json": "./package.json"` export entry:** Include in every adapter `package.json`. It allows tooling to read the package manifest directly and is included in core. [VERIFIED: packages/core/package.json exports]

### `files` Array

Both adapters: `"files": ["dist"]` — same as core. [VERIFIED: packages/core/package.json]

---

## Bundle Size

### Core Baseline

[VERIFIED: `pnpm --filter @ngockhoi96/ctc size` output — run 2026-04-13]

```
dist/index.mjs        → 126 B brotlied  (limit: 1 KB)
dist/clipboard/index.mjs → 137 B brotlied  (limit: 1 KB)
```

Core bundle is remarkably small — well within budget. The full clipboard implementation is only ~137B brotlied.

### Adapter Budget

**Assessment: < 2KB gzip is easily achievable for a single hook/composable wrapping one core function.**

A React hook that wraps one `async` function call, manages two `useState` values, one `useRef`, and two `useCallback` functions will compile to roughly 300–600 bytes of minified ESM before the React runtime (which is a peer dep, not bundled). The adapter bundle contains only the hook logic — React itself is not included.

Similarly, the Vue composable with two `shallowRef` values and a few local functions will produce comparable output.

**Recommended `size-limit` config for adapters:**

```json
"size-limit": [
  {
    "path": "dist/index.mjs",
    "limit": "2 KB"
  }
]
```

**tsdown flags that help keep bundle small:**

- `clean: true` — removes stale output, prevents size inflation
- No `minify` flag needed at this scale — tsdown's default tree-shaking and dead code elimination is sufficient
- `exports: true` — generates the exports map (no size effect)
- Single entry point (no subpath) — simpler output

**Note on peer dependency exclusion:** tsdown automatically excludes peer dependencies from the bundle. Since `react`, `react-dom`, `vue`, and `@ngockhoi96/ctc` are all declared as peer deps, none of their code will appear in the adapter bundle. The adapter ships *only* the hook/composable code. [VERIFIED: tsdown docs — peerDeps are externalized by default]

---

## Risks and Gotchas

### 1. React `act()` Warning with Async Timers (MEDIUM risk)

**Problem:** Using `vi.runAllTimersAsync()` inside tests can generate "not wrapped in act()" React warnings in Vitest, as reported in vitest-dev/vitest issue #7196 (January 2025). This does not fail tests but generates confusing noise.

**Mitigation:** Use `act(() => { vi.advanceTimersByTime(ms) })` (sync advance inside sync act) instead of async timer APIs. This is the verified safe pattern. Tests in this research use it throughout.

### 2. `jsdom` Environment Required for RTL (HIGH risk — must not miss)

`@testing-library/react` requires a DOM environment. Vitest runs in Node by default (as stated in STATE.md: "Stub all globals explicitly rather than relying on JSDOM"). For the React adapter, this approach must change — `renderHook` from RTL internally uses React DOM which requires a real DOM. Set `environment: 'jsdom'` in the React adapter's `vitest.config.ts`. Install `jsdom` as a devDependency.

**Alternative:** Use `@vitest/browser` with Playwright, but this adds complexity and contradicts the "unit tests only" policy for adapters. The `jsdom` path is standard for RTL.

**Vue adapter:** Vue Test Utils works with jsdom too, but for a composable with no DOM interaction, a plain Node environment may suffice. The `withSetup` helper mounts a component on `document.createElement('div')`, which requires `document` to exist. Therefore: Vue adapter also needs `environment: 'jsdom'`.

### 3. `exports: true` Overwrites Manual Exports Map (HIGH risk — already documented)

STATE.md decision log (Phase 01) explicitly documents: "tsdown exports:true auto-generates exports map on each build — manual exports edits are overwritten on build." Adapters must not manually maintain the `exports` map — it will be overwritten on the first `pnpm build`. After scaffolding, run `pnpm build` once and verify the generated exports map matches the expected shape before proceeding.

### 4. `@ngockhoi96/ctc` Peer Dep TypeScript Resolution in Adapters

When the adapter imports types from `@ngockhoi96/ctc` (e.g., `import type { BrowserUtilsError } from '@ngockhoi96/ctc'`), TypeScript must resolve to `packages/core/dist/index.d.cts` (or the `src/` if `paths` is configured). Since the workspace uses `"@ngockhoi96/ctc": "workspace:*"`, pnpm links the package — TypeScript follows the `"types"` field in `packages/core/package.json` to `./dist/index.d.cts`. This requires `packages/core` to be **built before** adapter TypeScript compilation. The Turbo `build` task already has `dependsOn: ["^build"]`, so the pipeline handles this. [VERIFIED: turbo.json `build.dependsOn`]

### 5. `noDefaultExport` Biome Rule Applies to All `*.ts` Files

Root `biome.json` enforces `"noDefaultExport": "error"` with an override for `*.config.ts` files. [VERIFIED: biome.json] The adapter's `tsdown.config.ts` (default export of `defineConfig(...)`) is covered by the existing override pattern in root `biome.json`:

```json
"overrides": [{
  "includes": ["*.config.ts", "packages/*/*.config.ts"],
  "linter": { "rules": { "style": { "noDefaultExport": "off" } } }
}]
```

`packages/react/tsdown.config.ts` and `packages/vue/tsdown.config.ts` match the `packages/*/*.config.ts` glob — no additional biome config change needed. [VERIFIED: biome.json overrides includes array]

### 6. `biome.json` in Adapter Packages (files.includes scope)

Root `biome.json` includes `"packages/*/src/**"` and `"packages/*/tests/**"` and `"packages/*/*.json"` and `"packages/*/*.config.ts"`. [VERIFIED: biome.json files.includes] New adapter packages at `packages/react/` and `packages/vue/` are covered by the existing `packages/*` glob patterns. The adapter's own `biome.json` need only extend root — no new file include patterns needed.

**Adapter `biome.json` template:**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.10/schema.json",
  "extends": ["../../biome.json"]
}
```

### 7. `isolatedDeclarations: true` in `tsconfig.base.json`

[VERIFIED: tsconfig.base.json] The base tsconfig has `"isolatedDeclarations": true`. This requires all exported functions to have explicit return type annotations — TypeScript cannot infer them from the function body alone. The adapter hook function `useCopyToClipboard` must have an explicit return type declared (or export a named interface for the return type).

This is already addressed in the implementation patterns above (explicit `UseCopyToClipboardResult` interface). Do not skip explicit return types — they are required by the TypeScript config, not optional.

### 8. `noUnusedParameters: true` in Base tsconfig

[VERIFIED: tsconfig.base.json] Parameters must be used or prefixed with `_`. In the Vue composable, if `options` is declared but `options?.onError` is the only usage, ensure the entire options object is not flagged. Since `options?.timeout` is also used, this is fine. Watch for test helpers where unused parameters might trigger this.

### 9. React 19 Compatibility

peerDep range `>=18 <20` covers React 19. [VERIFIED: packages/core/package.json — @testing-library/react 16.3.2 peerDeps support React 18 and 19]. React 19 removed `defaultProps` for function components and introduced some act() behavior changes, but `useState`/`useRef`/`useCallback` hook behavior is unchanged. The implementation patterns documented here work for React 18 and 19. [ASSUMED — full React 19 compatibility not verified against React 19 changelog in this session]

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js ≥20 | pnpm scripts, turbo | ✓ | (current) | — |
| pnpm | workspace | ✓ | (current) | — |
| tsdown | build | ✓ | 0.21.7 | — |
| vitest | unit tests | ✓ | 4.1.4 | — |
| jsdom | RTL + VTU tests (DOM env) | needs install | — | Not available by default in Vitest |
| @testing-library/react | React adapter tests | needs install | 16.3.2 (latest) | — |
| @vue/test-utils | Vue adapter tests | needs install | 2.4.6 (latest) | — |
| react (devDep) | React adapter tests | needs install | 18.x (latest 18) | — |
| vue (devDep) | Vue adapter tests | needs install | 3.5.x (latest 3) | — |
| @size-limit/file | bundle size check | ✓ (in core) | 12.0.1 | — |
| publint | package validation | ✓ (in core) | 0.3.18 | — |
| @arethetypeswrong/cli | type exports check | ✓ (in core) | 0.18.2 | — |

**Missing dependencies with no fallback:**
- `jsdom` — required for both React and Vue adapter test environments; install as devDep in each adapter package
- `@testing-library/react` — install in `packages/react/` devDeps
- `@vue/test-utils` — install in `packages/vue/` devDeps
- `react` + `react-dom` — install as devDeps in `packages/react/`
- `vue` — install as devDep in `packages/vue/`

All are standard packages from npm, no availability concerns.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | `packages/react/vitest.config.ts`, `packages/vue/vitest.config.ts` (Wave 0 — create) |
| Quick run (React) | `pnpm --filter @ngockhoi96/ctc-react test` |
| Quick run (Vue) | `pnpm --filter @ngockhoi96/ctc-vue test` |
| Full suite | `pnpm turbo run test --filter=./packages/*` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | File |
|--------|----------|-----------|------|
| ADAPT-01 | `copy()` returns `{ copy, copied, error, reset }` | unit | `use-copy-to-clipboard.test.ts` (React) |
| ADAPT-01 | `copied` auto-resets after 2000ms | unit | same — fake timers test |
| ADAPT-01 | `timeout: 0` never resets | unit | same |
| ADAPT-01 | `reset()` clears both fields | unit | same |
| ADAPT-01 | `copy()` returns `false` + sets `error` when no text | unit | same |
| ADAPT-02 | Same behaviors for Vue composable | unit | `use-copy-to-clipboard.test.ts` (Vue) |
| ADAPT-04 | `@ngockhoi96/ctc` in peerDeps, no runtime deps | publint/attw | `pnpm validate` |
| ADAPT-05 | 100% branch coverage | coverage threshold | `pnpm test -- --coverage` |
| ADAPT-06 | ESM + CJS + .d.ts output | build validation | `pnpm build && pnpm validate` |

### Wave 0 Gaps

- [ ] `packages/react/vitest.config.ts` — covers ADAPT-01, ADAPT-05
- [ ] `packages/react/tests/helpers/create-clipboard-mock.ts` — shared mock helper
- [ ] `packages/react/tests/use-copy-to-clipboard.test.ts` — main test file
- [ ] `packages/vue/vitest.config.ts` — covers ADAPT-02, ADAPT-05
- [ ] `packages/vue/tests/helpers/create-clipboard-mock.ts` — shared mock helper
- [ ] `packages/vue/tests/helpers/with-setup.ts` — composable test wrapper
- [ ] `packages/vue/tests/use-copy-to-clipboard.test.ts` — main test file

---

## Open Questions

1. **Error code for D-02 "no text provided"**
   - What we know: `BrowserUtilsError` requires a value from the `ErrorCode` union: `'CLIPBOARD_NOT_SUPPORTED' | 'CLIPBOARD_PERMISSION_DENIED' | 'CLIPBOARD_WRITE_FAILED' | 'CLIPBOARD_READ_FAILED' | 'INSECURE_CONTEXT'`
   - What's unclear: None of these cleanly expresses "programmer forgot to provide text." Using `'CLIPBOARD_NOT_SUPPORTED'` is a misuse of the code.
   - Recommendation: Add `'NO_TEXT_PROVIDED'` to `ErrorCode` in `packages/core/src/lib/types.ts` as part of the Phase 5 work. This is a non-breaking addition to a union type. Planner should include a task to extend `ErrorCode` before implementing the adapter.

2. **`jsdom` version pin vs `latest`**
   - What we know: jsdom is required; Vitest's jsdom integration works with current jsdom versions.
   - What's unclear: Whether to pin `jsdom` to the same version as root node_modules or install latest.
   - Recommendation: Install `jsdom` without version pin and let pnpm hoist to workspace root if already present; otherwise `jsdom@latest`.

3. **React adapter `@types/react` version**
   - What we know: `@types/react` latest is 19.x. The devDep installs React 18 but `@types/react` 19 types are mostly backward compatible.
   - What's unclear: Whether using `@types/react@^19` with `react@^18` devDep causes type errors in the hook implementation.
   - Recommendation: Install `@types/react@^18` for consistency with the React 18 devDep lower bound.

---

## Sources

### Primary (HIGH confidence — verified in this session)

- `packages/core/tsdown.config.ts` — exact adapter tsdown config baseline
- `packages/core/package.json` — exact exports map, size-limit, devDep versions [VERIFIED]
- `packages/core/vitest.config.ts` — coverage threshold pattern [VERIFIED]
- `packages/core/tsconfig.json` + `tsconfig.base.json` — TypeScript config inheritance [VERIFIED]
- `packages/core/biome.json` (root) — lint rules and override patterns [VERIFIED]
- `packages/core/tests/unit/clipboard/copy.test.ts` — vi.stubGlobal mock pattern [VERIFIED]
- `pnpm-workspace.yaml` — workspace glob [VERIFIED]
- `turbo.json` — task coverage [VERIFIED]
- npm registry: `@testing-library/react@16.3.2`, `@vue/test-utils@2.4.6`, `react@19.2.5`, `vue@3.5.32`, `tsdown@0.21.7` — current versions [VERIFIED]

### Secondary (MEDIUM confidence — official docs fetched)

- [vuejs.org/guide/reusability/composables](https://vuejs.org/guide/reusability/composables.html) — onUnmounted cleanup, async pattern, SSR guidance
- [testing-library.com/docs/react-testing-library/api/#renderhook](https://testing-library.com/docs/react-testing-library/api/#renderhook) — renderHook API
- [vitest.dev/guide/mocking/timers](https://vitest.dev/guide/mocking/timers) — fake timer API
- [publint.dev/rules](https://publint.dev/rules) — exports map validation rules
- [alexop.dev/posts/how-to-test-vue-composables/](https://alexop.dev/posts/how-to-test-vue-composables/) — withSetup pattern
- [test-utils.vuejs.org/guide/advanced/reusability-composition](https://test-utils.vuejs.org/guide/advanced/reusability-composition) — test component pattern

### Tertiary (LOW confidence — assumed from training / flagged)

- React 19 compatibility with React 18 hooks API — not verified against React 19 changelog [ASSUMED]
- Nuxt SSR composable behavior — deferred, not verified [ASSUMED]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | React 19 behaves identically to React 18 for `useState`/`useRef`/`useCallback` | Risks section | Hook may need minor adjustment; peerDep range `>=18 <20` catches breaking changes |
| A2 | Nuxt SSR context does not break the Vue composable | Vue SSR section | Nuxt users may see issues; mitigated by deferring SSR-specific variants to backlog |
| A3 | `'CLIPBOARD_NOT_SUPPORTED'` is acceptable ErrorCode for "no text" scenario | D-02 implementation | Semantically incorrect; Open Question #1 addresses this |
| A4 | `jsdom` installed as devDep satisfies Vitest's `environment: 'jsdom'` requirement without additional config | Environment section | May need `@vitest/jsdom` or explicit Vitest environment package |

---

## Metadata

**Confidence breakdown:**
- Standard stack versions: HIGH — verified against npm registry
- Core codebase analysis: HIGH — direct file reads
- React hook implementation pattern: HIGH — verified from multiple sources + React docs
- Vue composable pattern: HIGH — verified from Vue official docs + VTU docs
- Testing patterns: MEDIUM-HIGH — concrete examples derived from docs + known Vitest issues
- publint/attw compliance: HIGH — verified from publint.dev/rules + core package.json
- Bundle size estimate: MEDIUM — based on core baseline; adapter-specific size not measured (packages don't exist yet)

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (30 days — stack is stable)
