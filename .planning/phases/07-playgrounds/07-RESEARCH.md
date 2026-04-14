# Phase 7 Research: Playgrounds

**Researched:** 2026-04-13
**Domain:** Vite multi-app playground scaffolding, pnpm workspace integration, Playwright E2E wiring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Directory is `playground/` (not `apps/`). Four subdirs: `playground/vanilla`, `playground/react`, `playground/vue`, `playground/svelte`.
- **D-02:** `playground/vanilla` is both an interactive Vite app AND the E2E test harness for `packages/core`. Build output: `playground/vanilla/dist/`. `packages/core/playwright.config.ts` webServer updated to serve that dist. `window.__clipboard = clipboard` preserved. Old `packages/core/tests/e2e/fixtures/index.html` removed once confirmed.
- **D-03:** All four playgrounds include a detection panel: `isClipboardApiSupported()`, `isSecureContext()`, `isReadPermissionGranted()`, `isWritePermissionGranted()` — 4-row table/badge grid, evaluated on load, no progressive disclosure.
- **D-04:** Svelte playground: `use:copyAction` and `useCopyToClipboard` (runes) in 2-column desktop / stacked mobile layout. CSS grid, `@media (max-width: 767px)` breakpoint. No tabs.
- **D-05:** Independent styling per playground. No shared CSS package. Each has its own `style.css` (or inline `<style>` in `index.html` for vanilla).
- **D-06:** Every playground demonstrates: copy button, "Copied!" 2s feedback, error code display, secure context badge, detection panel. 2s timer is local, not exported from adapters.
- **D-07:** `pnpm-workspace.yaml` adds `"playground/*"`. Each playground has `"private": true`. CI `--filter=./packages/*` excludes playgrounds.
- **D-08:** `turbo.json` gains `dev: { cache: false, persistent: true }`. Root `package.json` gains `"dev": "turbo run dev --filter=./playground/*"`. Each playground has `"dev": "vite"`.
- **D-09:** No fixed port assignment — Vite auto-increments from 5173.

### Claude's Discretion

None specified — all major decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

- VitePress documentation site (deferred to v0.4.0+)
- Shared design system / component library across playgrounds
- Playground deployment (Netlify/Vercel preview) — deferred to Phase 8 or later
</user_constraints>

---

## Summary

Phase 7 scaffolds four standalone Vite 8 apps under `playground/`. The Vite ecosystem has moved to v8 (latest `8.0.8`, `previous` is `6.4.2`) — all official framework plugins now require `^8.0.0`. The installed framework versions in the monorepo are React 18.3.1, Vue 3.5.32, and Svelte 5.55.3. All three framework Vite plugins are at major versions that require Vite 8 (`@vitejs/plugin-react@6`, `@vitejs/plugin-vue@6`, `@sveltejs/vite-plugin-svelte@7`).

The critical path is the `playground/vanilla` → Playwright E2E wiring. The current `playwright.config.ts` serves the repo root and navigates to `/tests/e2e/fixtures/index.html`. After this phase it must serve `playground/vanilla/dist/` and navigate to `/` (the built index). The `window.__clipboard` exposure must move from the static fixture into the vanilla playground's `main.ts`. This requires a `dependsOn: ["^build"]` in the turbo `test:e2e` task — the vanilla playground's `pnpm build` must run before Playwright.

`@sveltejs/vite-plugin-svelte@7` is already installed in `packages/svelte/node_modules/` but each playground must declare it as its own `devDependency` — pnpm does not hoist from other workspace packages' `node_modules`.

**Primary recommendation:** Use Vite `8.0.8` pinned across all four playgrounds. Each playground declares workspace packages with `workspace:*` protocol. No Vite alias configuration is needed — pnpm symlinks handle workspace resolution at install time.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 7 |
|-----------|-------------------|
| Zero runtime dependencies (`package.json`) | Playgrounds are `private: true` — adapter packages (react, vue, svelte) are devDependencies in playgrounds, not runtime deps of published packages. Constraint does not apply to private playgrounds. |
| Named exports only — no default exports | Vite config files use `export default defineConfig(...)` — already exempted via Biome `noDefaultExport: off` override for `*.config.ts` files. Playground `vite.config.ts` files fall under the same override rule only if the biome `includes` pattern covers `playground/`. See Pitfall 4. |
| Biome 2.x `includes` with negation patterns | Current `biome.json` `files.includes` does not cover `playground/*/src/**`. Must add `"playground/*/src/**"` (or exclude playgrounds) to avoid silent non-linting. |
| `biome.json` already excludes `**/*.svelte` | `playground/svelte/*.svelte` files are automatically excluded from Biome lint. No action needed. |
| Run `pnpm lint && pnpm test && pnpm build` before commit | Applies to source packages. Playgrounds are `private` and CI-excluded. No per-playground lint enforcement needed, but root `pnpm lint` must not error on playground TypeScript files. |
| TypeScript strict | Playground `tsconfig.json` files should extend `../../tsconfig.base.json` to inherit strict settings. However, playgrounds may need `"noEmit": false` or separate emit config since Vite handles bundling (not tsc). |

