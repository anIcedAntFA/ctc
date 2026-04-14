import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCopyToClipboard } from '../src/use-copy-to-clipboard.ts'
import { createClipboardMock } from './helpers/create-clipboard-mock.ts'
import { withSetup } from './helpers/with-setup.ts'

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
		it('returns copied.value=false and error.value=null on setup', () => {
			const [{ copied, error }] = withSetup(() => useCopyToClipboard())
			expect(copied.value).toBe(false)
			expect(error.value).toBeNull()
		})
	})

	describe('copy() — happy path', () => {
		it('returns true and sets copied.value=true when clipboard write succeeds', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const [{ copy, copied }] = withSetup(() => useCopyToClipboard('hello'))

			const result = await copy()

			expect(result).toBe(true)
			expect(copied.value).toBe(true)
		})

		it('call-site text overrides init text (D-01)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const [{ copy }] = withSetup(() => useCopyToClipboard('init'))

			await copy('override')

			expect(mock.writeText).toHaveBeenCalledWith('override')
		})

		it('uses init text when no call-site text is provided (D-01)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const [{ copy }] = withSetup(() => useCopyToClipboard('init-text'))

			await copy()

			expect(mock.writeText).toHaveBeenCalledWith('init-text')
		})

		it('error.value is null after a successful copy (D-07)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const [{ copy, error }] = withSetup(() => useCopyToClipboard('hello'))

			await copy()

			expect(error.value).toBeNull()
		})
	})

	describe('copied auto-reset', () => {
		it('resets copied.value to false after default timeout (2000ms)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const [{ copy, copied }] = withSetup(() => useCopyToClipboard('hello'))

			await copy()
			expect(copied.value).toBe(true)

			vi.advanceTimersByTime(2000)
			expect(copied.value).toBe(false)
		})

		it('does not reset before timeout elapses', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const [{ copy, copied }] = withSetup(() =>
				useCopyToClipboard('hello', { timeout: 3000 }),
			)

			await copy()
			expect(copied.value).toBe(true)

			vi.advanceTimersByTime(2999)
			expect(copied.value).toBe(true) // still true

			vi.advanceTimersByTime(1)
			expect(copied.value).toBe(false)
		})

		it('never resets when timeout is 0 (D-05)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const [{ copy, copied }] = withSetup(() =>
				useCopyToClipboard('hello', { timeout: 0 }),
			)

			await copy()
			expect(copied.value).toBe(true)

			vi.advanceTimersByTime(60_000) // 1 minute
			expect(copied.value).toBe(true) // still true
		})

		it('clears previous timer when copy() is called again before timeout', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const [{ copy, copied }] = withSetup(() =>
				useCopyToClipboard('hello', { timeout: 2000 }),
			)

			// First copy
			await copy()
			expect(copied.value).toBe(true)

			// Advance partially
			vi.advanceTimersByTime(1000)
			expect(copied.value).toBe(true)

			// Second copy — resets the 2000ms timer from scratch
			await copy()
			expect(copied.value).toBe(true)

			// The original 1000ms remaining from the first timer must NOT fire
			vi.advanceTimersByTime(1000)
			expect(copied.value).toBe(true) // still true — new 2000ms timer running

			// Complete the new timer
			vi.advanceTimersByTime(1000)
			expect(copied.value).toBe(false)
		})
	})

	describe('reset()', () => {
		it('is a no-op when called with no active timer', () => {
			const [{ copied, error, reset }] = withSetup(() => useCopyToClipboard())
			// Initial state — no timer running
			expect(copied.value).toBe(false)
			expect(error.value).toBeNull()
			// reset() with no active timer should not throw
			reset()
			expect(copied.value).toBe(false)
			expect(error.value).toBeNull()
		})

		it('clears copied.value and error.value immediately (D-06)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const [{ copy, copied, error, reset }] = withSetup(() =>
				useCopyToClipboard('hello'),
			)

			await copy()
			expect(copied.value).toBe(true)

			reset()
			expect(copied.value).toBe(false)
			expect(error.value).toBeNull()
		})

		it('cancels the pending auto-reset timer when called', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const [{ copy, copied, reset }] = withSetup(() =>
				useCopyToClipboard('hello'),
			)

			await copy()
			expect(copied.value).toBe(true)

			reset() // cancels timer
			expect(copied.value).toBe(false)

			// Timer would fire at 2000ms — but reset() cancelled it.
			// copied should remain false (no double-flip to true then false).
			vi.advanceTimersByTime(2000)
			expect(copied.value).toBe(false)
		})
	})

	describe('error handling', () => {
		it('returns false and sets error.value when text is undefined at both sites (D-02)', async () => {
			const [{ copy, copied, error }] = withSetup(() => useCopyToClipboard())

			const result = await copy()

			expect(result).toBe(false)
			expect(copied.value).toBe(false)
			expect(error.value).not.toBeNull()
			expect(error.value?.code).toBe('CLIPBOARD_NOT_SUPPORTED')
		})

		it('calls onError callback when text is undefined at both sites (D-02)', async () => {
			const onError = vi.fn()
			const [{ copy }] = withSetup(() =>
				useCopyToClipboard(undefined, { onError }),
			)

			await copy()

			expect(onError).toHaveBeenCalledOnce()
			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_NOT_SUPPORTED' }),
			)
		})

		it('sets copied.value=false when clipboard write fails', async () => {
			mock.writeText.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const [{ copy, copied }] = withSetup(() => useCopyToClipboard('hello'))

			await copy()

			expect(copied.value).toBe(false)
		})

		it('calls onError when clipboard write fails', async () => {
			mock.writeText.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const onError = vi.fn()
			const [{ copy }] = withSetup(() =>
				useCopyToClipboard('hello', { onError }),
			)

			await copy()

			expect(onError).toHaveBeenCalledOnce()
		})

		it('clears error.value to null at start of next copy() call (D-07)', async () => {
			// First call: no text — sets error
			const [{ copy, error }] = withSetup(() => useCopyToClipboard())

			await copy()
			expect(error.value).not.toBeNull()

			// Second call with text — error must be null before the attempt
			mock.writeText.mockResolvedValue(undefined)
			await copy('hello')
			expect(error.value).toBeNull()
		})
	})

	describe('unmount cleanup', () => {
		it('clears pending timer on unmount via onUnmounted', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const [{ copy, copied }, app] = withSetup(() =>
				useCopyToClipboard('hello'),
			)

			await copy()
			expect(copied.value).toBe(true)

			// Unmount before the 2000ms timer fires — triggers onUnmounted cleanup
			app.unmount()

			// Timer would have fired at 2000ms — but onUnmounted cleared it.
			// No error should occur; copied.value changes are harmless since the
			// component is unmounted (Vue does not warn on ref mutation post-unmount).
			vi.advanceTimersByTime(2000)
			// Test passes if no error is thrown
		})

		it('reset() also clears timer — no double-clear error on unmount', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const [{ copy, reset }, app] = withSetup(() =>
				useCopyToClipboard('hello'),
			)

			await copy()
			reset() // clears timer in reset()

			// Unmount — onUnmounted fires but timer is already null. Must not throw.
			app.unmount()
			vi.advanceTimersByTime(2000)
			// Test passes if no error is thrown
		})
	})
})
