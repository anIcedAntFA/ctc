import { vi } from 'vitest'

export interface ClipboardMock {
	writeText: ReturnType<typeof vi.fn>
	install: () => void
	uninstall: () => void
}

export interface RichClipboardMock {
	write: ReturnType<typeof vi.fn>
	install: () => void
	uninstall: () => void
}

export interface ReadClipboardMock {
	readText: ReturnType<typeof vi.fn>
	install: () => void
	uninstall: () => void
}

/**
 * Stub window.isSecureContext to true.
 *
 * In vitest bench mode, the window/globalThis inside bench() differs from
 * beforeAll/beforeEach. This helper must be called from within the bench
 * function's scope (or via the bench `setup` option) to take effect.
 */
function stubSecureContext(): void {
	Object.defineProperty(window, 'isSecureContext', {
		value: true,
		writable: true,
		configurable: true,
	})
}

/**
 * Factory for a navigator.clipboard.writeText mock for benchmarks.
 * Uses mockResolvedValue (not mockResolvedValueOnce) since bench runs
 * thousands of iterations.
 */
export function createClipboardMock(): ClipboardMock {
	const writeText = vi.fn().mockResolvedValue(undefined)

	return {
		writeText,
		install() {
			vi.stubGlobal('navigator', { clipboard: { writeText } })
			stubSecureContext()
		},
		uninstall() {
			// Note: vi.unstubAllGlobals() only restores globals set via vi.stubGlobal().
			// window.isSecureContext was set via Object.defineProperty in stubSecureContext()
			// and is NOT restored here. Tests that require isSecureContext === false must
			// explicitly reset it via Object.defineProperty after calling uninstall().
			vi.unstubAllGlobals()
		},
	}
}

/**
 * Factory for a navigator.clipboard.write mock for rich content benchmarks.
 * Stubs ClipboardItem as a mock class to satisfy the ClipboardItem API contract.
 */
export function createRichClipboardMock(): RichClipboardMock {
	const write = vi.fn().mockResolvedValue(undefined)

	return {
		write,
		install() {
			vi.stubGlobal(
				'ClipboardItem',
				class MockClipboardItem {
					constructor(public data: Record<string, Blob>) {}
				},
			)
			vi.stubGlobal('navigator', { clipboard: { write } })
			stubSecureContext()
		},
		uninstall() {
			vi.unstubAllGlobals()
		},
	}
}

/**
 * Factory for a navigator.clipboard.readText mock for read benchmarks.
 */
export function createReadClipboardMock(): ReadClipboardMock {
	const readText = vi.fn().mockResolvedValue('benchmark text')

	return {
		readText,
		install() {
			vi.stubGlobal('navigator', { clipboard: { readText } })
			stubSecureContext()
		},
		uninstall() {
			vi.unstubAllGlobals()
		},
	}
}
