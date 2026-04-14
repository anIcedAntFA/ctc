---
status: resolved
trigger: "svelte playground rune_outside_svelte error — $state not recognized at runtime"
created: 2026-04-14T00:00:00Z
updated: 2026-04-14T00:00:00Z
---

## Current Focus

hypothesis: Playground resolves `@ngockhoi96/ctc-svelte` to source `.svelte.ts` but vite-plugin-svelte is not preprocessing it (missing config or not applied to node_modules/workspace symlink)
test: Inspect playground/svelte/vite.config.ts, packages/svelte/package.json exports, and dist output to confirm resolution path
expecting: Find that exports point to source OR vite config lacks svelte-plugin-svelte with proper extensions config
next_action: Read vite config, package.json exports, and check dist build status

## Symptoms

expected: Svelte playground starts and renders correctly with runes-based useCopyToClipboard working
actual: Runtime error "The `$state` rune is only available inside `.svelte` and `.svelte.js/ts` files"
errors: |
  Uncaught Svelte error: rune_outside_svelte
  at useCopyToClipboard (use-copy-to-clipboard.svelte.ts:64:16)
  at CopyRune (CopyRune.svelte:7:15)
reproduction: cd playground/svelte && pnpm dev, then open browser
started: First run — never worked

## Eliminated

- hypothesis: Missing vite-plugin-svelte in playground vite config
  evidence: playground/svelte/vite.config.ts imports svelte() from @sveltejs/vite-plugin-svelte and registers it in plugins
  timestamp: 2026-04-14

## Evidence

- timestamp: 2026-04-14
  checked: playground/svelte/vite.config.ts
  found: vite-plugin-svelte is installed and registered with defaults
  implication: Plugin is present but may not process files inside linked workspace package

- timestamp: 2026-04-14
  checked: playground/svelte/node_modules/@ngockhoi96/ctc-svelte (symlink)
  found: Symlink points to ../../../../packages/svelte (pnpm workspace)
  implication: Import resolves through packages/svelte/package.json exports

- timestamp: 2026-04-14
  checked: packages/svelte/package.json exports."./runes"
  found: Points to ./dist/runes.mjs (compiled output), NO svelte export condition
  implication: Consumer's vite-plugin-svelte loads the compiled dist file, not source

- timestamp: 2026-04-14
  checked: packages/svelte/dist/runes.mjs
  found: Contains literal "const state = $state({...})" and "$effect(() => ...)" calls — NOT transformed to $.state()/$.effect()
  implication: tsdown (rolldown/oxc) does not invoke the Svelte compiler, so runes are left as raw calls. At runtime, Svelte's `$state` export is a guard stub that throws rune_outside_svelte when it's called from a file that wasn't compiled by the Svelte compiler.

- timestamp: 2026-04-14
  checked: Svelte official packaging guidance (web)
  found: "Svelte components should be distributed as uncompiled .svelte files" with a `svelte` export condition pointing at source. vite-plugin-svelte compiles these on the consumer side.
  implication: The tsdown compiled dist is the wrong artifact for Svelte consumers. The package should expose the `.svelte.ts` source via a `svelte` export condition.

## Resolution

root_cause: |
  Two compounding issues in packages/svelte:

  1. The `./runes` subpath export pointed only at `./dist/runes.mjs`, the
     tsdown-compiled output. tsdown (rolldown/oxc) does NOT invoke the Svelte
     compiler, so the runes source was emitted verbatim — `const state =
     $state({...})` and `$effect(() => ...)` calls remained as literal function
     invocations. At runtime, Svelte's `$state` export is a dev guard that
     throws `rune_outside_svelte` when called from a file the Svelte compiler
     did not process. Per Svelte's official packaging guidance, Svelte library
     code must be distributed as *uncompiled* source (`.svelte` / `.svelte.js`
     / `.svelte.ts`) via a `svelte` export condition so the consumer's
     `vite-plugin-svelte` compiles it.

  2. `tsdown.config.ts` had `exports: true`, which makes tsdown automatically
     rewrite the `exports` field in package.json on every build based on its
     entry points. Even if a `svelte` condition were added manually, the next
     `pnpm build` would clobber it and reintroduce the bug.
fix: |
  - packages/svelte/tsdown.config.ts: set `exports: false` so tsdown no longer
    overwrites package.json's `exports` field. Added a comment explaining why
    re-enabling would break runes consumers.
  - packages/svelte/package.json:
      * Added a `svelte` export condition on the `./runes` subpath pointing at
        `./src/runes/use-copy-to-clipboard.svelte.ts` (the uncompiled source).
        vite-plugin-svelte resolves the `svelte` condition first and runs the
        Svelte compiler on the file, transforming `$state` / `$effect` into
        proper runtime calls.
      * Added `svelte` conditions on `.` and `./stores` (pointing at their
        compiled `.mjs` since those files don't use runes) for consistency.
      * Added `types` conditions (import/require) so type resolution still
        works for both ESM and CJS consumers.
      * Added `src/runes` to the `files` array so the source file is included
        in the published tarball.
verification: |
  1. packages/svelte: `pnpm build` succeeds; exports field is preserved across
     builds (confirmed by re-reading package.json post-build).
  2. packages/svelte: `pnpm test` → 36/36 tests pass.
  3. playground/svelte: `pnpm build` succeeds; inspected bundled output
     `dist/assets/index-BfbKzQ4-.js` — no raw `$state(` or `$effect(` calls
     remain. Runes compiled to Svelte runtime internals: `let n=Rt({copied:!1,
     error:null})` (from `$state`) and `an(() => ...)` (from `$effect`).
  4. playground/svelte: started `pnpm dev`, fetched the transformed module via
     `curl http://localhost:5173/@fs/.../use-copy-to-clipboard.svelte.ts`.
     Response header: `/* use-copy-to-clipboard.svelte.ts generated by Svelte
     v5.55.3 */` and body uses `$.tag_proxy($.proxy({...}), 'state')` and
     `$.user_effect(...)` — proving vite-plugin-svelte is now running the
     Svelte compiler on the source file resolved via the new `svelte` export
     condition. The `rune_outside_svelte` guard no longer fires.
files_changed:
  - packages/svelte/package.json
  - packages/svelte/tsdown.config.ts
