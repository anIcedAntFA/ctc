# 🤝 Contributing

Thanks for your interest in `@ngockhoi96/ctc`! This repo is a pnpm + Turborepo monorepo
housing the core clipboard library and its framework adapters. Below is everything you
need to set up, run tests, and ship a change.

## 🛠️ Prerequisites

- **Node.js** >= 20 (see `.nvmrc` if present)
- **pnpm** >= 10 (`npm i -g pnpm`)
- **Git**

## 🚀 Setup

```bash
git clone https://github.com/anIcedAntFA/ctc.git
cd ctc
pnpm install
pnpm setup    # installs lefthook git hooks (pre-commit + commit-msg)
```

After `pnpm setup`, every commit runs `pnpm lint` and `pnpm test` via lefthook, and
commit messages are validated by commitlint.

## 🧪 Running tests

From the repo root, all tasks are orchestrated by Turborepo:

```bash
pnpm lint          # biome check across all packages
pnpm test          # vitest unit tests across all packages
pnpm test:e2e      # playwright tests (packages/core)
pnpm build         # tsdown builds across all packages
pnpm validate      # publint + arethetypeswrong for all publishable packages
```

To run a task for a single package, use a filter:

```bash
pnpm --filter @ngockhoi96/ctc-react test
pnpm --filter @ngockhoi96/ctc-vue test
pnpm --filter @ngockhoi96/ctc-svelte test
pnpm --filter @ngockhoi96/ctc test:e2e
```

## 📊 Benchmarks

Run all benchmarks from the repo root:

```bash
pnpm bench         # vitest bench (performance) + bundle size measurement
pnpm size          # size-limit check against thresholds in package.json
```

To run benchmarks for a single package:

```bash
pnpm --filter @ngockhoi96/ctc bench
```

### Why is esbuild in devDependencies?

`esbuild` appears in `benchmarks/package.json` devDependencies but is **not** the library's build tool — that is [tsdown](https://github.com/sxzz/tsdown).

`esbuild` is used exclusively as a **bundle size measurement instrument** inside `benchmarks/scripts/measure-bundle-size.ts`. The script calls `esbuild.buildSync({ bundle: true, minify: true, format: 'esm', platform: 'browser' })` to produce a single minified ESM bundle for each competitor library, then measures the compressed size with Node.js `zlib.gzipSync` and `zlib.brotliCompressSync`. The results feed the Bundle Size Comparison table in `BENCHMARKS.md`.

**Role summary:**
- `tsdown` — builds the library output in `dist/` for publication
- `esbuild` — measures minified competitor bundles for `BENCHMARKS.md` only

## 📁 Adding a new package

1. Create `packages/<name>/` with `package.json`, `tsconfig.json`, and `tsdown.config.ts`.
   Copy the shape from an existing adapter (e.g. `packages/react/`) and adjust the
   `name`, `description`, `peerDependencies`, and entry points.
2. Workspaces are auto-discovered via `pnpm-workspace.yaml` (`packages/*`) — no manual
   registration needed.
3. Add `build`, `lint`, `test`, `typecheck`, `validate` scripts so the Turborepo
   pipeline picks them up. See `turbo.json` for the task graph.
4. Add a `packages/<name>/README.md` following the structure of existing package
   READMEs (Title → Install → Peer deps → Quick start → API → Browser support → License).
5. If the package is publishable, add it to `.changeset/config.json` workspace
   discovery (automatic for anything under `packages/`).

## 📝 Creating a changeset

Every PR that changes public API or observable behaviour needs a changeset:

```bash
pnpm changeset
```

The CLI prompts you to:
1. Select which packages are affected
2. Pick a bump type per package:
   - **patch** — bug fix, no API change
   - **minor** — new feature, backwards compatible
   - **major** — breaking change
3. Write a one-line summary — this becomes the `CHANGELOG.md` entry.

The custom changelog formatter automatically prepends an emoji based on bump type:

| Bump type | Emoji |
|-----------|-------|
| major     | 💥    |
| minor     | ✨    |
| patch     | 🐞    |

Commit the generated `.changeset/*.md` file alongside your code changes.

## 🚢 Release flow

This repo uses [changesets](https://github.com/changesets/changesets) in **independent mode** — each package versions and publishes separately.

The full flow:

1. **You open a PR** with code changes plus a changeset. CI runs `lint`, `test`,
   `test:e2e`, `build`, and `validate`.
2. **After merge to `master`**, the `changesets/action` bot opens (or updates) a
   `Version Packages` PR. This PR:
   - Consumes every pending changeset under `.changeset/`
   - Bumps the affected packages' versions in their `package.json`
   - Regenerates each package's `CHANGELOG.md` with the emoji-prefixed entries
3. **Merging the Version PR** triggers `pnpm changeset publish` in CI, which:
   - Publishes bumped packages to npm (using `NPM_TOKEN` secret stored in GitHub Actions)
   - Creates a GitHub Release per published package with the changelog entries
4. **Independent mode note:** a single Version PR can bump multiple packages at
   different levels — for example `@ngockhoi96/ctc@0.3.0` (minor) alongside
   `@ngockhoi96/ctc-react@0.2.1` (patch). Packages are never locked in step.

When in doubt about bump type, default to **patch** for any code change and **minor**
for any new exported function or option. Reserve **major** for removals or
signature-breaking changes.

## 🎨 Code style

- **TypeScript strict** — no `any`, no `as` casts unless documented
- **Named exports only** — no default exports (enforced by Biome)
- **Biome** handles lint + format: `pnpm lint:fix` auto-fixes what it can
- **Zero runtime dependencies** in published packages — only browser native APIs
- **Conventional commits** enforced by commitlint:

  ```
  feat(clipboard): add new utility function
  fix(clipboard): handle edge case in Safari
  chore: update dependencies
  docs(readme): clarify install instructions
  ```

  Types: `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `refactor`, `perf`.

## 🔒 Security

For vulnerability reports, see [SECURITY.md](./SECURITY.md). **Do not open a public
issue for security concerns** — use GitHub's private vulnerability reporting.

## 💬 Questions

Open a [GitHub Discussion](https://github.com/anIcedAntFA/ctc/discussions) for general
questions, or a bug/feature issue via the templates in the "New issue" chooser.
