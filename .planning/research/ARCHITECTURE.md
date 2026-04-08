# Architecture Research

**Domain:** Browser utilities library (clipboard-focused, tree-shakeable, framework-agnostic)
**Researched:** 2026-04-08
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Public API Layer                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ src/clipboard/    │  │ src/storage/     │  │ src/media/   │  │
│  │ (Phase 1)        │  │ (Future)         │  │ (Future)     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │          │
├───────────┴─────────────────────┴────────────────────┴──────────┤
│                     Internal Utils Layer                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ src/utils/                                                │   │
│  │   env.ts — SSR guards, secure context detection           │   │
│  │   errors.ts — typed error creation, onError dispatch      │   │
│  │   types.ts — shared type definitions                      │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     Browser APIs (Runtime)                       │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐               │
│  │Clipboard │  │ Permissions  │  │  DOM/Window  │               │
│  │   API    │  │     API      │  │   globals    │               │
│  └──────────┘  └──────────────┘  └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `src/clipboard/` | All clipboard operations (copy, read, detect) | Individual function files + barrel index.ts |
| `src/utils/env.ts` | Environment detection (SSR, secure context, API availability) | Pure functions returning boolean |
| `src/utils/errors.ts` | Error code constants, error factory, onError callback dispatch | Typed error objects, helper to invoke callbacks |
| `src/utils/types.ts` | Shared interfaces/types across all modules | TypeScript type-only file (zero runtime) |
| `src/index.ts` | Root barrel export — re-exports from all modules | Re-export only, no logic |

## Recommended Project Structure

```
src/
├── clipboard/
│   ├── copy.ts               # copyToClipboard(), copyRichContent()
│   ├── read.ts               # readFromClipboard(), readRichContent()
│   ├── detect.ts             # isClipboardSupported(), isClipboardReadSupported()
│   ├── fallback.ts           # execCommand-based fallback (explicit, separate)
│   ├── types.ts              # ClipboardOptions, ClipboardItemData
│   └── index.ts              # barrel: re-exports public API from this module
├── utils/
│   ├── env.ts                # isBrowser(), isSecureContext()
│   ├── errors.ts             # BrowserUtilsError, createError(), handleError()
│   └── types.ts              # shared types (ErrorCode, OnErrorCallback)
└── index.ts                  # root barrel: re-exports from clipboard/
```

### Structure Rationale

- **`clipboard/` as a self-contained module:** Each domain (clipboard, future storage, future media) gets its own directory. This maps directly to subpath exports (`@browser-utils/core/clipboard`) and enables consumers to import only what they need.
- **One function per file:** `copy.ts`, `read.ts`, `detect.ts` each contain one concern. This is the strongest tree-shaking guarantee because bundlers can eliminate entire files. Barrel files only re-export, never contain logic.
- **`fallback.ts` is separate from `copy.ts`:** The execCommand fallback is an explicit opt-in, not mixed into the modern API. Consumers who only target HTTPS never pay for fallback code.
- **`utils/` is internal-only:** Not exported from the root barrel. These are implementation details consumed by clipboard/ (and future modules). Bundlers will inline or tree-shake them as needed.
- **`types.ts` at both levels:** Module-specific types in `clipboard/types.ts`, shared types in `utils/types.ts`. Type-only files produce zero runtime code.

## Architectural Patterns

### Pattern 1: Guard-First Function Design

**What:** Every public function begins with environment guards before touching any browser API. Return early with a failure value rather than throwing.
**When to use:** Every exported function that accesses browser globals.
**Trade-offs:** Slight verbosity in every function, but guarantees SSR safety and graceful degradation. No try/catch needed at call sites.

**Example:**
```typescript
import { isBrowser, isSecureContext } from '../utils/env'
import { createError, handleError } from '../utils/errors'
import type { CopyOptions } from './types'

export async function copyToClipboard(
  text: string,
  options?: CopyOptions,
): Promise<boolean> {
  // Guard: SSR environment
  if (!isBrowser()) {
    handleError('CLIPBOARD_NOT_SUPPORTED', 'Not in a browser environment', options?.onError)
    return false
  }

  // Guard: API availability
  if (!navigator.clipboard?.writeText) {
    handleError('CLIPBOARD_NOT_SUPPORTED', 'Clipboard API not available', options?.onError)
    return false
  }

  // Guard: Secure context (HTTPS required)
  if (!isSecureContext()) {
    handleError('CLIPBOARD_NOT_SUPPORTED', 'Secure context required', options?.onError)
    return false
  }

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    handleError('CLIPBOARD_WRITE_FAILED', 'Failed to write to clipboard', options?.onError, error)
    return false
  }
}
```