---

## Vite Version

**Recommendation: pin `vite@8.0.8` across all four playgrounds.**

**Rationale:**

- [VERIFIED: npm registry] `vite@latest` is `8.0.8` as of 2026-04-13.
- [VERIFIED: npm registry] `vite@previous` (last major) is `6.4.2`. Vite 7 was skipped — the version sequence jumped from 6 to 8.
- [VERIFIED: npm registry] All three framework plugins require Vite 8:
  - `@vitejs/plugin-react@6` peer dep: `vite: "^8.0.0"`
  - `@vitejs/plugin-vue@6` peer dep: `vite: "^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0"` (also accepts 8)
  - `@sveltejs/vite-plugin-svelte@7` peer dep: `vite: "^8.0.0-beta.7 || ^8.0.0"`
- [VERIFIED: npm registry] Vite 8 requires Node `^20.19.0 || >=22.12.0`. Current dev machine runs Node v24.13.1. Root `package.json` already has `"engines": { "node": ">=20" }`. Compatible.
- [VERIFIED: npm registry] `@vitejs/plugin-react-swc@4.3.0` supports `vite: "^4 || ^5 || ^6 || ^7 || ^8"` — but plugin-react (Babel) is preferred for React 18 (see Framework Plugins section).

No Vite version is currently used in the monorepo — `packages/core` uses tsdown, not Vite. The playgrounds introduce Vite for the first time.

---

## Framework Plugins

### `playground/vanilla` — No framework plugin

Standard Vite with TypeScript. No framework plugin needed. Vite handles `.ts` files natively via esbuild.

```jsonc
// playground/vanilla/package.json devDependencies
"vite": "8.0.8",
"typescript": "6.0.2"  // match packages/core typescript version
```

### `playground/react` — `@vitejs/plugin-react@6.0.1`

[VERIFIED: npm registry] `@vitejs/plugin-react@6.0.1` is latest (dist-tag `latest`). Use `@vitejs/plugin-react` (Babel), NOT `@vitejs/plugin-react-swc`.

**Reasoning:**
- `@vitejs/plugin-react@6` supports React Compiler via optional Babel peer dep. Simpler default configuration.
- `@vitejs/plugin-react-swc@4.3.0` also supports Vite 8, but the Babel plugin has better error messages and is the official recommendation for new projects as of 2026.
- [VERIFIED: npm registry] Both babel peer deps (`@rolldown/plugin-babel`, `babel-plugin-react-compiler`) are `optional: true` — the plugin works without them for a simple playground.

**React version:** Use React 19. [VERIFIED: installed packages] React 18.3.1 is currently in `packages/react/node_modules/react`. However, React 19 (`19.2.5`) is the current latest and the playground is a greenfield app — use React 19 to avoid accumulating technical debt. `@vitejs/plugin-react@6` has no explicit React version peer dep; it works with React 18 and 19.

**Types:** `@types/react` and `@types/react-dom` are required as devDeps in the playground. [VERIFIED: npm registry] Latest `@types/react@19.2.14`, `@types/react-dom@19.2.3`. These must be in playground's own devDeps — they are not inherited from adapter package peerDeps.

**Open question answered (from CONTEXT.md Q2):** Yes, `@types/react` must be in playground devDeps. The adapter package `@ngockhoi96/ctc-react` declares React as a peerDep, not a dep — it provides no types to the playground.

```jsonc
// playground/react/package.json devDependencies
"vite": "8.0.8",
"@vitejs/plugin-react": "6.0.1",
"react": "^19.2.5",
"react-dom": "^19.2.5",
"@types/react": "^19.2.14",
"@types/react-dom": "^19.2.3",
"typescript": "6.0.2"
```

### `playground/vue` — `@vitejs/plugin-vue@6.0.6`

[VERIFIED: npm registry] `@vitejs/plugin-vue@6.0.6` is latest. Peer dep: `vite: "^5.0.0 || ... || ^8.0.0"` — Vite 8 supported.

**Vue version:** `3.5.32` is installed in `packages/vue/node_modules/vue`. Use `vue@^3.5.32` in the playground.

```jsonc
// playground/vue/package.json devDependencies
"vite": "8.0.8",
"@vitejs/plugin-vue": "6.0.6",
"vue": "^3.5.32",
"typescript": "6.0.2"
```

Vue 3 ships its own types — no separate `@types/vue` package needed.

