Prepare for a release:
1. Run full test suite: `pnpm test && pnpm test:e2e`
2. Run full build: `pnpm build`
3. Run validations: `pnpm validate`
4. Check bundle size: `pnpm size`
5. Show git log since last tag: `git log $(git describe --tags --abbrev=0)..HEAD --oneline`
6. Suggest changeset type (major/minor/patch) based on the changes
7. Show any TODO or FIXME comments in src/
8. Report readiness status