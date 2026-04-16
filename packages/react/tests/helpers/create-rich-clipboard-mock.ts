import { vi } from 'vitest'

/**
 * Mock object returned by createRichClipboardMock().
 */
export interface RichClipboardMock {
	/** Spy on navigator.clipboard.write calls and control its return value. */
	write: ReturnType<typeof vi.fn>
	/**
	 * Install the mock: stubs ClipboardItem global, stubs navigator.clipboard.write, and sets
	 * window.isSecureContext=true via Object.defineProperty (preserves jsdom globals).
	 * Call in beforeEach.
	 */
	install: () => void
	/**
	 * Uninstall the mock: calls vi.unstubAllGlobals().
	 * Call in afterEach.
	 */
	uninstall: () => void
}

/**
 * Factory for a navigator.clipboard.write mock compatible with jsdom.
 *
 * Unlike the per-file vi.stubGlobal pattern from packages/core/tests/unit/ (which
 * replaces the entire window object), this helper uses Object.defineProperty for
 * isSecureContext to preserve jsdom's HTMLElement and other globals that React DOM
 * depends on during renderHook.
 *
 * Stubs ClipboardItem as a mock class to satisfy the ClipboardItem API contract
 * used by copyRichContent in the core package.
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
		// replacing the entire window object — jsdom's HTMLElement and ShadowRoot
		// constructors must remain intact for React DOM's instanceof checks.
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