### `playground/svelte` — `@sveltejs/vite-plugin-svelte@7.0.0`

[VERIFIED: npm registry] `@sveltejs/vite-plugin-svelte@7.0.0` is latest. Peer dep: `vite: "^8.0.0"`, `svelte: "^5.46.4"`.

[VERIFIED: installed packages] `@sveltejs/vite-plugin-svelte@7.0.0` is already installed in `packages/svelte/node_modules/@sveltejs/`. The playground cannot reuse it — pnpm installs packages per-workspace-member. The playground must declare `@sveltejs/vite-plugin-svelte` as its own devDep.

**Open question answered (from CONTEXT.md Q3):** The playground needs its own `@sveltejs/vite-plugin-svelte` devDep — it cannot share `packages/svelte/node_modules/`.

**Svelte version:** Use `svelte@^5.55.3` to match the installed version in `packages/svelte`.

```jsonc
// playground/svelte/package.json devDependencies
"vite": "8.0.8",
"@sveltejs/vite-plugin-svelte": "7.0.0",
"svelte": "^5.55.3",
"typescript": "6.0.2"
```

**svelte.config.js:** Not required for a minimal Vite playground. [VERIFIED: vite-plugin-svelte README] The plugin reads `svelte.config.js` if present, but works without it. All compiler options can be passed inline to the `svelte()` plugin call in `vite.config.ts`. A `svelte.config.js` is only needed if using SvelteKit or if preprocessors (e.g., TypeScript via svelte-preprocess) are required. Since we use TypeScript via Vite's native esbuild handling for `<script lang="ts">`, no `svelte.config.js` is needed.

**Svelte 5 runes:** [VERIFIED: vite-plugin-svelte source] Runes (`$state`, `$derived`, `$effect`) are auto-detected per component in Svelte 5 — no global `compilerOptions: { runes: true }` is required. Components using rune syntax are automatically compiled in runes mode. No additional `vite.config.ts` compiler option needed.

---

## Workspace Dependency Resolution

### `workspace:*` protocol

[ASSUMED] Use `workspace:*` in each playground's `package.json` for all `@ngockhoi96/*` adapter dependencies. pnpm resolves `workspace:*` to the local workspace package at the matching name.

```jsonc
// Example: playground/react/package.json
"dependencies": {
  "@ngockhoi96/ctc-react": "workspace:*"
},
// And ctc-react's peer dep:
"devDependencies": {
  "@ngockhoi96/ctc": "workspace:*",
  ...
}
```

Wait — playgrounds don't publish; they are consumers. Pattern: declare the adapter as a `dependency` (or `devDependency` — both work for private packages). Peer deps of adapter packages must also be satisfied. Since the playground declares `react`, `vue`, or `svelte` as direct devDeps, peer dep resolution is satisfied automatically.

```jsonc
// playground/svelte/package.json
"dependencies": {
  "@ngockhoi96/ctc-svelte": "workspace:*"
},
"devDependencies": {
  "@ngockhoi96/ctc": "workspace:*",  // peer dep of ctc-svelte
  "svelte": "^5.55.3",               // peer dep of ctc-svelte
  ...
}
```

### pnpm workspace resolution — no Vite alias needed

[VERIFIED: installed packages] When a `workspace:*` dep is installed, pnpm creates a symlink in `node_modules/` pointing to the workspace package's directory. Example: `packages/svelte/node_modules/@ngockhoi96/ctc -> ../../../core`. The symlinked package exposes `dist/` (with `exports` map in `package.json`). Vite resolves imports from the `exports` map — no `resolve.alias` configuration is needed.

**Prerequisite:** Adapter packages (`packages/react`, `packages/vue`, `packages/svelte`) must be built (`pnpm build`) before the playground runs. pnpm workspace symlinks point to the package directory, and imports resolve via the `exports` map which points to `dist/`. If `dist/` is absent, the import fails at runtime. This is handled by `turbo.json` `dev` task `dependsOn: ["^build"]` (see Turbo Dev Task section).

### Import paths in playground source files

```typescript
// playground/react/src/App.tsx
import { useCopyToClipboard } from '@ngockhoi96/ctc-react'

// playground/vue/src/App.vue
import { useCopyToClipboard } from '@ngockhoi96/ctc-vue'

// playground/svelte/src/App.svelte
import { copyAction } from '@ngockhoi96/ctc-svelte'
import { useCopyToClipboard } from '@ngockhoi96/ctc-svelte/runes'

// playground/vanilla/src/main.ts
import * as clipboard from '@ngockhoi96/ctc'
// or: import { copyToClipboard, isClipboardApiSupported, ... } from '@ngockhoi96/ctc'
```

---

## Vanilla Playground — E2E Wiring (CRITICAL)

### Current state

