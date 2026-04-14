---
phase: 07-playgrounds
created: 2026-04-13
status: ready-for-research
---

# Phase 7 Context: Playgrounds

## Phase Goal

Four standalone Vite apps in `playground/` (vanilla, react, vue, svelte) demonstrate the core clipboard API and each framework adapter. Each playground is a workspace member, `"private": true`, and excluded from CI via `--filter=./packages/*`. `playground/vanilla` doubles as the E2E fixture for `packages/core`.

## Locked Decisions

### D-01: Directory name is `playground/` (not `apps/`)
Root `playground/` directory, not `apps/`. Four subdirectories: `playground/vanilla`, `playground/react`, `playground/vue`, `playground/svelte`.

### D-02: Vanilla playground replaces E2E fixture via static build (Option B)
`playground/vanilla` is a real interactive Vite app AND the E2E test harness. Build path:
- `playground/vanilla` has a `pnpm build` script that emits to `playground/vanilla/dist/`
- `packages/core/playwright.config.ts` `webServer.command` is updated from `npx http-server . -p 8080` to serve `playground/vanilla/dist/` instead
- The `window.__clipboard = clipboard` exposure is preserved in the vanilla playground so existing E2E specs (`clipboard.spec.ts`) need zero changes
- Navigation target in E2E tests changes from `/packages/core/tests/e2e/fixtures/index.html` to the playground's root `index.html`

**Implication for planner:** Update `packages/core/playwright.config.ts` webServer to point at `playground/vanilla/dist/`. Keep `window.__clipboard` assignment. The old `packages/core/tests/e2e/fixtures/index.html` can be removed once the playground build is confirmed working.

### D-03: Detection panel shows all 4 detect functions
Every playground (vanilla, react, vue, svelte) includes a detection panel showing live state for:
1. `isClipboardApiSupported()` — Async Clipboard API availability
2. `isSecureContext()` — HTTPS / localhost context
3. `isReadPermissionGranted()` — clipboard-read permission state
4. `isWritePermissionGranted()` — clipboard-write permission state

Display as a simple 4-row table or badge grid, evaluated on load. No progressive disclosure — show all 4 regardless of API support state.

### D-04: Svelte playground layout is responsive (2-col desktop / stacked mobile)
The Svelte playground shows `use:copyAction` and `useCopyToClipboard` (runes) as two panels:
- **Desktop (≥ 768px):** CSS grid 2-column layout — action panel left, runes panel right
- **Mobile (< 768px):** Single column, action panel on top, runes panel below
- Implementation: CSS `grid-template-columns: 1fr 1fr` with a `@media (max-width: 767px)` fallback to `grid-template-columns: 1fr`
- No tabs, no toggles — both patterns always visible

### D-05: Each playground has independent minimal styling
No shared CSS package or design tokens across playgrounds. Each playground maintains its own `style.css` (or inline `<style>` in `index.html` for vanilla). Consistent visual appearance is achieved by convention (similar structure) not by shared files. Keeps each playground self-contained and independently runnable.

### D-06: Playground UX contract (all 4 playgrounds)
Every playground must demonstrate:
1. **Copy button** — a button that triggers the copy operation
2. **"Copied!" feedback** — text/state change lasting 2 seconds, then resets
3. **Error code display** — shows the `BrowserUtilsError` code if copy fails (not thrown, displayed inline)
4. **Secure context badge/indicator** — visible signal showing whether the page is in a secure context
5. **Detection panel** — 4-row display per D-03

The `copied` 2s timer is local to each playground (not exported from any adapter package).

### D-07: Playgrounds are workspace members but CI-excluded
`pnpm-workspace.yaml` adds `"playground/*"` to the packages list. Each playground's `package.json` has `"private": true`. CI workflow uses `--filter=./packages/*` — playgrounds are never linted, tested, built, or published in CI.

### D-08: Turbo `dev` task
`turbo.json` gains a `dev` task: `{ "cache": false, "persistent": true }`. Root `package.json` gains `"dev": "turbo run dev --filter=./playground/*"`. Each playground's `package.json` has a `"dev": "vite"` script.

### D-09: Port assignment (avoid conflicts)
Vite auto-port is acceptable (Vite increments from 5173 if taken). No fixed port assignment required — playgrounds are run independently or all at once via Turbo.

## Constraints Inherited from Prior Phases

- `@ngockhoi96/ctc` is the core peer dep for all adapter packages
- React adapter: `@ngockhoi96/ctc-react` — `useCopyToClipboard()` hook
- Vue adapter: `@ngockhoi96/ctc-vue` — `useCopyToClipboard()` composable
- Svelte adapter: `@ngockhoi96/ctc-svelte` — `copyAction` (action) + `useCopyToClipboard` from `/stores` or `/runes`
- Biome 2.x: no nested `biome.json` in playground dirs — root `biome.json` covers them (or they are excluded if they contain `.svelte` files)
- `playground/svelte` will contain `.svelte` files — root `biome.json` already excludes `**/*.svelte`

## Deferred Ideas

- VitePress documentation site — deferred to v0.4.0+
- Shared design system / component library across playgrounds — out of scope for this phase
- Playground deployment (Netlify/Vercel preview) — deferred to Phase 8 or later

## Open Questions for Researcher

1. Which Vite version to use — latest stable or pin to the version already in the monorepo dev environment?
2. Does `@vitejs/plugin-react` (HMR fast refresh) require `@types/react` in playground devDeps, or is it sufficient to rely on `@ngockhoi96/ctc-react`'s peer deps?
3. Svelte playground Vite config — does it need `@sveltejs/vite-plugin-svelte` as a devDep (separate from `packages/svelte`)?
4. `playground/vanilla` build output path — confirm that `playwright.config.ts` `webServer` change works with Playwright's URL resolution for existing spec navigation.
