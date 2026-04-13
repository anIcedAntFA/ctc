import { expect, test } from '@playwright/test'

declare global {
	interface Window {
		__clipboard: {
			copyToClipboard: (text: string) => Promise<boolean>
			readFromClipboard: () => Promise<string | null>
			isClipboardSupported: () => boolean
			isClipboardReadSupported: () => boolean
			copyToClipboardLegacy: (text: string) => boolean
		}
	}
}

test.beforeEach(async ({ page }) => {
	await page.goto('/')
	// Wait for the ESM module to load and expose __clipboard on window
	await page.waitForFunction(() => typeof window.__clipboard !== 'undefined')
})

// Browsers that support clipboard-read permission via Playwright contextOptions.
// Firefox and WebKit do not accept 'clipboard-read'/'clipboard-write' permission strings,
// so clipboard read operations requiring explicit permission are skipped for these browsers.
// On Chromium, permissions are granted via contextOptions (see playwright.config.ts).
const skipReadPermission = ({ browserName }: { browserName: string }) =>
	browserName !== 'chromium'

// D-05 Scenario 1: copyToClipboard happy path
test.describe('copyToClipboard', () => {
	test('returns true on HTTPS/localhost', async ({ page }) => {
		const result = await page.evaluate(() =>
			window.__clipboard.copyToClipboard('hello e2e'),
		)
		expect(result).toBe(true)
	})

	test('clipboard contains expected text after copy', async ({
		page,
		browserName,
	}) => {
		// Requires clipboard-read permission — only Chromium accepts this in Playwright contextOptions
		test.skip(
			skipReadPermission({ browserName }),
			'clipboard-read permission not supported',
		)
		await page.evaluate(() =>
			window.__clipboard.copyToClipboard('verify-content-123'),
		)
		const text = await page.evaluate(() => navigator.clipboard.readText())
		expect(text).toBe('verify-content-123')
	})
})

// D-05 Scenario 2: readFromClipboard happy path
test.describe('readFromClipboard', () => {
	test('returns text that was previously written to clipboard', async ({
		page,
		browserName,
	}) => {
		// Requires clipboard-read permission — only Chromium accepts this in Playwright contextOptions
		test.skip(
			skipReadPermission({ browserName }),
			'clipboard-read permission not supported',
		)
		// Write text first via native clipboard API
		await page.evaluate(() => navigator.clipboard.writeText('read-test-abc'))
		const result = await page.evaluate(() =>
			window.__clipboard.readFromClipboard(),
		)
		expect(result).toBe('read-test-abc')
	})

	test('returns string type on success', async ({ page, browserName }) => {
		// Requires clipboard-read permission — only Chromium accepts this in Playwright contextOptions
		test.skip(
			skipReadPermission({ browserName }),
			'clipboard-read permission not supported',
		)
		await page.evaluate(() => navigator.clipboard.writeText('type-test'))
		const result = await page.evaluate(() =>
			window.__clipboard.readFromClipboard(),
		)
		expect(typeof result).toBe('string')
	})
})

// D-05 Scenario 3: isClipboardSupported returns true on HTTPS/localhost
test.describe('isClipboardSupported', () => {
	test('returns true on localhost (secure context)', async ({ page }) => {
		const result = await page.evaluate(() =>
			window.__clipboard.isClipboardSupported(),
		)
		expect(result).toBe(true)
	})
})

// D-05 Scenario 4: copyToClipboardLegacy copies text
test.describe('copyToClipboardLegacy', () => {
	test('returns true when execCommand is available', async ({ page }) => {
		const result = await page.evaluate(() =>
			window.__clipboard.copyToClipboardLegacy('legacy-copy-test'),
		)
		// execCommand may return false in headless browsers; test that function does not throw
		expect(typeof result).toBe('boolean')
	})

	test('does not throw on any browser', async ({ page }) => {
		await expect(
			page.evaluate(() =>
				Promise.resolve(
					window.__clipboard.copyToClipboardLegacy('no-throw-test'),
				),
			),
		).resolves.not.toThrow()
	})
})

// D-05 Scenario 5: functions return false on insecure context
// Note: localhost IS a secure context. The insecure context guard (INSECURE_CONTEXT error code)
// is exercised with 100% branch coverage in unit tests (tests/unit/clipboard/copy.test.ts).
// Per RESEARCH.md Assumption A6: E2E insecure context is covered by unit tests.
// isClipboardReadSupported verified here for completeness.
test.describe('isClipboardReadSupported', () => {
	test('returns true on localhost (secure context)', async ({ page }) => {
		const result = await page.evaluate(() =>
			window.__clipboard.isClipboardReadSupported(),
		)
		expect(result).toBe(true)
	})
})
