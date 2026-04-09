import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	isClipboardReadSupported,
	isClipboardSupported,
} from '../../../src/clipboard/detect.ts'

describe('isClipboardSupported', () => {
	beforeEach(() => {
		vi.stubGlobal('navigator', {
			clipboard: { writeText: vi.fn() },
		})
		vi.stubGlobal('window', { isSecureContext: true })
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.clearAllMocks()
	})

	it('returns true when browser + secure + writeText exists', () => {
		expect(isClipboardSupported()).toBe(true)
	})

	it('returns false when not browser', () => {
		vi.stubGlobal('navigator', undefined)
		vi.stubGlobal('window', undefined)

		expect(isClipboardSupported()).toBe(false)
	})

	it('returns false when not secure context', () => {
		vi.stubGlobal('window', { isSecureContext: false })

		expect(isClipboardSupported()).toBe(false)
	})

	it('returns false when navigator.clipboard is undefined', () => {
		vi.stubGlobal('navigator', { clipboard: undefined })

		expect(isClipboardSupported()).toBe(false)
	})

	it('returns false when navigator.clipboard.writeText is missing', () => {
		vi.stubGlobal('navigator', { clipboard: {} })

		expect(isClipboardSupported()).toBe(false)
	})
})

describe('isClipboardReadSupported', () => {
	beforeEach(() => {
		vi.stubGlobal('navigator', {
			clipboard: { readText: vi.fn() },
		})
		vi.stubGlobal('window', { isSecureContext: true })
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.clearAllMocks()
	})

	it('returns true when browser + secure + readText exists', () => {
		expect(isClipboardReadSupported()).toBe(true)
	})

	it('returns false when not browser', () => {
		vi.stubGlobal('navigator', undefined)
		vi.stubGlobal('window', undefined)

		expect(isClipboardReadSupported()).toBe(false)
	})

	it('returns false when not secure context', () => {
		vi.stubGlobal('window', { isSecureContext: false })

		expect(isClipboardReadSupported()).toBe(false)
	})

	it('returns false when navigator.clipboard is undefined', () => {
		vi.stubGlobal('navigator', { clipboard: undefined })

		expect(isClipboardReadSupported()).toBe(false)
	})

	it('returns false when navigator.clipboard.readText is missing', () => {
		vi.stubGlobal('navigator', { clipboard: {} })

		expect(isClipboardReadSupported()).toBe(false)
	})
})
