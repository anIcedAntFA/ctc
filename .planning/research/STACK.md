# Stack Research: v0.4.0 Additions

**Domain:** Rich clipboard support, benchmark tooling, CI validation hardening
**Researched:** 2026-04-16
**Confidence:** HIGH (ClipboardItem API), MEDIUM (benchmark tooling choices)

> This document covers ONLY new stack additions for v0.4.0. The existing stack
> (TypeScript 6.0, tsdown, Vitest, Playwright, Biome, pnpm, changesets) is
> validated and unchanged -- see the v0.3.0 STACK.md research in git history.

## 1. Rich Clipboard via ClipboardItem API

### No New Dependencies Required

The ClipboardItem API is a native browser API. Zero new packages are needed.

| Requirement | Status | Notes |
|-------------|--------|-------|
| `ClipboardItem` constructor | Native | `new ClipboardItem({ "text/html": blob, "text/plain": blob })` |
| `navigator.clipboard.write()` | Native | Accepts `ClipboardItem[]`, Baseline 2024 (all major browsers since June 2024) |
| `navigator.clipboard.read()` | Native | Returns `ClipboardItem[]`, Baseline 2024 |
| `ClipboardItem.supports()` | Native | Static method to check MIME type support before writing |
| TypeScript types | Already included | `ClipboardItem` is in TypeScript's DOM lib, included by default. TS 6.0.2 has full type coverage. |
| Polyfill | NOT needed | Baseline 2024 means Chrome 76+, Firefox 127+, Safari 13.1+. The project targets ES2020+ (>95% support). No polyfill aligns with zero-dependency constraint. |

### API Surface to Implement

```typescript
// Rich write: HTML + plaintext fallback in one ClipboardItem
async function copyRichContent(
  html: string,
  plainText: string,
  options?: ClipboardOptions,
): Promise<boolean>

// Rich read: extract HTML or plaintext from clipboard
async function readRichContent(
  options?: RichClipboardReadOptions,
): Promise<RichClipboardResult | null>
```

### Browser API Usage Pattern

```typescript
// Writing rich content -- both MIME types in one ClipboardItem
const item = new ClipboardItem({
  'text/html': new Blob([html], { type: 'text/html' }),
  'text/plain': new Blob([plainText], { type: 'text/plain' }),
})
await navigator.clipboard.write([item])

// Reading rich content -- iterate ClipboardItem.types
const items = await navigator.clipboard.read()
for (const item of items) {
  if (item.types.includes('text/html')) {
    const blob = await item.getType('text/html')
    const html = await blob.text()
  }
}
```

### New Error Codes Needed

Add to `ErrorCode` union in `src/lib/types.ts`:

| Error Code | When | Severity |
|------------|------|----------|
| `CLIPBOARD_ITEM_NOT_SUPPORTED` | `ClipboardItem` constructor missing (very old browsers) | Expected (warn) |
| `CLIPBOARD_MIME_NOT_SUPPORTED` | `ClipboardItem.supports('text/html')` returns false | Expected (warn) |

Existing error codes cover the rest: `CLIPBOARD_NOT_SUPPORTED`, `INSECURE_CONTEXT`, `CLIPBOARD_PERMISSION_DENIED`, `CLIPBOARD_WRITE_FAILED`, `CLIPBOARD_READ_FAILED`.

### New Types Needed

```typescript
// Options for reading rich content
interface RichClipboardReadOptions extends ClipboardOptions {
  /** Preferred MIME type to read. Defaults to 'text/html'. */
  preferredType?: 'text/html' | 'text/plain'
}

// Result of reading rich content
interface RichClipboardResult {
  html: string | null
  text: string | null
}
```

### Detection Function

```typescript
// New detection function for rich clipboard support
function isRichClipboardSupported(): boolean
```

Checks: `isBrowser() && typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function'`.

### Key Caveats (Affect Implementation, Not Stack)

1. **HTML sanitization**: Browsers sanitize HTML on read by default (strip `<script>`, dangerous attrs). The `unsanitized` option exists but has limited browser support. Document this; do NOT try to work around it.
2. **Safari user gesture**: Same constraint as `writeText()` -- must be called synchronously within a user gesture handler. Already handled by existing patterns.
3. **Firefox clipboard.read()**: May require the `dom.events.asyncClipboard.readText` pref in older Firefox versions. Baseline 2024 means Firefox 127+ supports it natively.

### Bundle Size Impact

The new functions use only native APIs (ClipboardItem, Blob). Estimated addition: ~300-500 bytes unminified, well within the 1KB gzip budget. The existing `copy.ts` is ~96 lines; `copyRichContent` will be comparable. Combined core bundle should stay under 1KB gzip with tree-shaking.

