# Phase 12: Benchmarks & CI Hardening - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a `benchmarks/` workspace package with Vitest bench that measures core function performance and React adapter wrapper overhead. Produce a bundle-size comparison table against clipboard-copy and copy-to-clipboard. Publish all results in `BENCHMARKS.md` at the repo root. Benchmarks are a local developer tool — CI does not run them.

</domain>

<decisions>
## Implementation Decisions

### Bundle Size Comparison (BENCH-02)

- **D-01:** Install `clipboard-copy` and `copy-to-clipboard` as devDeps in `benchmarks/`
- **D-02:** Bundle each competitor with esbuild to a single file, then measure gzip and brotli sizes via a Node script
- **D-03:** Compare against ctc core (`dist/index.mjs`) — same esbuild + gzip/brotli measurement for apples-to-apples comparison
- **D-04:** Do NOT use bundlephobia data (goes stale) or extend size-limit (not designed for competitor comparison)

### Benchmark Function Scope (BENCH-03)

- **D-05:** Benchmark core functions with mocked clipboard API: `copyToClipboard`, `copyRichContent`, `readFromClipboard`
- **D-06:** Also benchmark React adapter wrapper overhead: `useCopyToClipboard` and `useCopyRichContent` hooks — using `renderHook` from `@testing-library/react` in a jsdom environment
- **D-07:** Vue and Svelte adapters are NOT benchmarked — React is the most representative hook-based pattern
- **D-08:** All benchmarks use mocked `navigator.clipboard` — no real browser required, vitest bench runs in Node

### BENCHMARKS.md Update Strategy (BENCH-04)

- **D-09:** A script (`scripts/generate-benchmarks.ts` or similar) runs both the Vitest bench suite and the bundle-size comparison, then rewrites `BENCHMARKS.md` automatically
- **D-10:** The script is run locally by the developer; output is committed as a static file
- **D-11:** BENCHMARKS.md includes a "Generated on" date stamp so readers know the snapshot age
- **D-12:** Not part of the release pipeline — run manually when numbers need refreshing

### CI Integration

- **D-13:** `pnpm bench` does NOT run in CI — benchmarks are a local developer tool only
- **D-14:** Consistent with REQUIREMENTS.md explicit constraint: "CI benchmark gates — Benchmark ops/sec varies across CI environments — not deterministic enough to gate on"
- **D-15:** No `bench` job added to `.github/workflows/ci.yml`
- **D-16:** A `bench` task IS added to `turbo.json` so `pnpm bench` works consistently across the monorepo from the repo root

### Workspace Structure

- **D-17:** `benchmarks/` added as a top-level directory and registered in `pnpm-workspace.yaml` alongside `packages/*` and `playground/*`
- **D-18:** Package is private (`"private": true`) — not published to npm
- **D-19:** Package name: `@ngockhoi96/ctc-benchmarks` (or `ctc-benchmarks`) — private, follows monorepo naming

### Claude's Discretion

- Exact package.json shape for `benchmarks/` (scripts, devDeps versions)
- Whether the generate script is TypeScript or plain JavaScript
- Vitest bench config options (warmup iterations, sample count)
- BENCHMARKS.md table formatting and section structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Benchmarks — BENCH-01 through BENCH-04 full spec
- `.planning/REQUIREMENTS.md` §Out of Scope — "CI benchmark gates" explicitly excluded

### Existing Tooling to Follow
- `packages/core/vitest.config.ts` — vitest config pattern to follow for benchmarks/
- `turbo.json` — task definition pattern; bench task must follow same shape as test/size
- `pnpm-workspace.yaml` — add `benchmarks` entry here
- `.github/workflows/ci.yml` — reference for what CI does NOT need to include

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/core/tests/helpers/` — mock patterns for navigator.clipboard (reuse in benchmarks)
- `packages/react/tests/helpers/create-rich-clipboard-mock.ts` — ClipboardItem stub pattern for React bench

### Established Patterns
- All packages use `vitest run` for test execution — `vitest bench` follows same entry point
- `pnpm --filter @ngockhoi96/ctc-benchmarks bench` is the per-package invocation
- size-limit in `packages/core/package.json` shows how bundle size tooling integrates

### Integration Points
- `benchmarks/` depends on `@ngockhoi96/ctc` and `@ngockhoi96/ctc-react` as workspace deps
- `benchmarks/` adds `clipboard-copy` and `copy-to-clipboard` as devDeps (not in any published package — no contamination of zero-dep constraint)

</code_context>

<specifics>
## Specific Ideas

- hyperfine explicitly considered and rejected — not appropriate for function-level ops/sec benchmarks on a browser utility lib
- Bundle size script should produce numbers reproducible locally, not fetched from bundlephobia

</specifics>

<deferred>
## Deferred Ideas

- Hyperfine for startup/import time comparison — discussed, rejected as out of scope
- Vue and Svelte adapter overhead benchmarks — excluded from this phase; React covers the hook pattern
- CI artifact upload of bench results — excluded; local-only is sufficient for v0.4.0

</deferred>

---

*Phase: 12-benchmarks-ci-hardening*
*Context gathered: 2026-04-17*