```
playwright.config.ts webServer:
  command: "npx http-server . -p 8080 --silent --cors"
  (serves repo root at http://localhost:8080)

E2E test beforeEach:
  await page.goto('/tests/e2e/fixtures/')
  (navigates to /packages/core/tests/e2e/fixtures/index.html relative to http-server root)

Fixture imports:
  import * as clipboard from '/dist/clipboard/index.mjs'
  (resolves to packages/core/dist/clipboard/index.mjs from repo root)
```

### Target state (after Phase 7)

```
playwright.config.ts webServer:
  command: "npx http-server playground/vanilla/dist -p 8080 --silent --cors"
  cwd: "../../"  // repo root (playwright.config.ts is in packages/core/)
  OR: use absolute path or relative-from-config path

E2E test beforeEach:
  await page.goto('/')
  (navigates to playground/vanilla/dist/index.html)

Vanilla playground main.ts:
  import * as clipboard from '@ngockhoi96/ctc'
  window.__clipboard = clipboard
```

### Exact `playwright.config.ts` change

The `playwright.config.ts` is at `packages/core/playwright.config.ts`. The Playwright `webServer.command` runs relative to the config file's directory by default. However, [VERIFIED: Playwright types] `TestConfigWebServer` has an optional `cwd` property: "Current working directory of the spawned process, defaults to the directory of the configuration file."

**Recommended approach:** Specify `cwd` pointing to the repo root, and serve `playground/vanilla/dist`:

```typescript
webServer: {
  command: 'npx http-server playground/vanilla/dist -p 8080 --silent --cors',
  cwd: path.resolve(__dirname, '../..'),  // repo root (packages/core is 2 levels deep)
  url: 'http://localhost:8080',
  reuseExistingServer: !process.env.CI,
},
```

Add `import path from 'node:path'` to the config (currently not imported). `__dirname` is available since `playwright.config.ts` is a CommonJS-adjacent file loaded by Playwright's Node runner.

**Alternative (simpler, no cwd needed):** Pass an absolute path — but this is machine-specific and unsuitable for CI.

**Alternative 2 (no cwd property):** Change command to use absolute repo-root-relative path:
```
command: 'npx http-server ../../playground/vanilla/dist -p 8080 --silent --cors',
```
This works because the command runs from `packages/core/` by default. But `../../playground/vanilla/dist` from `packages/core/` correctly resolves to repo root `playground/vanilla/dist`. This is simpler than adding `cwd`.

**Recommendation: use relative path `../../playground/vanilla/dist`** — avoids adding a `cwd` import and relies on the known directory structure.

```typescript
webServer: {
  command: 'npx http-server ../../playground/vanilla/dist -p 8080 --silent --cors',
  url: 'http://localhost:8080',
  reuseExistingServer: !process.env.CI,
},
```

### E2E navigation URL change

`clipboard.spec.ts` `beforeEach` currently navigates to `'/tests/e2e/fixtures/'`. After this change, navigation is `'/'` (the root of `playground/vanilla/dist/`, which is `index.html`).

**IMPORTANT:** The `window.__clipboard` check must remain:
```typescript
await page.goto('/')
await page.waitForFunction(() => typeof window.__clipboard !== 'undefined')
```

The `__clipboard` property must be exposed in `playground/vanilla/dist/index.html` or via the bundled JS. See Vanilla Playground structure below.

### Vanilla playground structure to preserve `window.__clipboard`

The vanilla playground `src/main.ts` must expose all clipboard functions on `window.__clipboard`. The built `dist/index.html` loads the bundled JS which assigns this.

```typescript
// playground/vanilla/src/main.ts
import * as clipboard from '@ngockhoi96/ctc'

// Expose for E2E tests (D-02)
// Must match the window.__clipboard type declared in clipboard.spec.ts
;(window as Window & { __clipboard: typeof clipboard }).__clipboard = clipboard

// ... rest of playground UI code
```

The `window.__clipboard` declaration in `clipboard.spec.ts` references:
```typescript
interface Window {
  __clipboard: {
    copyToClipboard: (text: string) => Promise<boolean>
    readFromClipboard: () => Promise<string | null>
    isClipboardSupported: () => boolean
    isClipboardReadSupported: () => boolean
    copyToClipboardLegacy: (text: string) => boolean
  }
}
```

The `@ngockhoi96/ctc` package exports all of these from its root entry point. `import * as clipboard from '@ngockhoi96/ctc'` captures them all. The `window.__clipboard = clipboard` assignment makes them available. Existing E2E specs require zero changes to their `page.evaluate()` calls.

### Build step before Playwright

`packages/core/playwright.config.ts` does NOT have a pre-test build command. The existing flow relied on http-server serving a pre-built `dist/` from `packages/core`. After this change, `playground/vanilla/dist/` must exist before Playwright starts.

