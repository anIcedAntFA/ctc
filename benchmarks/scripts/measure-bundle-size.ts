import { buildSync } from 'esbuild'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export interface SizeResult {
  name: string
  version: string
  raw: number
  gzip: number
  brotli: number
}

function formatBytes(bytes: number): string {
  return (bytes / 1024).toFixed(2) + ' KB'
}

function getPackageVersion(packageName: string): string {
  try {
    const pkgPath = require.resolve(`${packageName}/package.json`)
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    return pkg.version as string
  } catch {
    return 'unknown'
  }
}

export function measureBundleSize(
  entryPoint: string,
  name: string,
  version: string,
): SizeResult {
  const outdir = mkdtempSync(join(tmpdir(), 'bench-size-'))
  const outfile = join(outdir, 'bundle.js')

  try {
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

    return {
      name,
      version,
      raw: code.length,
      gzip: gzipped.length,
      brotli: brotlied.length,
    }
  } finally {
    rmSync(outdir, { recursive: true, force: true })
  }
}

export function measureAllBundleSizes(): SizeResult[] {
  const packages = [
    { entry: '@ngockhoi96/ctc', name: '@ngockhoi96/ctc' },
    { entry: 'clipboard-copy', name: 'clipboard-copy' },
    { entry: 'copy-to-clipboard', name: 'copy-to-clipboard' },
  ] as const

  return packages.map(({ entry, name }) => {
    const version = getPackageVersion(entry)
    return measureBundleSize(entry, name, version)
  })
}

// Standalone execution
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('measure-bundle-size.ts')
) {
  const results = measureAllBundleSizes()

  console.log('\nBundle Size Comparison')
  console.log('=====================\n')
  console.log(
    'Package'.padEnd(25),
    'Version'.padEnd(10),
    'Raw'.padEnd(10),
    'Gzip'.padEnd(10),
    'Brotli',
  )
  console.log('-'.repeat(70))

  for (const r of results) {
    console.log(
      r.name.padEnd(25),
      r.version.padEnd(10),
      formatBytes(r.raw).padEnd(10),
      formatBytes(r.gzip).padEnd(10),
      formatBytes(r.brotli),
    )
  }
}