### size-limit Update

Add a new entry for the rich clipboard subpath if exposed separately, or verify the existing entries still pass:

```jsonc
// package.json size-limit (existing entries cover it if rich clipboard
// is exported through the same barrel files)
{
  "size-limit": [
    { "path": "dist/index.mjs", "limit": "1.5 KB" },  // bump from 1 KB
    { "path": "dist/clipboard/index.mjs", "limit": "1.5 KB" }  // bump from 1 KB
  ]
}
```

The limit increase is justified: adding rich clipboard doubles the clipboard API surface. 1.5KB gzip for the full clipboard module (text + rich) is still excellent.

## 2. Benchmark Tooling

### Recommendation: Vitest Bench (NOT standalone tinybench)

Use Vitest's built-in `bench` function, which wraps tinybench internally.

| Option | Version | Recommendation | Rationale |
|--------|---------|----------------|-----------|
| **Vitest bench** | 4.1.x (already installed) | **USE THIS** | Zero new dependencies. Same `describe`/`bench` API. Integrated with existing Vitest config. Output includes hz, min, max, mean, p75, p99, rme, samples. |
| tinybench (standalone) | 6.0.0 | DO NOT ADD | Would duplicate what Vitest already provides. Only useful if benchmarks need to run outside Vitest (they don't). |
| hyperfine | 1.0.0 (npm) / system | DO NOT ADD | CLI timing tool for comparing shell commands. Not applicable here -- we're benchmarking JS functions, not CLI programs. The "compare clipboard libs" use case needs in-process JS benchmarking. |

### Why Vitest Bench Over Standalone Tinybench

1. **Already installed**: Vitest 4.1.3 bundles tinybench internally. Zero new devDependencies.
2. **Same runner**: `pnpm vitest bench` uses the same config, transforms, and environment as unit tests.
3. **Consistent output**: Machine-readable JSON via `--reporter=json`, human-readable table by default.
4. **Turbo integration**: Add a `bench` task to `turbo.json` and it works across the monorepo.

### Benchmark File Structure

```
benchmarks/
  clipboard-write.bench.ts    # copyToClipboard vs clipboard-copy vs copy-to-clipboard
  clipboard-read.bench.ts     # readFromClipboard vs alternatives
  vitest.config.ts             # Separate vitest config for bench mode
```

### Vitest Bench Configuration

```typescript
// benchmarks/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    benchmark: {
      include: ['benchmarks/**/*.bench.ts'],
      outputJson: 'benchmarks/results.json',  // for CI comparison / publishing
    },
  },
})
```

### Benchmark Script

```jsonc
// Root package.json
{
  "scripts": {
    "bench": "vitest bench --config benchmarks/vitest.config.ts"
  }
}
```

### Turbo Task

```jsonc
// turbo.json addition
{
  "bench": {
    "dependsOn": ["build"],
    "inputs": ["benchmarks/**", "src/**"],
    "outputs": ["benchmarks/results.json"],
    "cache": false
  }
}
```

### Competitor Libraries for Benchmarking

These are installed as devDependencies in the benchmarks workspace ONLY, not in core:

| Library | Version | Purpose | Install Location |
|---------|---------|---------|-----------------|
| clipboard-copy | 4.0.1 | Write-only competitor (modern, tiny) | benchmarks/ devDependency |
| copy-to-clipboard | 3.3.3 | Write-only competitor (uses execCommand) | benchmarks/ devDependency |

These are the two libraries mentioned in PROJECT.md as competitive references.

### What NOT to Benchmark

- **Image clipboard operations**: Out of scope for v0.4.0.
- **Framework adapter hooks**: Benchmark raw functions only; hooks add React/Vue/Svelte overhead that varies by framework version.
- **Cold start / import time**: Not meaningful for a <1KB library.

## 3. CI Validation: attw + publint

### Current State

Validation is **already wired correctly** for local development:

- All 4 packages have `"validate": "publint && attw --pack"` in their scripts
- `turbo.json` has a `validate` task with `dependsOn: ["build"]`
- CI workflow (`ci.yml`) runs `pnpm turbo run validate` in the `unit-test` job

### Problem: validate Runs Only in unit-test Job

The current CI workflow runs `validate` inside the `unit-test` matrix job (Node 20 + 22). This means:
1. Validation runs twice (once per Node version) -- wasteful since publint/attw results don't vary by Node version.
2. Validation is buried in the test job -- a validation failure looks like a test failure.
3. If unit tests fail, validation doesn't run (they're sequential in the same job).