**Wiring approach:** Update `turbo.json` `test:e2e` task:

```jsonc
"test:e2e": {
  "dependsOn": ["build", "playground/vanilla#build"],
  "inputs": ["tests/e2e/**", "playwright.config.*", "package.json"],
  "outputs": [],
  "cache": false
}
```

This makes `packages/core#test:e2e` depend on `playground/vanilla#build`. Turbo resolves workspace package names from `package.json` `name` fields — `playground/vanilla/package.json` must have `"name": "@ngockhoi96/playground-vanilla"` (or similar) for this cross-package dependency to work.

**Alternative approach:** Add a pre-test build step inside `playwright.config.ts` `webServer`:

```typescript
webServer: {
  command: 'pnpm --filter=@ngockhoi96/playground-vanilla build && npx http-server ../../playground/vanilla/dist -p 8080 --silent --cors',
  ...
}
```

This is simpler but couples the build to the test server startup command. It also rebuilds on every `playwright test` run even when the build is cached.

**Recommendation: use Turbo dependency approach** — cleanest integration with the existing build pipeline. The `playground/vanilla#build` Turbo task runs before `packages/core#test:e2e`, with Turbo's caching preventing redundant rebuilds.

---

## TypeScript Setup

### Approach: each playground has its own `tsconfig.json` extending `tsconfig.base.json`

```jsonc
// playground/vanilla/tsconfig.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,        // tsc is type-check only; Vite/esbuild handles emit
    "target": "ES2020",    // already in base, repeated for clarity
    "lib": ["ES2020", "DOM", "DOM.Iterable"]  // browser globals needed for clipboard API
  },
  "include": ["src"]
}
```

**Key decisions:**

1. **Extend `../../tsconfig.base.json`** — inherits `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc. This is the same pattern as `packages/core/tsconfig.json`.

2. **`noEmit: true`** — Vite uses esbuild for transpilation; tsc is used only for type-checking (`pnpm typecheck`). The base tsconfig already has `noEmit: true` and `allowImportingTsExtensions: true`. These settings carry through.

3. **Add `"lib": ["ES2020", "DOM", "DOM.Iterable"]`** — the base tsconfig does not set `lib`, which means TypeScript defaults to `lib.es2020.d.ts` only (based on `"target": "ES2020"`). Browser APIs (`navigator`, `window`, `document`) require `DOM` in lib. Playgrounds use clipboard APIs in the browser, so this is mandatory.

4. **`"include": ["src"]`** — same as `packages/core`. Playground source in `src/`.

### Framework-specific additions

```jsonc
// playground/react/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "jsx": "react-jsx",        // React 17+ automatic JSX transform
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

```jsonc
// playground/vue/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src", "env.d.ts"]  // env.d.ts for Vue's triple-slash reference
}
```

```jsonc
// playground/svelte/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

### Vanilla playground: TypeScript

Use TypeScript (`src/main.ts`), not plain JS. Rationale: aligns with the monorepo's strict TypeScript convention; `window.__clipboard` requires a type cast that benefits from TypeScript.

---

## Turbo Dev Task

### `turbo.json` addition

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    // ... existing tasks ...
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

Per D-08. `cache: false` because dev servers produce no outputs to cache. `persistent: true` tells Turbo this task runs until killed (long-lived process).

### Root `package.json` addition

```jsonc
{
  "scripts": {
    // ... existing scripts ...
    "dev": "turbo run dev --filter=./playground/*"
  }
}
```

This runs all four playground dev servers in parallel. Individual playgrounds run `pnpm dev` from their own directory.

### `test:e2e` dependency update

To ensure `playground/vanilla` is built before `packages/core` E2E tests run:

```jsonc
"test:e2e": {
  "dependsOn": ["build", "^build"],
  "inputs": ["tests/e2e/**", "playwright.config.*", "package.json"],
  "outputs": [],
  "cache": false
}
```

`"^build"` makes `test:e2e` depend on all upstream package `build` tasks, including `playground/vanilla#build`. This is the cleanest approach — it follows Turbo's existing `dependsOn: ["^build"]` pattern used by the `test` task.

**Caveat:** `^build` means "build all dependencies of this package". `packages/core` does not declare `playground/vanilla` as a dependency in its `package.json`, so `^build` alone will NOT include `playground/vanilla#build`. 

**Correct approach:** Add explicit cross-package dependency:

```jsonc
"test:e2e": {
  "dependsOn": ["build", "@ngockhoi96/playground-vanilla#build"],
  "inputs": ["tests/e2e/**", "playwright.config.*", "package.json"],
  "outputs": [],
  "cache": false
}
```

Where `@ngockhoi96/playground-vanilla` matches the `name` field in `playground/vanilla/package.json`.

