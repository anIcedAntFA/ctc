# Phase 12: Benchmarks & CI Hardening - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 10
**Analogs found:** 9 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `benchmarks/package.json` | config | -- | `packages/react/package.json` | role-match |
| `benchmarks/vitest.config.ts` | config | -- | `packages/react/vitest.config.ts` | role-match |
| `benchmarks/tsconfig.json` | config | -- | `packages/react/tsconfig.json` | exact |
| `benchmarks/src/helpers/clipboard-mock.ts` | utility | -- | `packages/react/tests/helpers/create-clipboard-mock.ts` | exact |
| `benchmarks/src/core.bench.ts` | test (bench) | request-response | `packages/core/tests/unit/clipboard/copy.test.ts` | role-match |
| `benchmarks/src/react.bench.ts` | test (bench) | request-response | `packages/react/tests/use-copy-to-clipboard.test.ts` | role-match |
| `benchmarks/scripts/measure-bundle-size.ts` | utility | file-I/O | -- | no-analog |
| `benchmarks/scripts/generate-benchmarks.ts` | utility | file-I/O | -- | no-analog |
| `turbo.json` (modify) | config | -- | `turbo.json` (self -- add bench task) | exact |
| `pnpm-workspace.yaml` (modify) | config | -- | `pnpm-workspace.yaml` (self) | exact |
| `package.json` (modify root) | config | -- | `package.json` (self -- add bench script) | exact |
| `BENCHMARKS.md` (new) | docs | -- | -- | no-analog |

## Pattern Assignments

### `benchmarks/package.json` (config)

**Analog:** `packages/react/package.json`

**Structure pattern** (full file):
```json
{
  "name": "@ngockhoi96/ctc-react",
  "version": "0.1.1",
  "license": "MIT",
  "type": "module",
  "private": false,
  "description": "React hook for @ngockhoi96/ctc clipboard utilities",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "build": "tsdown",
    "test": "vitest run"
  },
  "devDependencies": {
    "@ngockhoi96/ctc": "workspace:*",
    "vitest": "4.1.3"
  }
}
```

**Key differences for benchmarks/:**
- `"private": true` (not published)
- No `build`, `lint`, `validate`, `size` scripts -- only `bench`, `bench:size`, `bench:generate`
- No `main`, `module`, `types`, `exports`, `files` fields (not a publishable package)
- Uses `vitest bench` not `vitest run`
- Vitest version must match: `4.1.3`

---

### `benchmarks/vitest.config.ts` (config)

**Analog:** `packages/react/vitest.config.ts`

**Full pattern** (lines 1-19):
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
    },
  },
})
```

**Key differences for benchmarks/:**
- Keep `environment: 'jsdom'` (needed for React hook benchmarks)
- Replace `include` with `benchmark.include: ['src/**/*.bench.ts']`
- Add `benchmark.reporters` and optionally `benchmark.outputJson`
- Remove all `coverage` config (not relevant for bench)

---

### `benchmarks/tsconfig.json` (config)

**Analog:** `packages/react/tsconfig.json`

**Full pattern** (lines 1-7):
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {},
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Key difference:** Add `"scripts"` to `include` array so TypeScript covers the scripts/ directory too. Or use `"include": ["src", "scripts"]`.

---

### `benchmarks/src/helpers/clipboard-mock.ts` (utility)

**Analog:** `packages/react/tests/helpers/create-clipboard-mock.ts`

**Full pattern** (lines 1-59):
```typescript
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
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      writable: true,
      configurable: true,
    })
  }

  function uninstall(): void {
    vi.unstubAllGlobals()
  }

  return { writeText, install, uninstall }
}
```

**Critical bench adaptation:** Use `mockResolvedValue(undefined)` (reusable) NOT `mockResolvedValueOnce` since bench runs each function thousands of times.

**Also reuse `createRichClipboardMock`** from `packages/react/tests/helpers/create-rich-clipboard-mock.ts` (lines 40-68):
```typescript
export function createRichClipboardMock(): RichClipboardMock {
  const write = vi.fn()

  function install(): void {
    vi.stubGlobal(
      'ClipboardItem',
      class MockClipboardItem {
        constructor(public data: Record<string, Blob>) {}
      },
    )
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

---

### `benchmarks/src/core.bench.ts` (test/bench, request-response)

**Analog:** `packages/core/tests/unit/clipboard/copy.test.ts`

**Mock setup pattern** (lines 1-17):
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboard } from '../../../src/clipboard/copy.ts'

describe('copyToClipboard', () => {
  const mockWriteText = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockWriteText },
    })
    vi.stubGlobal('window', { isSecureContext: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })
```

**Key adaptations for bench:**
- Replace `import { it, expect }` with `import { bench }` from vitest
- Replace `it('...', async () => {...})` with `bench('...', async () => {...})`
- Use `mockResolvedValue` not `mockResolvedValueOnce`
- Import from `@ngockhoi96/ctc` (workspace dep) not relative paths
- Use the helper mock factory instead of inline mocking (cleaner for bench files)

---

### `benchmarks/src/react.bench.ts` (test/bench, request-response)

**Analog:** `packages/react/tests/use-copy-to-clipboard.test.ts`

**Setup + renderHook pattern** (lines 1-17):
```typescript
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCopyToClipboard } from '../src/use-copy-to-clipboard.ts'
import { createClipboardMock } from './helpers/create-clipboard-mock.ts'

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

**Bench execution pattern** (adapted from lines 29-41):
```typescript
// Original test pattern:
it('returns true and sets copied=true', async () => {
  mock.writeText.mockResolvedValue(undefined)
  const { result } = renderHook(() => useCopyToClipboard('hello'))
  await act(async () => {
    await result.current.copy()
  })
  expect(result.current.copied).toBe(true)
})

// Bench adaptation:
bench('useCopyToClipboard - render + copy', async () => {
  const { result } = renderHook(() => useCopyToClipboard('bench'))
  await act(async () => {
    await result.current.copy()
  })
})
```

**Key adaptations:**
- No fake timers needed (bench doesn't test reset timeout behavior)
- No assertions -- bench only measures execution time
- Import from `@ngockhoi96/ctc-react` (workspace dep)
- `mockResolvedValue` set in `beforeEach` via mock helper

---

### `turbo.json` (modify -- add bench task)

**Analog:** Self -- existing `test:e2e` task pattern (lines 13-19):
```json
"test:e2e": {
  "dependsOn": ["build"],
  "inputs": ["tests/e2e/**", "playwright.config.*", "package.json"],
  "outputs": [],
  "cache": false
}
```

**Bench task should follow:**
- `"dependsOn": ["^build"]` (needs core + react built first via workspace deps)
- `"cache": false` (benchmarks must always run fresh, like test:e2e)
- `"inputs"` scoped to bench source files
- `"outputs": []`

---

### `pnpm-workspace.yaml` (modify)

**Current content** (lines 1-3):
```yaml
packages:
  - "packages/*"
  - "playground/*"
```

**Add:** `- "benchmarks"` as a new entry.

---

### `package.json` root (modify -- add bench script)

**Existing script pattern** (lines 17-25):
```json
"scripts": {
  "dev": "turbo run dev --filter=./playground/*",
  "build": "turbo run build",
  "test": "turbo run test",
  "test:e2e": "turbo run test:e2e",
  "size": "turbo run size"
}
```

**Add:** `"bench": "turbo run bench"` following the same `turbo run X` pattern.

---

## Shared Patterns

### Clipboard Mocking (for bench files)
**Source:** `packages/react/tests/helpers/create-clipboard-mock.ts` (lines 37-59) and `packages/react/tests/helpers/create-rich-clipboard-mock.ts` (lines 40-68)
**Apply to:** `benchmarks/src/core.bench.ts`, `benchmarks/src/react.bench.ts`

The React test helpers use `Object.defineProperty` for `isSecureContext` instead of `vi.stubGlobal('window', ...)` to preserve jsdom globals. This is essential for React hook benchmarks. For core-only benchmarks, either approach works, but using the same helper keeps things consistent.

### Vitest Config Shape
**Source:** `packages/react/vitest.config.ts` (lines 1-19)
**Apply to:** `benchmarks/vitest.config.ts`

All packages use `defineConfig` from `vitest/config`. The React package sets `environment: 'jsdom'` which the benchmarks package also needs.

### Workspace Package Structure
**Source:** `packages/react/package.json` (lines 1-69)
**Apply to:** `benchmarks/package.json`

All workspace packages use `"type": "module"`, `"engines": { "node": ">=20" }`, and pin vitest to `4.1.3`.

### TSConfig Extension
**Source:** `packages/react/tsconfig.json` (lines 1-7)
**Apply to:** `benchmarks/tsconfig.json`

All packages extend `../../tsconfig.base.json` which provides strict TS, ES2020 target, and nodenext module resolution.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `benchmarks/scripts/measure-bundle-size.ts` | utility | file-I/O | No esbuild bundling + zlib measurement scripts exist in the codebase. Use RESEARCH.md Pattern 2 (esbuild buildSync + zlib gzipSync/brotliCompressSync). |
| `benchmarks/scripts/generate-benchmarks.ts` | utility | file-I/O | No orchestrator scripts that run subprocesses and write markdown exist. Use RESEARCH.md code examples for subprocess invocation + markdown generation. |
| `BENCHMARKS.md` | docs | -- | Generated output file. Use RESEARCH.md recommended structure. |

## Metadata

**Analog search scope:** `packages/core/`, `packages/react/`, root config files
**Files scanned:** 15+ config, test, and helper files
**Pattern extraction date:** 2026-04-17
