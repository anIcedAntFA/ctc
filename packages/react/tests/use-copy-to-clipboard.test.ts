import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCopyToClipboard } from '../src/use-copy-to-clipboard.ts'
import { createClipboardMock } from './helpers/create-clipboard-mock.ts'

const mock = createClipboardMock()

beforeEach(() => {
	mock.install()
	vi.useFakeTimers()
})

afterEach(() => {
	mock.uninstall()
	vi.useRealTimers()
	vi.clearAllMocks()
})

describe('useCopyToClipboard', () => {
	describe('initial state', () => {
		it('returns copied=false and error=null on mount', () => {
			const { result } = renderHook(() => useCopyToClipboard())
			expect(result.current.copied).toBe(false)
			expect(result.current.error).toBeNull()
		})
	})

	describe('copy() — happy path', () => {
		it('returns true and sets copied=true when clipboard write succeeds', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyToClipboard('hello'))

			let returnValue: boolean | undefined
			await act(async () => {
				returnValue = await result.current.copy()
			})

			expect(returnValue).toBe(true)
			expect(result.current.copied).toBe(true)
			expect(result.current.error).toBeNull()
		})

		it('call-site text overrides init text', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyToClipboard('init'))

			await act(async () => {
				await result.current.copy('override')
			})

			expect(mock.writeText).toHaveBeenCalledWith('override')
		})

		it('uses init text when no call-site text is provided', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyToClipboard('init-text'))

			await act(async () => {
				await result.current.copy()
			})

			expect(mock.writeText).toHaveBeenCalledWith('init-text')
		})
	})

	describe('copied auto-reset', () => {
		it('resets copied to false after default timeout (2000ms)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyToClipboard('hello'))

			await act(async () => {
				await result.current.copy()
			})
			expect(result.current.copied).toBe(true)

			act(() => {
				vi.advanceTimersByTime(2000)
			})
			expect(result.current.copied).toBe(false)
		})

		it('does not reset before timeout elapses', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { result } = renderHook(() =>
				useCopyToClipboard('hello', { timeout: 3000 }),
			)

			await act(async () => {
				await result.current.copy()
			})
			expect(result.current.copied).toBe(true)

			act(() => {
				vi.advanceTimersByTime(2999)
			})
			expect(result.current.copied).toBe(true) // still true — timer not elapsed

			act(() => {
				vi.advanceTimersByTime(1)
			})
			expect(result.current.copied).toBe(false)
		})

		it('never resets when timeout is 0 (D-05)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { result } = renderHook(() =>
				useCopyToClipboard('hello', { timeout: 0 }),
			)

			await act(async () => {
				await result.current.copy()
			})
			expect(result.current.copied).toBe(true)

			act(() => {
				vi.advanceTimersByTime(60_000) // advance 1 minute
			})
			expect(result.current.copied).toBe(true) // still true
		})

		it('clears previous timer when copy() is called again before timeout', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { result } = renderHook(() =>
				useCopyToClipboard('hello', { timeout: 2000 }),
			)

			// First copy
			await act(async () => {
				await result.current.copy()
			})
			expect(result.current.copied).toBe(true)

			// Advance partially
			act(() => {
				vi.advanceTimersByTime(1000)
			})
			expect(result.current.copied).toBe(true)

			// Second copy — resets the 2000ms timer from scratch
			await act(async () => {
				await result.current.copy()
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

	describe('reset()', () => {
		it('is a no-op when called without a prior copy (no timer pending)', () => {
			const { result } = renderHook(() => useCopyToClipboard('hello'))

			// Should not throw — timer is null, just clears state (already false/null)
			act(() => {
				result.current.reset()
			})
			expect(result.current.copied).toBe(false)
			expect(result.current.error).toBeNull()
		})

		it('clears copied and error immediately (D-06)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyToClipboard('hello'))

			await act(async () => {
				await result.current.copy()
			})
			expect(result.current.copied).toBe(true)

			act(() => {
				result.current.reset()
			})
			expect(result.current.copied).toBe(false)
			expect(result.current.error).toBeNull()
		})

		it('cancels the pending auto-reset timer when called', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { result } = renderHook(() => useCopyToClipboard('hello'))

			await act(async () => {
				await result.current.copy()
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

	describe('error handling', () => {
		it('throws TypeError when text is undefined at both init and call-site (D-02)', async () => {
			const { result } = renderHook(() => useCopyToClipboard())

			await expect(
				act(async () => {
					await result.current.copy()
				}),
			).rejects.toThrow(TypeError)
		})

		it('sets error and keeps copied=false when clipboard write fails', async () => {
			const writeError = new DOMException(
				'Permission denied',
				'NotAllowedError',
			)
			mock.writeText.mockRejectedValue(writeError)
			const { result } = renderHook(() => useCopyToClipboard('hello'))

			await act(async () => {
				await result.current.copy()
			})

			expect(result.current.copied).toBe(false)
			expect(result.current.error).not.toBeNull()
		})

		it('calls onError and populates error when clipboard write fails', async () => {
			const writeError = new DOMException(
				'Permission denied',
				'NotAllowedError',
			)
			mock.writeText.mockRejectedValue(writeError)
			const onError = vi.fn()
			const { result } = renderHook(() =>
				useCopyToClipboard('hello', { onError }),
			)

			await act(async () => {
				await result.current.copy()
			})

			expect(result.current.copied).toBe(false)
			expect(result.current.error).not.toBeNull()
			expect(onError).toHaveBeenCalledOnce()
		})

		it('clears error to null at start of next copy() call (D-07)', async () => {
			// First call: write fails — sets error
			mock.writeText.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const { result } = renderHook(() => useCopyToClipboard('hello'))

			await act(async () => {
				await result.current.copy()
			})
			expect(result.current.error).not.toBeNull()

			// Second call with text — error must be null before the attempt
			mock.writeText.mockResolvedValue(undefined)
			await act(async () => {
				await result.current.copy()
			})
			expect(result.current.error).toBeNull()
			expect(result.current.copied).toBe(true)
		})
	})

	describe('unmount cleanup', () => {
		it('unmounts cleanly without a timer (no copy called)', () => {
			const { unmount } = renderHook(() => useCopyToClipboard('hello'))
			// Unmount immediately — timerRef.current is null, cleanup is a no-op
			unmount()
			// If this does not throw, the null-check branch in useEffect cleanup is covered
		})

		it('clears pending timer on unmount — no setState-after-unmount', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { result, unmount } = renderHook(() => useCopyToClipboard('hello'))

			await act(async () => {
				await result.current.copy()
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
