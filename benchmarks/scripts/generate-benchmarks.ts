import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { measureAllBundleSizes, formatBytes, type SizeResult } from './measure-bundle-size.ts'

const BENCHMARKS_DIR = resolve(import.meta.dirname!, '..')
const REPO_ROOT = resolve(BENCHMARKS_DIR, '..')
const BENCH_RESULTS_PATH = join(BENCHMARKS_DIR, 'bench-results.json')
const BENCHMARKS_MD_PATH = join(REPO_ROOT, 'BENCHMARKS.md')

function formatOps(ops: number): string {
  return ops.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function formatMean(ms: number): string {
  return ms.toFixed(4)
}

interface BenchEntry {
  name: string
  hz: number
  mean: number
  samples: number
  rme: number
}

/**
 * Walk the vitest bench JSON to extract benchmark entries.
 * Structure: { files: [{ groups: [{ benchmarks: [{ name, hz, mean, sampleCount, rme }] }] }] }
 */
function extractBenchEntries(data: unknown): BenchEntry[] {
  const entries: BenchEntry[] = []

  function walk(obj: unknown): void {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const record = obj as Record<string, unknown>
      if ('hz' in record && 'mean' in record && 'name' in record) {
        entries.push({
          name: String(record.name),
          hz: Number(record.hz),
          mean: Number(record.mean),
          samples: Number(record.sampleCount ?? 0),
          rme: Number(record.rme ?? 0),
        })
      }
      for (const value of Object.values(record)) {
        walk(value)
      }
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        walk(item)
      }
    }
  }

  walk(data)
  return entries
}

// Step 1: Run vitest bench to produce bench-results.json
console.log('Running vitest bench...')
execFileSync('pnpm', ['exec', 'vitest', 'bench'], {
  cwd: BENCHMARKS_DIR,
  stdio: 'inherit',
})

// Step 2: Measure bundle sizes
console.log('\nMeasuring bundle sizes...')
const sizeResults = measureAllBundleSizes()

// Step 3: Parse bench results JSON
if (!existsSync(BENCH_RESULTS_PATH)) {
  console.error('bench-results.json not found. vitest bench may have failed.')
  process.exit(1)
}

const benchRaw = JSON.parse(readFileSync(BENCH_RESULTS_PATH, 'utf-8'))
const benchEntries = extractBenchEntries(benchRaw)

const coreEntries = benchEntries.filter(
  (e) =>
    e.name.includes('copyToClipboard') ||
    e.name.includes('copyRichContent') ||
    e.name.includes('readFromClipboard'),
)

const reactEntries = benchEntries.filter(
  (e) =>
    e.name.includes('useCopyToClipboard') ||
    e.name.includes('useCopyRichContent'),
)

// Step 4: Generate BENCHMARKS.md
const now = new Date().toISOString().split('T')[0]
const nodeVersion = process.version
const platform = `${process.platform} ${process.arch}`

function sizesTable(results: SizeResult[]): string {
  let table = '| Package | Version | Raw | Gzip | Brotli |\n'
  table += '|---------|---------|-----|------|--------|\n'
  for (const r of results) {
    table += `| ${r.name} | ${r.version} | ${formatBytes(r.raw)} | ${formatBytes(r.gzip)} | ${formatBytes(r.brotli)} |\n`
  }
  return table
}

function perfTable(entries: BenchEntry[]): string {
  let table = '| Function | ops/sec | Mean (ms) | Samples | RME |\n'
  table += '|----------|---------|-----------|---------|-----|\n'
  for (const e of entries) {
    table += `| ${e.name} | ${formatOps(e.hz)} | ${formatMean(e.mean)} | ${e.samples} | +/-${e.rme.toFixed(2)}% |\n`
  }
  return table
}

const markdown = `# Benchmarks

> Generated on ${now} | Node ${nodeVersion} | ${platform}

## Bundle Size Comparison

${sizesTable(sizeResults)}
## Core Function Performance

${coreEntries.length > 0 ? perfTable(coreEntries) : '_No core benchmark results found._'}

## React Adapter Overhead

${reactEntries.length > 0 ? perfTable(reactEntries) : '_No React benchmark results found._'}

## Methodology

- **Performance:** Vitest bench (tinybench) with mocked navigator.clipboard
- **Bundle size:** esbuild (minified ESM, \`platform: 'browser'\`) + Node.js zlib compression
- **Environment:** Node ${nodeVersion}, ${platform}
- **Note:** Benchmark ops/sec are relative to the machine; use for comparison ratios, not absolute values
`

writeFileSync(BENCHMARKS_MD_PATH, markdown, 'utf-8')
console.log(`\nWrote ${BENCHMARKS_MD_PATH}`)
