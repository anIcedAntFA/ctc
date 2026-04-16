import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isRichClipboardSupported } from '../../../src/clipboard/rich-detect.ts'

describe('isRichClipboardSupported', () => {
	beforeEach(() => {
		vi.stubGlobal('ClipboardItem', class MockClipboardItem {})
		vi.stubGlobal('navigator', {
			clipboard: { write: vi.fn() },
		})
		vi.stubGlobal('window', { isSecureContext: true })
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.clearAllMocks()
	})

	it('returns true when all conditions are met', () => {
		expect(isRichClipboardSupported()).toBe(true)
	})

	it('returns false when not in browser (navigator undefined)', () => {
		vi.stubGlobal('navigator', undefined)
		vi.stubGlobal('window', undefined)

		expect(isRichClipboardSupported()).toBe(false)
	})

	it('returns false when not in browser (window undefined)', () => {
		vi.stubGlobal('window', undefined)

		expect(isRichClipboardSupported()).toBe(false)
	})

	it('returns false when not in secure context', () => {
		vi.stubGlobal('window', { isSecureContext: false })

		expect(isRichClipboardSupported()).toBe(false)
	})

	it('returns false when ClipboardItem is undefined', () => {
		vi.stubGlobal('ClipboardItem', undefined)

		expect(isRichClipboardSupported()).toBe(false)
	})

	it('returns false when navigator.clipboard.write is not a function', () => {
		vi.stubGlobal('navigator', {
			clipboard: { write: undefined },
		})

		expect(isRichClipboardSupported()).toBe(false)
	})

	it('returns false when navigator.clipboard is undefined', () => {
		vi.stubGlobal('navigator', { clipboard: undefined })

		expect(isRichClipboardSupported()).toBe(false)
	})

	it('returns false when navigator.clipboard is missing entirely', () => {
		vi.stubGlobal('navigator', {})

		expect(isRichClipboardSupported()).toBe(false)
	})
})
