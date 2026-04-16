import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		stores: 'src/stores/index.ts',
		runes: 'src/runes/index.ts',
	},
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	clean: true,
	// NOTE: `exports` is intentionally NOT enabled here. The runes subpath must
	// expose the uncompiled source `.svelte.ts` via a `svelte` export condition
	// so the consumer's vite-plugin-svelte can run the Svelte compiler on it.
	// tsdown's auto `exports: true` would overwrite this condition on every
	// build and reintroduce `rune_outside_svelte` at runtime. The exports map is
	// maintained manually in package.json — do not re-enable without reworking
	// how the runes entry is published.
	exports: false,
})