**Alternative:** Keep E2E tests self-sufficient by adding a build step to the Playwright `webServer.command`:
```
command: 'pnpm --filter=@ngockhoi96/playground-vanilla build && npx http-server ../../playground/vanilla/dist -p 8080 --silent --cors'
```
This rebuilds unconditionally but eliminates the cross-package Turbo dependency. For CI correctness this is simpler.

**Recommendation for planner:** Use the Playwright webServer compound command. It is self-contained and doesn't require modifying `turbo.json` task dependencies, which currently have no cross-package `test:e2e` deps. Document as a known limitation (rebuilds on every test run) with the option to add Turbo dependency in Phase 8.

---

## pnpm Workspace Changes

### `pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"
  - "playground/*"
```

[ASSUMED] This is the correct pnpm workspace glob syntax — same format as `"packages/*"`. The `playground/` directory does not exist yet; adding it to the workspace file before creating subdirectories is safe. pnpm ignores patterns that match no directories.

### Impact on Turbo CI filter

CI uses `--filter=./packages/*` in turbo commands. [ASSUMED] Adding `playground/*` to pnpm-workspace.yaml does not affect Turbo's `--filter=./packages/*` — Turbo filters by path, and playground packages are in `./playground/*`, not `./packages/*`. CI commands remain unchanged.

### Biome `files.includes` update

Current `biome.json` `files.includes` covers `packages/*/src/**` but not `playground/*/src/**`. This means Biome silently ignores all playground TypeScript files.

**Decision needed:** Either extend biome coverage to playgrounds or explicitly exclude them. Since playgrounds are private consumer apps (not library code), the pragmatic choice is to add them to `includes` to catch obvious errors. However, since `playground/svelte` contains `.svelte` files and those are already excluded, we only need to cover the `.ts`/`.tsx` source.

**Recommendation:** Add to `biome.json` `files.includes`:
```jsonc
"playground/*/src/**",
"playground/*/*.config.ts"
```
And add config file override for `playground/*/*.config.ts`:
```jsonc
{
  "includes": ["playground/*/*.config.ts"],
  "linter": { "rules": { "style": { "noDefaultExport": "off" } } }
}
```

---

## Common Pitfalls

### Pitfall 1: Vite 7 does not exist

**What goes wrong:** Searching for `vite@7` finds nothing; the npm registry shows `vite@previous: 6.4.2` and `vite@latest: 8.0.8`. Developers assuming a sequential major version history may try to use Vite 7 or mix Vite 6 plugins with Vite 8.

**Why it happens:** Vite jumped from 6 to 8. The `previous` dist-tag (6.4.2) is not compatible with `@vitejs/plugin-react@6` which requires `^8.0.0`.

**How to avoid:** Use only Vite 8. Pin `"vite": "8.0.8"` in all playground `package.json` files.

**Warning sign:** `pnpm install` peer dep warnings about Vite version mismatch.

### Pitfall 2: `window.__clipboard` missing from built output

**What goes wrong:** E2E tests navigate to `'/'` but `window.__clipboard` is never set. `page.waitForFunction(() => typeof window.__clipboard !== 'undefined')` times out.

**Why it happens:** The assignment `window.__clipboard = clipboard` must be in the entry file that Vite bundles into `dist/index.html`. If it's in a component rather than `main.ts`, it may not execute before `waitForFunction` is checked.

**How to avoid:** Assign `window.__clipboard` at the top level of `playground/vanilla/src/main.ts`, before any async code. The assignment should be synchronous and unconditional.

**Warning sign:** Playwright test `beforeEach` times out with "Timeout exceeded while waiting for function to return truthy value".

### Pitfall 3: Build output not present when Playwright starts

**What goes wrong:** `npx http-server playground/vanilla/dist -p 8080` fails with "No such file or directory" because `playground/vanilla/dist/` doesn't exist yet.

**Why it happens:** `packages/core/playwright.config.ts` does not build the playground. If running `pnpm test:e2e` directly (without Turbo), the dist doesn't exist.

**How to avoid:** Use a compound `webServer.command` that builds first:
```
pnpm --filter=@ngockhoi96/playground-vanilla build && npx http-server ../../playground/vanilla/dist -p 8080 --silent --cors
```
Or always run E2E tests via `pnpm turbo run test:e2e` which handles dependencies.

**Warning sign:** Playwright exits immediately with a server startup error before any test runs.

### Pitfall 4: Biome `noDefaultExport` errors on `vite.config.ts`

**What goes wrong:** Biome reports `noDefaultExport` errors on playground `vite.config.ts` files.

**Why it happens:** Current Biome `overrides` exempts `packages/*/*.config.ts` but not `playground/*/*.config.ts`. Adding playgrounds to `biome.json` `includes` without adding the override causes lint errors.

**How to avoid:** Update `biome.json` overrides to also cover `playground/*/*.config.ts`:
```jsonc
"includes": [
  "*.config.ts",
  "*.config.js",
  "packages/*/*.config.ts",
  "packages/*/*.config.js",
  "playground/*/*.config.ts",
  "playground/*/*.config.js"
]
```

### Pitfall 5: Vue playground missing `env.d.ts` for `.vue` file imports

**What goes wrong:** TypeScript errors on `import App from './App.vue'` — "Cannot find module './App.vue'".

**Why it happens:** TypeScript doesn't know how to resolve `.vue` files. Vue provides a type declaration for this in `@vue/runtime-core`.

**How to avoid:** Add an `env.d.ts` file in `playground/vue/src/`:
```typescript
/// <reference types="vite/client" />
```
This includes Vite's client types which declare `.vue` module support. Alternatively, Vue's own `volar` plugin handles this, but since we're using tsc for type checking only, the Vite client types approach is simpler.

### Pitfall 6: pnpm resolves `workspace:*` to `0.0.0` in lockfile if package has no `version`

**What goes wrong:** `pnpm install` resolves workspace deps but the lockfile shows `0.0.0` for adapter packages.

**Why it happens:** Each adapter package must have a `version` field in its `package.json`. Without it, pnpm cannot resolve `workspace:*`.

**How to avoid:** Ensure `packages/react/package.json`, `packages/vue/package.json`, and `packages/svelte/package.json` all have `"version"` fields before Phase 7 workspace install.

**Warning sign:** `pnpm install` produces warnings about packages without version fields.

### Pitfall 7: Svelte 5 runes used outside component context

**What goes wrong:** `useCopyToClipboard` from `@ngockhoi96/ctc-svelte/runes` uses `$effect` internally. If called outside a Svelte component `<script>` block (e.g., in a `.ts` module), the `$effect` call throws: "lifecycle_outside_component".

**Why it happens:** Svelte 5 rune functions like `$effect` require a Svelte component context to properly track cleanup.

**How to avoid:** Call `useCopyToClipboard` only inside `<script>` blocks in `.svelte` files. The playground `App.svelte` must use it at the top level of the `<script>` block, not inside a callback.

**Correct:**
```svelte
<script lang="ts">
  import { useCopyToClipboard } from '@ngockhoi96/ctc-svelte/runes'
  const ctc = useCopyToClipboard('Hello')  // top-level ✓