### Pattern 2: Typed Error Dispatch (Not Throw)

**What:** Errors are represented as typed objects with string literal codes. A `handleError` helper logs a warning and invokes the optional `onError` callback. Functions never throw for expected failures.
**When to use:** All public API functions.
**Trade-offs:** Callers must check return values instead of catching. This is intentional: clipboard failures are not exceptional in most UX flows.

**Example:**
```typescript
// utils/types.ts
export type ErrorCode =
  | 'CLIPBOARD_NOT_SUPPORTED'
  | 'CLIPBOARD_PERMISSION_DENIED'
  | 'CLIPBOARD_WRITE_FAILED'
  | 'CLIPBOARD_READ_FAILED'

export interface BrowserUtilsError {
  code: ErrorCode
  message: string
  cause?: unknown
}

export type OnErrorCallback = (error: BrowserUtilsError) => void

// utils/errors.ts
export function createError(
  code: ErrorCode,
  message: string,
  cause?: unknown,
): BrowserUtilsError {
  return { code, message, cause }
}

export function handleError(
  code: ErrorCode,
  message: string,
  onError?: OnErrorCallback,
  cause?: unknown,
): void {
  const error = createError(code, message, cause)
  console.warn(`[@browser-utils] ${code}: ${message}`)
  onError?.(error)
}
```

### Pattern 3: Feature Detection as Pure Functions

**What:** Feature detection is extracted into dedicated pure functions that check API availability without side effects. These are both used internally and exported publicly.
**When to use:** Any browser API that may not exist (SSR, older browsers, non-secure contexts).
**Trade-offs:** Adds a few bytes to bundle, but prevents cryptic runtime errors and enables consumers to conditionally render UI.

**Example:**
```typescript
// utils/env.ts
export function isBrowser(): boolean {
  return typeof navigator !== 'undefined' && typeof window !== 'undefined'
}

export function isSecureContext(): boolean {
  return isBrowser() && window.isSecureContext === true
}

// clipboard/detect.ts
import { isBrowser } from '../utils/env'

export function isClipboardSupported(): boolean {
  return isBrowser() && typeof navigator.clipboard?.writeText === 'function'
}

export function isClipboardReadSupported(): boolean {
  return isBrowser() && typeof navigator.clipboard?.readText === 'function'
}
```

### Pattern 4: Barrel Exports with Subpath Mapping

**What:** Each module has a barrel `index.ts` that re-exports its public API. The root `index.ts` re-exports from all modules. `package.json` exports map provides both root and per-module subpath entries.
**When to use:** Always, for any library targeting tree-shaking.
**Trade-offs:** Barrel files can hurt tree-shaking if they contain logic or side effects. The rule: barrel files contain ONLY re-export statements, never logic.

**Example:**
```typescript
// src/clipboard/index.ts (barrel - re-exports only)
export { copyToClipboard } from './copy'
export { copyRichContent } from './copy'  // if in same file, or separate
export { readFromClipboard, readRichContent } from './read'
export { isClipboardSupported, isClipboardReadSupported } from './detect'
export { copyWithFallback } from './fallback'
export type { CopyOptions, ClipboardItemData } from './types'

// src/index.ts (root barrel)
export * from './clipboard'
```

```jsonc
// package.json exports map
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./clipboard": {
      "import": "./dist/clipboard/index.mjs",
      "require": "./dist/clipboard/index.cjs",
      "types": "./dist/clipboard/index.d.ts"
    }
  },
  "sideEffects": false
}
```

## Data Flow

### Copy Operation Flow

