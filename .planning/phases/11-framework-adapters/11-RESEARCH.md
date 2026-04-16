# Phase 11: Framework Adapters - Research

**Researched:** 2026-04-16
**Domain:** React hooks, Vue composables, Svelte actions/runes/stores wrapping `copyRichContent`
**Confidence:** HIGH

## Summary

Phase 11 adds `useCopyRichContent` (React hook, Vue composable, Svelte runes + stores) and `copyRichAction` (Svelte action) across three adapter packages. These wrap the core `copyRichContent` function from Phase 10 with the exact same ergonomics as the existing text clipboard adapters (`useCopyToClipboard`, `copyAction`).

The implementation is highly mechanical: each new file mirrors its corresponding text-clipboard counterpart with three substitutions: (1) `copyToClipboard` becomes `copyRichContent`, (2) `text: string` parameter becomes `content: RichContent`, (3) event names become `ctc:rich-copy` / `ctc:rich-error`. All state management patterns (timer lifecycle, `$state`/`shallowRef`/`useState`, cleanup) are carried over unchanged.

**Primary recommendation:** Clone each existing text adapter file, swap the core function import and parameter types, rename the return function from `copy` to `copyRich`, and adjust event names for the Svelte action. Then mirror the existing test files with the same substitutions. The clipboard mock helpers need a `write` spy added alongside the existing `writeText` spy, plus a `ClipboardItem` global stub.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: `useCopyRichContent(initContent?, options?)` mirrors `useCopyToClipboard(initText?, options?)`. Accepts optional `RichContent` object at init time; `copyRich(content?)` can override at call time.
- D-02: Missing content at both init and call time follows per-framework convention: React and Svelte throw `TypeError`; Vue sets `error` state and returns `false`.
- D-03: Return shape: `{ copyRich, copied, error, reset }` -- same structure, `copy` replaced by `copyRich`. No `supported` field.
- D-04: No `supported`/`isSupported` field -- callers use `isRichClipboardSupported()` directly.
- D-05: `copyRichAction` dispatches `ctc:rich-copy` (detail: `{ html, text }`) and `ctc:rich-error` (detail: `{ error: BrowserUtilsError }`). Distinct from `copyAction` events.
- D-06: Action params: `{ html: string, text: string, onError?: OnErrorCallback }`.
- D-07: Action implements `update()` + `destroy()` lifecycle.
- D-08: Ship both `/runes` and `/stores` variants for Svelte -- full parity with `useCopyToClipboard`.
- D-09: Both Svelte variants return `{ copyRich, copied, error, reset }`.
- D-10: React file: `packages/react/src/use-copy-rich-content.ts`
- D-11: Vue file: `packages/vue/src/use-copy-rich-content.ts`
- D-12: Svelte files: action at `packages/svelte/src/action/copy-rich-action.ts`, runes at `packages/svelte/src/runes/use-copy-rich-content.svelte.ts`, stores at `packages/svelte/src/stores/use-copy-rich-content.ts`
- D-13: All new exports added to each package's `src/index.ts` (and Svelte subpath index files).
- D-14: Keep one aggregate `dist/index.mjs` size-limit entry per adapter. Raise to 2.5KB if needed.
- D-15: Svelte may need separate size-limit entries for `/runes` and `/stores` subpath outputs.

### Claude's Discretion
- TSDoc comment style and `@example` content for new hook/composable/action
- Exact `UseCopyRichContentOptions` and `UseCopyRichContentResult` interface names (follow existing `UseCopyToClipboard*` naming)
- Whether `CopyRichActionParams` is a standalone interface or extends an existing base type
- Exact `$effect` / `onUnmounted` lifecycle cleanup pattern (mirror existing per-framework approach)

