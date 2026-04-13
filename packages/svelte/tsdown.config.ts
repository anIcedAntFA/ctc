import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		stores: 'src/stores/use-copy-to-clipboard.ts',
		runes: 'src/runes/use-copy-to-clipboard.svelte.ts',
	},
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	clean: true,
	exports: true,
})
