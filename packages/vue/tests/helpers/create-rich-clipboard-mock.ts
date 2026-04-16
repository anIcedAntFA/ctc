import { vi } from 'vitest'

/**
 * Mock object returned by createRichClipboardMock().
 */
export interface RichClipboardMock {
	/** Spy on navigator.clipboard.write calls and control its return value. */
	write: ReturnType<typeof vi.fn>
	/**
	 * Install the mock: stubs ClipboardItem global, stubs navigator.clipboard.write
	 * and window.isSecureContext=true. Call in beforeEach.
	 */
	install: () => void
	/**
	 * Uninstall the mock: calls vi.unstubAllGlobals().
	 * Call in afterEach.
	 */
	uninstall: () => void
}

/**
 * Factory for a navigator.clipboard rich content mock (uses write + ClipboardItem).
 * Mirrors the pattern from packages/core/tests/unit/clipboard/rich-copy.test.ts.
 *
 * @example
 * ```typescript
 * const mock = createRichClipboardMock()
 * beforeEach(() => { mock.install(); vi.useFakeTimers() })
 * afterEach(() => { mock.uninstall(); vi.useRealTimers(); vi.clearAllMocks() })
 * ```
 */
export function createRichClipboardMock(): RichClipboardMock {
	const write = vi.fn()

	function install(): void {
		vi.stubGlobal(
			'ClipboardItem',
			class MockClipboardItem {
				constructor(public data: Record<string, Blob>) {}
			},
		)
		vi.stubGlobal('navigator', {
			clipboard: { write },
		})
		// Use Object.defineProperty instead of vi.stubGlobal('window', ...) to avoid
		// replacing the entire window object — other globals (window.location, etc.)
		// must remain intact for the composable under test.
		Object.defineProperty(window, 'isSecureContext', {
			value: true,
			writable: true,
			configurable: true,
		})
	}

	function uninstall(): void {
		vi.unstubAllGlobals()
	}

	return { write, install, uninstall }
}