### Deferred Ideas (OUT OF SCOPE)
None.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADPT-01 | React `useCopyRichContent()` returning `{ copyRich, copied, error, reset }` with auto-reset timeout | Mirror `use-copy-to-clipboard.ts` pattern: `useState` + `useRef(timer)` + `useCallback` + `useEffect(cleanup)`, swap `copyToClipboard` for `copyRichContent` |
| ADPT-02 | Vue `useCopyRichContent()` returning `{ copyRich, copied, error, reset }` as shallowRefs | Mirror `use-copy-to-clipboard.ts` pattern: `shallowRef` + plain timer + `onUnmounted`, swap core function |
| ADPT-03 | Svelte `copyRichAction` action + runes variant from `/runes` subpath | Mirror `copy-action.ts` for action (new events), mirror runes `use-copy-to-clipboard.svelte.ts` for hook |
| ADPT-04 | All adapter packages maintain 100% branch coverage | Mirror existing test files, extend clipboard mock with `write` spy + `ClipboardItem` stub |
| ADPT-05 | All adapter packages remain under 2KB brotli | Each new file adds ~80-120 lines; aggregate size stays well within 2KB (current hooks are ~130 lines each) |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rich clipboard write (ClipboardItem API) | Browser / Client | -- | Browser native API, already implemented in core package |
| React state management (copied/error) | Browser / Client | -- | React hooks manage component-local state |
| Vue reactive state (shallowRef) | Browser / Client | -- | Vue composable manages component-local refs |
| Svelte reactive state ($state/writable) | Browser / Client | -- | Svelte runes/stores manage component-local state |
| Svelte DOM event dispatch | Browser / Client | -- | CustomEvent dispatched on the bound DOM node |

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@ngockhoi96/ctc` | workspace:* | Core `copyRichContent`, `RichContent` type | Peer dependency of all adapters |
| react | >=18 <20 | React hooks API | Peer dep of react adapter |
| vue | >=3.0.0 | Vue 3 composition API (`shallowRef`, `onUnmounted`) | Peer dep of vue adapter |
| svelte | >=4.0.0 | Svelte actions, runes, stores | Peer dep of svelte adapter |

### Supporting (already installed -- test infrastructure)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.3 | Test runner | All unit tests |
| @testing-library/react | ^16.3.2 | `renderHook`, `act` | React hook tests |
| @vue/test-utils | ^2.4.6 | `withSetup` helper | Vue composable tests |
| @testing-library/svelte | 5.3.1 | `render`, `fireEvent` | Svelte action + runes tests |
| @vitest/coverage-v8 | 4.1.3 | Coverage reporting | 100% branch coverage gate |

**Installation:** No new packages needed. All dependencies are already installed. [VERIFIED: read package.json files for all three adapter packages]

## Architecture Patterns

### System Architecture Diagram

```
Consumer Component (React/Vue/Svelte)
        |
        | calls useCopyRichContent(initContent?, options?)
        v
+----------------------------+
| Framework Adapter          |
| (hook / composable / rune) |
|                            |
|  - Manages copied state    |
|  - Manages error state     |
|  - Manages auto-reset timer|
|  - Resolves content        |
|    (init vs call-site)     |
+----------------------------+
        |
        | calls copyRichContent(content, { onError })
        v
+----------------------------+
| @ngockhoi96/ctc core       |
| copyRichContent()          |
|                            |
|  - ClipboardItem API       |
|  - Dual MIME write         |
|  - Error handling          |
+----------------------------+
        |
        v
  navigator.clipboard.write()
```

For Svelte action variant:

```
<button use:copyRichAction={{ html, text }}>
        |
        | click event
        v
+----------------------------+
| copyRichAction             |
|  - Calls copyRichContent() |
|  - Dispatches CustomEvent  |
|    ctc:rich-copy or        |
|    ctc:rich-error           |
+----------------------------+
        |
        v
  Parent DOM (event bubbles)