```
Consumer calls copyToClipboard(text, { onError })
    |
    v
[Guard: isBrowser()] --NO--> handleError() --> return false
    |YES
    v
[Guard: navigator.clipboard exists?] --NO--> handleError() --> return false
    |YES
    v
[Guard: isSecureContext()] --NO--> handleError() --> return false
    |YES
    v
[Try: navigator.clipboard.writeText(text)]
    |               |
    |SUCCESS        |CATCH
    v               v
return true     handleError(code, msg, onError, cause)
                    |
                    v
                return false
```

### Error Dispatch Flow

```
handleError(code, message, onError?, cause?)
    |
    +--> createError({ code, message, cause })
    |
    +--> console.warn(`[@browser-utils] ${code}: ${message}`)
    |
    +--> onError?.(error)   // invoke callback if provided
```

### Module Dependency Flow (Build Order)

```
utils/types.ts        (no deps - build first)
    ^
    |
utils/env.ts          (no deps - build first)
    ^
    |
utils/errors.ts       (depends on utils/types.ts)
    ^
    |
clipboard/types.ts    (depends on utils/types.ts)
    ^
    |
clipboard/detect.ts   (depends on utils/env.ts)
    ^
    |
clipboard/copy.ts     (depends on utils/env, utils/errors, clipboard/types)
clipboard/read.ts     (depends on utils/env, utils/errors, clipboard/types)
clipboard/fallback.ts (depends on utils/env, utils/errors, clipboard/types)
    ^
    |
clipboard/index.ts    (barrel - depends on all clipboard/*.ts)
    ^
    |
src/index.ts          (root barrel - depends on clipboard/index.ts)
```

### Key Data Flows

1. **Success path:** Consumer call -> guards pass -> browser API succeeds -> return `true`
2. **Expected failure:** Consumer call -> guard fails OR browser API rejects -> `handleError()` logs warning + invokes `onError` callback -> return `false`/`null`
3. **Feature detection:** Consumer calls `isClipboardSupported()` -> checks `isBrowser()` + `navigator.clipboard.writeText` existence -> returns `boolean` (no side effects)

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 module (clipboard) | Single package, flat structure. Current architecture is correct. |
| 3-5 modules (clipboard, storage, media, DOM) | Still single package. Add directories per module, add subpath exports. tsdown entry array grows. |
| 5+ modules + framework adapters | Monorepo with pnpm workspaces. `packages/core/` for vanilla, `packages/react/` for hooks, `packages/vue/` for composables. |

### Scaling Priorities

1. **First growth point:** Adding a second browser API module (e.g., storage). No architecture change needed -- just add `src/storage/` directory, add entry to tsdown config, add subpath export. The `utils/` layer already supports shared error handling and env detection.
2. **Second growth point:** Framework adapters (React hooks, Vue composables). This triggers monorepo migration. Core package remains framework-agnostic. Adapter packages import from core and wrap with framework primitives. Use pnpm workspaces + turborepo.

## Anti-Patterns

### Anti-Pattern 1: Logic in Barrel Files

**What people do:** Put helper functions, constants, or conditional logic in `index.ts` barrel files.
**Why it's wrong:** Bundlers cannot tree-shake individual exports from a file that has side effects. If the barrel does anything other than re-export, importing one function may pull in the entire module.
**Do this instead:** Barrel files contain ONLY `export { X } from './x'` statements. All logic lives in dedicated files.

### Anti-Pattern 2: Transparent Auto-Fallback

**What people do:** Silently fall back from Clipboard API to `document.execCommand('copy')` inside `copyToClipboard()`.
**Why it's wrong:** The consumer has no idea which code path ran. The deprecated API has different behavior (requires user gesture, injects DOM elements, may not work in iframes). Mixing modern and legacy APIs in one function creates an untestable, unpredictable surface.
**Do this instead:** Export `copyWithFallback()` as an explicit separate function. Keep `copyToClipboard()` as modern-API-only. Consumer explicitly chooses which to use.

### Anti-Pattern 3: Throwing on Expected Failures

**What people do:** `throw new Error('Clipboard not supported')` when the API is unavailable.
**Why it's wrong:** Clipboard failures are expected in many environments (HTTP, SSR, iframes, missing permissions). Forcing try/catch on every call site is bad DX for a non-critical operation.
**Do this instead:** Return `false`/`null` for expected failures. Provide `onError` callback for consumers who need details. Only throw for programmer errors (e.g., wrong argument type at development time).

