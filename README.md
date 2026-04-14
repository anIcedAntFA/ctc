# @ngockhoi96/ctc

Modular, tree-shakeable browser utilities monorepo. Core clipboard APIs plus idiomatic framework adapters for React, Vue, and Svelte. Zero runtime dependencies, SSR-safe, framework-agnostic.

[![npm version](https://img.shields.io/npm/v/@ngockhoi96/ctc)](https://www.npmjs.com/package/@ngockhoi96/ctc)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@ngockhoi96/ctc)](https://bundlephobia.com/package/@ngockhoi96/ctc)
[![CI](https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml/badge.svg)](https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

## License

[MIT](./LICENSE)