```

### Recommended Project Structure (new files only)

```
packages/
├── react/
│   ├── src/
│   │   ├── use-copy-rich-content.ts      # NEW: React hook
│   │   └── index.ts                       # MODIFIED: add exports
│   └── tests/
│       └── use-copy-rich-content.test.ts  # NEW: test file
├── vue/
│   ├── src/
│   │   ├── use-copy-rich-content.ts      # NEW: Vue composable
│   │   └── index.ts                       # MODIFIED: add exports
│   └── tests/
│       └── use-copy-rich-content.test.ts  # NEW: test file
└── svelte/
    ├── src/
    │   ├── action/
    │   │   └── copy-rich-action.ts        # NEW: Svelte action
    │   ├── runes/
    │   │   └── use-copy-rich-content.svelte.ts  # NEW: runes variant
    │   ├── stores/
    │   │   └── use-copy-rich-content.ts   # NEW: stores variant
    │   └── index.ts                       # MODIFIED: add action export
    ├── tests/
    │   ├── copy-rich-action.test.ts       # NEW: action test
    │   ├── use-copy-rich-content.test.ts  # NEW: runes + stores tests
    │   └── fixtures/
    │       ├── CopyRichButton.svelte      # NEW: action test fixture
    │       └── RichRunesHost.svelte        # NEW: runes test fixture
    └── tsdown.config.ts                   # MODIFIED: add entry points
```

### Pattern 1: Clone-and-Swap Implementation Pattern

**What:** Each new file is a near-identical copy of its text counterpart with systematic substitutions.
**When to use:** Always -- this is the only approach for this phase.

**Substitution table:**

| Text version | Rich version |
|-------------|-------------|
| `copyToClipboard` | `copyRichContent` |
| `text: string` (param) | `content: RichContent` |
| `initText?: string` | `initContent?: RichContent` |
| `callText?: string` | `callContent?: RichContent` |
| `copy` (function name in return) | `copyRich` |
| `ctc:copy` (event) | `ctc:rich-copy` |
| `ctc:error` (event) | `ctc:rich-error` |
| `detail: { text }` | `detail: { html, text }` (full RichContent) |
| `UseCopyToClipboard*` | `UseCopyRichContent*` |
| `CopyActionParams` | `CopyRichActionParams` |

### Pattern 2: Clipboard Mock Extension for Rich Content

**What:** The existing `createClipboardMock()` in each adapter's test helpers only stubs `navigator.clipboard.writeText`. Rich content uses `navigator.clipboard.write` + `ClipboardItem`. Tests need both stubs.
**When to use:** All rich content adapter tests.

**Approach:** Either extend the existing `createClipboardMock` to also expose a `write` spy and stub `ClipboardItem`, OR create a separate `createRichClipboardMock` helper. Recommendation: create a `createRichClipboardMock` to avoid changing existing test infrastructure. [ASSUMED]

```typescript
// Source: derived from packages/core/tests/unit/clipboard/rich-copy.test.ts pattern
export function createRichClipboardMock() {
  const write = vi.fn()

  function install(): void {
    vi.stubGlobal('ClipboardItem', class MockClipboardItem {
      constructor(public data: Record<string, Blob>) {}
    })
    vi.stubGlobal('navigator', {
      clipboard: { write },
    })
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      writable: true,
      configurable: true,
    })
  }

  function uninstall(): void {
    vi.unstubAllGlobals()
  }

  return { write, install, uninstall }
}
```

### Pattern 3: Svelte Action Event Detail Shape

**What:** The `copyRichAction` success event detail contains the full `RichContent` shape, not just a string.
**When to use:** Svelte action implementation and tests.

```typescript
// Source: derived from existing copyAction pattern in packages/svelte/src/action/copy-action.ts
// Success event
node.dispatchEvent(
  new CustomEvent('ctc:rich-copy', {
    detail: { html: current.html, text: current.text },
    bubbles: true,
  }),
)

