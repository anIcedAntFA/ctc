import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copyRichContent } from '../../../src/clipboard/rich-copy.ts'

describe('copyRichContent', () => {
	const mockWrite = vi.fn()
	const testContent = { html: '<b>Hello</b>', text: 'Hello' }

	beforeEach(() => {
		vi.stubGlobal(
			'ClipboardItem',
			class MockClipboardItem {
				constructor(public data: Record<string, Blob>) {}
			},
		)
		vi.stubGlobal('navigator', {
			clipboard: { write: mockWrite },
		})
		vi.stubGlobal('window', { isSecureContext: true })
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.clearAllMocks()
	})

	it('returns true on success', async () => {
		mockWrite.mockResolvedValueOnce(undefined)

		const result = await copyRichContent(testContent)

		expect(result).toBe(true)
		expect(mockWrite).toHaveBeenCalledOnce()
	})

	it('passes ClipboardItem with text/html and text/plain Blobs to write', async () => {
		mockWrite.mockResolvedValueOnce(undefined)

		await copyRichContent(testContent)

		const writeArg = mockWrite.mock.calls[0][0]
		expect(writeArg).toHaveLength(1)
		expect(writeArg[0]).toBeDefined()
	})

	it('returns false when isBrowser() is false', async () => {
		vi.stubGlobal('navigator', undefined)
		vi.stubGlobal('window', undefined)

		const result = await copyRichContent(testContent)

		expect(result).toBe(false)
	})

	it('returns false when isSecureContext() is false', async () => {
		vi.stubGlobal('window', { isSecureContext: false })

		const result = await copyRichContent(testContent)

		expect(result).toBe(false)
	})

	it('returns false when ClipboardItem is undefined', async () => {
		vi.stubGlobal('ClipboardItem', undefined)

		const result = await copyRichContent(testContent)

		expect(result).toBe(false)
	})

	it('returns false when navigator.clipboard.write is not a function', async () => {
		vi.stubGlobal('navigator', { clipboard: {} })

		const result = await copyRichContent(testContent)

		expect(result).toBe(false)
	})

	it('returns false when navigator.clipboard is undefined', async () => {
		vi.stubGlobal('navigator', { clipboard: undefined })

		const result = await copyRichContent(testContent)

		expect(result).toBe(false)
	})

	it('returns false on NotAllowedError', async () => {
		mockWrite.mockRejectedValueOnce(
			new DOMException('Permission denied', 'NotAllowedError'),
		)

		const result = await copyRichContent(testContent)

		expect(result).toBe(false)
	})

	it('returns false on unexpected Error', async () => {
		mockWrite.mockRejectedValueOnce(new Error('unexpected'))

		const result = await copyRichContent(testContent)

		expect(result).toBe(false)
	})

	describe('onError callback', () => {
		it('calls onError with CLIPBOARD_NOT_SUPPORTED when not in browser', async () => {
			vi.stubGlobal('navigator', undefined)
			vi.stubGlobal('window', undefined)
			const onError = vi.fn()

			await copyRichContent(testContent, { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_NOT_SUPPORTED' }),
			)
		})

		it('calls onError with INSECURE_CONTEXT when not secure', async () => {
			vi.stubGlobal('window', { isSecureContext: false })
			const onError = vi.fn()

			await copyRichContent(testContent, { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'INSECURE_CONTEXT' }),
			)
		})

		it('calls onError with RICH_CLIPBOARD_NOT_SUPPORTED when ClipboardItem unavailable', async () => {
			vi.stubGlobal('ClipboardItem', undefined)
			const onError = vi.fn()

			await copyRichContent(testContent, { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'RICH_CLIPBOARD_NOT_SUPPORTED' }),
			)
		})

		it('calls onError with CLIPBOARD_PERMISSION_DENIED on NotAllowedError', async () => {
			mockWrite.mockRejectedValueOnce(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const onError = vi.fn()

			await copyRichContent(testContent, { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_PERMISSION_DENIED' }),
			)
		})

		it('calls onError with CLIPBOARD_WRITE_FAILED on unexpected error', async () => {
			mockWrite.mockRejectedValueOnce(new Error('unexpected'))
			const onError = vi.fn()

			await copyRichContent(testContent, { onError })

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
				copyRichContent(testContent, { onError }),
			).resolves.toBe(false)
		})
	})
})