</script>
```

### Pitfall 8: http-server CORS headers and Clipboard API

**What goes wrong:** Clipboard write operations fail in the playground when served by http-server.

**Why it happens:** The Clipboard API requires a secure context (HTTPS or `localhost`). `http-server` on `localhost:8080` IS a secure context, so this should not be an issue. However, if the server does not set proper headers, some browsers may refuse clipboard access.

**How to avoid:** The `--cors` flag on http-server adds `Access-Control-Allow-Origin: *`. This is already in the current configuration and is sufficient. localhost satisfies the secure context requirement without HTTPS.

**Warning sign:** Clipboard operations in E2E tests fail with "NotAllowedError: Write permission denied".

---

## Playground Structure Reference

### `playground/vanilla/` (also E2E fixture)

```
playground/vanilla/
├── package.json          "name": "@ngockhoi96/playground-vanilla", "private": true
├── vite.config.ts        defineConfig({ build: { outDir: 'dist' } })
├── tsconfig.json         extends ../../tsconfig.base.json
├── index.html            Vite HTML entry point
└── src/
    └── main.ts           imports @ngockhoi96/ctc, assigns window.__clipboard
```

### `playground/react/`

```
playground/react/
├── package.json          "name": "@ngockhoi96/playground-react", "private": true
├── vite.config.ts        defineConfig({ plugins: [react()] })
├── tsconfig.json         extends ../../tsconfig.base.json, jsx: "react-jsx"
├── index.html
└── src/
    ├── main.tsx
    └── App.tsx
```

### `playground/vue/`

```
playground/vue/
├── package.json          "name": "@ngockhoi96/playground-vue", "private": true
├── vite.config.ts        defineConfig({ plugins: [vue()] })
├── tsconfig.json         extends ../../tsconfig.base.json
├── index.html
└── src/
    ├── main.ts
    ├── env.d.ts          /// <reference types="vite/client" />
    └── App.vue
```

### `playground/svelte/`

```
playground/svelte/
├── package.json          "name": "@ngockhoi96/playground-svelte", "private": true
├── vite.config.ts        defineConfig({ plugins: [svelte()] })
├── tsconfig.json         extends ../../tsconfig.base.json
├── index.html
└── src/
    ├── main.ts
    ├── App.svelte         2-col grid: action panel + runes panel (D-04)
    ├── CopyAction.svelte  use:copyAction demo
    └── CopyRune.svelte    useCopyToClipboard rune demo
