# Phase 12: Benchmarks & CI Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 12-benchmarks-ci-hardening
**Areas discussed:** Bundle size comparison, Benchmark function scope, BENCHMARKS.md update strategy, CI integration depth

---

## Bundle Size Comparison

| Option | Description | Selected |
|--------|-------------|----------|
| devDeps + esbuild + Node script | Install competitors as devDeps, bundle with esbuild, measure gzip/brotli in Node | ✓ |
| Hardcoded bundlephobia data | Pull published sizes manually, embed as static table | |
| size-limit extension | Add competitors to existing size-limit config | |

**User's choice:** devDeps + esbuild + Node script
**Notes:** Produces reproducible local numbers; bundlephobia data goes stale.

---

## Benchmark Function Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Core functions only | copyToClipboard, copyRichContent, readFromClipboard — no adapter deps | |
| Core + one adapter overhead | Core + React hook wrapper overhead via renderHook | ✓ |
| Core + all adapter overhead | Core + React + Vue + Svelte — three different runtimes | |

**User's choice:** Core + one adapter overhead (React)
**Notes:** React is the most representative hook pattern; Vue/Svelte excluded from this phase.

---

## BENCHMARKS.md Update Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Static snapshot, manual | Run locally, copy output to BENCHMARKS.md, commit | |
| Script regenerates it | generate-benchmarks script rewrites BENCHMARKS.md from bench output | ✓ |
| Part of release pipeline | Regenerated during changeset version / pre-publish | |

**User's choice:** Script regenerates it
**Notes:** Script run manually by developer; not part of release pipeline.

---

## CI Integration Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Local-only | Benchmarks never run in CI; results committed as static output | ✓ |
| CI smoke test only | CI runs pnpm bench to catch errors, no value assertions | |
| CI with artifact upload | CI runs bench, uploads JSON as build artifact | |

**User's choice:** Local-only
**Notes:** Consistent with REQUIREMENTS.md explicit constraint against CI benchmark gates.

---

## Hyperfine

Raised by user mid-discussion. Hyperfine is a shell command benchmarker (wall-clock time for commands), not suited for JavaScript function-level ops/sec measurement. Would complement vitest bench for startup/import time comparison. User decided: **not needed** for this phase.

## Claude's Discretion

- Vitest bench config options (warmup, sample count)
- generate-benchmarks script language (TS vs JS)
- BENCHMARKS.md table formatting
- Exact benchmarks/ package.json structure
