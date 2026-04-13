import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { get } from 'svelte/store'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UseCopyToClipboardResult as RunesResult } from '../src/runes/use-copy-to-clipboard.svelte.ts'
import {
	type UseCopyToClipboardOptions,
	useCopyToClipboard as useStores,
} from '../src/stores/use-copy-to-clipboard.ts'
import RunesHost from './fixtures/RunesHost.svelte'
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

/** Render the RunesHost fixture and return the live reactive api + utils. */
function renderRunes(
	initText?: string,
	options?: UseCopyToClipboardOptions,
): { api: RunesResult; unmount: () => void } {
	let api: RunesResult | undefined
	const utils = render(RunesHost, {
		props: {
			initText,
			options,
			onReady: (a: RunesResult) => {
				api = a
			},
		},
	})
	if (!api) {
		throw new Error('RunesHost did not invoke onReady synchronously')
	}
	return { api, unmount: utils.unmount }
}

describe('useCopyToClipboard — /stores', () => {
	describe('initial state', () => {
		it('copied=false and error=null on init', () => {
			const { copied, error } = useStores()
			expect(get(copied)).toBe(false)
			expect(get(error)).toBeNull()
		})
	})

	describe('copy() — happy path', () => {
		it('flips copied to true and calls writeText with the bound text', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { copy, copied, error } = useStores('hello')

			const result = await copy()

			expect(result).toBe(true)
			expect(get(copied)).toBe(true)
			expect(get(error)).toBeNull()
			expect(mock.writeText).toHaveBeenCalledWith('hello')
		})

		it('call-site text overrides init text', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { copy } = useStores('init')

			await copy('override')

			expect(mock.writeText).toHaveBeenCalledWith('override')
		})
	})

	describe('copied auto-reset', () => {
		it('resets copied to false after default 2000ms timeout', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { copy, copied } = useStores('hello')

			await copy()
			expect(get(copied)).toBe(true)

			vi.advanceTimersByTime(2000)
			expect(get(copied)).toBe(false)
		})

		it('does not reset before timeout elapses', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { copy, copied } = useStores('hello', { timeout: 3000 })

			await copy()
			vi.advanceTimersByTime(2999)
			expect(get(copied)).toBe(true)

			vi.advanceTimersByTime(1)
			expect(get(copied)).toBe(false)
		})

		it('never resets when timeout is 0 (D-18)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { copy, copied } = useStores('hello', { timeout: 0 })

			await copy()
			expect(get(copied)).toBe(true)

			vi.advanceTimersByTime(60_000)
			expect(get(copied)).toBe(true)
		})

		it('clears previous timer when copy() is called again before timeout', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { copy, copied } = useStores('hello', { timeout: 2000 })

			await copy()
			vi.advanceTimersByTime(1000)
			expect(get(copied)).toBe(true)

			await copy()
			vi.advanceTimersByTime(1000)
			expect(get(copied)).toBe(true)

			vi.advanceTimersByTime(1000)
			expect(get(copied)).toBe(false)
		})
	})

	describe('reset()', () => {
		it('clears copied + error and cancels the pending auto-reset timer', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { copy, copied, error, reset } = useStores('hello')

			await copy()
			expect(get(copied)).toBe(true)

			reset()
			expect(get(copied)).toBe(false)
			expect(get(error)).toBeNull()

			// Pending timer should be cancelled — no flip back.
			vi.advanceTimersByTime(2000)
			expect(get(copied)).toBe(false)
		})

		it('is a no-op when called without a pending timer', () => {
			const { copied, error, reset } = useStores('hello')

			reset()
			expect(get(copied)).toBe(false)
			expect(get(error)).toBeNull()
		})
	})

	describe('error handling', () => {
		it('returns false and sets CLIPBOARD_NOT_SUPPORTED error when text is undefined (D-19)', async () => {
			const { copy, copied, error } = useStores()

			const result = await copy()

			expect(result).toBe(false)
			expect(get(copied)).toBe(false)
			expect(get(error)?.code).toBe('CLIPBOARD_NOT_SUPPORTED')
		})

		it('invokes onError when text is undefined', async () => {
			const onError = vi.fn()
			const { copy } = useStores(undefined, { onError })

			await copy()

			expect(onError).toHaveBeenCalledOnce()
			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_NOT_SUPPORTED' }),
			)
		})

		it('clears error to null at the start of the next copy() call', async () => {
			const { copy, error } = useStores()

			await copy()
			expect(get(error)).not.toBeNull()

			mock.writeText.mockResolvedValue(undefined)
			await copy('hello')
			expect(get(error)).toBeNull()
		})

		it('keeps copied=false and invokes onError when writeText rejects', async () => {
			mock.writeText.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const onError = vi.fn()
			const { copy, copied } = useStores('hello', { onError })

			const result = await copy()

			expect(result).toBe(false)
			expect(get(copied)).toBe(false)
			expect(onError).toHaveBeenCalledOnce()
		})
	})
})

