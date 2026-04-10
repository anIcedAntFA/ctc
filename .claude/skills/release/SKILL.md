---
name: release
description: Prepare a new release with changeset, changelog, and validation. Use when versioning or publishing.
disable-model-invocation: true
---

# Release Workflow

## Steps
1. Ensure all tests pass: `pnpm test && pnpm test:e2e`
2. Ensure build is clean: `pnpm build`
3. Run validations: `pnpm validate`
4. Check bundle size: `pnpm size`
5. Create changeset: `pnpm changeset`
   - Select change type (major/minor/patch)
   - Write human-readable summary
6. Version packages: `pnpm changeset version`
   - This updates package.json version + CHANGELOG.md
7. Review CHANGELOG.md — edit if needed
8. Commit: `git add . && git commit -m "chore: version bump"`
9. Tag: `git tag v$(node -p "require('./package.json').version")`
10. Push: `git push && git push --tags`
11. CI handles npm publish via GitHub Actions

## IMPORTANT
- NEVER publish manually with `npm publish`
- ALWAYS go through changeset workflow
- ALWAYS verify CI passes before merging to main