### Anti-Pattern 4: SSR Guards Only at Module Level

**What people do:** Put `if (typeof window !== 'undefined')` at the top of the module file, wrapping all exports.
**Why it's wrong:** Module-level guards execute at import time, which can cause unexpected behavior with bundlers, break tree-shaking, and make testing harder (you cannot mock the guard state per-test).
**Do this instead:** Guard at the function level. Each function checks `isBrowser()` at call time. This keeps imports safe (importing the module in SSR is fine) and makes behavior testable.

### Anti-Pattern 5: Deep Internal Imports by Consumers

**What people do:** Import from internal paths like `@browser-utils/core/utils/errors`.
**Why it's wrong:** Internal modules are implementation details. Exposing them couples consumers to your file structure, preventing refactoring.
**Do this instead:** Only expose subpath exports for public modules (`./clipboard`). `utils/` is never in the exports map. If consumers need error types, re-export them from the public barrel.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Clipboard API | `navigator.clipboard.writeText()` / `readText()` | Requires HTTPS (secure context). Requires user gesture in some browsers. |
| Permissions API | `navigator.permissions.query({ name: 'clipboard-read' })` | Optional; for pre-checking read permission. Not supported in all browsers. |
| `document.execCommand('copy')` | Fallback via DOM selection + execCommand | Deprecated but works on HTTP. Explicit separate function. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| clipboard/ -> utils/env | Direct import | Pure function calls, no state |
| clipboard/ -> utils/errors | Direct import | Error factory + dispatch, no state |
| clipboard/ -> clipboard/types | Type-only import | Zero runtime cost, erased at compile |
| src/index.ts -> clipboard/ | Re-export only | No logic, no transformation |

## Build Configuration (tsdown)

### Recommended tsdown.config.ts

```typescript
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
  exports: true,    // auto-generate package.json exports field
  unbundle: false,   // bundle mode — inline utils/ into output
})
```

### Key Build Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Bundle vs Unbundle | Bundle (default) | Utils layer gets inlined/tree-shaken. Consumers get fewer files. For a small library (<1KB), bundling is simpler. |
| Entry points | Root + clipboard subpath | Two entries: `"."` and `"./clipboard"`. Subpath lets consumers import only clipboard module. |
| exports: true | Enabled | Let tsdown auto-generate the exports map. Validate with publint before publishing. |
| dts | Enabled | Auto-generates `.d.ts` files. Use `isolatedDeclarations: true` in tsconfig for faster oxc-transform path. |

## Sources

- [tsdown Package Exports documentation](https://tsdown.dev/options/package-exports) - AUTO-GENERATION of exports field
- [tsdown Entry Points documentation](https://tsdown.dev/options/entry) - Multiple entry point configuration
- [tsdown Unbundle Mode documentation](https://tsdown.dev/options/unbundle) - Bundle vs unbundle tradeoffs
- [tsdown How It Works](https://tsdown.dev/guide/how-it-works) - Build pipeline overview
- [clipboard-copy source code](https://github.com/feross/clipboard-copy) - Reference implementation (30 lines, execCommand fallback)
- [Theodo - How to Make Tree-Shakeable Libraries](https://blog.theodo.com/2021/04/library-tree-shaking/) - Tree-shaking architecture patterns
- [Cube Blog - Tree-shakeable JavaScript Libraries](https://cube.dev/blog/how-to-build-tree-shakeable-javascript-libraries) - sideEffects and module structure
- [Smashing Magazine - Tree-Shaking Reference Guide](https://www.smashingmagazine.com/2021/05/tree-shaking-reference-guide/) - Comprehensive tree-shaking patterns
- [VueUse Package Structure](https://app.studyraid.com/en/read/11889/378519/vueuse-package-structure-and-organization) - Module organization reference
- [Dual publish ESM and CJS with tsdown](https://dev.to/hacksore/dual-publish-esm-and-cjs-with-tsdown-2l75) - Practical tsdown setup

---
*Architecture research for: Browser utilities library (clipboard-focused)*
*Researched: 2026-04-08*
