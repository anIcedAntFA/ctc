import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readRichContent } from '../../../src/clipboard/rich-read.ts'

function createMockClipboardItem(data: Record<string, string>) {
	return {
		types: Object.keys(data),
		async getType(type: string): Promise<Blob> {
			if (!(type in data)) {
				throw new DOMException('Not found', 'NotFoundError')
			}
			return new Blob([data[type]], { type })
		},
	}
}

describe('readRichContent', () => {
	const mockRead = vi.fn()

	beforeEach(() => {
		vi.stubGlobal('ClipboardItem', class MockClipboardItem {})
		vi.stubGlobal('navigator', {
			clipboard: { read: mockRead },
		})
		vi.stubGlobal('window', { isSecureContext: true })
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.clearAllMocks()
	})

	it('returns { html, text } when both MIME types present', async () => {
		const item = createMockClipboardItem({
			'text/html': '<b>Hello</b>',
			'text/plain': 'Hello',
		})
		mockRead.mockResolvedValueOnce([item])

		const result = await readRichContent()

		expect(result).toEqual({ html: '<b>Hello</b>', text: 'Hello' })
	})

	it('returns { html: string, text: null } when only HTML present', async () => {
		const item = createMockClipboardItem({
			'text/html': '<b>Hello</b>',
		})
		mockRead.mockResolvedValueOnce([item])

		const result = await readRichContent()

		expect(result).toEqual({ html: '<b>Hello</b>', text: null })
	})

	it('returns { html: null, text: string } when only text present', async () => {
		const item = createMockClipboardItem({
			'text/plain': 'Hello',
		})
		mockRead.mockResolvedValueOnce([item])

		const result = await readRichContent()

		expect(result).toEqual({ html: null, text: 'Hello' })
	})

	it('returns { html: null, text: null } when clipboard is empty (no items)', async () => {
		mockRead.mockResolvedValueOnce([])

		const result = await readRichContent()

		expect(result).toEqual({ html: null, text: null })
	})

	it('returns { html: null, text: null } when item has neither MIME type', async () => {
		const item = createMockClipboardItem({})
		mockRead.mockResolvedValueOnce([item])

		const result = await readRichContent()

		expect(result).toEqual({ html: null, text: null })
	})

	it('returns null when isBrowser() is false', async () => {
		vi.stubGlobal('navigator', undefined)
		vi.stubGlobal('window', undefined)

		const result = await readRichContent()

		expect(result).toBeNull()
	})

	it('returns null when isSecureContext() is false', async () => {
		vi.stubGlobal('window', { isSecureContext: false })

		const result = await readRichContent()

		expect(result).toBeNull()
	})

	it('returns null when ClipboardItem is undefined', async () => {
		vi.stubGlobal('ClipboardItem', undefined)

		const result = await readRichContent()

		expect(result).toBeNull()
	})

	it('returns null when navigator.clipboard.read is not a function', async () => {
		vi.stubGlobal('navigator', { clipboard: {} })

		const result = await readRichContent()

		expect(result).toBeNull()
	})

	it('returns null when navigator.clipboard is undefined', async () => {
		vi.stubGlobal('navigator', { clipboard: undefined })

		const result = await readRichContent()

		expect(result).toBeNull()
	})

	it('returns null on NotAllowedError', async () => {
		mockRead.mockRejectedValueOnce(
			new DOMException('Permission denied', 'NotAllowedError'),
		)

		const result = await readRichContent()

		expect(result).toBeNull()
	})

	it('returns null on unexpected Error', async () => {
		mockRead.mockRejectedValueOnce(new Error('unexpected'))

		const result = await readRichContent()

		expect(result).toBeNull()
	})

	describe('onError callback', () => {
		it('calls onError with CLIPBOARD_NOT_SUPPORTED when not in browser', async () => {
			vi.stubGlobal('navigator', undefined)
			vi.stubGlobal('window', undefined)
			const onError = vi.fn()

			await readRichContent({ onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_NOT_SUPPORTED' }),
			)
		})

		it('calls onError with INSECURE_CONTEXT when not secure', async () => {
			vi.stubGlobal('window', { isSecureContext: false })
			const onError = vi.fn()

			await readRichContent({ onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'INSECURE_CONTEXT' }),
			)
		})

		it('calls onError with RICH_CLIPBOARD_NOT_SUPPORTED when ClipboardItem unavailable', async () => {
			vi.stubGlobal('ClipboardItem', undefined)
			const onError = vi.fn()

			await readRichContent({ onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'RICH_CLIPBOARD_NOT_SUPPORTED' }),
			)
		})

		it('calls onError with CLIPBOARD_PERMISSION_DENIED on NotAllowedError', async () => {
			mockRead.mockRejectedValueOnce(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const onError = vi.fn()

			await readRichContent({ onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_PERMISSION_DENIED' }),
			)
		})

		it('calls onError with CLIPBOARD_READ_FAILED on unexpected error', async () => {
			mockRead.mockRejectedValueOnce(new Error('unexpected'))
			const onError = vi.fn()

			await readRichContent({ onError })

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

			await expect(readRichContent({ onError })).resolves.toBeNull()
		})
	})
})
