import type { BrowserUtilsError } from '@ngockhoi96/ctc'
import { fireEvent, render } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copyAction } from '../src/action/copy-action.ts'
import CopyButton from './fixtures/CopyButton.svelte'
import { createClipboardMock } from './helpers/create-clipboard-mock.ts'

const mock = createClipboardMock()

beforeEach(() => {
	mock.install()
})

afterEach(() => {
	mock.uninstall()
	vi.clearAllMocks()
})

describe('copyAction', () => {
	describe('initial state', () => {
		it('does not call writeText on mount', () => {
			render(CopyButton, { props: { text: 'hi' } })
			expect(mock.writeText).not.toHaveBeenCalled()
		})
	})

	describe('click → success', () => {
		it('calls navigator.clipboard.writeText with the bound text on click', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { getByRole } = render(CopyButton, { props: { text: 'hello' } })
			await fireEvent.click(getByRole('button'))
			await vi.waitFor(() => {
				expect(mock.writeText).toHaveBeenCalledTimes(1)
				expect(mock.writeText).toHaveBeenCalledWith('hello')
			})
		})

		it('dispatches a bubbling ctc:copy CustomEvent with detail.text on success (D-08)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const handleCopy = vi.fn()
			const { getByRole, container } = render(CopyButton, {
				props: { text: 'hello' },
			})
			container.addEventListener('ctc:copy', handleCopy as EventListener)
			await fireEvent.click(getByRole('button'))
			await vi.waitFor(() => expect(handleCopy).toHaveBeenCalledOnce())
			const evt = handleCopy.mock.calls[0][0] as CustomEvent<{ text: string }>
			expect(evt.detail.text).toBe('hello')
			expect(evt.bubbles).toBe(true)
		})
	})

	describe('click → failure', () => {
		it('dispatches a bubbling ctc:error CustomEvent with detail.error on writeText rejection (D-09)', async () => {
			mock.writeText.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const handleError = vi.fn()
			const { getByRole, container } = render(CopyButton, {
				props: { text: 'fail' },
			})
			container.addEventListener('ctc:error', handleError as EventListener)
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
			mock.writeText.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const onError = vi.fn()
			const { getByRole } = render(CopyButton, {
				props: { text: 'fail', onError },
			})
			await fireEvent.click(getByRole('button'))
			await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce())
			expect(onError.mock.calls[0][0]).toMatchObject({
				code: expect.any(String),
			})
		})

		it('does not dispatch ctc:copy when the write fails', async () => {
			mock.writeText.mockRejectedValue(
				new DOMException('Permission denied', 'NotAllowedError'),
			)
			const handleCopy = vi.fn()
			const handleError = vi.fn()
			const { getByRole, container } = render(CopyButton, {
				props: { text: 'fail' },
			})
			container.addEventListener('ctc:copy', handleCopy as EventListener)
			container.addEventListener('ctc:error', handleError as EventListener)
			await fireEvent.click(getByRole('button'))
			await vi.waitFor(() => expect(handleError).toHaveBeenCalled())
			expect(handleCopy).not.toHaveBeenCalled()
		})
	})

	describe('update()', () => {
		it('uses the updated text after rerender (D-06)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { getByRole, rerender } = render(CopyButton, {
				props: { text: 'first' },
			})
			await rerender({ text: 'second' })
			await fireEvent.click(getByRole('button'))
			await vi.waitFor(() => {
				expect(mock.writeText).toHaveBeenCalledTimes(1)
				expect(mock.writeText).toHaveBeenCalledWith('second')
			})
		})
	})

	describe('destroy()', () => {
		it('removes the click listener on unmount (D-07)', async () => {
			mock.writeText.mockResolvedValue(undefined)
			const { getByRole, unmount } = render(CopyButton, {
				props: { text: 'hello' },
			})
			const button = getByRole('button')
			unmount()
			// Dispatch a click directly on the (now-detached) node — the listener
			// should have been removed by destroy(), so writeText must not fire.
			await fireEvent.click(button)
			expect(mock.writeText).not.toHaveBeenCalled()
		})
	})

	describe('D-11: action does not track copied state internally', () => {
		it('exposes only { update, destroy } from its return value', () => {
			// Direct invocation confirms the return shape is ONLY { update, destroy }
			// — no copied flag, no state container leaked to consumers.
			const node = document.createElement('button')
			const result = copyAction(node, { text: 'x' })
			expect(result).toBeDefined()
			const keys = Object.keys(result ?? {}).sort()
			expect(keys).toEqual(['destroy', 'update'])
		})
	})
})
