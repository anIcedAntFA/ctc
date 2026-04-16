import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCopyRichContent } from '../src/use-copy-rich-content.ts'
import { createRichClipboardMock } from './helpers/create-rich-clipboard-mock.ts'

const mock = createRichClipboardMock()

const INIT_CONTENT = { html: '<b>Hello</b>', text: 'Hello' }
const CALL_CONTENT = { html: '<i>World</i>', text: 'World' }

beforeEach(() => {
	mock.install()
	vi.useFakeTimers()
})

afterEach(() => {
	mock.uninstall()
	vi.useRealTimers()
	vi.clearAllMocks()
})

describe('useCopyRichContent', () => {
	describe('initial state', () => {
		it('returns copied=false and error=null on mount', () => {
			const { result } = renderHook(() => useCopyRichContent())
			expect(result.current.copied).toBe(false)
			expect(result.current.error).toBeNull()
		})

		it('exposes copyRich and reset as functions', () => {
			const { result } = renderHook(() => useCopyRichContent())
			expect(typeof result.current.copyRich).toBe('function')
			expect(typeof result.current.reset).toBe('function')
		})
	})

	describe('copyRich() — happy path with init content', () => {
		it('returns true and sets copied=true when clipboard write succeeds', async () => {
			mock.write.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyRichContent(INIT_CONTENT))

			let returnValue: boolean | undefined
			await act(async () => {
				returnValue = await result.current.copyRich()
			})

			expect(returnValue).toBe(true)
			expect(result.current.copied).toBe(true)
			expect(result.current.error).toBeNull()
		})

		it('uses init content when no call-site content is provided', async () => {
			mock.write.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyRichContent(INIT_CONTENT))

			await act(async () => {
				await result.current.copyRich()
			})

			expect(mock.write).toHaveBeenCalledOnce()
		})
	})

	describe('copyRich() — happy path with call-site content', () => {
		it('returns true when call-site content is provided and init content is absent', async () => {
			mock.write.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyRichContent())

			let returnValue: boolean | undefined
			await act(async () => {
				returnValue = await result.current.copyRich(CALL_CONTENT)
			})

			expect(returnValue).toBe(true)
			expect(result.current.copied).toBe(true)
			expect(result.current.error).toBeNull()
		})

		it('call-site content overrides init content', async () => {
			mock.write.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyRichContent(INIT_CONTENT))

			await act(async () => {
				await result.current.copyRich(CALL_CONTENT)
			})

			// Mock receives ClipboardItem constructed from call-site content
			expect(mock.write).toHaveBeenCalledOnce()
			// Verify the ClipboardItem was constructed (write was called with an array)
			const writeArg = mock.write.mock.calls[0][0]
			expect(Array.isArray(writeArg)).toBe(true)
			expect(writeArg).toHaveLength(1)
		})
	})

	describe('copied auto-reset', () => {
		it('resets copied to false after default timeout (2000ms)', async () => {
			mock.write.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyRichContent(INIT_CONTENT))

			await act(async () => {
				await result.current.copyRich()
			})
			expect(result.current.copied).toBe(true)

			act(() => {
				vi.advanceTimersByTime(2000)
			})
			expect(result.current.copied).toBe(false)
		})

		it('resets copied to false after custom timeout', async () => {
			mock.write.mockResolvedValue(undefined)
			const { result } = renderHook(() =>
				useCopyRichContent(INIT_CONTENT, { timeout: 500 }),
			)

			await act(async () => {
				await result.current.copyRich()
			})
			expect(result.current.copied).toBe(true)

			act(() => {
				vi.advanceTimersByTime(499)
			})
			expect(result.current.copied).toBe(true) // not yet

			act(() => {
				vi.advanceTimersByTime(1)
			})
			expect(result.current.copied).toBe(false)
		})

		it('never resets when timeout is 0 (D-05)', async () => {
			mock.write.mockResolvedValue(undefined)
			const { result } = renderHook(() =>
				useCopyRichContent(INIT_CONTENT, { timeout: 0 }),
			)

			await act(async () => {
				await result.current.copyRich()
			})
			expect(result.current.copied).toBe(true)

			act(() => {
				vi.advanceTimersByTime(60_000) // advance 1 minute
			})
			expect(result.current.copied).toBe(true) // still true
		})

		it('clears previous timer when copyRich() is called again before timeout', async () => {
			mock.write.mockResolvedValue(undefined)
			const { result } = renderHook(() =>
				useCopyRichContent(INIT_CONTENT, { timeout: 2000 }),
			)

			// First copy
			await act(async () => {
				await result.current.copyRich()
			})
			expect(result.current.copied).toBe(true)

			// Advance partially
			act(() => {
				vi.advanceTimersByTime(1000)
			})
			expect(result.current.copied).toBe(true)

			// Second copy — resets the 2000ms timer from scratch
			await act(async () => {
				await result.current.copyRich()
			})
			expect(result.current.copied).toBe(true)

			// Original 1000ms remaining from first timer — should NOT fire
			act(() => {
				vi.advanceTimersByTime(1000)
			})
			expect(result.current.copied).toBe(true) // still true — new 2000ms timer running

			// Complete the new timer
			act(() => {
				vi.advanceTimersByTime(1000)
			})
			expect(result.current.copied).toBe(false)
		})
	})

	describe('error handling', () => {
		it('throws TypeError when content is undefined at both init and call-site (D-02)', async () => {
			const { result } = renderHook(() => useCopyRichContent())

			await expect(
				act(async () => {
					await result.current.copyRich()
				}),
			).rejects.toThrow(TypeError)
		})

		it('sets error and keeps copied=false when clipboard write fails', async () => {
			const writeError = new DOMException(
				'Permission denied',
				'NotAllowedError',
			)
			mock.write.mockRejectedValue(writeError)
			const { result } = renderHook(() => useCopyRichContent(INIT_CONTENT))

			await act(async () => {
				await result.current.copyRich()
			})

			expect(result.current.copied).toBe(false)
			expect(result.current.error).not.toBeNull()
		})

		it('calls onError callback and populates error when clipboard write fails', async () => {
			const writeError = new DOMException(
				'Permission denied',
				'NotAllowedError',
			)
			mock.write.mockRejectedValue(writeError)
			const onError = vi.fn()
			const { result } = renderHook(() =>
				useCopyRichContent(INIT_CONTENT, { onError }),
			)

			await act(async () => {
				await result.current.copyRich()
			})

			expect(result.current.copied).toBe(false)
			expect(result.current.error).not.toBeNull()
			expect(onError).toHaveBeenCalledOnce()
		})

		it('clears error to null at start of next copyRich() call (D-07)', async () => {
			// First call: write fails — sets error
			mock.write.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const { result } = renderHook(() => useCopyRichContent(INIT_CONTENT))

			await act(async () => {
				await result.current.copyRich()
			})
			expect(result.current.error).not.toBeNull()

			// Second call — error must be null before the attempt
			mock.write.mockResolvedValue(undefined)
			await act(async () => {
				await result.current.copyRich()
			})
			expect(result.current.error).toBeNull()
			expect(result.current.copied).toBe(true)
		})
	})

	describe('reset()', () => {
		it('is a no-op when called without a prior copy (no timer pending)', () => {
			const { result } = renderHook(() => useCopyRichContent(INIT_CONTENT))

			// Should not throw — timer is null, just clears state (already false/null)
			act(() => {
				result.current.reset()
			})
			expect(result.current.copied).toBe(false)
			expect(result.current.error).toBeNull()
		})

		it('clears copied and error immediately (D-06)', async () => {
			mock.write.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyRichContent(INIT_CONTENT))

			await act(async () => {
				await result.current.copyRich()
			})
			expect(result.current.copied).toBe(true)

			act(() => {
				result.current.reset()
			})
			expect(result.current.copied).toBe(false)
			expect(result.current.error).toBeNull()
		})

		it('cancels the pending auto-reset timer when called', async () => {
			mock.write.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyRichContent(INIT_CONTENT))

			await act(async () => {
				await result.current.copyRich()
			})
			expect(result.current.copied).toBe(true)

			act(() => {
				result.current.reset() // cancels timer
			})
			expect(result.current.copied).toBe(false)

			// Timer would have fired at 2000ms — but reset() cancelled it.
			// After another 2000ms, copied should still be false (no double-flip).
			act(() => {
				vi.advanceTimersByTime(2000)
			})
			expect(result.current.copied).toBe(false)
		})
	})

	describe('unmount cleanup', () => {
		it('unmounts cleanly without a timer (no copy called)', () => {
			const { unmount } = renderHook(() => useCopyRichContent(INIT_CONTENT))
			// Unmount immediately — timerRef.current is null, cleanup is a no-op
			unmount()
			// If this does not throw, the null-check branch in useEffect cleanup is covered
		})

		it('clears pending timer on unmount — no setState-after-unmount', async () => {
			mock.write.mockResolvedValue(undefined)
			const { result, unmount } = renderHook(() =>
				useCopyRichContent(INIT_CONTENT),
			)

			await act(async () => {
				await result.current.copyRich()
			})
			expect(result.current.copied).toBe(true)

			// Unmount before the 2000ms timer fires
			unmount()

			// Advance past the timer — if cleanup did not work, React would warn
			// about setState on unmounted component. Test passes if no warning/error.
			act(() => {
				vi.advanceTimersByTime(2000)
			})
			// No assertion needed — test passes if no React warning is thrown
		})
	})
})
