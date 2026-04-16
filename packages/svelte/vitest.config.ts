import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [svelte(), svelteTesting()],
	test: {
		environment: 'jsdom',
		include: ['tests/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
			include: ['src/**/*.ts', 'src/**/*.svelte.ts'],
			exclude: ['src/index.ts'],
			thresholds: {
				'src/action/copy-action.ts': { 100: true },
				'src/action/copy-rich-action.ts': { 100: true },
				'src/stores/use-copy-to-clipboard.ts': { 100: true },
				'src/stores/use-copy-rich-content.ts': { 100: true },
				'src/runes/use-copy-to-clipboard.svelte.ts': { 100: true },
				'src/runes/use-copy-rich-content.svelte.ts': { 100: true },
			},
		},
	},
})
