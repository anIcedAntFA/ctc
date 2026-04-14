import { vi } from 'vitest'

/**
 * Mock object returned by createClipboardMock().
 */
export interface ClipboardMock {
	/** Spy on navigator.clipboard.writeText calls and control its return value. */
	writeText: ReturnType<typeof vi.fn>
	/**
	 * Install the mock: stubs navigator.clipboard.writeText and
	 * window.isSecureContext=true. Call in beforeEach.
	 */
	install: () => void
	/**
	 * Uninstall the mock: calls vi.unstubAllGlobals().
	 * Call in afterEach.
	 */
	uninstall: () => void
}

/**
 * Factory for a navigator.clipboard mock.
 * Mirrors the pattern from packages/core/tests/unit/ and packages/react/tests/helpers/.
 *
 * @example
 * ```typescript
 * const mock = createClipboardMock()
 * beforeEach(() => { mock.install(); vi.useFakeTimers() })
 * afterEach(() => { mock.uninstall(); vi.useRealTimers(); vi.clearAllMocks() })
 * ```
 */
export function createClipboardMock(): ClipboardMock {
	const writeText = vi.fn()

	function install(): void {
		vi.stubGlobal('navigator', {
			clipboard: { writeText },
		})
		vi.stubGlobal('window', { isSecureContext: true })
	}

	function uninstall(): void {
		vi.unstubAllGlobals()
	}

	return { writeText, install, uninstall }
}
