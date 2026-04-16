import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { get } from 'svelte/store'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UseCopyRichContentResult as RunesResult } from '../src/runes/use-copy-rich-content.svelte.ts'
import {
	type UseCopyRichContentOptions,
	useCopyRichContent as useStores,
} from '../src/stores/use-copy-rich-content.ts'
import RichRunesHost from './fixtures/RichRunesHost.svelte'
import { createRichClipboardMock } from './helpers/create-rich-clipboard-mock.ts'

const RICH_CONTENT = { html: '<b>Hello</b>', text: 'Hello' }
const RICH_CONTENT_2 = { html: '<i>World</i>', text: 'World' }

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

/** Render the RichRunesHost fixture and return the live reactive api + utils. */
function renderRunes(
	initContent?: { html: string; text: string },
	options?: UseCopyRichContentOptions,
): { api: RunesResult; unmount: () => void } {
	let api: RunesResult | undefined
	const utils = render(RichRunesHost, {
		props: {
			initContent,
			options,
			onReady: (a: RunesResult) => {
				api = a
			},
		},
	})
	if (!api) {
		throw new Error('RichRunesHost did not invoke onReady synchronously')
	}
	return { api, unmount: utils.unmount }
}

describe('useCopyRichContent — /stores', () => {
	describe('initial state', () => {
		it('copied=false and error=null on init', () => {
			const { copied, error } = useStores()
			expect(get(copied)).toBe(false)
			expect(get(error)).toBeNull()
		})
	})

	describe('copyRich() — happy path', () => {
		it('flips copied to true and calls clipboard.write with the bound content', async () => {
			mock.write.mockResolvedValue(undefined)
			const { copyRich, copied, error } = useStores(RICH_CONTENT)

			const result = await copyRich()

			expect(result).toBe(true)
			expect(get(copied)).toBe(true)
			expect(get(error)).toBeNull()
			expect(mock.write).toHaveBeenCalledTimes(1)
		})

		it('call-site content overrides init content', async () => {
			mock.write.mockResolvedValue(undefined)
			const { copyRich } = useStores(RICH_CONTENT)

			await copyRich(RICH_CONTENT_2)

			expect(mock.write).toHaveBeenCalledTimes(1)
		})
	})

	describe('copied auto-reset', () => {
		it('resets copied to false after default 2000ms timeout', async () => {
			mock.write.mockResolvedValue(undefined)
			const { copyRich, copied } = useStores(RICH_CONTENT)

			await copyRich()
			expect(get(copied)).toBe(true)

			vi.advanceTimersByTime(2000)
			expect(get(copied)).toBe(false)
		})

		it('does not reset before timeout elapses', async () => {
			mock.write.mockResolvedValue(undefined)
			const { copyRich, copied } = useStores(RICH_CONTENT, { timeout: 3000 })

			await copyRich()
			vi.advanceTimersByTime(2999)
			expect(get(copied)).toBe(true)

			vi.advanceTimersByTime(1)
			expect(get(copied)).toBe(false)
		})

		it('never resets when timeout is 0', async () => {
			mock.write.mockResolvedValue(undefined)
			const { copyRich, copied } = useStores(RICH_CONTENT, { timeout: 0 })

			await copyRich()
			expect(get(copied)).toBe(true)

			vi.advanceTimersByTime(60_000)
			expect(get(copied)).toBe(true)
		})

		it('clears previous timer when copyRich() is called again before timeout', async () => {
			mock.write.mockResolvedValue(undefined)
			const { copyRich, copied } = useStores(RICH_CONTENT, { timeout: 2000 })

			await copyRich()
			vi.advanceTimersByTime(1000)
			expect(get(copied)).toBe(true)

			await copyRich()
			vi.advanceTimersByTime(1000)
			expect(get(copied)).toBe(true)

			vi.advanceTimersByTime(1000)
			expect(get(copied)).toBe(false)
		})
	})

	describe('reset()', () => {
		it('clears copied + error and cancels the pending auto-reset timer', async () => {
			mock.write.mockResolvedValue(undefined)
			const { copyRich, copied, error, reset } = useStores(RICH_CONTENT)

			await copyRich()
			expect(get(copied)).toBe(true)

			reset()
			expect(get(copied)).toBe(false)
			expect(get(error)).toBeNull()

			vi.advanceTimersByTime(2000)
			expect(get(copied)).toBe(false)
		})

		it('is a no-op when called without a pending timer', () => {
			const { copied, error, reset } = useStores(RICH_CONTENT)

			reset()
			expect(get(copied)).toBe(false)
			expect(get(error)).toBeNull()
		})
	})

	describe('error handling', () => {
		it('throws TypeError when content is undefined at both init and call-site', async () => {
			const { copyRich } = useStores()

			await expect(copyRich()).rejects.toThrow(TypeError)
		})

		it('clears error to null at the start of the next copyRich() call', async () => {
			mock.write.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const { copyRich, error } = useStores(RICH_CONTENT)

			await copyRich()
			expect(get(error)).not.toBeNull()

			mock.write.mockResolvedValue(undefined)
			await copyRich()
			expect(get(error)).toBeNull()
		})

		it('keeps copied=false and invokes onError when write rejects', async () => {
			mock.write.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const onError = vi.fn()
			const { copyRich, copied, error } = useStores(RICH_CONTENT, { onError })

			const result = await copyRich()

			expect(result).toBe(false)
			expect(get(copied)).toBe(false)
			expect(get(error)).not.toBeNull()
			expect(onError).toHaveBeenCalledOnce()
		})

		it('sets error state when write rejects without onError callback', async () => {
			mock.write.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const { copyRich, error } = useStores(RICH_CONTENT)

			await copyRich()

			expect(get(error)).not.toBeNull()
		})
	})
})

