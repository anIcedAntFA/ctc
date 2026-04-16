# Phase 12: Benchmarks & CI Hardening - Research

**Researched:** 2026-04-17
**Domain:** Vitest benchmarking, bundle size measurement, monorepo workspace tooling
**Confidence:** HIGH

## Summary

Phase 12 creates a `benchmarks/` workspace package that houses two distinct measurement tools: (1) Vitest bench for ops/sec performance measurement of core clipboard functions and React adapter wrapper overhead, and (2) a Node.js script that bundles ctc and competitors with esbuild then measures gzip/brotli output sizes. All results feed into a generated `BENCHMARKS.md` at the repo root.

The technical surface is straightforward. Vitest already ships benchmarking support via `vitest bench` backed by tinybench. The project already uses Vitest 4.1.3 across all packages. esbuild handles the competitor bundling. Node.js built-in `zlib` provides gzip/brotli compression measurements without any additional dependencies. The main implementation complexity is in the generate script that orchestrates both measurement types and writes structured markdown output.

**Primary recommendation:** Create a private `benchmarks/` workspace with Vitest bench files for core + React adapter ops/sec, an esbuild-based bundle size script using Node zlib, and a top-level generate script that runs both and writes `BENCHMARKS.md`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Install `clipboard-copy` and `copy-to-clipboard` as devDeps in `benchmarks/`
- D-02: Bundle each competitor with esbuild to a single file, then measure gzip and brotli sizes via a Node script
- D-03: Compare against ctc core (`dist/index.mjs`) -- same esbuild + gzip/brotli measurement for apples-to-apples comparison
- D-04: Do NOT use bundlephobia data or extend size-limit
- D-05: Benchmark core functions with mocked clipboard API: `copyToClipboard`, `copyRichContent`, `readFromClipboard`
- D-06: Also benchmark React adapter wrapper overhead: `useCopyToClipboard` and `useCopyRichContent` hooks using renderHook from @testing-library/react in jsdom
- D-07: Vue and Svelte adapters are NOT benchmarked
- D-08: All benchmarks use mocked `navigator.clipboard` -- no real browser required
- D-09: A script (`scripts/generate-benchmarks.ts` or similar) runs both Vitest bench and bundle-size comparison, then rewrites `BENCHMARKS.md` automatically
- D-10: Script is run locally by the developer; output is committed as a static file
- D-11: BENCHMARKS.md includes a "Generated on" date stamp
- D-12: Not part of the release pipeline
- D-13: `pnpm bench` does NOT run in CI
- D-14: Consistent with REQUIREMENTS.md constraint on CI benchmark gates
- D-15: No `bench` job added to CI workflow
- D-16: A `bench` task IS added to `turbo.json`
- D-17: `benchmarks/` added as a top-level directory and registered in `pnpm-workspace.yaml`
- D-18: Package is private (`"private": true`)
- D-19: Package name: `@ngockhoi96/ctc-benchmarks` (or `ctc-benchmarks`) -- private

### Claude's Discretion
- Exact package.json shape for `benchmarks/` (scripts, devDeps versions)
- Whether the generate script is TypeScript or plain JavaScript
- Vitest bench config options (warmup iterations, sample count)
- BENCHMARKS.md table formatting and section structure

