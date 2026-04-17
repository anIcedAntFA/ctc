# Benchmarks

> Generated on 2026-04-17 | Node v24.13.1 | linux x64

## Bundle Size Comparison

| Package | Version | Raw | Gzip | Brotli | API Style | Last Updated | TypeScript | SSR-safe |
|---------|---------|-----|------|--------|-----------|--------------|------------|----------|
| @ngockhoi96/ctc | 0.2.2 | 4.52 KB | 1.17 KB | 0.99 KB | Function / Hook / Composable / Action | Active | Native (strict) | Yes |
| clipboard-copy | 4.0.1 | 0.93 KB | 0.53 KB | 0.43 KB | Function call | 2020-11-18 | No | No |
| copy-to-clipboard | 3.3.3 | 2.23 KB | 1.06 KB | 0.88 KB | Function call | 2022-11-13 | Bundled index.d.ts | No (execCommand) |
| react-copy-to-clipboard | 5.1.1 | — | — | — | Render-prop component | 2026-03-07 | @types pkg | No |
| usehooks-ts (useClipboard) | 3.1.1 | — | — | — | React hook | 2025-02-05 | Native | Partial |
| @vueuse/core (useClipboard) | 14.2.1 | — | — | — | Vue composable | 2026-02-10 | Native | Partial |

## Core Function Performance

| Function | ops/sec | Mean (ms) | Samples | RME |
|----------|---------|-----------|---------|-----|
| copyToClipboard - success path | 670,152 | 0.0015 | 335076 | +/-14.74% |
| copyRichContent - success path | 16,947 | 0.0590 | 8474 | +/-4.70% |
| readFromClipboard - success path | 823,725 | 0.0012 | 411863 | +/-16.24% |


## React Adapter Overhead

| Function | ops/sec | Mean (ms) | Samples | RME |
|----------|---------|-----------|---------|-----|
| useCopyToClipboard - render + copy | 1,634 | 0.6120 | 831 | +/-11.12% |
| useCopyRichContent - render + copyRich | 1,878 | 0.5325 | 939 | +/-11.78% |


## Methodology

- **Performance:** Vitest bench (tinybench) with mocked navigator.clipboard
- **Bundle size:** esbuild (minified ESM, `platform: 'browser'`) + Node.js zlib compression
- **Environment:** Node v24.13.1, linux x64
- **Note:** Benchmark ops/sec are relative to the machine; use for comparison ratios, not absolute values
