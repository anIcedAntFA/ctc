import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboardLegacy } from '../../../src/clipboard/fallback.ts'

describe('copyToClipboardLegacy', () => {
	let mockExecCommand: ReturnType<typeof vi.fn>
	let mockTextarea: {
		style: Record<string, string>
		readOnly: boolean
		value: string
		focus: ReturnType<typeof vi.fn>
		setSelectionRange: ReturnType<typeof vi.fn>
		remove: ReturnType<typeof vi.fn>
		isConnected: boolean
	}

	beforeEach(() => {
		mockExecCommand = vi.fn().mockReturnValue(true)
		mockTextarea = {
			style: {},
			readOnly: false,
			value: '',
			focus: vi.fn(),
			setSelectionRange: vi.fn(),
			remove: vi.fn(),
			isConnected: true,
		}

		const mockDocument = {
			body: {
				appendChild: vi.fn((node: unknown) => {
					// Simulate real DOM behavior: mark as connected
					mockTextarea.isConnected = true
					return node
				}),
			},
			createElement: vi.fn(() => mockTextarea),
			execCommand: mockExecCommand,
		}

		vi.stubGlobal('navigator', {})
		vi.stubGlobal('window', { isSecureContext: true })
		vi.stubGlobal('document', mockDocument)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.clearAllMocks()
	})

	it('returns true on success', () => {
		const result = copyToClipboardLegacy('hello')

		expect(result).toBe(true)
		expect(mockExecCommand).toHaveBeenCalledWith('copy')
	})

	it('sets textarea value and selects text', () => {
		copyToClipboardLegacy('hello')

		expect(mockTextarea.value).toBe('hello')
		expect(mockTextarea.focus).toHaveBeenCalled()
		expect(mockTextarea.setSelectionRange).toHaveBeenCalledWith(0, 5)
	})

	it('returns false when isBrowser() is false', () => {
		vi.stubGlobal('navigator', undefined)
		vi.stubGlobal('window', undefined)

		const result = copyToClipboardLegacy('hello')

		expect(result).toBe(false)
	})

	it('returns false when document.body is null', () => {
		vi.stubGlobal('document', {
			body: null,
			createElement: vi.fn(),
			execCommand: vi.fn(),
		})

		const result = copyToClipboardLegacy('hello')

		expect(result).toBe(false)
	})

	it('returns false when execCommand returns false', () => {
		mockExecCommand.mockReturnValueOnce(false)

		const result = copyToClipboardLegacy('hello')

		expect(result).toBe(false)
	})

	it('returns false when execCommand throws', () => {
		mockExecCommand.mockImplementationOnce(() => {
			throw new Error('execCommand failed')
		})

		const result = copyToClipboardLegacy('hello')

		expect(result).toBe(false)
	})

	it('does not call textarea.remove() when textarea is not connected', () => {
		// Override appendChild to NOT set isConnected
		const mockDoc = {
			body: {
				appendChild: vi.fn((node: unknown) => {
					// Do not set isConnected — simulates node not being in DOM
					return node
				}),
			},
			createElement: vi.fn(() => {
				mockTextarea.isConnected = false
				return mockTextarea
			}),
			execCommand: mockExecCommand,
		}
		vi.stubGlobal('document', mockDoc)

		copyToClipboardLegacy('hello')

		expect(mockTextarea.remove).not.toHaveBeenCalled()
	})

	it('calls textarea.remove() when textarea is connected after success', () => {
		copyToClipboardLegacy('hello')

		expect(mockTextarea.remove).toHaveBeenCalled()
	})

	describe('onError callback', () => {
		it('calls onError with CLIPBOARD_NOT_SUPPORTED when not browser', () => {
			vi.stubGlobal('navigator', undefined)
			vi.stubGlobal('window', undefined)
			const onError = vi.fn()

			copyToClipboardLegacy('hello', { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_NOT_SUPPORTED' }),
			)
		})

		it('calls onError with CLIPBOARD_NOT_SUPPORTED when document.body is null', () => {
			vi.stubGlobal('document', {
				body: null,
				createElement: vi.fn(),
				execCommand: vi.fn(),
			})
			const onError = vi.fn()

			copyToClipboardLegacy('hello', { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_NOT_SUPPORTED' }),
			)
		})

		it('calls onError with CLIPBOARD_WRITE_FAILED when execCommand returns false', () => {
			mockExecCommand.mockReturnValueOnce(false)
			const onError = vi.fn()

			copyToClipboardLegacy('hello', { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_WRITE_FAILED' }),
			)
		})

		it('calls onError with CLIPBOARD_WRITE_FAILED when execCommand throws', () => {
			mockExecCommand.mockImplementationOnce(() => {
				throw new Error('execCommand failed')
			})
			const onError = vi.fn()

			copyToClipboardLegacy('hello', { onError })

			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_WRITE_FAILED' }),
			)
		})
	})
})
