import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'jsdom',
		benchmark: {
			include: ['src/**/*.bench.ts'],
			reporters: ['default'],
			outputJson: 'bench-results.json',
		},
	},
})
