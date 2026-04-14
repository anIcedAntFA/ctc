import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// On Arch Linux dev machines, WebKit requires Ubuntu-compatible system libraries
// (libicu74, libflite1, libxml2.so.2) that differ from Arch versions.
// Pre-built libs are placed in /tmp/webkit-libs via developer setup.
// In CI (Ubuntu), these are installed system-wide via playwright install-deps.
const webkitLibsPath = '/tmp/webkit-libs'
if (existsSync(webkitLibsPath)) {
	const current = process.env.LD_LIBRARY_PATH ?? ''
	process.env.LD_LIBRARY_PATH = current
		? `${webkitLibsPath}:${current}`
		: webkitLibsPath
}

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	webServer: {
		command:
			'pnpm --filter=@ngockhoi96/playground-vanilla build && npx http-server ../../playground/vanilla/dist -p 8080 --silent --cors',
		url: 'http://localhost:8080',
		reuseExistingServer: !process.env.CI,
	},
	use: {
		baseURL: 'http://localhost:8080',
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				contextOptions: {
					permissions: ['clipboard-read', 'clipboard-write'],
				},
			},
		},
		{
			name: 'firefox',
			use: {
				...devices['Desktop Firefox'],
				// Firefox does NOT accept clipboard-read/clipboard-write permission strings.
				// navigator.clipboard works on localhost without explicit grant in Playwright.
				// Per RESEARCH.md Pitfall 1 and D-06.
			},
		},
		{
			name: 'webkit',
			use: {
				...devices['Desktop Safari'],
				// WebKit does NOT accept clipboard-read/clipboard-write permission strings
				// in Playwright contextOptions. Clipboard API works on localhost (secure context)
				// without explicit permission grant. Per testing: "Unknown permission: clipboard-write".
			},
		},
	],
})
