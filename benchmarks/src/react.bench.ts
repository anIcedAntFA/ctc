import { bench, describe, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCopyRichContent, useCopyToClipboard } from '@ngockhoi96/ctc-react'
import { createClipboardMock, createRichClipboardMock } from './helpers/clipboard-mock.ts'

describe('useCopyToClipboard overhead', () => {
	const mock = createClipboardMock()

	bench(
		'useCopyToClipboard - render + copy',
		async () => {
			const { result, unmount } = renderHook(() => useCopyToClipboard())
			await act(async () => {
				await result.current.copy('bench')
			})
			unmount()
		},
		{
			setup: () => {
				mock.install()
			},
			teardown: () => {
				mock.uninstall()
				vi.clearAllMocks()
			},
		},
	)
})

describe('useCopyRichContent overhead', () => {
	const mock = createRichClipboardMock()

	bench(
		'useCopyRichContent - render + copyRich',
		async () => {
			const { result, unmount } = renderHook(() => useCopyRichContent())
			await act(async () => {
				await result.current.copyRich('<b>bench</b>', 'bench')
			})
			unmount()
		},
		{
			setup: () => {
				mock.install()
			},
			teardown: () => {
				mock.uninstall()
				vi.clearAllMocks()
			},
		},
	)
})
