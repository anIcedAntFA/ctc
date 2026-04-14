# Milestones

## v0.3.0 Monorepo + Framework Adapters (Shipped: 2026-04-14)

**Phases completed:** 5 phases (04–08), 13 plans, 14 tasks
**Timeline:** 2026-04-08 → 2026-04-14 (6 days)
**Files changed:** 192 | Lines added: 33,506 | TypeScript LOC (packages): 3,659

**Key accomplishments:**

- pnpm workspaces + Turborepo monorepo — packages/core migrated as self-contained @ngockhoi96/ctc, shared tsconfig.base.json, turbo-orchestrated build/test/lint/validate pipeline
- @ngockhoi96/ctc-react — useCopyToClipboard hook returning { copy, copied, error, reset }; copied auto-resets (default 2s); 18 tests, 100% branch coverage, 737B brotli
- @ngockhoi96/ctc-vue — useCopyToClipboard composable with shallowRef + onUnmounted pattern; 19 tests, 100% branch coverage, 765B brotli
- @ngockhoi96/ctc-svelte — copyAction Svelte action (ctc:copy/ctc:error CustomEvents) + /stores (Svelte 4+5) + /runes (Svelte 5) subpath exports; 36 tests, 100% branch coverage
- Four playgrounds (vanilla/react/vue/svelte): interactive copy UX, playground/vanilla doubles as Playwright E2E fixture replacing old static HTML
- Hub README + per-package API docs + CONTRIBUTING.md + SECURITY.md + GitHub PR/issue templates + emoji changeset formatter (.changeset/changelog.cjs)

---
