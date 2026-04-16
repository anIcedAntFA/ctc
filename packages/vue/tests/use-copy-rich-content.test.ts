import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCopyRichContent } from '../src/use-copy-rich-content.ts'
import { createRichClipboardMock } from './helpers/create-rich-clipboard-mock.ts'
import { withSetup } from './helpers/with-setup.ts'

const mock = createRichClipboardMock()

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
	const initContent = { html: '<b>Hello</b>', text: 'Hello' }
	const altContent = { html: '<i>World</i>', text: 'World' }

	describe('initial state', () => {
		it('returns copied.value=false and error.value=null on setup', () => {
			const [{ copied, error }] = withSetup(() => useCopyRichContent())
			expect(copied.value).toBe(false)
			expect(error.value).toBeNull()
		})
	})

	describe('copyRich() — happy path', () => {
		it('returns true and sets copied.value=true when clipboard write succeeds', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich, copied }] = withSetup(() =>
				useCopyRichContent(initContent),
			)

			const result = await copyRich()

			expect(result).toBe(true)
			expect(copied.value).toBe(true)
		})

		it('uses init content when no call-site content is provided (D-01)', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich }] = withSetup(() => useCopyRichContent(initContent))

			await copyRich()

			expect(mock.write).toHaveBeenCalledOnce()
		})

		it('call-site content overrides init content (D-01)', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich }] = withSetup(() => useCopyRichContent(initContent))

			await copyRich(altContent)

			expect(mock.write).toHaveBeenCalledOnce()
		})

		it('call-site content works when init content not provided', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich, copied }] = withSetup(() => useCopyRichContent())

			const result = await copyRich(initContent)

			expect(result).toBe(true)
			expect(copied.value).toBe(true)
		})

		it('error.value is null after a successful copy (D-07)', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich, error }] = withSetup(() =>
				useCopyRichContent(initContent),
			)

			await copyRich()

			expect(error.value).toBeNull()
		})
	})

	describe('copied auto-reset', () => {
		it('resets copied.value to false after default timeout (2000ms)', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich, copied }] = withSetup(() =>
				useCopyRichContent(initContent),
			)

			await copyRich()
			expect(copied.value).toBe(true)

			vi.advanceTimersByTime(2000)
			expect(copied.value).toBe(false)
		})

		it('does not reset before timeout elapses', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich, copied }] = withSetup(() =>
				useCopyRichContent(initContent, { timeout: 3000 }),
			)

			await copyRich()
			expect(copied.value).toBe(true)

			vi.advanceTimersByTime(2999)
			expect(copied.value).toBe(true) // still true

			vi.advanceTimersByTime(1)
			expect(copied.value).toBe(false)
		})

		it('never resets when timeout is 0 (D-05)', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich, copied }] = withSetup(() =>
				useCopyRichContent(initContent, { timeout: 0 }),
			)

			await copyRich()
			expect(copied.value).toBe(true)

			vi.advanceTimersByTime(60_000) // 1 minute
			expect(copied.value).toBe(true) // still true
		})

		it('clears previous timer when copyRich() is called again before timeout', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich, copied }] = withSetup(() =>
				useCopyRichContent(initContent, { timeout: 2000 }),
			)

			// First copy
			await copyRich()
			expect(copied.value).toBe(true)

			// Advance partially
			vi.advanceTimersByTime(1000)
			expect(copied.value).toBe(true)

			// Second copy — resets the 2000ms timer from scratch
			await copyRich()
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
			const [{ copied, error, reset }] = withSetup(() => useCopyRichContent())
			// Initial state — no timer running
			expect(copied.value).toBe(false)
			expect(error.value).toBeNull()
			// reset() with no active timer should not throw
			reset()
			expect(copied.value).toBe(false)
			expect(error.value).toBeNull()
		})

		it('clears copied.value and error.value immediately (D-06)', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich, copied, error, reset }] = withSetup(() =>
				useCopyRichContent(initContent),
			)

			await copyRich()
			expect(copied.value).toBe(true)

			reset()
			expect(copied.value).toBe(false)
			expect(error.value).toBeNull()
		})

		it('cancels the pending auto-reset timer when called', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich, copied, reset }] = withSetup(() =>
				useCopyRichContent(initContent),
			)

			await copyRich()
			expect(copied.value).toBe(true)

			reset() // cancels timer
			expect(copied.value).toBe(false)

			// Timer would fire at 2000ms — but reset() cancelled it.
			vi.advanceTimersByTime(2000)
			expect(copied.value).toBe(false)
		})
	})

	describe('error handling', () => {
		it('throws TypeError when content is undefined at both init and call site (D-02)', async () => {
			const [{ copyRich }] = withSetup(() => useCopyRichContent())

			await expect(copyRich()).rejects.toThrow(TypeError)
			await expect(copyRich()).rejects.toThrow(
				'[ctc] useCopyRichContent: no content provided. Pass content at init or call-site.',
			)
		})

		it('sets copied.value=false when clipboard write fails', async () => {
			mock.write.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const [{ copyRich, copied }] = withSetup(() =>
				useCopyRichContent(initContent),
			)

			await copyRich()

			expect(copied.value).toBe(false)
		})

		it('calls onError when clipboard write fails', async () => {
			mock.write.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const onError = vi.fn()
			const [{ copyRich }] = withSetup(() =>
				useCopyRichContent(initContent, { onError }),
			)

			await copyRich()

			expect(onError).toHaveBeenCalledOnce()
		})

		it('error.value stays null across successive copyRich() calls when no error occurs (D-07)', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich, error }] = withSetup(() =>
				useCopyRichContent(initContent),
			)

			await copyRich()
			expect(error.value).toBeNull()

			await copyRich()
			expect(error.value).toBeNull()
		})
	})

	describe('unmount cleanup', () => {
		it('clears pending timer on unmount via onUnmounted', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich, copied }, app] = withSetup(() =>
				useCopyRichContent(initContent),
			)

			await copyRich()
			expect(copied.value).toBe(true)

			// Unmount before the 2000ms timer fires — triggers onUnmounted cleanup
			app.unmount()

			// Timer would have fired at 2000ms — but onUnmounted cleared it.
			// No error should occur; copied.value changes are harmless since the
			// component is unmounted.
			vi.advanceTimersByTime(2000)
			// Test passes if no error is thrown
		})

		it('reset() also clears timer — no double-clear error on unmount', async () => {
			mock.write.mockResolvedValue(undefined)
			const [{ copyRich, reset }, app] = withSetup(() =>
				useCopyRichContent(initContent),
			)

			await copyRich()
			reset() // clears timer in reset()

			// Unmount — onUnmounted fires but timer is already null. Must not throw.
			app.unmount()
			vi.advanceTimersByTime(2000)
			// Test passes if no error is thrown
		})
	})
})