### Deferred Ideas (OUT OF SCOPE)
- Hyperfine for startup/import time comparison
- Vue and Svelte adapter overhead benchmarks
- CI artifact upload of bench results
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BENCH-01 | `benchmarks/` workspace with Vitest bench configured and runnable via `pnpm bench` | Vitest bench API documented; workspace registration pattern established; turbo.json task shape confirmed |
| BENCH-02 | Bundle size comparison table (gzip + brotli) vs `clipboard-copy` and `copy-to-clipboard` captured | esbuild bundling + Node.js zlib.gzipSync/brotliCompressSync for measurement; competitor versions verified |
| BENCH-03 | Wrapper overhead benchmarks (mocked clipboard API) produce timing results via `vitest bench` | Core mock patterns from existing tests; React renderHook pattern from @testing-library/react; bench API options documented |
| BENCH-04 | Results published in `BENCHMARKS.md` at repo root | Generate script pattern documented; markdown table formatting at Claude's discretion |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Ops/sec benchmarking | Node (Vitest bench) | -- | vitest bench runs in Node with tinybench; mocked clipboard API means no browser needed |
| Bundle size measurement | Node (esbuild + zlib) | -- | esbuild bundles to single file; Node zlib measures compressed sizes |
| React hook benchmarking | Node (jsdom via Vitest) | -- | renderHook from @testing-library/react runs in jsdom environment |
| Results generation | Node script | -- | Script orchestrates bench + size measurement, writes BENCHMARKS.md |
| Monorepo integration | Turbo + pnpm workspace | -- | bench task in turbo.json; benchmarks/ in pnpm-workspace.yaml |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.3 | Benchmark runner via `vitest bench` | Already used across all packages; bench mode built-in [VERIFIED: packages/core/package.json] |
| esbuild | 0.28.0 | Bundle competitors + ctc for size comparison | Fast, zero-config bundler for single-file output [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clipboard-copy | 4.0.1 | Competitor for size/perf comparison | Bundle size measurement only [VERIFIED: npm registry] |
| copy-to-clipboard | 3.3.3 | Competitor for size/perf comparison | Bundle size measurement only [VERIFIED: npm registry] |
| @testing-library/react | ^16.3.2 | renderHook for React adapter benchmarks | React hook overhead measurement [VERIFIED: packages/react/package.json] |
| jsdom | ^26.0.0 | DOM environment for React hook benchmarks | Required by @testing-library/react [VERIFIED: packages/react/package.json] |
| react / react-dom | ^18.3.1 | React runtime for hook benchmarks | Required by renderHook [VERIFIED: packages/react/package.json] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| esbuild for bundling | rollup, webpack | esbuild is fastest; only need single-file bundle for measurement, no complex config needed |
| Node zlib for compression | external `gzip-size` package | Node built-in zlib.gzipSync and zlib.brotliCompressSync are sufficient; zero-dep approach |

**Installation (in benchmarks/):**
```bash
pnpm add -D vitest esbuild clipboard-copy copy-to-clipboard @testing-library/react jsdom react react-dom @types/react @types/react-dom @ngockhoi96/ctc @ngockhoi96/ctc-react
```

Note: `@ngockhoi96/ctc` and `@ngockhoi96/ctc-react` are workspace dependencies (`workspace:*`).

## Architecture Patterns

### System Architecture Diagram

```
Developer runs `pnpm bench`
         |
         v
  turbo.json "bench" task
         |
         v
  benchmarks/package.json "bench" script
         |
    +----+----+
    |         |
    v         v
vitest bench  generate-benchmarks script
    |              |
    |         +----+----+
    |         |         |
    v         v         v
*.bench.ts  esbuild    Node zlib
(core +     (bundle    (gzip +
 react      ctc +      brotli
 ops/sec)   competitors) sizes)
    |         |         |
    +----+----+----+----+
         |
         v
   BENCHMARKS.md
   (repo root)
```

### Recommended Project Structure
```
benchmarks/
  package.json           # private workspace package
  vitest.config.ts       # bench-specific vitest config
  tsconfig.json          # extends root or minimal config
  src/
    helpers/
      clipboard-mock.ts  # shared mock for bench files
    core.bench.ts        # copyToClipboard, copyRichContent, readFromClipboard
    react.bench.ts       # useCopyToClipboard, useCopyRichContent overhead
  scripts/
    measure-bundle-size.ts  # esbuild + zlib measurement
    generate-benchmarks.ts  # orchestrator: runs bench + size, writes BENCHMARKS.md
```

### Pattern 1: Vitest Bench File Structure
**What:** Benchmark file using `bench` and `describe` from vitest
**When to use:** All performance measurement files
**Example:**
```typescript
// Source: Vitest docs (vitest-dev/vitest, bench API)
import { bench, describe, beforeEach, afterEach, vi } from 'vitest'
import { copyToClipboard } from '@ngockhoi96/ctc'

describe('copyToClipboard', () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined)

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

  bench('copyToClipboard - success path', async () => {
    await copyToClipboard('benchmark text')
  })
})
```

### Pattern 2: Bundle Size Measurement with esbuild + zlib
**What:** Bundle a package to a single file, measure gzip and brotli sizes
**When to use:** BENCH-02 bundle comparison
**Example:**
```typescript
// Source: Node.js zlib docs + esbuild API [ASSUMED]
import { buildSync } from 'esbuild'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

interface SizeResult {
  name: string
  raw: number
  gzip: number
  brotli: number
}

function measureBundleSize(entryPoint: string, name: string): SizeResult {
  const outdir = mkdtempSync(join(tmpdir(), 'bench-'))
  const outfile = join(outdir, 'bundle.js')

  buildSync({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile,
    platform: 'browser',
  })

  const code = readFileSync(outfile)
  const gzipped = gzipSync(code)
  const brotlied = brotliCompressSync(code)

  rmSync(outdir, { recursive: true })

  return {
    name,
    raw: code.length,
    gzip: gzipped.length,
    brotli: brotlied.length,
  }
}
```

### Pattern 3: React Hook Benchmark with renderHook
**What:** Measure React adapter wrapper overhead using renderHook in jsdom
**When to use:** BENCH-03 React adapter benchmarks
**Example:**
```typescript
// Source: existing React test pattern [VERIFIED: packages/react/tests/helpers/]
import { bench, describe, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCopyToClipboard } from '@ngockhoi96/ctc-react'

describe('useCopyToClipboard overhead', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    Object.defineProperty(window, 'isSecureContext', {
      value: true, writable: true, configurable: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  bench('useCopyToClipboard - render + copy', async () => {
    const { result } = renderHook(() => useCopyToClipboard())
    await act(async () => {
      await result.current.copy('bench')
    })
  })
})
```

### Pattern 4: Vitest Bench Config
**What:** vitest.config.ts for benchmark-only workspace
**When to use:** benchmarks/ package configuration
**Example:**
```typescript
// Source: Vitest bench config docs [VERIFIED: vitest-dev/vitest]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom', // needed for React hook benchmarks
    benchmark: {
      include: ['src/**/*.bench.ts'],
      reporters: ['default'],
      outputJson: 'bench-results.json',
    },
  },
})
```

### Anti-Patterns to Avoid
- **Using real clipboard API in benchmarks:** Benchmarks must use mocked navigator.clipboard. Real clipboard requires browser context and user gestures, making bench results non-deterministic.
- **Fetching sizes from bundlephobia:** D-04 explicitly prohibits this. Results go stale and are not reproducible.
- **Adding bench to CI:** D-13/D-14/D-15 explicitly prohibit this. Ops/sec varies across CI runners.
- **Sharing vitest config between test and bench:** Bench files use `vitest bench` mode which uses `benchmark.include` pattern, separate from `test.include`. Use a dedicated vitest.config.ts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Micro-benchmarking | Custom timing loops | vitest bench (tinybench) | Statistical rigor: warmup, samples, confidence intervals, RME% |
| JS bundling for size measurement | Manual concatenation | esbuild buildSync | Tree-shaking, minification, proper module resolution |
| Gzip/brotli compression | Shell commands piped together | Node.js zlib built-in | Cross-platform, programmatic, no shell dependency |
| React hook rendering in Node | Custom VDOM setup | @testing-library/react renderHook | Proper React lifecycle, cleanup, act() wrapping |

**Key insight:** The benchmarking infrastructure itself is well-served by existing tools. The implementation effort is in wiring them together, not building measurement primitives.

## Common Pitfalls

### Pitfall 1: Vitest bench vs test mode confusion
**What goes wrong:** Putting `bench()` calls in `.test.ts` files or `test()` calls in `.bench.ts` files.
**Why it happens:** Vitest has two modes -- `vitest run` for tests and `vitest bench` for benchmarks. They use different include patterns and different APIs.
**How to avoid:** Use `.bench.ts` file extension and `benchmark.include` in vitest config. Keep bench files separate from test files. [VERIFIED: vitest-dev/vitest docs]
**Warning signs:** "bench is not defined" errors or benchmarks silently not running.

### Pitfall 2: Mocking clipboard incorrectly for bench
**What goes wrong:** Mock resolves with a delay or doesn't properly stub globals, causing artificially slow or erroring benchmarks.
**Why it happens:** Copy-pasting test mocks that include `mockResolvedValueOnce` (single-use) instead of `mockResolvedValue` (reusable).
**How to avoid:** Use `vi.fn().mockResolvedValue(undefined)` (not `Once`) since bench runs the function many times. [VERIFIED: existing test patterns in packages/core/]
**Warning signs:** Benchmark reporting very low ops/sec or errors after first iteration.

### Pitfall 3: esbuild platform mismatch
**What goes wrong:** Bundling browser libraries with `platform: 'node'`, which excludes browser globals or includes node built-ins.
**Why it happens:** esbuild defaults to `platform: 'browser'` but explicit setting prevents mistakes.
**How to avoid:** Always set `platform: 'browser'` and `format: 'esm'` when bundling ctc and competitors for size comparison. [ASSUMED]
**Warning signs:** Wildly different bundle sizes than expected; missing exports.

### Pitfall 4: Competitor entry point resolution
**What goes wrong:** esbuild resolves the wrong entry point for competitors, measuring the wrong code.
**Why it happens:** clipboard-copy and copy-to-clipboard have different module entry points (ESM vs CJS).
**How to avoid:** Use the package name directly as entry point and let esbuild resolve via node_modules. Verify output with `metafile: true` to confirm correct resolution. [ASSUMED]
**Warning signs:** Bundle sizes that don't match published package sizes.

### Pitfall 5: React hook bench in wrong environment
**What goes wrong:** renderHook fails because jsdom is not configured.
**Why it happens:** The benchmark vitest config doesn't set `environment: 'jsdom'` for React bench files.
**How to avoid:** Either set `environment: 'jsdom'` globally in vitest.config.ts for the benchmarks package, or use `// @vitest-environment jsdom` comment directive in React bench files. [VERIFIED: packages/react/vitest.config.ts pattern]
**Warning signs:** "document is not defined" or "HTMLElement is not a constructor" errors.

### Pitfall 6: Turbo task missing cache:false
**What goes wrong:** Turbo caches bench results and skips re-running on subsequent `pnpm bench` calls.
**Why it happens:** Turbo caches by default; benchmarks should always run fresh.
**How to avoid:** Set `"cache": false` on the bench task in turbo.json, similar to the existing `test:e2e` and `dev` tasks. [VERIFIED: turbo.json patterns]
**Warning signs:** `pnpm bench` says "FULL TURBO" and shows stale results.

## Code Examples

### Vitest Bench Config (benchmarks/vitest.config.ts)
```typescript
// Source: Vitest docs [VERIFIED: vitest-dev/vitest]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom', // needed for React hook benchmarks
    benchmark: {
      include: ['src/**/*.bench.ts'],
      reporters: ['default'],
      outputJson: 'bench-results.json',
    },
  },
})
```

### Turbo bench task (addition to turbo.json)
```jsonc
// Source: existing turbo.json patterns [VERIFIED: turbo.json]
{
  "bench": {
    "dependsOn": ["^build"],
    "inputs": ["src/**", "vitest.config.*", "package.json"],
    "outputs": [],
    "cache": false
  }
}
```

### benchmarks/package.json shape
```json
{
  "name": "@ngockhoi96/ctc-benchmarks",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "bench": "vitest bench",
    "bench:size": "tsx scripts/measure-bundle-size.ts",
    "bench:generate": "tsx scripts/generate-benchmarks.ts"
  },
  "devDependencies": {
    "@ngockhoi96/ctc": "workspace:*",
    "@ngockhoi96/ctc-react": "workspace:*",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "clipboard-copy": "^4.0.1",
    "copy-to-clipboard": "^3.3.3",
    "esbuild": "^0.28.0",
    "jsdom": "^26.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tsx": "^4.0.0",
    "vitest": "4.1.3"
  }
}
```

### pnpm-workspace.yaml update
```yaml
packages:
  - "packages/*"
  - "playground/*"
  - "benchmarks"
```

### Root package.json script addition
```json
{
  "scripts": {
    "bench": "turbo run bench"
  }
}
```

### BENCHMARKS.md structure recommendation
```markdown
# Benchmarks

> Generated on YYYY-MM-DD | Node vXX.XX.X | [machine info]

## Bundle Size Comparison

| Package | Version | Raw | Gzip | Brotli |
|---------|---------|-----|------|--------|
| @ngockhoi96/ctc | X.X.X | X.XX KB | X.XX KB | X.XX KB |
| clipboard-copy | 4.0.1 | X.XX KB | X.XX KB | X.XX KB |
| copy-to-clipboard | 3.3.3 | X.XX KB | X.XX KB | X.XX KB |

## Core Function Performance

| Function | ops/sec | Mean (ms) | Samples | RME |
|----------|---------|-----------|---------|-----|
| copyToClipboard | X,XXX,XXX | 0.XXXX | XXXX | +/-X.XX% |
| copyRichContent | X,XXX,XXX | 0.XXXX | XXXX | +/-X.XX% |
| readFromClipboard | X,XXX,XXX | 0.XXXX | XXXX | +/-X.XX% |

## React Adapter Overhead

| Hook | ops/sec | Mean (ms) | Samples | RME |
|------|---------|-----------|---------|-----|
| useCopyToClipboard | X,XXX | 0.XXXX | XXXX | +/-X.XX% |
| useCopyRichContent | X,XXX | 0.XXXX | XXXX | +/-X.XX% |

## Methodology

- Performance: Vitest bench (tinybench) with mocked navigator.clipboard
- Bundle size: esbuild (minified ESM) + Node.js zlib compression
- Environment: Node vXX, [OS], [arch]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| benchmark.js | tinybench (via vitest bench) | Vitest 0.23+ | Built into vitest; no separate benchmark runner needed |
| Manual gzip-size package | Node.js zlib built-in | Always available | No extra dependency for compression measurement |
| bundlephobia for size comparison | Local esbuild + zlib | -- | Reproducible, up-to-date, works offline |

**Deprecated/outdated:**
- benchmark.js: Largely unmaintained; tinybench is the modern replacement used by Vitest internally [ASSUMED]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | esbuild `platform: 'browser'` is correct for bundling clipboard-copy and copy-to-clipboard | Pitfalls | Low -- can be adjusted; both are browser-targeted packages |
| A2 | tsx can run TypeScript scripts directly for the generate script | Code Examples | Low -- could use ts-node or compile first; tsx is standard for script execution |
| A3 | `vitest bench --outputJson` produces parseable JSON for the generate script | Architecture | Medium -- if format differs, generate script parsing needs adjustment |
| A4 | benchmark.js is largely unmaintained | State of the Art | Very low -- does not affect implementation |

## Open Questions

1. **vitest bench outputJson format**
   - What we know: Vitest supports `outputJson` config option for bench results [VERIFIED: vitest-dev/vitest docs]
   - What's unclear: The exact JSON schema of the output (field names, nesting)
   - Recommendation: Run `vitest bench` once during implementation and inspect the JSON output to build the parser

2. **tsx availability in monorepo**
   - What we know: tsx is a common TypeScript script runner with no config needed
   - What's unclear: Whether it's already available in the monorepo devDeps
   - Recommendation: Add tsx as a devDep in benchmarks/package.json; alternatively use `vitest` itself to run scripts or use `node --import tsx`

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All scripts | Yes | v24.13.1 | -- |
| pnpm | Workspace management | Yes | 10.29.3 | -- |
| Turbo | Task orchestration | Yes | 2.9.6 (devDep) | -- |
| esbuild | Bundle size measurement | No (will install) | 0.28.0 (npm) | -- |
| zlib (Node built-in) | Gzip/brotli measurement | Yes | Built-in | -- |

**Missing dependencies with no fallback:** None -- all missing deps are installable via pnpm.

**Missing dependencies with fallback:** None.

## Project Constraints (from CLAUDE.md)

- Zero runtime dependencies -- only devDeps in benchmarks/ (private package, not published) [COMPLIANT]
- Named exports only -- applies to any shared helpers in benchmarks/ [COMPLIANT]
- Strict TypeScript -- bench files and scripts follow strict TS [COMPLIANT]
- Conventional commits: `bench(12): ...` or `chore(12): ...` for benchmark work
- Run `pnpm lint && pnpm test && pnpm build` before any commit -- bench does not need to pass for commits to other packages
- NEVER add runtime dependencies to published packages -- benchmarks/ is private, competitors are devDeps only [COMPLIANT]

## Sources

### Primary (HIGH confidence)
- [/vitest-dev/vitest] - bench API, BenchOptions interface, benchmark config, outputJson
- [packages/core/vitest.config.ts] - existing vitest config pattern
- [packages/react/vitest.config.ts] - jsdom environment config for React
- [packages/react/tests/helpers/] - clipboard mock patterns for React hooks
- [turbo.json] - task definition patterns (cache, dependsOn, inputs)
- [pnpm-workspace.yaml] - workspace registration pattern
- [npm registry] - verified versions: vitest 4.1.4, esbuild 0.28.0, clipboard-copy 4.0.1, copy-to-clipboard 3.3.3

### Secondary (MEDIUM confidence)
- [Node.js zlib docs] - gzipSync, brotliCompressSync APIs

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all tools verified against npm registry and existing project usage
- Architecture: HIGH - patterns directly follow existing monorepo conventions
- Pitfalls: HIGH - most pitfalls derived from verified project patterns and vitest docs

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable tools, no fast-moving dependencies)