### Recommendation: Separate validate Job

```yaml
# .github/workflows/ci.yml -- add new job
validate:
  name: Validate Packages (publint + attw)
  needs: lint-and-build
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: 'pnpm'
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Build
      run: pnpm turbo run build
    - name: Validate (publint + attw)
      run: pnpm turbo run validate
```

Then remove the `pnpm turbo run validate` step from the `unit-test` job.

### No New Packages Needed

| Tool | Current Version | Latest | Action |
|------|----------------|--------|--------|
| publint | 0.3.18 | 0.3.18 | Already latest. No change. |
| @arethetypeswrong/cli | 0.18.2 | 0.18.2 | Already latest. No change. |

### attw Svelte Profile

The Svelte package already uses `--profile node16` flag:

```json
"validate": "publint && attw --pack --profile node16"
```

This is correct because Svelte's subpath exports (`/stores`, `/runes`) need the node16 resolution profile. No change needed.

### Consider: size-limit in CI

Currently `pnpm size` is available locally but not in CI. Consider adding it to the `validate` job:

```yaml
- name: Check bundle size
  run: pnpm turbo run size
```

This prevents size regressions from being merged. Turbo already has a `size` task configured.

## Summary: What to Add, What NOT to Add

### Add (devDependencies)

| Package | Version | Where | Why |
|---------|---------|-------|-----|
| clipboard-copy | 4.0.1 | benchmarks/ only | Competitor for benchmark comparison |
| copy-to-clipboard | 3.3.3 | benchmarks/ only | Competitor for benchmark comparison |

**Total new devDependencies: 2** (benchmark workspace only, not in core)

### Do NOT Add

| Package | Why Not |
|---------|---------|
| tinybench (standalone) | Vitest 4.x bundles it. Adding standalone would duplicate functionality. |
| hyperfine (npm) | Wrong tool -- it benchmarks CLI commands, not JS functions. |
| any ClipboardItem polyfill | Zero-dependency constraint. Baseline 2024 coverage is sufficient. |
| clipboard-polyfill | Same reason. Document browser support instead. |
| @anthropic-ai/benchmark or similar | Overcomplicated for a library comparison. Vitest bench is sufficient. |

### Modify (Existing Config)

| File | Change | Why |
|------|--------|-----|
| `src/lib/types.ts` | Add `CLIPBOARD_ITEM_NOT_SUPPORTED` and `CLIPBOARD_MIME_NOT_SUPPORTED` error codes | Rich clipboard error reporting |
| `package.json` (core) | Adjust size-limit from 1KB to 1.5KB | Rich clipboard doubles API surface |
| `turbo.json` | Add `bench` task | Benchmark integration with turbo pipeline |
| Root `package.json` | Add `bench` script | Entry point for benchmark runs |
| `.github/workflows/ci.yml` | Extract validate into its own job; add size check | Cleaner CI, prevent size regressions |

## Version Compatibility

| Addition | Compatible With | Notes |
|----------|-----------------|-------|
| ClipboardItem API (native) | TypeScript 6.0.2 DOM lib | Types included in `lib.dom.d.ts` since TS 4.3 |
| Vitest bench | Vitest 4.1.3 (installed) | Built-in, uses tinybench internally |
| clipboard-copy 4.0.1 | Any Node 20+ | ESM package, benchmark-only |
| copy-to-clipboard 3.3.3 | Any Node 20+ | CJS package, benchmark-only |

## Sources

- [MDN ClipboardItem](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem) -- constructor, supports(), Baseline 2024 status (HIGH confidence)
- [MDN Clipboard.write()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write) -- write method, supported MIME types: text/plain, text/html, image/png (HIGH confidence)
- [MDN Clipboard.read()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read) -- read method, HTML sanitization behavior, unsanitized option (HIGH confidence)
- [Vitest docs (Context7, vitest-dev/vitest v4.0.7)](https://vitest.dev/guide/features) -- bench function, tinybench integration (HIGH confidence)
- [Tinybench docs (Context7, tinylibs/tinybench)](https://github.com/tinylibs/tinybench) -- API confirmed, version 6.0.0 latest (HIGH confidence)
- npm registry -- tinybench@6.0.0, clipboard-copy@4.0.1, copy-to-clipboard@3.3.3, publint@0.3.18, @arethetypeswrong/cli@0.18.2 versions verified (HIGH confidence)
- Existing codebase -- ci.yml, turbo.json, package.json files analyzed for current wiring (HIGH confidence)

---
*Stack research for: v0.4.0 rich clipboard, benchmarks, CI validation*
*Researched: 2026-04-16*
