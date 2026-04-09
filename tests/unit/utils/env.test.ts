import { afterEach, describe, expect, it, vi } from 'vitest'
import { isBrowser, isSecureContext } from '../../../src/utils/env.ts'

describe('isBrowser', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('returns true when navigator and window are defined', () => {
		vi.stubGlobal('navigator', {})
		vi.stubGlobal('window', {})

		expect(isBrowser()).toBe(true)
	})

	it('returns false when navigator is undefined', () => {
		vi.stubGlobal('navigator', undefined)
		vi.stubGlobal('window', {})

		expect(isBrowser()).toBe(false)
	})

	it('returns false when window is undefined', () => {
		vi.stubGlobal('navigator', {})
		vi.stubGlobal('window', undefined)

		expect(isBrowser()).toBe(false)
	})
})

describe('isSecureContext', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('returns true when browser and window.isSecureContext is true', () => {
		vi.stubGlobal('navigator', {})
		vi.stubGlobal('window', { isSecureContext: true })

		expect(isSecureContext()).toBe(true)
	})

	it('returns false when not in browser', () => {
		vi.stubGlobal('navigator', undefined)
		vi.stubGlobal('window', undefined)

		expect(isSecureContext()).toBe(false)
	})

	it('returns false when window.isSecureContext is false', () => {
		vi.stubGlobal('navigator', {})
		vi.stubGlobal('window', { isSecureContext: false })

		expect(isSecureContext()).toBe(false)
	})
})
