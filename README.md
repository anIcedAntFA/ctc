# 📋 @ngockhoi96/ctc

Modular, tree-shakeable browser utilities monorepo. Core clipboard APIs plus idiomatic framework adapters for React, Vue, and Svelte. Zero runtime dependencies, SSR-safe, framework-agnostic.

[![npm version](https://img.shields.io/npm/v/@ngockhoi96/ctc)](https://www.npmjs.com/package/@ngockhoi96/ctc)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@ngockhoi96/ctc)](https://bundlephobia.com/package/@ngockhoi96/ctc)
[![npm downloads](https://img.shields.io/npm/dm/@ngockhoi96/ctc)](https://www.npmjs.com/package/@ngockhoi96/ctc)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB?logo=react)](https://www.npmjs.com/package/@ngockhoi96/ctc-react)
[![Vue](https://img.shields.io/badge/Vue-3%2B-4FC08D?logo=vue.js)](https://www.npmjs.com/package/@ngockhoi96/ctc-vue)
[![Svelte](https://img.shields.io/badge/Svelte-4%2B%20%7C%205-FF3E00?logo=svelte)](https://www.npmjs.com/package/@ngockhoi96/ctc-svelte)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![tree-shakeable](https://img.shields.io/badge/tree--shakeable-yes-brightgreen)](https://bundlephobia.com/package/@ngockhoi96/ctc)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](./packages/core)
[![CI](https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml/badge.svg)](https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml)
[![Release](https://github.com/anIcedAntFA/ctc/actions/workflows/release.yml/badge.svg)](https://github.com/anIcedAntFA/ctc/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Why ctc?** Modern Clipboard API under the hood, SSR-safe out of the box, TypeScript-native with zero `any`, multi-framework adapters that share a zero-dependency core, and fully tree-shakeable. [See full comparison →](./BENCHMARKS.md)

> All functions are SSR-safe -- safe to import in Next.js, Nuxt, or any server-side environment without crashing.

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| [`@ngockhoi96/ctc`](./packages/core/README.md) | Core clipboard utilities (copy, read, detect) | `pnpm add @ngockhoi96/ctc` |
| [`@ngockhoi96/ctc-react`](./packages/react/README.md) | React hook `useCopyToClipboard` | `pnpm add @ngockhoi96/ctc-react @ngockhoi96/ctc` |
| [`@ngockhoi96/ctc-vue`](./packages/vue/README.md) | Vue 3 composable `useCopyToClipboard` | `pnpm add @ngockhoi96/ctc-vue @ngockhoi96/ctc` |
| [`@ngockhoi96/ctc-svelte`](./packages/svelte/README.md) | Svelte action + rune/store | `pnpm add @ngockhoi96/ctc-svelte @ngockhoi96/ctc` |

## Quick Start

```typescript
import { copyToClipboard, isClipboardSupported } from '@ngockhoi96/ctc/clipboard'

button.addEventListener('click', async () => {
  if (isClipboardSupported()) {
    const success = await copyToClipboard('Hello, world!')
    console.log(success ? 'Copied!' : 'Copy failed')
  }
})
```

For framework-idiomatic usage, see the React, Vue, or Svelte package README linked above.
For the full API reference (all five functions, error codes, options), see [`packages/core/README.md`](./packages/core/README.md).

## Monorepo Structure

```
.
├── packages/
│   ├── core/      # @ngockhoi96/ctc — clipboard utilities
│   ├── react/     # @ngockhoi96/ctc-react — React hook
│   ├── vue/       # @ngockhoi96/ctc-vue — Vue composable
│   └── svelte/    # @ngockhoi96/ctc-svelte — action + rune
├── playground/    # standalone Vite apps per framework
└── .changeset/    # versioning + changelog config
```

Built with [pnpm workspaces](https://pnpm.io/workspaces) + [Turborepo](https://turbo.build/). See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup.

## Browser Support

| Function | Chrome | Firefox | Safari | HTTP Support |
|----------|--------|---------|--------|--------------|
| `copyToClipboard` | 66+ | 63+ | 13.1+ | No (use legacy) |
| `readFromClipboard` | 66+ | 63+ | 13.1+ | No |
| `isClipboardSupported` | 66+ | 63+ | 13.1+ | Returns `false` |
| `isClipboardReadSupported` | 66+ | 63+ | 13.1+ | Returns `false` |
| `copyToClipboardLegacy` | All | All | Partial | Yes |

All functions require ES2020+ (>95% global browser support).

All functions are SSR-safe and will return `false` or `null` when called in a server-side environment (Node.js, Deno, Bun) without crashing.

## Similar / Related Projects

The following libraries solve clipboard operations in similar or overlapping ways. Listed here for reference — see [BENCHMARKS.md](./BENCHMARKS.md) for a detailed comparison table.

### Framework-agnostic

- [**clipboard-copy**](https://github.com/feross/clipboard-copy) — Minimal clipboard write utility using the modern Clipboard API with `execCommand` fallback. Last updated 2020.
- [**copy-to-clipboard**](https://github.com/sudodoki/copy-to-clipboard) — Clipboard write utility with broad browser support via `execCommand`. Last updated 2022.

### React

- [**react-copy-to-clipboard**](https://github.com/nkbt/react-copy-to-clipboard) — Render-prop React component for clipboard copy operations.
- [**usehooks-ts** `useClipboard`](https://usehooks-ts.com/react-hook/use-clipboard) — Clipboard hook included in the `usehooks-ts` multi-utility collection. TypeScript-native.
- [**react-use** `useClipboard`](https://github.com/streamich/react-use) — Clipboard hook included in the `react-use` multi-utility collection.

### Vue

- [**@vueuse/core** `useClipboard`](https://vueuse.org/core/useClipboard/) — Clipboard composable included in the VueUse collection of Vue 3 utilities. TypeScript-native.

### Svelte

_The Svelte clipboard ecosystem is sparse. The [Svelte docs](https://svelte.dev/docs/svelte-action) show how to write a clipboard action natively; no widely-maintained dedicated library exists as of 2026._

## License

[MIT](./LICENSE)
