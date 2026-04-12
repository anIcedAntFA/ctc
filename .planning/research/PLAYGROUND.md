# Research: Playground Structure for @ngockhoi96/ctc

**Researched:** 2026-04-13
**Confidence:** MEDIUM (training data through Aug 2025; live repos not verified via network)

---

## Recommendation (bottom line up front)

Use **separate per-framework Vite apps** under `playground/`. Add `playground/vanilla` first — it doubles as the E2E fixture. Framework playgrounds are added when, and only when, the corresponding adapter package exists. CI runs `--filter=./packages/*` so playgrounds never block the pipeline.

---

## How Reference Libraries Structure Their Playgrounds

### TanStack Query — closest comparable (core + per-framework adapters)

```
packages/
  query-core/
  react-query/
  vue-query/
  svelte-query/
examples/
  react/basic/      ← self-contained Vite app, own package.json
  vue/basic/
  svelte/basic/
```

Each `examples/<framework>/<name>/` is an independent Vite app with `file:../../packages/<adapter>` local path refs. **None participate in the Turborepo pipeline** — `turbo.json` covers `packages/**` only. StackBlitz links point at individual example directories via the GitHub tree URL.

### VueUse — co-located demos (single-framework pattern, not portable to ctc)

```
packages/core/useClipboard/
  index.ts
  demo.vue       ← co-located, imported into VitePress page
  index.md
```

Works for single-framework only. Multi-framework would require `demo.react.tsx` + `demo.vue` + `demo.svelte` next to a framework-agnostic source file — messy.

### Floating UI — conflates docs and playground (too heavy)

Next.js `website/` directory IS the playground via `<Preview>` wrapper components in docs pages. Overkill for a clipboard utility.

### Radix UI — Storybook in `apps/storybook/`

Wrong tool for clipboard utilities — nothing to render in a story when the operation is invisible.

### Motion/Framer — delegates entirely to CodeSandbox/StackBlitz embeds

No committed `examples/` tree. Good for large libs; not for ctc where a local playground also serves as E2E fixture.

---

## Vite Plugin Isolation — Why Separate Apps

**Single app with framework tabs**: avoid. `@vitejs/plugin-react` + `vite-plugin-svelte` in one config creates transform pipeline conflicts and unreliable HMR. Not officially supported.

**Separate per-framework Vite apps**: correct for ctc.

```
playground/
  vanilla/      ← no framework; doubles as existing E2E fixture
  react/        ← add with ctc-react
  vue/          ← add with ctc-vue
  svelte/       ← add with ctc-svelte
```

Each is an independent `pnpm create vite` scaffold. StackBlitz links work automatically via `stackblitz.com/github/anIcedAntFA/ctc/tree/main/playground/react`.

---

## pnpm Workspaces + Turborepo for Playground Apps

**pnpm-workspace.yaml:**
```yaml
packages:
  - packages/*      # ctc, ctc-react, ctc-vue, ctc-svelte
  - playground/*    # vanilla, react, vue, svelte
```

All playgrounds are workspace members (`"private": true`) so `workspace:*` protocol resolves local packages. Changesets never touches private packages.

**Turborepo:** Playgrounds only appear under the `dev` task (`cache: false, persistent: true`). They never produce `dist/**` outputs and are excluded from CI:

```yaml
# .github/workflows/ci.yml
- run: pnpm turbo run build test lint --filter=./packages/*
```

Local development:
```bash
pnpm turbo run dev --filter=@ngockhoi96/ctc-playground-react
```

---

## What a Clipboard Playground Must Demonstrate

**Required demo scenarios:**

1. **Copy button with 2s copied-state timer** — "Copy" → "Copied!" → reset. Timer must clear on unmount.
2. **Error code display** — render `BrowserUtilsError.code` from `onError` with human labels: `INSECURE_CONTEXT`, `CLIPBOARD_NOT_SUPPORTED`, `CLIPBOARD_PERMISSION_DENIED`, `CLIPBOARD_WRITE_FAILED`. Must be visible in UI, not just the console.
3. **Secure context indicator** — green/red badge from `isClipboardSupported()`. When HTTP: show legacy section, hide modern API section.
4. **Read-from-clipboard demo** — calls `readFromClipboard()`, renders result or error. Makes browser permission prompt visible.
5. **Detection status panel** — static display of both detection function results.
6. **Legacy fallback section** — explicit `copyToClipboardLegacy()` demo, visually separated.

**Clipboard-specific constraints:**

- **localhost is a secure context.** Dev server always passes. To demo the HTTP path, implement `?mock=insecure` query param — local flag in playground state, do not modify the library.
- **Permission state is sticky.** Once denied, `CLIPBOARD_PERMISSION_DENIED` on every call until user resets browser settings. Playground should render reset instructions.
- **User gesture is mandatory.** All calls inside click handlers. No auto-copy-on-mount examples.

**Recommended per-framework component structure:**
```
playground/react/src/
  App.tsx
  components/
    ContextBadge.tsx        ← HTTPS vs HTTP indicator
    CopyDemo.tsx            ← copy button + timer
    ReadDemo.tsx            ← read result/error
    LegacyDemo.tsx          ← copyToClipboardLegacy section
    DetectionPanel.tsx      ← feature detection status
    ErrorDisplay.tsx        ← BrowserUtilsError.code → readable label
```

The `useCopiedState` 2s timer hook must be **local to the playground**, not imported from `ctc-react`. The playground demonstrates the primitive API; sugar belongs in the adapter.

---

## Astro Islands — Deferred

Astro can render React + Vue + Svelte on one page via `client:load` islands, enabling side-by-side framework comparison. But: non-trivial config, all three runtimes load upfront, maintainers need Astro knowledge.

**Decision:** Skip for v0.3.0. Revisit when DOCS-01 (VitePress/docs site) enters scope — at that point an Astro docs site with per-framework API islands is worth the investment.

---

## Gaps / Open Questions

- TanStack/Floating UI structures from training data; confirm current state when Phase 7 planning begins.
- `?mock=insecure` query param vs second dev server on LAN IP for HTTP path testing — decide at implementation.
- Astro multi-framework islands need a scratch-project test before adopting for future docs site.
