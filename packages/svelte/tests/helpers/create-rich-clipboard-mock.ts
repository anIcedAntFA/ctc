import { vi } from 'vitest'

/**
 * Mock object returned by createRichClipboardMock().
 */
export interface RichClipboardMock {
	/** Spy on navigator.clipboard.write calls and control its return value. */
	write: ReturnType<typeof vi.fn>
	/**
	 * Install the mock: stubs ClipboardItem global, navigator.clipboard.write,
	 * and sets window.isSecureContext=true.
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
 * Stubs ClipboardItem (not available in jsdom) and navigator.clipboard.write.
 *
 * @example
 * ```typescript
 * const mock = createRichClipboardMock()
 * beforeEach(() => { mock.install() })
 * afterEach(() => { mock.uninstall(); vi.clearAllMocks() })
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
		vi.stubGlobal('navigator', { clipboard: { write } })
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
