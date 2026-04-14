# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## pnpm-workspace-ctc-vue-missing — pnpm install fails because @ngockhoi96/ctc-vue package source was never merged to master
- **Date:** 2026-04-13
- **Error patterns:** ERR_PNPM_WORKSPACE_PKG_NOT_FOUND, @ngockhoi96/ctc-vue, workspace:*, playground/vue, missing package.json
- **Root cause:** packages/vue was implemented on feat/monorepo-foundation branch in phase 05 but was never merged into master. Phase 07 restored packages/react (from 8d3b230) and packages/svelte (from a4442fc) explicitly but missed packages/vue. Build artifacts (dist/, coverage/) remained from a prior local build, which masked the missing source files on disk.
- **Fix:** Restored packages/vue source files from commit 50e4c39 via `git checkout 50e4c39 -- packages/vue/`, then ran `pnpm install` to regenerate the lockfile.
- **Files changed:** packages/vue/README.md, packages/vue/package.json, packages/vue/src/index.ts, packages/vue/src/use-copy-to-clipboard.ts, packages/vue/tests/helpers/create-clipboard-mock.ts, packages/vue/tests/helpers/with-setup.ts, packages/vue/tests/use-copy-to-clipboard.test.ts, packages/vue/tsconfig.json, packages/vue/tsconfig.node.json, packages/vue/tsdown.config.ts, packages/vue/vitest.config.ts, pnpm-lock.yaml
---

## svelte-playground-rune-outside-svelte — Svelte adapter throws rune_outside_svelte because tsdown does not compile runes
- **Date:** 2026-04-14
- **Error patterns:** rune_outside_svelte, $state, $effect, .svelte.ts, vite-plugin-svelte, tsdown, exports condition, svelte packaging
- **Root cause:** packages/svelte/package.json exports `./runes` pointed only at `./dist/runes.mjs`. tsdown (rolldown/oxc) does not invoke the Svelte compiler, so runes were emitted verbatim as literal `$state(...)` / `$effect(...)` calls. At runtime Svelte's `$state` export is a dev guard that throws `rune_outside_svelte` when called from a file the Svelte compiler did not process. Per Svelte's packaging guidance, library code using runes must be distributed as uncompiled source via a `svelte` export condition so the consumer's vite-plugin-svelte compiles it. Compounding issue: tsdown.config.ts had `exports: true`, which rewrites the exports field on every build and would clobber any manual svelte condition.
- **Fix:** Set `exports: false` in packages/svelte/tsdown.config.ts. Added a `svelte` export condition on `./runes` pointing at `./src/runes/use-copy-to-clipboard.svelte.ts` (uncompiled source). Added svelte/types conditions on `.` and `./stores` for consistency, and included `src/runes` in the `files` array so the source file ships in the tarball.
- **Files changed:** packages/svelte/package.json, packages/svelte/tsdown.config.ts
---
