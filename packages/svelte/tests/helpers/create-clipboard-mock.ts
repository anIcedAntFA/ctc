import { vi } from 'vitest'

/**
 * Mock object returned by createClipboardMock().
 */
export interface ClipboardMock {
	/** Spy on navigator.clipboard.writeText calls and control its return value. */
	writeText: ReturnType<typeof vi.fn>
	/**
	 * Install the mock: stubs navigator.clipboard.writeText and sets
	 * window.isSecureContext=true via Object.defineProperty (preserves jsdom globals).
	 * Call in beforeEach.
	 */
	install: () => void
	/**
	 * Uninstall the mock: calls vi.unstubAllGlobals() and restores isSecureContext.
	 * Call in afterEach.
	 */
	uninstall: () => void
}

/**
 * Factory for a navigator.clipboard mock compatible with jsdom.
 *
 * Mirrors the React adapter helper (D-22). Uses Object.defineProperty for
 * isSecureContext to preserve jsdom globals required by Svelte's host
 * component rendering through @testing-library/svelte.
 *
 * @example
 * ```typescript
 * const mock = createClipboardMock()
 * beforeEach(() => { mock.install() })
 * afterEach(() => { mock.uninstall(); vi.clearAllMocks() })
 * ```
 */
export function createClipboardMock(): ClipboardMock {
	const writeText = vi.fn()

	function install(): void {
		vi.stubGlobal('navigator', {
			clipboard: { writeText },
		})
		// Use Object.defineProperty instead of vi.stubGlobal('window', ...) to
		// avoid replacing the entire window object — jsdom's HTMLElement and
		// ShadowRoot constructors must remain intact for Svelte's mount logic.
		Object.defineProperty(window, 'isSecureContext', {
			value: true,
			writable: true,
			configurable: true,
		})
	}

	function uninstall(): void {
		vi.unstubAllGlobals()
	}

	return { writeText, install, uninstall }
}