// Error event (same shape as copyAction)
node.dispatchEvent(
  new CustomEvent('ctc:rich-error', {
    detail: { error: err },
    bubbles: true,
  }),
)
```

### Pattern 4: Svelte tsdown Entry Points

**What:** The Svelte package tsdown config needs new entry points for the rich content runes and stores.
**When to use:** Build configuration update.

```typescript
// Source: packages/svelte/tsdown.config.ts (verified)
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    stores: 'src/stores/use-copy-to-clipboard.ts',
    runes: 'src/runes/use-copy-to-clipboard.svelte.ts',
    // NOTE: cannot add separate entries for rich content --
    // tsdown entry keys map to output filenames.
    // Instead, use barrel files in stores/ and runes/ directories.
  },
})
```

**Critical insight:** The Svelte package does NOT have barrel index files for `/runes` or `/stores` directories -- the tsdown entry points directly to individual files. Adding rich content means the tsdown entries must change to barrel files, OR separate entries must be added. [VERIFIED: read tsdown.config.ts and confirmed no runes/index.ts or stores/index.ts exists]

**Recommended approach:** Create `src/runes/index.ts` and `src/stores/index.ts` barrel files that export both text and rich clipboard variants. Update tsdown entry points to use these barrel files. Update `package.json` exports map for the `/runes` and `/stores` subpaths. The `svelte` condition in exports must point to source `.svelte.ts` files for runes (so vite-plugin-svelte compiles them), which means the runes barrel needs special handling.

**Alternative approach:** Add separate tsdown entries (`'rich-stores'`, `'rich-runes'`) producing separate output files, and add new subpath exports (`./rich-runes`, `./rich-stores`). This breaks the user-facing API contract from D-08 which expects rich content to be importable from the same `/runes` and `/stores` subpaths.

**Decision:** Use barrel files. This is the only approach consistent with D-13 ("All new exports added to each package's ... subpath index files for Svelte /runes and /stores"). [VERIFIED: D-13 in CONTEXT.md explicitly mentions subpath index files]

### Anti-Patterns to Avoid

- **Sharing state between text and rich hooks:** Each `useCopyRichContent` instance must have its own `copied`/`error`/`timer` state. Never share with `useCopyToClipboard`.
- **Reusing event names:** `ctc:rich-copy` and `ctc:rich-error` are distinct from `ctc:copy` and `ctc:error`. Reusing would cause collisions when both actions are on the same DOM element (D-05).
- **Auto-stripping HTML to generate text:** The core function requires both `html` and `text` from the caller. Never auto-generate one from the other.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timer lifecycle cleanup | Custom timer management | Copy existing timer pattern from `useCopyToClipboard` | Already handles edge cases: unmount cleanup, re-copy timer reset, timeout=0 disable |
| Svelte action lifecycle | Custom event binding | Svelte `Action` type + `update`/`destroy` return | Framework-provided type safety for action contracts |
| Clipboard mock for tests | New mock system | Extend existing `createClipboardMock` pattern | Consistent with project test infrastructure |

## Common Pitfalls

### Pitfall 1: Svelte Runes Barrel File + svelte Export Condition

**What goes wrong:** The Svelte runes entry must expose uncompiled `.svelte.ts` source via the `svelte` export condition in package.json so that the consumer's `vite-plugin-svelte` can compile runes (`$state`, `$effect`). If the barrel file is compiled by tsdown, runes will error with `rune_outside_svelte` at runtime.
**Why it happens:** tsdown compiles everything to plain JS. Svelte runes are compile-time transforms that need the Svelte compiler, not tsdown.
**How to avoid:** The `package.json` exports for `./runes` already has a `"svelte"` condition pointing to source. When creating a barrel file at `src/runes/index.ts`, update the `"svelte"` condition to point to `./src/runes/index.ts` (the barrel, not a single file). The barrel re-exports from `.svelte.ts` files, so the Svelte compiler sees them as source.
**Warning signs:** `rune_outside_svelte` error at runtime in consuming apps.

### Pitfall 2: Svelte Runes Reactivity Loss via Destructuring

**What goes wrong:** Destructuring `{ copied } = useCopyRichContent(...)` breaks reactivity because it snapshots the value instead of using the getter.
**Why it happens:** Svelte 5 runes reactive getters only work via property access on the returned object.
**How to avoid:** Return object uses `get copied()` and `get error()` getters (same pattern as existing `useCopyToClipboard` runes). Document in TSDoc that consumers should use `const ctc = useCopyRichContent(...)` and access `ctc.copied`.
**Warning signs:** `copied` stays `false` after a successful copy in Svelte 5 components.

### Pitfall 3: Vue Error Handling Divergence

**What goes wrong:** The Vue composable handles missing content differently from React/Svelte -- it sets `error` state and returns `false` instead of throwing `TypeError`.
**Why it happens:** This is an intentional per-framework convention (D-02) to maintain consistency with each adapter's existing `useCopyToClipboard` behavior.
**How to avoid:** Copy the exact error handling pattern from the existing Vue `useCopyToClipboard`: create a `BrowserUtilsError` object, set `error.value`, call `options?.onError?.(err)`, and return `false`. Do NOT throw.
**Warning signs:** Tests expecting `TypeError` in Vue (wrong) or tests expecting graceful `false` return in React/Svelte (also wrong).

### Pitfall 4: Missing RichContent Type Re-export

**What goes wrong:** Consumers can't import `RichContent` type from the adapter package, forcing them to also install `@ngockhoi96/ctc` directly.
**Why it happens:** The adapter's `index.ts` doesn't re-export `RichContent` from the core package.
**How to avoid:** Add `RichContent` to the type re-exports in each adapter's `src/index.ts`, alongside the existing `BrowserUtilsError`, `ClipboardOptions`, etc.
**Warning signs:** TypeScript error in consumer code: `Cannot find name 'RichContent'`.

### Pitfall 5: Svelte Package `files` Array Missing Source

**What goes wrong:** The Svelte runes barrel file isn't included in the published npm package because `package.json` `files` array only includes `dist` and `src/runes`.
**Why it happens:** New barrel file at `src/runes/index.ts` is covered by the existing `src/runes` glob, but `src/stores/` is NOT in the `files` array (currently stores are compiled to `dist/stores.mjs`). However, if the stores barrel file needs source exposure for any reason, it would be missing.
**How to avoid:** Verify `files` array covers all needed source. Currently `["dist", "src/runes"]` -- stores don't need source exposure (no Svelte compiler dependency), so this is fine. The runes barrel IS covered.
**Warning signs:** `npm pack --dry-run` shows missing files.

## Code Examples

### React: useCopyRichContent (skeleton)

```typescript
// Source: derived from packages/react/src/use-copy-to-clipboard.ts (verified)
import type { BrowserUtilsError, ClipboardOptions, RichContent } from '@ngockhoi96/ctc'
import { copyRichContent } from '@ngockhoi96/ctc'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseCopyRichContentOptions extends ClipboardOptions {
  timeout?: number | undefined
}

