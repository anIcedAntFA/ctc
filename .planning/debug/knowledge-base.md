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
