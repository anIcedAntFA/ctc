import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['tests/unit/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
			include: ['src/**/*.ts'],
			exclude: [
				'src/**/index.ts',
				'src/**/*.types.ts',
				'src/clipboard/types.ts',
				'src/utils/types.ts',
			],
			thresholds: {
				'src/clipboard/copy.ts': { 100: true },
				'src/clipboard/read.ts': { 100: true },
				'src/clipboard/detect.ts': { 100: true },
				'src/clipboard/fallback.ts': { 100: true },
				'src/utils/errors.ts': { 100: true },
				'src/utils/env.ts': { 100: true },
			},
		},
	},
})