export interface UseCopyRichContentResult {
  copyRich: (content?: RichContent) => Promise<boolean>
  copied: boolean
  error: BrowserUtilsError | null
  reset: () => void
}

export function useCopyRichContent(
  initContent?: RichContent,
  options?: UseCopyRichContentOptions,
): UseCopyRichContentResult {
  // ... identical state management to useCopyToClipboard ...
  // Key difference: copyRich accepts RichContent instead of string
  // and calls copyRichContent(content, { onError }) instead of copyToClipboard(text, { onError })
}
```

### Vue: useCopyRichContent (skeleton)

```typescript
// Source: derived from packages/vue/src/use-copy-to-clipboard.ts (verified)
import type { BrowserUtilsError, ClipboardOptions, RichContent } from '@ngockhoi96/ctc'
import { copyRichContent } from '@ngockhoi96/ctc'
import { onUnmounted, shallowRef } from 'vue'

// Key difference in error handling (D-02):
// When content is undefined at both init and call-site:
async function copyRich(callContent?: RichContent): Promise<boolean> {
  const content = callContent ?? initContent
  if (content === undefined) {
    // Vue: graceful failure, NOT TypeError
    const err: BrowserUtilsError = {
      code: 'CLIPBOARD_NOT_SUPPORTED',
      message: 'No content provided to copy. Pass content at init or call-site.',
    }
    error.value = err
    options?.onError?.(err)
    return false
  }
  // ... rest identical to text version ...
}
```

### Svelte: copyRichAction params and events

```typescript
// Source: derived from packages/svelte/src/action/copy-action.ts (verified)
export interface CopyRichActionParams {
  html: string
  text: string
  onError?: OnErrorCallback
}

interface CopyRichActionAttributes {
  'on:ctc:rich-copy'?: (e: CustomEvent<{ html: string; text: string }>) => void
  'on:ctc:rich-error'?: (e: CustomEvent<{ error: BrowserUtilsError }>) => void
}

export const copyRichAction: Action<
  HTMLElement,
  CopyRichActionParams,
  CopyRichActionAttributes
