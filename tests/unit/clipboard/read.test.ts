import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFromClipboard } from '../../../src/clipboard/read.ts'
import type { BrowserUtilsError } from '../../../src/utils/types.ts'

describe('readFromClipboard', () => {
	const mockReadText = vi.fn()

	beforeEach(() => {
		vi.stubGlobal('navigator', {
			clipboard: { readText: mockReadText },
		})
		vi.stubGlobal('window', { isSecureContext: true })
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.clearAllMocks()
	})

	it('returns clipboard text on success', async () => {
		mockReadText.mockResolvedValueOnce('clipboard content')

		const result = await readFromClipboard()

		expect(result).toBe('clipboard content')
	})

	it('returns null when isBrowser() is false', async () => {
		vi.stubGlobal('navigator', undefined)
		vi.stubGlobal('window', undefined)

		const result = await readFromClipboard()

		expect(result).toBeNull()
	})

	it('returns null when isSecureContext() is false', async () => {
		vi.stubGlobal('window', { isSecureContext: false })

		const result = await readFromClipboard()

		expect(result).toBeNull()
	})

	it('returns null when navigator.clipboard.readText is not a function', async () => {
		vi.stubGlobal('navigator', { clipboard: {} })

		const result = await readFromClipboard()

		expect(result).toBeNull()
	})

	it('returns null when navigator.clipboard is undefined', async () => {
		vi.stubGlobal('navigator', { clipboard: undefined })

		const result = await readFromClipboard()

		expect(result).toBeNull()
	})

	it('returns null on NotAllowedError', async () => {
		mockReadText.mockRejectedValueOnce(
			new DOMException('Permission denied', 'NotAllowedError'),
		)

		const result = await readFromClipboard()

		expect(result).toBeNull()
	})

	it('returns null on unexpected error', async () => {
		mockReadText.mockRejectedValueOnce(new Error('unexpected'))

		const result = await readFromClipboard()

		expect(result).toBeNull()
	})

	describe('onError callback', () => {
		it('calls onError with CLIPBOARD_NOT_SUPPORTED when not in browser', async () => {
			vi.stubGlobal('navigator', undefined)
			vi.stubGlobal('window', undefined)
			const onError = vi.fn()

			await readFromClipboard({ onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_NOT_SUPPORTED' }),
			)
		})

		it('calls onError with INSECURE_CONTEXT when not secure', async () => {
			vi.stubGlobal('window', { isSecureContext: false })
			const onError = vi.fn()

			await readFromClipboard({ onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'INSECURE_CONTEXT' }),
			)
		})

		it('calls onError with CLIPBOARD_PERMISSION_DENIED on NotAllowedError', async () => {
			mockReadText.mockRejectedValueOnce(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const onError = vi.fn()

			await readFromClipboard({ onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_PERMISSION_DENIED' }),
			)
		})

		it('calls onError with CLIPBOARD_READ_FAILED on unexpected error', async () => {
			mockReadText.mockRejectedValueOnce(new Error('unexpected'))
			const onError = vi.fn()

			await readFromClipboard({ onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_READ_FAILED' }),
			)
		})

		it('does NOT throw when onError callback itself throws', async () => {
			vi.stubGlobal('navigator', undefined)
			vi.stubGlobal('window', undefined)
			const onError = vi.fn(() => {
				throw new Error('boom')
			})

			await expect(
				readFromClipboard({ onError }),
			).resolves.toBeNull()
		})
	})
})
