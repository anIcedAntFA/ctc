import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createError, handleError } from '../../../src/lib/errors.ts'
import type { BrowserUtilsError } from '../../../src/lib/types.ts'

describe('createError', () => {
	it('returns an error object with code, message, and cause', () => {
		const cause = new Error('original')
		const error = createError('CLIPBOARD_WRITE_FAILED', 'write failed', cause)

		expect(error).toEqual({
			code: 'CLIPBOARD_WRITE_FAILED',
			message: 'write failed',
			cause,
		})
	})

	it('returns cause as undefined when not provided', () => {
		const error = createError('CLIPBOARD_NOT_SUPPORTED', 'not supported')

		expect(error).toEqual({
			code: 'CLIPBOARD_NOT_SUPPORTED',
			message: 'not supported',
			cause: undefined,
		})
	})
})

describe('handleError', () => {
	let warnSpy: ReturnType<typeof vi.spyOn>
	let errorSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('when onError is provided', () => {
		it('calls onError callback with the error object', () => {
			const onError = vi.fn()
			const error: BrowserUtilsError = {
				code: 'CLIPBOARD_WRITE_FAILED',
				message: 'write failed',
			}

			handleError(error, onError)

			expect(onError).toHaveBeenCalledWith(error)
		})

		it('does NOT call console.warn or console.error when onError is provided', () => {
			const onError = vi.fn()
			const error: BrowserUtilsError = {
				code: 'CLIPBOARD_NOT_SUPPORTED',
				message: 'not supported',
			}

			handleError(error, onError)

			expect(warnSpy).not.toHaveBeenCalled()
			expect(errorSpy).not.toHaveBeenCalled()
		})

		it('swallows exceptions thrown by onError callback', () => {
			const onError = vi.fn(() => {
				throw new Error('boom')
			})
			const error: BrowserUtilsError = {
				code: 'CLIPBOARD_WRITE_FAILED',
				message: 'write failed',
			}

			expect(() => handleError(error, onError)).not.toThrow()
		})
	})

	describe('when onError is not provided (expected error codes)', () => {
		it('calls console.warn for CLIPBOARD_NOT_SUPPORTED', () => {
			const error: BrowserUtilsError = {
				code: 'CLIPBOARD_NOT_SUPPORTED',
				message: 'not supported',
			}

			handleError(error)

			expect(warnSpy).toHaveBeenCalledOnce()
			expect(errorSpy).not.toHaveBeenCalled()
		})

		it('calls console.warn for INSECURE_CONTEXT', () => {
			const error: BrowserUtilsError = {
				code: 'INSECURE_CONTEXT',
				message: 'insecure',
			}

			handleError(error)

			expect(warnSpy).toHaveBeenCalledOnce()
			expect(errorSpy).not.toHaveBeenCalled()
		})

		it('calls console.warn for CLIPBOARD_PERMISSION_DENIED', () => {
			const error: BrowserUtilsError = {
				code: 'CLIPBOARD_PERMISSION_DENIED',
				message: 'denied',
			}

			handleError(error)

			expect(warnSpy).toHaveBeenCalledOnce()
			expect(errorSpy).not.toHaveBeenCalled()
		})

		it('console.warn message contains [ngockhoi96] prefix', () => {
			const error: BrowserUtilsError = {
				code: 'CLIPBOARD_NOT_SUPPORTED',
				message: 'not supported',
			}

			handleError(error)

			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('[ngockhoi96]'),
			)
		})
	})

	describe('when onError is not provided (unexpected error codes)', () => {
		it('calls console.error for CLIPBOARD_WRITE_FAILED', () => {
			const cause = new Error('original')
			const error: BrowserUtilsError = {
				code: 'CLIPBOARD_WRITE_FAILED',
				message: 'write failed',
				cause,
			}

			handleError(error)

			expect(errorSpy).toHaveBeenCalledOnce()
			expect(warnSpy).not.toHaveBeenCalled()
		})

		it('calls console.error for CLIPBOARD_READ_FAILED', () => {
			const cause = new Error('original')
			const error: BrowserUtilsError = {
				code: 'CLIPBOARD_READ_FAILED',
				message: 'read failed',
				cause,
			}

			handleError(error)

			expect(errorSpy).toHaveBeenCalledOnce()
			expect(warnSpy).not.toHaveBeenCalled()
		})

		it('console.error includes the cause', () => {
			const cause = new Error('original')
			const error: BrowserUtilsError = {
				code: 'CLIPBOARD_WRITE_FAILED',
				message: 'write failed',
				cause,
			}

			handleError(error)

			expect(errorSpy).toHaveBeenCalledWith(
				expect.stringContaining('[ngockhoi96]'),
				cause,
			)
		})
	})
})