describe('useCopyToClipboard — /runes', () => {
	describe('initial state', () => {
		it('copied=false and error=null on init', () => {
			const { api } = renderRunes()
			expect(api.copied).toBe(false)
			expect(api.error).toBeNull()
		})
	})

	describe('copy() — happy path', () => {
		it('flips copied to true and calls writeText with the bound text', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { api } = renderRunes('hello')

			const result = await api.copy()
			flushSync()

			expect(result).toBe(true)
			expect(api.copied).toBe(true)
			expect(api.error).toBeNull()
			expect(mock.writeText).toHaveBeenCalledWith('hello')
		})

		it('call-site text overrides init text', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { api } = renderRunes('init')

			await api.copy('override')
			flushSync()

			expect(mock.writeText).toHaveBeenCalledWith('override')
		})
	})

	describe('copied auto-reset', () => {
		it('resets copied to false after default 2000ms timeout', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { api } = renderRunes('hello')

			await api.copy()
			flushSync()
			expect(api.copied).toBe(true)

			vi.advanceTimersByTime(2000)
			flushSync()
			expect(api.copied).toBe(false)
		})

		it('does not reset before timeout elapses', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { api } = renderRunes('hello', { timeout: 3000 })

			await api.copy()
			flushSync()
			vi.advanceTimersByTime(2999)
			flushSync()
			expect(api.copied).toBe(true)

			vi.advanceTimersByTime(1)
			flushSync()
			expect(api.copied).toBe(false)
		})

		it('never resets when timeout is 0 (D-18)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { api } = renderRunes('hello', { timeout: 0 })

			await api.copy()
			flushSync()
			expect(api.copied).toBe(true)

			vi.advanceTimersByTime(60_000)
			flushSync()
			expect(api.copied).toBe(true)
		})

		it('clears previous timer when copy() is called again before timeout', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { api } = renderRunes('hello', { timeout: 2000 })

			await api.copy()
			flushSync()
			vi.advanceTimersByTime(1000)
			flushSync()
			expect(api.copied).toBe(true)

			await api.copy()
			flushSync()
			vi.advanceTimersByTime(1000)
			flushSync()
			expect(api.copied).toBe(true)

			vi.advanceTimersByTime(1000)
			flushSync()
			expect(api.copied).toBe(false)
		})
	})

	describe('reset()', () => {
		it('clears copied + error and cancels the pending auto-reset timer', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { api } = renderRunes('hello')

			await api.copy()
			flushSync()
			expect(api.copied).toBe(true)

			api.reset()
			flushSync()
			expect(api.copied).toBe(false)
			expect(api.error).toBeNull()

			vi.advanceTimersByTime(2000)
			flushSync()
			expect(api.copied).toBe(false)
		})

		it('is a no-op when called without a pending timer', () => {
			const { api } = renderRunes('hello')

			api.reset()
			flushSync()
			expect(api.copied).toBe(false)
			expect(api.error).toBeNull()
		})
	})

	describe('error handling', () => {
		it('returns false and sets CLIPBOARD_NOT_SUPPORTED error when text is undefined (D-19)', async () => {
			const { api } = renderRunes()

			const result = await api.copy()
			flushSync()

			expect(result).toBe(false)
			expect(api.copied).toBe(false)
			expect(api.error?.code).toBe('CLIPBOARD_NOT_SUPPORTED')
		})

		it('invokes onError when text is undefined', async () => {
			const onError = vi.fn()
			const { api } = renderRunes(undefined, { onError })

			await api.copy()
			flushSync()

			expect(onError).toHaveBeenCalledOnce()
			expect(onError).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'CLIPBOARD_NOT_SUPPORTED' }),
			)
		})

		it('clears error to null at the start of the next copy() call', async () => {
			const { api } = renderRunes()

			await api.copy()
			flushSync()
			expect(api.error).not.toBeNull()

			mock.writeText.mockResolvedValue(undefined)
			await api.copy('hello')
			flushSync()
			expect(api.error).toBeNull()
		})

		it('keeps copied=false and invokes onError when writeText rejects', async () => {
			mock.writeText.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const onError = vi.fn()
			const { api } = renderRunes('hello', { onError })

			const result = await api.copy()
			flushSync()

			expect(result).toBe(false)
			expect(api.copied).toBe(false)
			expect(onError).toHaveBeenCalledOnce()
		})
	})

	describe('unmount cleanup ($effect cleanup)', () => {
		it('clears pending timer on host unmount without throwing', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { api, unmount } = renderRunes('hello')

			await api.copy()
			flushSync()
			expect(api.copied).toBe(true)

			unmount()

			// Advancing past the timeout must not throw and must not flip a stale state.
			expect(() => {
				vi.advanceTimersByTime(2000)
			}).not.toThrow()
		})
	})
})