describe('useCopyRichContent — /runes', () => {
	describe('initial state', () => {
		it('copied=false and error=null on init', () => {
			const { api } = renderRunes()
			expect(api.copied).toBe(false)
			expect(api.error).toBeNull()
		})
	})

	describe('copyRich() — happy path', () => {
		it('flips copied to true and calls clipboard.write with the bound content', async () => {
			mock.write.mockResolvedValue(undefined)
			const { api } = renderRunes(RICH_CONTENT)

			const result = await api.copyRich()
			flushSync()

			expect(result).toBe(true)
			expect(api.copied).toBe(true)
			expect(api.error).toBeNull()
			expect(mock.write).toHaveBeenCalledTimes(1)
		})

		it('call-site content overrides init content', async () => {
			mock.write.mockResolvedValue(undefined)
			const { api } = renderRunes(RICH_CONTENT)

			await api.copyRich(RICH_CONTENT_2)
			flushSync()

			expect(mock.write).toHaveBeenCalledTimes(1)
		})
	})

	describe('copied auto-reset', () => {
		it('resets copied to false after default 2000ms timeout', async () => {
			mock.write.mockResolvedValue(undefined)
			const { api } = renderRunes(RICH_CONTENT)

			await api.copyRich()
			flushSync()
			expect(api.copied).toBe(true)

			vi.advanceTimersByTime(2000)
			flushSync()
			expect(api.copied).toBe(false)
		})

		it('does not reset before timeout elapses', async () => {
			mock.write.mockResolvedValue(undefined)
			const { api } = renderRunes(RICH_CONTENT, { timeout: 3000 })

			await api.copyRich()
			flushSync()
			vi.advanceTimersByTime(2999)
			flushSync()
			expect(api.copied).toBe(true)

			vi.advanceTimersByTime(1)
			flushSync()
			expect(api.copied).toBe(false)
		})

		it('never resets when timeout is 0', async () => {
			mock.write.mockResolvedValue(undefined)
			const { api } = renderRunes(RICH_CONTENT, { timeout: 0 })

			await api.copyRich()
			flushSync()
			expect(api.copied).toBe(true)

			vi.advanceTimersByTime(60_000)
			flushSync()
			expect(api.copied).toBe(true)
		})

		it('clears previous timer when copyRich() is called again before timeout', async () => {
			mock.write.mockResolvedValue(undefined)
			const { api } = renderRunes(RICH_CONTENT, { timeout: 2000 })

			await api.copyRich()
			flushSync()
			vi.advanceTimersByTime(1000)
			flushSync()
			expect(api.copied).toBe(true)

			await api.copyRich()
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
			mock.write.mockResolvedValue(undefined)
			const { api } = renderRunes(RICH_CONTENT)

			await api.copyRich()
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
			const { api } = renderRunes(RICH_CONTENT)

			api.reset()
			flushSync()
			expect(api.copied).toBe(false)
			expect(api.error).toBeNull()
		})
	})

	describe('error handling', () => {
		it('throws TypeError when content is undefined at both init and call-site', async () => {
			const { api } = renderRunes()

			await expect(api.copyRich()).rejects.toThrow(TypeError)
		})

		it('clears error to null at the start of the next copyRich() call', async () => {
			mock.write.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const { api } = renderRunes(RICH_CONTENT)

			await api.copyRich()
			flushSync()
			expect(api.error).not.toBeNull()

			mock.write.mockResolvedValue(undefined)
			await api.copyRich()
			flushSync()
			expect(api.error).toBeNull()
		})

		it('keeps copied=false and invokes onError when write rejects', async () => {
			mock.write.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const onError = vi.fn()
			const { api } = renderRunes(RICH_CONTENT, { onError })

			const result = await api.copyRich()
			flushSync()

			expect(result).toBe(false)
			expect(api.copied).toBe(false)
			expect(api.error).not.toBeNull()
			expect(onError).toHaveBeenCalledOnce()
		})

		it('sets error state when write rejects without onError callback', async () => {
			mock.write.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const { api } = renderRunes(RICH_CONTENT)

			await api.copyRich()
			flushSync()

			expect(api.error).not.toBeNull()
		})
	})

	describe('unmount cleanup ($effect cleanup)', () => {
		it('clears pending timer on host unmount without throwing', async () => {
			mock.write.mockResolvedValue(undefined)
			const { api, unmount } = renderRunes(RICH_CONTENT)

			await api.copyRich()
			flushSync()
			expect(api.copied).toBe(true)

			unmount()

			expect(() => {
				vi.advanceTimersByTime(2000)
			}).not.toThrow()
		})
	})
})
