import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboard } from '../../../src/clipboard/copy.ts'

describe('copyToClipboard', () => {
	const mockWriteText = vi.fn()

	beforeEach(() => {
		vi.stubGlobal('navigator', {
			clipboard: { writeText: mockWriteText },
		})
		vi.stubGlobal('window', { isSecureContext: true })
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.clearAllMocks()
	})

	it('returns true on success', async () => {
		mockWriteText.mockResolvedValueOnce(undefined)

		const result = await copyToClipboard('hello')

		expect(result).toBe(true)
		expect(mockWriteText).toHaveBeenCalledWith('hello')
	})

	it('handles empty string input (returns true)', async () => {
		mockWriteText.mockResolvedValueOnce(undefined)

		const result = await copyToClipboard('')

		expect(result).toBe(true)
		expect(mockWriteText).toHaveBeenCalledWith('')
	})

	it('returns false when isBrowser() is false', async () => {
		vi.stubGlobal('navigator', undefined)
		vi.stubGlobal('window', undefined)

		const result = await copyToClipboard('hello')

		expect(result).toBe(false)
	})

	it('returns false when isSecureContext() is false', async () => {
		vi.stubGlobal('window', { isSecureContext: false })

		const result = await copyToClipboard('hello')

		expect(result).toBe(false)
	})

	it('returns false when navigator.clipboard is undefined', async () => {
		vi.stubGlobal('navigator', { clipboard: undefined })

		const result = await copyToClipboard('hello')

		expect(result).toBe(false)
	})

	it('returns false when writeText is not a function', async () => {
		vi.stubGlobal('navigator', { clipboard: {} })

		const result = await copyToClipboard('hello')

		expect(result).toBe(false)
	})

	it('returns false on NotAllowedError', async () => {
		mockWriteText.mockRejectedValueOnce(
			new DOMException('Permission denied', 'NotAllowedError'),
		)

		const result = await copyToClipboard('hello')

		expect(result).toBe(false)
	})

	it('returns false on unexpected Error', async () => {
		mockWriteText.mockRejectedValueOnce(new Error('unexpected'))

		const result = await copyToClipboard('hello')

		expect(result).toBe(false)
	})

	describe('onError callback', () => {
		it('calls onError with CLIPBOARD_NOT_SUPPORTED when not in browser', async () => {
			vi.stubGlobal('navigator', undefined)
			vi.stubGlobal('window', undefined)
			const onError = vi.fn()

			await copyToClipboard('hello', { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_NOT_SUPPORTED' }),
			)
		})

		it('calls onError with INSECURE_CONTEXT when not secure', async () => {
			vi.stubGlobal('window', { isSecureContext: false })
			const onError = vi.fn()

			await copyToClipboard('hello', { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'INSECURE_CONTEXT' }),
			)
		})

		it('calls onError with CLIPBOARD_NOT_SUPPORTED when clipboard is undefined', async () => {
			vi.stubGlobal('navigator', { clipboard: undefined })
			const onError = vi.fn()

			await copyToClipboard('hello', { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_NOT_SUPPORTED' }),
			)
		})

		it('calls onError with CLIPBOARD_PERMISSION_DENIED on NotAllowedError', async () => {
			mockWriteText.mockRejectedValueOnce(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const onError = vi.fn()

			await copyToClipboard('hello', { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_PERMISSION_DENIED' }),
			)
		})

		it('calls onError with CLIPBOARD_WRITE_FAILED on unexpected error', async () => {
			mockWriteText.mockRejectedValueOnce(new Error('unexpected'))
			const onError = vi.fn()

			await copyToClipboard('hello', { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_WRITE_FAILED' }),
			)
		})

		it('does NOT throw when onError callback itself throws', async () => {
			vi.stubGlobal('navigator', undefined)
			vi.stubGlobal('window', undefined)
			const onError = vi.fn(() => {
				throw new Error('boom')
			})

			await expect(
				copyToClipboard('hello', { onError }),
			).resolves.toBe(false)
		})
	})
})