```

No `svelte.config.js` required.

---

## Decision Log

| Decision | Rationale | Overrides CONTEXT.md? |
|----------|-----------|----------------------|
| Use Vite 8.0.8 (not 6.x) | All framework plugins require ^8.0.0; Vite 7 does not exist | No — CONTEXT.md left version to researcher |
| Use `@vitejs/plugin-react@6` (Babel, not SWC) | Official recommendation for new projects; optional Babel peer deps mean no config overhead | No |
| Use React 19 (`19.2.5`) in playground | Latest stable; `packages/react` adapter is React 18 compatible but playground can target latest | No — CONTEXT.md defers to researcher |
| No `svelte.config.js` in svelte playground | vite-plugin-svelte works without it; TypeScript handled by Vite/esbuild | No |
| Compound webServer command for E2E build | Simpler than Turbo cross-package deps; self-contained | No — implementation detail not specified in CONTEXT.md |
| `@types/react` required in playground devDeps | React adapter does not re-export types; playground needs its own type declarations | Clarifies CONTEXT.md Q2 |
| `lib: ["ES2020", "DOM", "DOM.Iterable"]` in all playground tsconfigs | Base tsconfig lacks DOM lib; clipboard API needs browser globals | Clarifies CONTEXT.md Q8 |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `workspace:*` is correct pnpm protocol for playground deps on adapter packages | Workspace Dependency Resolution | Low — standard pnpm workspace feature; failure is obvious (install error) |
| A2 | Adding `playground/*` to pnpm-workspace.yaml does not affect `--filter=./packages/*` CI filter | pnpm Workspace Changes | Low — Turbo filter is path-based |
| A3 | React 19 is compatible with `@vitejs/plugin-react@6` | Framework Plugins | Low — plugin has no React version peer dep |
| A4 | No `svelte.config.js` needed for the playground | Framework Plugins | Low — vite-plugin-svelte README confirms it is optional |

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: npm registry] `vite@8.0.8` — latest as of 2026-04-13 via `npm view vite dist-tags`
- [VERIFIED: npm registry] `@vitejs/plugin-react@6.0.1` peer deps via `npm view @vitejs/plugin-react@6.0.1 --json`
- [VERIFIED: npm registry] `@vitejs/plugin-vue@6.0.6` peer deps via `npm view @vitejs/plugin-vue@6.0.6 --json`
- [VERIFIED: npm registry] `@sveltejs/vite-plugin-svelte@7.0.0` peer deps via `npm view`
- [VERIFIED: installed packages] React 18.3.1 in `packages/react/node_modules/react`
- [VERIFIED: installed packages] Vue 3.5.32 in `packages/vue/node_modules/vue`
- [VERIFIED: installed packages] Svelte 5.55.3 in `packages/svelte/node_modules/svelte`
- [VERIFIED: installed packages] `@sveltejs/vite-plugin-svelte@7.0.0` in `packages/svelte/node_modules/`
- [VERIFIED: Playwright types] `TestConfigWebServer.cwd` property in `playwright/types/test.d.ts:10236`
- [VERIFIED: codebase] `packages/core/playwright.config.ts` — current webServer configuration
- [VERIFIED: codebase] `packages/core/tests/e2e/clipboard.spec.ts` — navigation URL and `__clipboard` usage
- [VERIFIED: codebase] `biome.json` — current `files.includes` and `overrides` patterns
- [VERIFIED: codebase] `tsconfig.base.json` — base TypeScript config options
- [VERIFIED: vite-plugin-svelte README] svelte.config.js is optional
- [VERIFIED: vite-plugin-svelte source] Runes auto-detected per component in Svelte 5
- [VERIFIED: installed packages] pnpm workspace symlink pattern (`@ngockhoi96/ctc -> ../../../core`)

### Secondary (MEDIUM confidence)

- [ASSUMED] `workspace:*` protocol syntax for playground → adapter package dependencies
- [ASSUMED] CI `--filter=./packages/*` unaffected by adding `playground/*` to workspace

---

## Metadata

**Confidence breakdown:**
- Vite version: HIGH — verified via npm registry
- Framework plugin versions: HIGH — verified via npm registry + peer dep checks
- E2E wiring: HIGH — verified against actual playwright.config.ts, spec files, and Playwright type definitions
- Workspace resolution: HIGH — verified via installed pnpm symlinks
- TypeScript setup: HIGH — verified against existing tsconfig.base.json
- Svelte runes config: HIGH — verified in vite-plugin-svelte source
- Turbo dev task: HIGH — verified against existing turbo.json patterns

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (stable ecosystem; Vite versions may bump but 8.x API is stable)
