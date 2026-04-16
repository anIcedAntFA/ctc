import type { BrowserUtilsError } from '@ngockhoi96/ctc'
import { fireEvent, render } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copyRichAction } from '../src/action/copy-rich-action.ts'
import CopyRichButton from './fixtures/CopyRichButton.svelte'
import { createRichClipboardMock } from './helpers/create-rich-clipboard-mock.ts'

const mock = createRichClipboardMock()

beforeEach(() => {
	mock.install()
})

afterEach(() => {
	mock.uninstall()
	vi.clearAllMocks()
})

describe('copyRichAction', () => {
	describe('initial state', () => {
		it('does not call clipboard.write on mount', () => {
			render(CopyRichButton, { props: { html: '<b>hi</b>', text: 'hi' } })
			expect(mock.write).not.toHaveBeenCalled()
		})
	})

	describe('click → success', () => {
		it('calls navigator.clipboard.write with the bound content on click', async () => {
			mock.write.mockResolvedValue(undefined)
			const { getByRole } = render(CopyRichButton, {
				props: { html: '<b>hello</b>', text: 'hello' },
			})
			await fireEvent.click(getByRole('button'))
			await vi.waitFor(() => {
				expect(mock.write).toHaveBeenCalledTimes(1)
			})
		})

		it('dispatches a bubbling ctc:rich-copy CustomEvent with detail.html and detail.text on success', async () => {
			mock.write.mockResolvedValue(undefined)
			const handleCopy = vi.fn()
			const { getByRole, container } = render(CopyRichButton, {
				props: { html: '<b>hello</b>', text: 'hello' },
			})
			container.addEventListener('ctc:rich-copy', handleCopy as EventListener)
			await fireEvent.click(getByRole('button'))
			await vi.waitFor(() => expect(handleCopy).toHaveBeenCalledOnce())
			const evt = handleCopy.mock.calls[0][0] as CustomEvent<{
				html: string
				text: string
			}>
			expect(evt.detail.html).toBe('<b>hello</b>')
			expect(evt.detail.text).toBe('hello')
			expect(evt.bubbles).toBe(true)
		})
	})

	describe('click → failure', () => {
		it('dispatches a bubbling ctc:rich-error CustomEvent with detail.error on write rejection', async () => {
			mock.write.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const handleError = vi.fn()
			const { getByRole, container } = render(CopyRichButton, {
				props: { html: '<b>fail</b>', text: 'fail' },
			})
			container.addEventListener('ctc:rich-error', handleError as EventListener)
			await fireEvent.click(getByRole('button'))
			await vi.waitFor(() => expect(handleError).toHaveBeenCalledOnce())
			const evt = handleError.mock.calls[0][0] as CustomEvent<{
				error: BrowserUtilsError
			}>
			expect(evt.detail.error).toBeDefined()
			expect(typeof evt.detail.error.code).toBe('string')
			expect(evt.detail.error.code.length).toBeGreaterThan(0)
			expect(evt.bubbles).toBe(true)
		})

		it('still invokes the user-supplied onError callback on failure', async () => {
			mock.write.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const onError = vi.fn()
			const { getByRole } = render(CopyRichButton, {
				props: { html: '<b>fail</b>', text: 'fail', onError },
			})
			await fireEvent.click(getByRole('button'))
			await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce())
			expect(onError.mock.calls[0][0]).toMatchObject({
				code: expect.any(String),
			})
		})

		it('does not dispatch ctc:rich-copy when the write fails', async () => {
			mock.write.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const handleCopy = vi.fn()
			const handleError = vi.fn()
			const { getByRole, container } = render(CopyRichButton, {
				props: { html: '<b>fail</b>', text: 'fail' },
			})
			container.addEventListener('ctc:rich-copy', handleCopy as EventListener)
			container.addEventListener('ctc:rich-error', handleError as EventListener)
			await fireEvent.click(getByRole('button'))
			await vi.waitFor(() => expect(handleError).toHaveBeenCalled())
			expect(handleCopy).not.toHaveBeenCalled()
		})
	})

	describe('update()', () => {
		it('uses the updated content after rerender', async () => {
			mock.write.mockResolvedValue(undefined)
			const handleCopy = vi.fn()
			const { getByRole, rerender, container } = render(CopyRichButton, {
				props: { html: '<b>first</b>', text: 'first' },
			})
			container.addEventListener('ctc:rich-copy', handleCopy as EventListener)
			await rerender({ html: '<b>second</b>', text: 'second' })
			await fireEvent.click(getByRole('button'))
			await vi.waitFor(() => expect(handleCopy).toHaveBeenCalledOnce())
			const evt = handleCopy.mock.calls[0][0] as CustomEvent<{
				html: string
				text: string
			}>
			expect(evt.detail.html).toBe('<b>second</b>')
			expect(evt.detail.text).toBe('second')
		})
	})

	describe('destroy()', () => {
		it('removes the click listener on unmount', async () => {
			mock.write.mockResolvedValue(undefined)
			const { getByRole, unmount } = render(CopyRichButton, {
				props: { html: '<b>hello</b>', text: 'hello' },
			})
			const button = getByRole('button')
			unmount()
			await fireEvent.click(button)
			expect(mock.write).not.toHaveBeenCalled()
		})
	})

	describe('action shape', () => {
		it('exposes only { update, destroy } from its return value', () => {
			const node = document.createElement('button')
			const result = copyRichAction(node, { html: '<b>x</b>', text: 'x' })
			expect(result).toBeDefined()
			const keys = Object.keys(result ?? {}).sort()
			expect(keys).toEqual(['destroy', 'update'])
		})
	})
})
