import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'jsdom',
		include: ['tests/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
			include: ['src/**/*.ts'],
			exclude: ['src/index.ts'],
			thresholds: {
				'src/use-copy-to-clipboard.ts': { 100: true },
				'src/use-copy-rich-content.ts': { 100: true },
			},
		},
	},
})
