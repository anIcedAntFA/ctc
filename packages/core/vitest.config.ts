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
				'src/lib/types.ts',
			],
			thresholds: {
				'src/clipboard/copy.ts': { 100: true },
				'src/clipboard/read.ts': { 100: true },
				'src/clipboard/detect.ts': { 100: true },
				'src/clipboard/fallback.ts': { 100: true },
				'src/lib/errors.ts': { 100: true },
				'src/lib/env.ts': { 100: true },
				'src/clipboard/rich-detect.ts': { 100: true },
				'src/clipboard/rich-copy.ts': { 100: true },
				'src/clipboard/rich-read.ts': { 100: true },
			},
		},
	},
})
