---
status: resolved
trigger: "pnpm install fails: @ngockhoi96/ctc-vue not found in workspace"
created: 2026-04-13T00:00:00Z
updated: 2026-04-13T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — packages/vue source was never merged to master; restored from commit 50e4c39
test: `git checkout 50e4c39 -- packages/vue/` + `pnpm install`
expecting: workspace resolves @ngockhoi96/ctc-vue
next_action: await human verification

## Symptoms

expected: pnpm install completes successfully across all 8 workspace projects
actual: ERR_PNPM_WORKSPACE_PKG_NOT_FOUND — "@ngockhoi96/ctc-vue@workspace:*" in playground/vue deps but no workspace package named "@ngockhoi96/ctc-vue"
errors: ERR_PNPM_WORKSPACE_PKG_NOT_FOUND in playground/vue
reproduction: pnpm install from repo root
started: After Phase 07 execution

## Eliminated

(none)

## Evidence

- checked: packages/vue directory contents
  found: only dist/, coverage/, node_modules/ present — no package.json, no src/
  implication: source files missing from working tree
- checked: pnpm-workspace.yaml
  found: "packages/*" included — config is correct
  implication: issue is missing package.json, not misconfig
- checked: playground/vue/package.json
  found: depends on "@ngockhoi96/ctc-vue": "workspace:*"
  implication: dependency declaration is correct; just needs the package to exist
- checked: git log --all -- packages/vue/
  found: no commits on master touching packages/vue source
  implication: files were never merged to master
- checked: git ls-tree -r 50e4c39 packages/vue/
  found: README.md, package.json, src/index.ts, src/use-copy-to-clipboard.ts, tests/, configs all exist
  implication: commit 50e4c39 (on feat/monorepo-foundation branch) has the full package
- checked: pnpm install after `git checkout 50e4c39 -- packages/vue/`
  found: "Done in 37.3s" — no ERR_PNPM_WORKSPACE_PKG_NOT_FOUND
  implication: fix works
- checked: pnpm -r list --depth -1
  found: @ngockhoi96/ctc-vue@0.0.1 resolves alongside ctc, ctc-react, ctc-svelte and all 4 playgrounds
  implication: all 8 workspace projects now wired

## Resolution

root_cause: packages/vue was implemented on feat/monorepo-foundation branch in phase 05 but was never merged into master. Phase 07 restored packages/react (from 8d3b230) and packages/svelte (from a4442fc) explicitly but missed packages/vue. Build artifacts (dist/, coverage/) remained from a prior local build but source was not tracked.
fix: Restored packages/vue source files from commit 50e4c39 via `git checkout 50e4c39 -- packages/vue/`
verification: `pnpm install` completes successfully; `pnpm -r list` shows @ngockhoi96/ctc-vue@0.0.1 and all 8 workspace projects resolve
files_changed:
  - packages/vue/README.md
  - packages/vue/package.json
  - packages/vue/src/index.ts
  - packages/vue/src/use-copy-to-clipboard.ts
  - packages/vue/tests/helpers/create-clipboard-mock.ts
  - packages/vue/tests/helpers/with-setup.ts
  - packages/vue/tests/use-copy-to-clipboard.test.ts
  - packages/vue/tsconfig.json
  - packages/vue/tsconfig.node.json
  - packages/vue/tsdown.config.ts
  - packages/vue/vitest.config.ts
  - pnpm-lock.yaml