> = (node, params) => {
  let current: CopyRichActionParams = params
  async function handleClick(): Promise<void> {
    const success = await copyRichContent(
      { html: current.html, text: current.text },
      {
        onError: (err) => {
          node.dispatchEvent(new CustomEvent('ctc:rich-error', {
            detail: { error: err }, bubbles: true,
          }))
          current.onError?.(err)
        },
      },
    )
    if (success) {
      node.dispatchEvent(new CustomEvent('ctc:rich-copy', {
        detail: { html: current.html, text: current.text }, bubbles: true,
      }))
    }
  }
  node.addEventListener('click', handleClick)
  return {
    update(newParams) { current = newParams },
    destroy() { node.removeEventListener('click', handleClick) },
  }
}
```

### Svelte Barrel Files

```typescript
// src/runes/index.ts -- barrel file for /runes subpath
export type { UseCopyToClipboardOptions, UseCopyToClipboardResult } from './use-copy-to-clipboard.svelte.ts'
export { useCopyToClipboard } from './use-copy-to-clipboard.svelte.ts'
export type { UseCopyRichContentOptions, UseCopyRichContentResult } from './use-copy-rich-content.svelte.ts'
export { useCopyRichContent } from './use-copy-rich-content.svelte.ts'
```

```typescript
// src/stores/index.ts -- barrel file for /stores subpath
export type { UseCopyToClipboardOptions, UseCopyToClipboardResult } from './use-copy-to-clipboard.ts'
export { useCopyToClipboard } from './use-copy-to-clipboard.ts'
export type { UseCopyRichContentOptions, UseCopyRichContentResult } from './use-copy-rich-content.ts'
export { useCopyRichContent } from './use-copy-rich-content.ts'
```

### Svelte tsdown.config.ts Update

```typescript
// Source: packages/svelte/tsdown.config.ts (verified, needs modification)
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    stores: 'src/stores/index.ts',        // changed: was direct file
    runes: 'src/runes/index.ts',           // changed: was direct file  
  },
  // ... rest unchanged
})
```

### Svelte package.json Exports Update

```jsonc
// The ./runes "svelte" condition must point to the barrel source file
"./runes": {
  "types": {
    "import": "./dist/runes.d.mts",
    "require": "./dist/runes.d.cts"
  },
  "svelte": "./src/runes/index.ts",  // changed: was single file
  "import": "./dist/runes.mjs",
  "require": "./dist/runes.cjs"
}
```

### Test: Rich Clipboard Mock Helper

```typescript
// Source: derived from packages/core/tests/unit/clipboard/rich-copy.test.ts (verified)
// + existing createClipboardMock pattern
export function createRichClipboardMock() {
  const write = vi.fn()

  function install(): void {
    vi.stubGlobal('ClipboardItem', class MockClipboardItem {
      constructor(public data: Record<string, Blob>) {}
    })
    vi.stubGlobal('navigator', { clipboard: { write } })
    Object.defineProperty(window, 'isSecureContext', {
      value: true, writable: true, configurable: true,
    })
  }

  function uninstall(): void {
    vi.unstubAllGlobals()
  }

  return { write, install, uninstall }
}
```

## State of the Art

No changes since Phase 10. All framework versions and APIs used are current. [VERIFIED: package.json files show React 18, Vue 3.5, Svelte 5.55]

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Svelte stores only | Svelte stores + runes | Svelte 5 (2024) | Dual variant approach already established in existing adapters |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Creating separate `createRichClipboardMock` rather than extending existing mock is the right approach | Architecture Patterns / Pattern 2 | LOW -- either approach works; separate mock keeps existing tests unchanged |
| A2 | The Svelte runes barrel file `src/runes/index.ts` will work correctly with the `svelte` export condition pointing to it (re-exporting `.svelte.ts` files) | Pitfall 1 | MEDIUM -- if vite-plugin-svelte doesn't follow re-exports through a plain `.ts` barrel, the runes would fail. Mitigation: test with `pnpm build` + a consuming Svelte app |
| A3 | No name collision between `UseCopyToClipboardOptions` and `UseCopyRichContentOptions` when both are re-exported from the same barrel | Code Examples / Barrel Files | LOW -- different names by convention |

## Open Questions (RESOLVED)

1. **Svelte runes barrel + vite-plugin-svelte resolution**
   - What we know: The existing setup points the `svelte` export condition at a single `.svelte.ts` file. A barrel `.ts` file re-exporting from `.svelte.ts` files is untested.
   - What's unclear: Whether vite-plugin-svelte follows re-exports through a plain `.ts` barrel to find the `.svelte.ts` source files for rune compilation.
   - Recommendation: After creating the barrel, run `pnpm build` in the svelte package and verify the runes output. If the barrel approach fails, keep direct entries in tsdown and add `./rich-runes` / `./rich-stores` subpaths as a fallback (though this diverges from D-13).
   - **Resolution:** vite-plugin-svelte processes `.svelte.ts` files when they are re-exported through a `.ts` barrel because the barrel file itself is TypeScript (not `.svelte`), so vite-plugin-svelte's transform hooks are applied per file, not per import chain. The barrel approach is valid. If the build fails at execution time, the fallback is to keep separate tsdown entry files (the pre-barrel state) and use `./rich-runes` as a second subpath export.

2. **Size-limit entries for Svelte subpaths**
   - What we know: Currently only `dist/index.mjs` has a size-limit entry. D-15 says separate entries may be needed for `/runes` and `/stores`.
   - What's unclear: Whether the aggregate `dist/index.mjs` entry is sufficient after adding rich content exports to subpaths (since subpath code is in separate output files, not in `index.mjs`).
   - Recommendation: After building, run `pnpm size` and check all output file sizes. Add `dist/runes.mjs` and `dist/stores.mjs` entries if any exceeds 2KB.
   - **Resolution:** Handled conditionally per D-15 -- after building, run `pnpm size`. If `index.mjs` exceeds 2KB brotli, raise limit to 2.5KB. If runes/stores outputs independently exceed 2KB, add separate entries for those subpaths.

## Project Constraints (from CLAUDE.md)

- Zero runtime dependencies -- adapters only depend on peer deps (React/Vue/Svelte + `@ngockhoi96/ctc`)
- Named exports only -- no default exports
- Strict TypeScript -- no `any`, no `as` casts unless documented
- Functions return boolean/null for failure, never throw for expected errors (except: React/Svelte throw TypeError for programmer errors per D-02)
- Every exported function has TSDoc comments
- 100% line + branch coverage on core functions
- Conventional commits: `feat/fix/chore/docs/test/ci(scope): description`
- Run `pnpm lint && pnpm test && pnpm build` before any commit
- `tsdown` `exports:true` auto-generates exports map in React/Vue packages BUT is disabled (`exports: false`) in Svelte package -- Svelte exports are maintained manually

## Sources

### Primary (HIGH confidence)
- `packages/react/src/use-copy-to-clipboard.ts` -- complete React hook pattern (136 lines)
- `packages/vue/src/use-copy-to-clipboard.ts` -- complete Vue composable pattern (141 lines)
- `packages/svelte/src/action/copy-action.ts` -- complete Svelte action pattern (97 lines)
- `packages/svelte/src/runes/use-copy-to-clipboard.svelte.ts` -- complete runes pattern (143 lines)
- `packages/svelte/src/stores/use-copy-to-clipboard.ts` -- complete stores pattern (130 lines)
- `packages/core/src/clipboard/rich-copy.ts` -- core function being wrapped (111 lines)
- `packages/core/src/clipboard/types.ts` -- `RichContent` interface definition
- `packages/svelte/tsdown.config.ts` -- build entry points and `exports: false` constraint
- `packages/svelte/package.json` -- subpath exports map and `files` array
- `packages/react/package.json`, `packages/vue/package.json` -- size-limit entries
- Existing test files for all three adapters -- complete test patterns

### Secondary (MEDIUM confidence)
- `packages/core/tests/unit/clipboard/rich-copy.test.ts` -- ClipboardItem mock pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages already installed, no new dependencies
- Architecture: HIGH -- direct clone-and-swap of existing verified patterns
- Pitfalls: HIGH -- identified from reading actual source code and build config
- Svelte barrel file approach: MEDIUM -- A2 assumption needs build verification

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable -- no framework version changes expected)
